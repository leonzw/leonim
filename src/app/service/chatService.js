const { app,BrowserWindow } = require('electron')
const path = require('path');
const config = require(path.join(app.getAppPath(), "src","config.json"))
var ws = require("nodejs-websocket")
var wsUrl = "ws://" + config.ws.server + ":" + config.ws.port + "/chat"
var wsConnection = ws.connect(config.ws.server, onConnect);


module.exports.ws_c = () => {

}

onConnect = (data) => {
    console.log("Connected")
    console.log(data)
}

wsConnection.on('error',(err)=>{
    console.log(err)
})

wsConnection.on('text', (str)=>{
    console.log(str)
})