/**
 * Created by Tolotra Samuel on 27/04/2017.
 */
module.exports = {
    senderLearnOrQuestionButton : function (sender) {
        console.log('tolotra send learn question', sender)
        let messageData = {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "button",
                    "text": "What is your gender?",
                    "buttons": [
                        {
                            "title": "Learn",
                            "type": "postback",
                            "payload": "nav-main-learn"
                        },
                        {
                            "title": "Quick Replies",
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