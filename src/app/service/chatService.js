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
let clientList

ipcMain.on('msg-send',sendMsg)

function connect(){
    this.wsConnection = ws.connect(wsUrl, ()=>{
        console.log("Connected")
        var login_data = '{"type":"login","client_name":"abc","room_id":1}';
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
    console.log("===服务短消息 : " + str);
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
            if(data['client_list'])
            {
                clientList = data['client_list'];
            }
            else
            {
                clientList[data['client_id']] = data['client_name'];
            }
            //flush_client_list();
            console.log(data['client_name']+"登录成功");
            break;
        // 发言
        case 'say':
            //{"type":"say","from_client_id":xxx,"to_client_id":"all/client_id","content":"xxx","time":"xxx"}
            mainService.getWin().webContents.send('msg-receive', str)
            //mainService.win.BrowserWindow.webContents.send('msg-receive', str)
            break;
        // 用户退出 更新用户列表
        // case 'logout':
        //     //{"type":"logout","client_id":xxx,"time":"xxx"}
        //     say(data['from_client_id'], data['from_client_name'], data['from_client_name']+' 退出了', data['time']);
        //     delete client_list[data['from_client_id']];
        //     flush_client_list();
    }
}

function sendMsg(event,msg){
    console.log("发送" + msg)

    var to_client_id = "7f00000108ff00000001"
    var to_client_name = "def"
    wsConnection.send(
        '{"type":"say","to_client_id":"'+to_client_id
        +'","to_client_name":"'+to_client_name
        +'","content":"'
        +msg.replace(/"/g, '\\"').replace(/\n/g,'\\n').replace(/\r/g, '\\r')
        +'"}');


}



module.exports.connect = connect()
module.exports.getWsConnection = () =>{
    return this.wsConnection
}
module.exports.getClientList = () => {
    return clientList
}