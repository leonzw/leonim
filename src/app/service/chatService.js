const { app, ipcMain } = require('electron')
const path = require('path');
const config = require(path.join(app.getAppPath(), "src","config.json"))
let mainService  = require(path.join(app.getAppPath(), "src", "app", "service", "mainService.js"))
var ws = require("nodejs-websocket")
var wsUrl = "ws://" + config.ws.server + ":" + config.ws.port + "/chat"

module.exports.wsConnection

/**
 * 用户列表
 */
let clientList, clientId, clientName, clientTarget

ipcMain.on('msg-send',sendMsg)
ipcMain.on('msg-targetClient', changeTarget)

function connect(){
    this.wsConnection = ws.connect(wsUrl, ()=>{
        console.log("Connected")
        var login_data = '{"type":"login","client_name":"'+mainService.getUser()+'","room_id":1}';
        console.log("websocket握手成功，发送登录数据:"+login_data);
        this.wsConnection.send(login_data);
        //console.log(login_data)
    });
    this.wsConnection.on('error',(err)=>{
        console.log("Websocket 出错了 : " + err)
    })

    this.wsConnection.on('text', (str)=>{
        //console.log(str)
        onMessage(str,this.wsConnection)
    })

    this.wsConnection.on('close', ()=> {
        console.log("连接关闭，定时重连");
        connect(this.wsConnection);
    });
}


function onMessage(str,wsConnection){
    console.log("===服务端消息 : " + str);
    var data = JSON.parse(str);
    switch(data['type']){
        // 服务端ping客户端
        case 'ping':
            wsConnection.send('{"type":"pong"}');
            break;
        // 登录 更新用户列表
        case 'login':
            //{"type":"login","client_id":xxx,"client_name":"xxx","client_list":"[...]","time":"xxx"}
            //say(data['client_id'], data['client_name'],  data['client_name']+' 加入了聊天室', data['time']);
            if(!clientList)
            {
                clientList = data['client_list'];
            }
            else
            {
                clientList[data['client_id']] = data['client_name'];
            }
            //flush_client_list();
            
            if (data['client_name'] == mainService.getUser()){
                /**
                 * 当前登录用户，设置一下client_id
                 */
                clientId = data['client_id']
                clientName = data['client_name']
            }
            

            console.log("I am " + clientId)
            console.log(clientList)
            mainService.getWin().webContents.send('msg-contactList', clientList)
            break;
        // 发言
        case 'say':
            //{"type":"say","from_client_id":xxx,"to_client_id":"all/client_id","content":"xxx","time":"xxx"}
            mainService.getWin().webContents.send('msg-receive', str)
            //mainService.win.BrowserWindow.webContents.send('msg-receive', str)
            break;
        // 用户退出 更新用户列表
        case 'logout':
            //{"type":"logout","client_id":xxx,"time":"xxx"}
            delete clientList[data['from_client_id']];
            console.log("I am " + clientId)
            console.log(clientList)
            mainService.getWin().webContents.send('msg-contactList', clientList)
    }
}

/**
 * IpcMain action
 * @param event
 * @param msg
 */
function sendMsg(event,msg){
    console.log("发送" + msg)

    var to_client_id = clientTarget
    var to_client_name = clientList[clientTarget]
    wsConnection.send(
        '{"type":"say","to_client_id":"'+to_client_id
        +'","to_client_name":"'+to_client_name
        +'","content":"'
        +msg.replace(/"/g, '\\"').replace(/\n/g,'\\n').replace(/\r/g, '\\r')
        +'"}');


}

/**
 * IpcMain Action for change contact
 * @param event
 * @param msg
 */
function changeTarget(event,msg){
    clientTarget = msg
}


module.exports.connect = connect()
module.exports.getWsConnection = () =>{
    return this.wsConnection
}
module.exports.getChatClientInfo = () => {
    return {"clientList":clientList, "clientId":clientId, "clientName":clientName, "clientTarget": clientTarget}
}