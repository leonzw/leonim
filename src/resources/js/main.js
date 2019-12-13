const backend = require('electron').remote
const mainService = backend.require('./service/mainService.js')

function openChat(){
    mainService.openChatWindow()
}
