const backend = require('electron')

function openChat(){
    const { BrowserWindow } = require('electron').remote
    let win = new BrowserWindow({ width: 800, height: 600 })
    win.loadURL('resources/chat.html')
}
