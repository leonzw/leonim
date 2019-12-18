const { app, ipcMain, Notification } = require('electron')
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
ipcMain.on('msg-history-list', getChatHistory)

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

            if (data['client_name'] === mainService.getUser()){
                /**
                 * 当前登录用户，设置一下client_id
                 */
                clientId = data['client_id']
                clientName = data['client_name']
            }


            //console.log("I am " + clientId)
            //console.log(clientList)
            mainService.vars.contactList = clientList       // 升级联系人列表
            mainService.getWin().webContents.send('msg-contactList', clientList)
            break;
        // 发言
        case 'say':
            //{"type":"say","from_client_id":xxx,"to_client_id":"all/client_id","content":"xxx","time":"xxx"}
            if (data['from_client_name'] !== clientName) {
                data['msgToMe'] = true
            }else {
                data['msgToMe'] = false
            }


            /**
             * 通知渲染更新
             */

            if (typeof mainService.getWin() === 'undefined' || mainService.getWin() === null || mainService.getWin().isDestroyed()) {
                // Don't do anything
            }else{
                mainService.getWin().webContents.send('msg-receive', str)
            }

            //mainService.win.BrowserWindow.webContents.send('msg-receive', str)

            /**
             * 存聊天记录
             */
            if (data['msgToMe']){
                // 别人给我说话
                if (!mainService.vars.chatHistory[data['from_client_name']]) {
                    mainService.vars.chatHistory[data['from_client_name']] = []
                }
                mainService.vars.chatHistory[data['from_client_name']].push(data)
            } else{
                // 我发给别人的

                var toClientName = clientList[data['to_client_id']]
                console.log(toClientName)
                if (!mainService.vars.chatHistory[toClientName]) {
                    mainService.vars.chatHistory[toClientName] = []
                }
                mainService.vars.chatHistory[toClientName].push(data)
            }


            /**
             * 未读消息记录
             */
            if (data['from_client_name'] !== clientName) {
                let notification = new Notification({
                    title: data['from_client_name'],
                    "body": "新消息",
                    icon: path.join(app.getAppPath(), "src", "resources", "images", "chat-tiny.png"),
                })

                if (mainService.getWin().isDestroyed || !mainService.getWin().isFocused()) {
                    notification.show()
                    mainService.vars.newMsgCount++
                    app.badgeCount = mainService.vars.newMsgCount

                    notification.on('click', ()=>{
                        mainService.getWin().show()
                        mainService.vars.newMsgCount = 0
                        app.badgeCount = 0
                    })
                }



                // mainService.notifier.notify({
                //     title: data['from_client_name'],
                //     message: data['content'],
                //     icon: path.join(app.getAppPath(), "src", "resources", "images", "chat-tiny.png"), // Absolute path (doesn't work on balloons)
                //     sound: true,
                // });
                // mainService.notifier.on('click', ()=>{
                //     mainService.getWin().show()
                //
                // })

            }
            //console.log(mainService.vars.chatHistory)
            break;
        // 用户退出 更新用户列表
        case 'logout':
            //{"type":"logout","client_id":xxx,"time":"xxx"}
            delete clientList[data['from_client_id']];
            //console.log("I am " + clientId)
            //console.log(clientList)
            mainService.getWin().webContents.send('msg-history-list', clientList)
    }
}

/**
 * IpcMain action
 * @param event
 * @param msg
 */
function sendMsg(event,msg){
    console.log("发送" + msg)

    var to_client_id = getClientIdByClientName(clientTarget)
    var to_client_name = msg
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
    mainService.vars.currentContact = msg
}

function getChatHistory(event,name){
    var clientChatHistory = mainService.vars.chatHistory[name]
    event.reply('msg-history-list-reply', clientChatHistory)

}


function getClientIdByClientName(name){
    for (ci in clientList){
        if (clientList[ci] === name){
            return ci
        }
    }
}


module.exports.connect = connect()
module.exports.getWsConnection = () =>{
    return this.wsConnection
}
module.exports.getChatClientInfo = () => {
    return {
        "clientList":clientList,
        "clientId":clientId,
        "clientName":clientName,
        "clientTarget": clientTarget
    }
}



