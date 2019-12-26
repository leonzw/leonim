const backend = require('electron').remote
const chatService = backend.require('./service/chatService.js')
const { ipcRenderer } = require('electron')


ipcRenderer.on('msg-receive',onMessage)
ipcRenderer.on('msg-contactList',flushContactList)
ipcRenderer.on('msg-history-list-reply', flushHistory)
ipcRenderer.on('restore-currentContact', (event,msg)=>{
    flushContactList(event, msg.contactList)
    selectTarget(msg.currentContact)
    resizeWindow()
})
ipcRenderer.on('user-offline-say', ()=>{ window.alert('联系人已经离线,发送失败')})
ipcRenderer.on('image-clipboard-failed', ()=>{window.alert('剪切板图片不存在，请重试')})


function selectTarget(name){
    var target = document.querySelector('#chat_list_'+name)
    changeTarget(target,name)
}

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
    msg_history.animate({ scrollTop: top_height }, 0);
}

function renderMessage(data){
    let from_uid = data['from_uid']
    let content = data['content']
    let time = data['time']

    if (from_uid == chatService.getVars().uid){
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
            '  <div class="incoming_msg_img"> <img src="../images/user-profile.png" alt="sunil"> </div>\n' +
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
    if (msg.trim() != ''){
        ipcRenderer.send('msg-send', msg)
        $('#sendMsg').val('')
        document.querySelector('#sendMsg').value = ''
    }

}

function flushContactList(event, message){
    var contactList = message
    $('#contactList').empty()
    for (contactId in contactList){
        if (contactId != chatService.getVars().uid){
            $('#contactList').append('<div class="chat_list" id="chat_list_'+ contactId +'" onclick="changeTarget(this,\''+contactId+'\')">\n' +
                '                        <div class="chat_people">\n' +
                '                            <div class="chat_img"> <img src="../images/user-profile.png" alt="sunil"> </div>\n' +
                '                            <div class="chat_ib">\n' +
                '                                <h5>'+contactList[contactId]['nickname']+'\n' +
                '                                <p>'+contactId+'</p>\n' +
                '                            </div>\n' +
                '                        </div>\n' +
                '                    </div>')
        }
    }
}

function flushHistory(event,message){
    if (message != null && message.length > 0) {
        message.forEach((row) => {
            renderMessage(row)
        })
        scrollChatHisotryToBottom()
    }
}

function changeTarget(target, cid) {
    if (!target || !cid) return false;
    /**
     * 修改聊天标题
     */
    cname = chatService.getVars().contactList[cid].nickname;
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


    ipcRenderer.send('msg-history-list', cid)

    /**
     * 通知后台服务更新目标
     */
    ipcRenderer.send('msg-targetClient', cid)
}
var resizeTimer = null
function resizeWindow(){
    // if (resizeTimer) clearTimeout(resizeTimer)
    // resizeTimer = setTimeout(()=>{
    //     console.log(window.outerHeight)
    // }, 500)
    let leftListHeight = window.outerHeight - 83
    let leftListInboxChatHeight = window.outerHeight - 83 - 77
    let rightMsgHistory = window.outerHeight - 264
    let rightMsgTextareaWidth = document.querySelector("#mesgs").scrollWidth - 110
    document.querySelector("#inbox_people").setAttribute("style","height:" + leftListHeight + "px")
    document.querySelector("div[class='inbox_chat']").setAttribute("style","height:" + leftListInboxChatHeight + "px")
    document.querySelector("#msg_history").setAttribute("style","height:" + rightMsgHistory + "px")
    document.querySelector("textarea[class='write_msg']").setAttribute("style","height:105px;width:" + rightMsgTextareaWidth + "px")

    // Notify the backend
    ipcRenderer.send('window-resize', {"width":window.outerWidth, "height":window.outerHeight})
}
window.onresize = ()=>{
    resizeWindow()
}

function sendImg() {
    ipcRenderer.send('msg-image-send')
}

function viewImage(obj){
    ipcRenderer.send('msg-image-view', obj.src)
}
