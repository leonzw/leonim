const backend = require('electron').remote
const mainService = backend.require('./service/mainService.js')

function openChat(){
    console.log("openchat")
    var username = document.getElementById('username').value
    var password = document.getElementById('password').value
    mainService.openChatWindow(username,password)
}
