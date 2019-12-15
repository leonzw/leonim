const { app,BrowserWindow } = require('electron')
const electron = require('electron');
const path = require('path');
const config = require(path.join(app.getAppPath(), "src","config.json"))
const {spawn} = require('child_process');


"use strict"

//用一个 Tray 来表示一个图标,这个图标处于正在运行的系统的通知区 ，通常被添加到一个 context menu 上.
const Menu = electron.Menu;
const Tray = electron.Tray;

/**
 * 保持对window对象的全局引用，如果不这么做的话，当JavaScript对象被
 * 垃圾回收的时候，window对象将会自动的关闭
 */
let win = null;
let appTray = null;
let user = null;

exports.openChatWindow = (username,password) =>{
    /**
     * Connect Web socket and run as service
     */

    user = username

    /**
     * Open chat window
     */
    //console.log(win)
    win.setSize(1280,800)
    win.loadFile(path.join(app.getAppPath(), 'src', 'resources', 'html', 'chat.html'))
}



exports.createMainWindow = () => {


    if (process.platform == 'darwin') {
        // Mac系统
        // 创建浏览器窗口。
        win = new BrowserWindow({
            width: 320,
            height: 240 ,
            //frame: false,
            titleBarStyle: 'default',
            show: false,
            autoHideMenuBar: false,
            title: "wechat聊天自制版",
            skipTaskbar:false,      // 是否在任务栏中显示窗口. 默认值为false.
            //backgroundColor: '#2e2c29'
            resizable:false,
            webPreferences: {
                nodeIntegration: true
            }
        })
    }else{
        // Win or Linux
        win = new BrowserWindow({
            width: 320,
            height: 240 ,
            //frame: false,
            titleBarStyle: 'hidden',
            show: false,
            autoHideMenuBar: true,
            title: "wechat聊天自制版",
            skipTaskbar:false,      // 是否在任务栏中显示窗口. 默认值为false.
            //backgroundColor: '#2e2c29'
            resizable:false,
            closable: false,
            webPreferences: {
                nodeIntegration: true
            }
        })
    }

    //系统托盘右键菜单
    var trayMenuTemplate = [
        {
            label: '设置',
            click: function () {} //打开相应页面
        },
        {
            label: '打开主窗口',
            click: function () {}
        },
        {
            label: '退出',
            click: function () {
                //ipc.send('close-main-window');
                app.quit();
            }
        }
    ];
    //系统托盘图标目录
    let trayIcon = path.join(app.getAppPath(), 'src', 'resources', 'images', 'ico_wechat.png');
    appTray = new Tray(trayIcon);
    appTray.setImage(trayIcon)
    //图标的上下文菜单
    const contextMenu = Menu.buildFromTemplate(trayMenuTemplate);
    //设置此托盘图标的悬停提示内容
    appTray.setToolTip('wechat聊天自制版.');
    //设置此图标的上下文菜单
    appTray.setContextMenu(contextMenu);

    win.setIcon(trayIcon)
    // 然后加载应用的 index.html。
    win.loadFile(path.join(app.getAppPath(), 'src', 'resources', 'html', 'index.html'))


    // 打开开发者工具
    if(config.openDebugTool === true){
        win.webContents.openDevTools()
    }

    win.once('ready-to-show', () => {
        win.show()
    })

    win.on('minimize', ()=>{
        //console.log("Window Minimized")
        win.setSkipTaskbar(false)
    });
    win.on("restore",()=>{
        //console.log("Window restore again")
        win.setSkipTaskbar(true)
    });


    // 当 window 被关闭，这个事件会被触发。
    win.on('closed', () => {
        // 取消引用 window 对象，如果你的应用支持多窗口的话，
        // 通常会把多个 window 对象存放在一个数组里面，
        // 与此同时，你应该删除相应的元素。
        win = null
    })

}


module.exports.getWin = () => {
    return win
}
module.exports.getUser = () => {
    return user
}
