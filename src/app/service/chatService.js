const { app, ipcMain, Notification, clipboard , BrowserWindow} = require('electron');
const nativeImage = require('electron').nativeImage
const fs = require("fs");
const path = require('path');
const axios = require('axios');
const config = require(path.join(app.getAppPath(), "src","config.json"));
let mainService  = require(path.join(app.getAppPath(), "src", "app", "service", "mainService.js"));
let ws = require("nodejs-websocket");
let wsUrl = "ws://" + config.ws.server + ":" + config.ws.port + "/chat";

let wsConnection = null
global.currentImgUrl = ''

mainService.vars.chatService.reCreateChatWindow = reCreateChatWindow
module.exports.getVars = () => {
    return mainService.vars.chatService
}

connect()

app.on('activate', () => {
    /**
     * 在macOS上，当单击dock图标并且没有其他窗口打开时，
     * 通常在应用程序中重新创建一个窗口。
     */
    mainService.vars.chatService.newMsgCount = 0;   // 新消息改成0
    app.badgeCount = 0
    //console.log(mainService.getWin())
    if (mainService.getWin() === null || mainService.getWin().isDestroyed()) {
        mainService.vars.chatService.reCreateChatWindow()
    }else {
        mainService.getWin().restore()
    }
})
/**
 * 用户列表
 */

ipcMain.on('msg-send',sendMsg);
ipcMain.on('msg-targetClient', changeTarget);
ipcMain.on('msg-history-list', getChatHistory);
ipcMain.on('window-resize', windowResize);
ipcMain.on('msg-image-send', prepareImg);
ipcMain.on('msg-img-send-ok', sendImgOk);
ipcMain.on('msg-image-view', loadImageViewDetailsWindow)

function connect(){
    wsConnection = ws.connect(wsUrl, ()=>{
        console.log("Connected")
        var login_data = '{"type":"login","client_name":"'+mainService.getUser().username+'", "password":"' + mainService.getUser().password + '","room_id":1}';
        console.log("websocket握手成功，发送登录数据:"+login_data);
        wsConnection.send(login_data);
        //console.log(login_data)
    });
    wsConnection.on('error',(err)=>{
        console.log("Websocket 出错了 : " + err)
    })

    wsConnection.on('text', (str)=>{
        //console.log(str)
        onMessage(str,wsConnection)
    })

    wsConnection.on('close', ()=> {
        console.log("连接关闭，定时重连");
        connect(wsConnection);
    });
}


function onMessage(str,wsConnection){
    console.log("===服务端消息 : " + str);
    let data = JSON.parse(str);
    switch(data['type']){
        // 服务端ping客户端
        case 'ping':
            wsConnection.send('{"type":"pong"}');
            break;
        // 登录 更新用户列表
        case 'login':
            //{"type":"login","client_id":xxx,"client_name":"xxx","client_list":"[...]","time":"xxx"}
            //say(data['client_id'], data['client_name'],  data['client_name']+' 加入了聊天室', data['time']);
            if(mainService.vars.chatService.contactList === null){
                mainService.vars.chatService.contactList = data['client_list'];
            }else{
                mainService.vars.chatService.contactList[data['client_id']] = data['client_name'];
            }

            if (data['client_name'] === mainService.getUser().username){
                /**
                 * 当前登录用户，设置一下client_id
                 */
                mainService.vars.chatService.clientId = data['client_id']
            }

            // 不管前端是否存在，先发个通知消息吧
            if (!mainService.getWin().isDestroyed()){
                mainService.getWin().webContents.send('msg-contactList', mainService.vars.chatService.contactList)
            }


            if (data['client_name'] !== mainService.getUser().username) {
                let notification = new Notification({
                    title: "登录信息",
                    "body": data['client_name'] + "上线",
                    icon: path.join(app.getAppPath(), "src", "resources", "images", "chat-tiny.png"),
                })

                if (mainService.getWin().isDestroyed()){
                    // 窗口已经销毁，点的是关闭按钮, win == null
                    notification.on('click', ()=> {
                        mainService.vars.chatService.currentContactName = data['client_name']
                        mainService.vars.chatService.reCreateChatWindow()
                    })
                }else if(mainService.getWin() !== null && !mainService.getWin().isFocused()){
                    // 窗口没销毁，只是不是焦点
                    notification.on('click', ()=>{
                        mainService.vars.chatService.currentContactName = data['client_name']
                        let restoreInfoObj = {
                            currentContact: mainService.vars.chatService.currentContactName,
                            contactList: mainService.vars.chatService.contactList,
                            chatHistory: mainService.vars.chatService.chatHistory
                        }
                        mainService.getWin().webContents.send('restore-currentContact', restoreInfoObj)
                        mainService.getWin().show()
                    })
                }else{
                    // 窗口没销毁，只是最小化了。
                    console.log("未处理")
                }
                notification.show()
            }



            break;
        // 发言
        case 'say':
            //{"type":"say","from_client_id":xxx,"to_client_id":"all/client_id","content":"xxx","time":"xxx"}
            sayAction(str)
            break;
        case 'sayImg':
            //{"type":"say","from_client_id":xxx,"to_client_id":"all/client_id","content":"xxx","time":"xxx"}
            sayAction(str)
            break;
        // 用户退出 更新用户列表
        case 'logout':
            //{"type":"logout","client_id":xxx,"time":"xxx"}
            delete mainService.vars.chatService.contactList[data['from_client_id']];
            console.log(mainService.vars.chatService.contactList)
            if (!mainService.getWin().isDestroyed()) {
                mainService.getWin().webContents.send('msg-contactList', mainService.vars.chatService.contactList)
            }

    }
}

/**
 * IpcMain action
 * @param event
 * @param msg
 */
function sendMsg(event,msg){
    //console.log("发送" + msg)

    let to_client_id = getClientIdByClientName(mainService.vars.chatService.currentContactName)
    let msgStr =
        '{"type":"say","to_client_id":"'+to_client_id
        +'","to_client_name":"'+mainService.vars.chatService.currentContactName
        +'","content":"'
        +msg.replace(/"/g, '\\"').replace(/\n/g,'\\n').replace(/\r/g, '\\r')
        +'"}'
    console.log(msgStr)
    wsConnection.send(msgStr);


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




function sayAction(str){
    var data = JSON.parse(str);
    if (data['from_client_name'] === mainService.getUser().username) {
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
    }else if(mainService.vars.chatService.currentContactName !== data['from_client_name'] && mainService.getUser().username !== data['from_client_name']){
        // 既不是我发给当前用户的，也不是当前用户发给我的， 别人的，不用更新页面
    }else{
        mainService.getWin().webContents.send('msg-receive', str)
    }

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
        if (toClientName === undefined){
            //联系人已经离线
            console.log("User offline now")
            mainService.getWin().webContents.send('user-offline-say', str)
        } else{
            if (!mainService.vars.chatService.chatHistory[toClientName]) {
                mainService.vars.chatService.chatHistory[toClientName] = []
            }
            mainService.vars.chatService.chatHistory[toClientName].push(data)
        }

    }

    /**
     * 未读消息记录
     */
    if (data['from_client_name'] === mainService.getUser().username){
        // 我发给别人的
    } else if( !mainService.getWin().isDestroyed() && mainService.getWin() !== null && mainService.getWin().isFocused()){
        // 当前窗口存在且是焦点
    }else{
        // 该通知啦

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
                mainService.vars.chatService.currentContactName = data['from_client_name']
                mainService.vars.chatService.reCreateChatWindow()
            })
        }else if(mainService.getWin() !== null && !mainService.getWin().isFocused()){
            // 窗口没销毁，只是不是焦点
            notification.on('click', ()=>{
                mainService.vars.chatService.currentContactName = data['from_client_name']
                let restoreInfoObj = {
                    currentContact: mainService.vars.chatService.currentContactName,
                    contactList: mainService.vars.chatService.contactList,
                    chatHistory: mainService.vars.chatService.chatHistory
                }
                mainService.getWin().webContents.send('restore-currentContact', restoreInfoObj)
                mainService.getWin().show()
            })
        }else{
            // 窗口没销毁，只是最小化了。
            console.log("未处理")
        }


        notification.show()
    }

}


function reCreateChatWindow(){
    mainService.vars.win = null
    mainService.vars.win = mainService.createMainWindow()
    mainService.vars.win.setSize(mainService.vars.chatService.windowSize.width, mainService.vars.chatService.windowSize.height)
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
    })
}

function windowResize(event,msg){
    mainService.vars.chatService.windowSize.width = msg.width;
    mainService.vars.chatService.windowSize.height = msg.height;
}

function prepareImg() {


    let image = clipboard.readImage()
    let imagePath = path.join(app.getPath('userData'), "/snapshot.png")
    let fd = fs.openSync(imagePath, 'w');
    let buff = Buffer.alloc(image.toPNG().length, image.toPNG(), 'base64')

    fs.write(fd,buff,0,buff.length,0,(err,bytesWritten)=>{
        //console.log(err,bytesWritten)
        if (bytesWritten === 0){
            // image null
            mainService.getWin().webContents.send('image-clipboard-failed');
        } else {
            loadPreviewWindow()
        }
    })

}

function loadPreviewWindow(){
        // 创建浏览器窗口
        let preViewImageWin = new BrowserWindow({
            width: 800,
            height: 600,
            webPreferences: {
                nodeIntegration: true
            }
        })

        if(mainService.vars.config.openDebugTool)preViewImageWin.openDevTools()
        // 加载index.html文件
        preViewImageWin.loadFile(path.join(app.getAppPath(), "src", "resources", "html", "preViewImage.html"))
}

function loadImageViewDetailsWindow(event,msg){
    // 创建浏览器窗口
    let win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        }
    })
    global.currentImgUrl = msg
    // 加载index.html文件
    win.loadFile(path.join(app.getAppPath(), "src", "resources", "html", "imageViewDetails.html"))
}

function sendImgOk() {
    console.log('sent')
    /**
     * 开始发送图片
     */

    let imgNative = nativeImage.createFromPath(path.join(app.getPath('userData'), "/snapshot.png"))

    axios.post(mainService.vars.config.webServer + '/image.php', {
        img: imgNative.toDataURL()
        })
        .then(function (response) {
            //console.log(response);
            if (response.data !== null){
                // Say msg

                let to_client_id = getClientIdByClientName(mainService.vars.chatService.currentContactName)
                let msgStr =
                    '{"type":"sayImg","to_client_id":"'+to_client_id
                    +'","to_client_name":"'+mainService.vars.chatService.currentContactName
                    +'","content":"'
                    + "<img onclick='viewImage(this)' src='" + mainService.vars.config.webServer + response.data + "' />"
                    +'"}'
                console.log(msgStr)
                wsConnection.send(msgStr);

            }
        })
        .catch(function (error) {
            console.log(error);
        });
}

