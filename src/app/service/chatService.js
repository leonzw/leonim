const { app,BrowserWindow } = require('electron')
const path = require('path');
const config = require(path.join(app.getAppPath(), "src","config.json"))
let mainService  = require(path.join(app.getAppPath(), "src", "app", "service", "mainService.js"))
var ws = require("nodejs-websocket")
var wsUrl = "ws://" + config.ws.server + ":" + config.ws.port + "/chat"
var wsConnection = null

console.log(mainService.win)

function onConnect (data){

}

function connect(wsConnection){
    wsConnection = ws.connect(wsUrl, ()=>{
        console.log("Connected")
        var login_data = '{"type":"login","client_name":"abc","room_id":1}';
        console.log("websocket握手成功，发送登录数据:"+login_data);
        wsConnection.send(login_data);
        //console.log(login_data)
    });
    wsConnection.on('error',(err)=>{
        console.log("Websocket 出错了 : " + err)
    })

    wsConnection.on('text', (str)=>{
        //console.log(str)
        onMessage(str)
    })

    wsConnection.on('close', ()=> {
        console.log("连接关闭，定时重连");
        connect(wsConnection);
    });
}


function onMessage(str){
    console.log(str);
    var data = JSON.parse(str);
    switch(data['type']){
        // 服务端ping客户端
        case 'ping':
            wsConnection.send('{"type":"pong"}');
            break;
        // 登录 更新用户列表
        // case 'login':
        //     //{"type":"login","client_id":xxx,"client_name":"xxx","client_list":"[...]","time":"xxx"}
        //     say(data['client_id'], data['client_name'],  data['client_name']+' 加入了聊天室', data['time']);
        //     if(data['client_list'])
        //     {
        //         client_list = data['client_list'];
        //     }
        //     else
        //     {
        //         client_list[data['client_id']] = data['client_name'];
        //     }
        //     //flush_client_list();
        //     console.log(data['client_name']+"登录成功");
        //     break;
        // 发言
        case 'say':
            //{"type":"say","from_client_id":xxx,"to_client_id":"all/client_id","content":"xxx","time":"xxx"}
            mainService.win.BrowserWindow.webContents.send('msg-receive', data)
            break;
        // 用户退出 更新用户列表
        // case 'logout':
        //     //{"type":"logout","client_id":xxx,"time":"xxx"}
        //     say(data['from_client_id'], data['from_client_name'], data['from_client_name']+' 退出了', data['time']);
        //     delete client_list[data['from_client_id']];
        //     flush_client_list();
    }
}




module.exports.chatService = {
    wsConnection,
    connect : connect()
}