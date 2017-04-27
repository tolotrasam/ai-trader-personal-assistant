/**
 * Created by Tolotra Samuel on 27/04/2017.
 */
const request = require('request') // Added by Tojosoa Ramarlina 4:03 pm the same day mdr
const token = process.env.PAGE_ACCESS_TOKEN // same

module.exports = {
    senderLearnOrQuestionButton : function (sender) {
        console.log('tolotra send learn question', sender)
        let messageData = {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "button",
                    "text": "What do you want to do?",
                    "buttons": [
                        {
                            "title": "Learn",
                            "type": "postback",
                            "payload": "nav-main-learn"
                        },
                        {
                            "title": "Ask Question",
                            "type": "postback",
                            "payload": "nav-main-learn"
                        }
                    ]
                }
            }
        }
        sendRequest(sender, messageData)
    }
}

function sendRequest(sender, messageData) {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: token},
        method: 'POST',
        json: {
            recipient: {id: sender},
            message: messageData,
        }
    }, function (error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })

}