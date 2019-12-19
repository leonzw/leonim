const { app,ipcMain } = require('electron')
const path = require('path');
let mainService  = require(path.join(app.getAppPath(), "src", "app", "service", "mainService.js"))




// Electron 会在初始化后并准备
// 创建浏览器窗口时，调用这个函数。
// 部分 API 在 ready 事件触发后才能使用。
app.on('ready', ()=>{
    mainService.createMainWindow()
    mainService.setTrayIcon()
    // 然后加载应用的 index.html。
    mainService.getWin().loadFile(path.join(app.getAppPath(), 'src', 'resources', 'html', 'index.html'))
})



// 当全部窗口关闭时退出。
app.on('window-all-closed', () => {
    // 在 macOS 上，除非用户用 Cmd + Q 确定地退出，
    // 否则绝大部分应用及其菜单栏会保持激活。如果需要保持mac上关闭按钮不退出，打开下面的代码
    if (process.platform !== 'darwin') {
        app.quit()
    }else{

    }
})