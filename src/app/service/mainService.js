const { app,BrowserWindow } = require('electron')
const path = require('path');
const config = require(path.join(app.getAppPath(), "src","config.json"))

module.exports.openChatWindow = () => {
    let chatWindow = new BrowserWindow({ width: 800, height: 600 })
    chatWindow.loadFile('src/resources/chat.html')
    if (config.openDebugTool) chatWindow.webContents.openDevTools()
    chatWindow.on('close', ()=>{
        chatWindow = null;
    })
}