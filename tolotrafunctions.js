/**
 * Created by Tolotra Samuel on 27/04/2017.
 */
const request = require('request') // Added by Tojosoa Ramarlina 4:03 pm the same day mdr
const token = process.env.PAGE_ACCESS_TOKEN // same

module.exports = {
    senderLearnOrQuestionButton : function (sender, text_main) {
        console.log('tolotra send learn question', sender)
        let messageData = {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "button",
                    "text": text_main,
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
    } ,

    //text_main is the content,
    //payload_for_something_else and payload_for_more should have category, subcategory and value separeted with a dash
    sendContentButton : function (sender, text_main, payload_for_more, payload_for_something_else) {
        console.log('tolotra send learn question', sender, payload_for_more, payload_for_something_else)
        let messageData = {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "button",
                    "text": text_main,
                    "buttons": [
                        {
                            "title": "Learn More",
                            "type": "postback",
                            "payload": payload_for_more
                        },
                        {
                            "title": "Something else",
                            "type": "postback",
                            "payload": payload_for_something_else
                        }
                    ]
                }
            }
        }
        sendRequest(sender, messageData)
    },
    sendTopics : function sendTopics(sender) {
            let messageData = {
                "attachment": {
                    "type": "template",
                    "payload": {
                        "template_type": "generic",
                        "elements": [{
                            "title": "Anatomy",
                            "subtitle": "Let's learn about the genitals + Sexual Hygiene",
                            "image_url": "https://davidventzelblog.files.wordpress.com/2016/05/vitruvian.jpg?w=1200",
                            "buttons": [{
                                "type": "postback",
                                "payload": "get_content-child_of-anatomy",
                                "title": "Read more"
                            }, {
                                "type": "postback",
                                "title": "Later",
                                "payload": "later",
                            }],
                        }, {
                            "title": "Contraception",
                            "subtitle": "Pleasure without the Consequences",
                            "image_url": "http://blog.francetvinfo.fr/medecine/files/2013/11/contraception.jpg?w=640",
                            "buttons": [{
                                "type": "postback",
                                "payload": "contraception",
                                "title": "Read more"
                            }, {
                                "type": "postback",
                                "title": "Later",
                                "payload": "later",
                            }],
                        },
                            {
                                "title": "Puberty",
                                "subtitle": "Symptoms of puberty",
                                "image_url": "https://i.ytimg.com/vi/Rsj6dW6qKRc/maxresdefault.jpg",
                                "buttons": [{
                                    "type": "postback",
                                    "payload": "puberty",
                                    "title": "Read more"
                                }, {
                                    "type": "postback",
                                    "title": "Later",
                                    "payload": "later",
                                }],
                            },
                            {
                                "title": "Sexual Orientation",
                                "subtitle": "Heterosexual? Homosexual? Bisexual? What Am I?",
                                "image_url": "http://theastrologypodcast.com/wp-content/uploads/2016/04/sexual-orientation-astrology-660.jpg",
                                "buttons": [{
                                    "type": "postback",
                                    "title": "Read more",
                                    "payload": "sex_orientation",
                                }, {
                                    "type": "postback",
                                    "title": "Later",
                                    "payload": "later",
                                }],
                            }]
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