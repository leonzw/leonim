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
            if(mainService.vars.chatService.contactList === null)
            {
                mainService.vars.chatService.contactList = data['client_list'];
            }
            else
            {
                mainService.vars.chatService.contactList[data['client_id']] = data['client_name'];
            }
            //flush_client_list();

            if (data['client_name'] === mainService.getUser()){
                /**
                 * 当前登录用户，设置一下client_id
                 */
                mainService.vars.chatService.clientId = data['client_id']
            }

            mainService.getWin().webContents.send('msg-contactList', mainService.vars.chatService.contactList)
            break;
        // 发言
        case 'say':
            //{"type":"say","from_client_id":xxx,"to_client_id":"all/client_id","content":"xxx","time":"xxx"}
            if (data['from_client_name'] === mainService.getUser()) {
                data['msgToMe'] = false
            }else {
                data['msgToMe'] = true
            }


            /**
             * 通知渲染更新
             */

            if (typeof mainService.getWin() === 'undefined' ||
                mainService.getWin() === null ||
                mainService.getWin().isDestroyed()) {
                // Don't do anything
            }else if(mainService.vars.chatService.currentContactName !== data['from_client_name'] && mainService.getUser() !== data['from_client_name']){
                // 既不是我发给当前用户的，也不是当前用户发给我的， 别人的，不用更新页面
            }else{
                mainService.getWin().webContents.send('msg-receive', str)
            }

            //mainService.win.BrowserWindow.webContents.send('msg-receive', str)

            /**
             * 存聊天记录
             */
            if (data['msgToMe']){
                // 别人给我说话
                if (!mainService.vars.chatService.chatHistory[data['from_client_name']]) {
                    mainService.vars.chatService.chatHistory[data['from_client_name']] = []
                }
                mainService.vars.chatService.chatHistory[data['from_client_name']].push(data)
            } else{
                // 我发给别人的

                let toClientName = mainService.vars.chatService.contactList[data['to_client_id']]
                console.log(toClientName)
                if (!mainService.vars.chatService.chatHistory[toClientName]) {
                    mainService.vars.chatService.chatHistory[toClientName] = []
                }
                mainService.vars.chatService.chatHistory[toClientName].push(data)
            }

            /**
             * 未读消息记录
             */
            if (data['from_client_name'] !== mainService.getUser()) {

                mainService.vars.chatService.newMsgCount++
                app.badgeCount = mainService.vars.chatService.newMsgCount

                let notification = new Notification({
                    title: data['from_client_name'],
                    "body": "新消息",
                    icon: path.join(app.getAppPath(), "src", "resources", "images", "chat-tiny.png"),
                })

                if (mainService.getWin().isDestroyed()){
                    // 窗口已经销毁，点的是关闭按钮, win == null
                    notification.on('click', ()=> {

                        mainService.vars.win = null
                        mainService.vars.win = mainService.createMainWindow()
                        mainService.vars.win.setSize(1280, 800)
                        // 然后加载应用的 index.html。
                        mainService.vars.win.loadFile(path.join(app.getAppPath(), 'src', 'resources', 'html', 'chat.html'))
                        mainService.vars.win.on('ready-to-show', () => {
                            //mainService.getWin().openDevTools()
                            mainService.vars.win.show()
                            let restoreInfoObj = {
                                currentContact: mainService.vars.chatService.currentContactName,
                                contactList: mainService.vars.chatService.contactList,
                                chatHistory: mainService.vars.chatService.chatHistory
                            }
                            mainService.vars.win.webContents.send('restore-currentContact', restoreInfoObj)


                            mainService.vars.chatService.newMsgCount = 0
                            app.badgeCount = 0
                        })
                    })
                }else if(mainService.getWin() !== null && !mainService.getWin().isFocused()){
                    // 窗口没销毁，只是不是焦点
                    notification.on('click', ()=>{
                        mainService.getWin().show()
                        mainService.vars.chatService.newMsgCount = 0
                        app.badgeCount = 0
                    })
                }else{
                    // 窗口没销毁，只是最小化了。
                    console.log("未处理")
                }


                notification.show()
            }
            break;
        // 用户退出 更新用户列表
        case 'logout':
            //{"type":"logout","client_id":xxx,"time":"xxx"}
            delete mainService.vars.chatService.contactList[data['from_client_id']];
            mainService.getWin().webContents.send('msg-history-list', mainService.vars.chatService.contactList)
    }
}

/**
 * IpcMain action
 * @param event
 * @param msg
 */
function sendMsg(event,msg){
    console.log("发送" + msg)

    var to_client_id = getClientIdByClientName(mainService.vars.chatService.currentContactName)
    wsConnection.send(
        '{"type":"say","to_client_id":"'+to_client_id
        +'","to_client_name":"'+msg
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
    mainService.vars.chatService.currentContactName = msg
    mainService.vars.chatService.currentContactId = getClientIdByClientName(msg)
}

function getChatHistory(event,name){
    if (mainService.vars.chatService.chatHistory !== null && mainService.vars.chatService.chatHistory[name] !== null) {
        event.reply('msg-history-list-reply', mainService.vars.chatService.chatHistory[name])
    }
}


function getClientIdByClientName(name){
    for (ci in mainService.vars.chatService.contactList){
        if (mainService.vars.chatService.contactList[ci] === name){
            return ci
        }
    }
}


module.exports.connect = connect()
module.exports.getWsConnection = () =>{
    return this.wsConnection
}
module.exports.getVars = () => {
    return mainService.vars.chatService
}



