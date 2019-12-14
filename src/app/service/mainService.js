const { app,BrowserWindow } = require('electron')
const path = require('path');
const config = require(path.join(app.getAppPath(), "src","config.json"))
const {spawn} = require('child_process');

"use strict"




/**
 * Spawn a child proess to collect data
 */

const chatProcess = new spawn('node',['src/app/controller/chat.js']);

chatProcess.stdout.on('data', (data) => {
    console.log(`[chatProcess] : ${data}`);
});

chatProcess.on('close', (code) => {
    console.log(`chatProcess exited with code ${code}`);
});


function closeAll(){
    chatProcess.kill();
}


module.exports.openChatWindow = () => {

}

