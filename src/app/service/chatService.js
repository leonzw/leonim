const { app,BrowserWindow } = require('electron')
const path = require('path');
const config = require(path.join(app.getAppPath(), "src","config.json"))
var ws = require("nodejs-websocket")
var wsUrl = "ws://" + config.ws.server + ":" + config.ws.port + "/chat"
var wsConnection = null



function onConnect (data){
    console.log("Connected")
    var login_data = '{"type":"login","client_name":"abc","room_id":1}';
    console.log("websocket握手成功，发送登录数据:"+login_data);
    wsConnection.send(login_data);
    //console.log(login_data)
}

function connect(wsConnection){
    wsConnection = ws.connect(wsUrl, onConnect);
    wsConnection.on('error',(err)=>{
        console.log("Websocket 出错了 : " + err)
    })

    wsConnection.on('text', (str)=>{
        console.log(str)
    })

    wsConnection.on('close', ()=> {
        console.log("连接关闭，定时重连");
        connect(wsConnection);
    });
}


module.exports.chatService = {
    wsConnection,
    connect : connect()
}