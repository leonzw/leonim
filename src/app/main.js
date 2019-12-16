const { app,BrowserWindow } = require('electron')
const path = require('path');
let mainService  = require(path.join(app.getAppPath(), "src", "app", "service", "mainService.js"))


// Electron 会在初始化后并准备
// 创建浏览器窗口时，调用这个函数。
// 部分 API 在 ready 事件触发后才能使用。
app.on('ready', mainService.createMainWindow)

// 当全部窗口关闭时退出。
app.on('window-all-closed', () => {
  // 在 macOS 上，除非用户用 Cmd + Q 确定地退出，
  // 否则绝大部分应用及其菜单栏会保持激活。如果需要保持mac上关闭按钮不退出，打开下面的代码
  //if (process.platform !== 'darwin') {
    app.quit()
  //}
})

app.on('activate', () => {
  /**
   * 在macOS上，当单击dock图标并且没有其他窗口打开时，
   * 通常在应用程序中重新创建一个窗口。
   */

  if (mainService.getWin() === null) {
    mainService.createMainWindow()
  }
})

// 剩下主进程代码。
// 启动定时任务线程
//const {spawn} = require("child_process");
//var child_cron = spawn("node",["app/libs/cron.js"],{ stdio: ['inherit', 'inherit', 'inherit', 'ipc'] })



// ipcMain.on('stopCronResult', (event, arg) => {
//     console.log(arg) // prints "ping"
//     event.returnValue = 'pong'
// })

/*
exports.getWinObj = () => {
  return win;
}

exports.yanganSqlite = require(path.join(app.getAppPath(), "app","libs","sqlite.js"));
*/
