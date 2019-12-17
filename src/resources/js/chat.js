const backend = require('electron').remote
const chatService = backend.require('./service/chatService.js')
const { ipcRenderer } = require('electron')


ipcRenderer.on('msg-receive',onMessage)
ipcRenderer.on('msg-contactList',flushContactList)
ipcRenderer.on('msg-history-list-reply', flushHistory)

// 发言
function onMessage(event,message){
    var data = JSON.parse(message);

    //console.log(data)
    renderMessage(data)
    scrollChatHisotryToBottom()
}

function scrollChatHisotryToBottom() {
    var msg_history = $("#msg_history")
    var top_height = msg_history.prop("scrollHeight") - msg_history.height()
    msg_history.animate({ scrollTop: top_height }, 500);
}

function renderMessage(data){
    let from_client_id = data['from_client_id']
    let from_client_name = data['from_client_name']
    let content = data['content']
    let time = data['time']

    if (from_client_id == chatService.getChatClientInfo().clientId){
        /**
         * 自己发出的留言，显示在自己这边
         */
        $("#msg_history").append('' +
            '                    <div class="outgoing_msg">\n' +
            '                        <div class="sent_msg">\n' +
            '                            <p>'+content+'</p>\n' +
            '                            <span class="time_date">'+time+'</span> </div>\n' +
            '                    </div>')
    }else{
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


}

function sendMsg(){
    var msg = $('#sendMsg').val()
    ipcRenderer.send('msg-send', msg)
    $('#sendMsg').val(null)
}

function flushContactList(event, message){
    var contactList = message
    $('#contactList').empty()
    for (contactId in contactList){
        if (contactId != chatService.getChatClientInfo().clientId){
            $('#contactList').append('<div class="chat_list" onclick="changeTarget(this,\''+contactList[contactId].trim()+'\')">\n' +
                '                        <div class="chat_people">\n' +
                '                            <div class="chat_img"> <img src="https://ptetutorials.com/images/user-profile.png" alt="sunil"> </div>\n' +
                '                            <div class="chat_ib">\n' +
                '                                <h5>'+contactList[contactId]+'\n' +
                '                                <p>'+contactId+'</p>\n' +
                '                            </div>\n' +
                '                        </div>\n' +
                '                    </div>')
        }
    }
}

function flushHistory(event,message){
    message.forEach((row) => {
        renderMessage(row)
    })
    scrollChatHisotryToBottom()
}

function changeTarget(target, cname) {
    /**
     * 修改聊天标题
     */
    document.getElementById('targetContactTitle').innerText = "与 "+ cname+" 聊天中"

    /**
     * 找到已有的高亮，去掉高亮
     */
    var oldTarget = document.querySelector("div[class='chat_list active_chat']");
    if (oldTarget != null) oldTarget.setAttribute("class", "chat_list")

    /**
     * 新的目标选中高亮
     */
    target.setAttribute("class", "chat_list active_chat")

    /**
     * 修改聊天内容窗口，清空已有内容
     */
    var msgHistory = document.querySelector('#msg_history')
    if (msgHistory != null) msgHistory.innerHTML = ''


    ipcRenderer.send('msg-history-list', cname)

    /**
     * 通知后台服务更新目标
     */
    ipcRenderer.send('msg-targetClient', cname)
}


