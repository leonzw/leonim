const backend = require('electron').remote
const chatService = backend.require('./service/chatService.js')
const { ipcRenderer } = require('electron')


ipcRenderer.on('msg-receive',onMessage)
ipcRenderer.on('msg-contactList',flushContactList)

// 发言
function onMessage(event,message){
    var data = JSON.parse(message);

    console.log(data)

    let from_client_id = data['from_client_id']
    let from_client_name = data['from_client_name']
    let content = data['content']
    let time = data['time']

    $("#msg_history").append(
        '<div class="incoming_msg">\n' +
        '  <div class="incoming_msg_img"> <img src="https://ptetutorials.com/images/user-profile.png" alt="sunil"> </div>\n' +
        '  <div class="received_msg">\n' +
        '  <div class="received_withd_msg">\n' +
        '    <p>'+content+'</p>\n' +
        '    <span class="time_date">'+time+'</span></div>\n' +
        '  </div>\n' +
        '</div>' +
        '');
}

function sendMsg(){
    var msg = $('#sendMsg').val()
    ipcRenderer.send('msg-send', msg)
    $('#sendMsg').val(null)
}

function flushContactList(event, message){
    var data = JSON.parse(message)
    var contactList = data['client_list']
    for (contactId in contactList){
        if (contactId != chatService.getChatClientInfo().clientId){
            $('#contactList').append('<div class="chat_list" onclick="changeTarget(this,contactId)">\n' +
                '                        <div class="chat_people">\n' +
                '                            <div class="chat_img"> <img src="https://ptetutorials.com/images/user-profile.png" alt="sunil"> </div>\n' +
                '                            <div class="chat_ib">\n' +
                '                                <h5>'+contactList[contactId]+'<span class="chat_date">Dec 25</span></h5>\n' +
                '                                <p>'+contactId+'</p>\n' +
                '                            </div>\n' +
                '                        </div>\n' +
                '                    </div>')
        }
    }
}

function changeTarget(target, contactId) {
    target.addr();
    console.log(contactId)
}