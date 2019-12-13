function openChatWindow() {
    chatWindow = new BrowserWindow({
        height:800,
        width:600,
        webPreferences: {nodeIntegration:true}
    });
    chatWindow.loadURL('src/app/controller/chat.js');
    chatWindow.on('closed', function () {
        chatWindow = null;
    })
}
