const backend = require('electron').remote
const chatService = backend.require('./service/chatService.js')
const { ipcRenderer } = require('electron')


ipcRenderer.on('msg-receive',say)

// 发言
function say(data){
    from_client_id = data['from_client_id']
    from_client_name = data['from_client_name']
    content = data['content']
    time = data['time']
    //解析新浪微博图片
    content = content.replace(/(http|https):\/\/[\w]+.sinaimg.cn[\S]+(jpg|png|gif)/gi, function(img){
        return "<a target='_blank' href='"+img+"'>"+"<img src='"+img+"'>"+"</a>";}
    );

    //解析url
    content = content.replace(/(http|https):\/\/[\S]+/gi, function(url){
            if(url.indexOf(".sinaimg.cn/") < 0)
                return "<a target='_blank' href='"+url+"'>"+url+"</a>";
            else
                return url;
        }
    );

    $("#msg_history").append('<div class="incoming_msg">\n' +
        '                        <div class="incoming_msg_img"> <img src="https://ptetutorials.com/images/user-profile.png" alt="sunil"> </div>\n' +
        '                        <div class="received_msg">\n' +
        '                            <div class="received_withd_msg">\n' +
        '                                <p>content</p>\n' +
        '                                <span class="time_date">time</span></div>\n' +
        '                        </div>\n' +
        '                    </div>');
}

console.log(chatService)