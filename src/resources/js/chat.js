const backend = require('electron').remote
const chatService = backend.require('./service/chatService.js')
const { ipcRenderer } = require('electron')


ipcRenderer.on('msg-receive',onMessage)

// 发言
function onMessage(event,message){
    var data = JSON.parse(message);

    console.log(data)
    console.log(chatService.getClientList())

    let from_client_id = data['from_client_id']
    let from_client_name = data['from_client_name']
    let content = data['content']
    let time = data['time']

    $("#msg_history").append('<div class="incoming_msg">\n' +
        '                        <div class="incoming_msg_img"> <img src="https://ptetutorials.com/images/user-profile.png" alt="sunil"> </div>\n' +
        '                        <div class="received_msg">\n' +
        '                            <div class="received_withd_msg">\n' +
        '                                <p>'+content+'</p>\n' +
        '                                <span class="time_date">'+time+'</span></div>\n' +
        '                        </div>\n' +
        '                    </div>');
}

function sendMsg(){
    var msg = $('#sendMsg').val()
    ipcRenderer.send('msg-send', msg)
    $('#sendMsg').val(null)
}