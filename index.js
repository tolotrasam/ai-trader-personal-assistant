//https://dashboard.heroku.com/apps/rocky-beyond-32293/logs
'use strict';

const token = process.env.PAGE_ACCESS_TOKEN;
const vtoken = process.env.VERIFICATION_TOKEN;
const db_token = process.env.MONGODB_URI

const express = require('express');
const bodyParser = require('body-parser');
var mongoose = require("mongoose");

const request = require('request');
const app = express();
var Promise = require('promise');
var userData = {};
var globalvars = {sendRequest: sendRequest, userData: userData};

var db = mongoose.connect(db_token);
//for messages sequence

var tolotrafunctions = require('./tolotrafunctions');
var Users = require("./content/users");
var Content = require("./content/content");
// Process application/x-www-form-urlencoded
var coinmarkethelper = require('./api/coinmarketcap')

var symbol = null;
updateSymbols()
function updateSymbols() {

    coinmarkethelper.getTicker(null, function (data, param) {
        symbol = data;
    })
}
app.use(bodyParser.urlencoded({extended: false}));
// Process application/json
app.use(bodyParser.json());
app.set('port', (process.env.PORT || 5000));

// Index route
app.get('/', function (req, res) {
    res.send('Hello world, I am a chat bot')
});

// for Facebook verification
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === vtoken) {
        res.send(req.query['hub.challenge'])
    } else {
        res.send('No sir')
    }
});

// Spin up the server
app.listen(app.get('port'), function () {
    console.log('running on port', app.get('port'))
});

app.post('/webhook/', function (req, res) {
    var data = req.body;
    console.log('IT STARTS HERE');
    //Make sure its a page subscription
    if (data.object === 'page') {
        let messaging_events = data.entry[0].messaging;
        //iterate over each messaging events
        for (let i = 0; i < messaging_events.length; i++) {
            let event = data.entry[0].messaging[i];
            let sender = event.sender.id;

            if (event.message && event.message.text) {
                let text = event.message.text;
                decideMessagePlainText(sender, text);
                receivedMessageLog(event)
            }

            else if (event.postback) {
                let text = event.postback.payload;
                decideMessagePostBack(sender, text)
            }
        }
    }
    res.sendStatus(200)
});

//Functions


function UserMeetsCriteria(sender) {
    var userInDatabase = isUserInDatabase(sender);
}

function isUserInDatabase(senderId) {
    Users.findOne({user_id: senderId}, function (err, user) {
        if (err) {
            console.log(senderId, "user not found or something weirder");
            askGender(senderId);
            return false; // user not found or something weirder

        } else {
            if (user) {
                console.log(user, "user found on database");
                hasCompleteInformation(senderId, user);
                return true; //user found
            } else {
                console.log('no result from database for', senderId);
                askGender(senderId);
                return false;
            }
        }
    })
}

function askGender(sender) {
    console.log('gender asked to ', sender);

    let messageData = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": "What is your gender?",
                "buttons": [
                    {
                        "type": "postback",
                        "title": "Male",
                        "payload": "registration-gender-male"
                    },
                    {
                        "type": "postback",
                        "title": "Female",
                        "payload": "registration-gender-female"
                    },
                    {
                        "type": "postback",
                        "title": "I prefer not to say",
                        "payload": "registration-gender-undefined"
                    }
                ]
            }
        }
    };
    sendRequest(sender, messageData)

    // sendQuickReply(sender, "What is your gender?", "text", "Male", "text", "Female")
}

function checkMinor(sender) {
    console.log('check if minor or major');
    sendQuickReplyTwoBtn(sender, "Check which applies", "text", "I am under 18.", "minor", "text", "I am above 18.", "major")
}

function hasCompleteInformation(sender, userInDatabase) {
    if (typeof (userInDatabase['sexe']) === 'undefined' || userInDatabase['sexe'] === '') {
        askGender(sender)
    }
    if (typeof (userInDatabase['minor']) === 'undefined' || userInDatabase['minor'] === '') {
        //askAge(sender)
        checkMinor(sender)
    }
    // if (typeof (userInDatabase['sexe']) != 'undefined' || userInDatabase['sexe'] != '') {
    else {
        //age and gender saved.
        tolotrafunctions.senderLearnOrQuestionButton(sender, "Okay! Here we go. What do you want to do? 😏 ")
        //sendTopics(sender)
    }
}

//update is a json that contains the userid and the update fields as attribute.
function surveyToRegister(senderId, update) {
    console.log('update user ' + senderId, JSON.stringify(update));

    var query = {user_id: senderId};
    var options = {upsert: true};

    Users.findOneAndUpdate(query, update, options, function (err, mov) {
        if (err) {
            console.log("Database error: " + err);
        } else {
            console.log("Database sucess");
        }
    })
}

function insertToSession(sender) {
    if (typeof (userData.sender) === 'undefined') {
        userData.sender = {userdId: sender}
    }
}
//To gather information about received messages
function receivedMessageLog(event) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
    var timeOfMessage = event.timestamp;
    var message = event.message || event.postback;
    var news;

    console.log("Received message for user %d and page %d at %d with message:", senderID, recipientID, timeOfMessage);
    console.log(JSON.stringify(event));
}

function get_more_content(sender, content_target_id, id_in_group) {
    console.log('getting to sender: ' + sender + ' id: ' + content_target_id + ' id in group ' + id_in_group);
    if (!(typeof (id_in_group) === 'undefined')) {
        console.log(id_in_group, 'id in group');
        Content.find({content_id: content_target_id, id_in_group: Number(id_in_group)}, function (err, chat_content) {
            // Content.find({id_in_group: Number(id_in_group)}, function (err, chat_content) {
            if (err) {
                sendTextMessage(sender, "Sorry, I couldn't get what you asked for the moment. Try out later");
            } else {
                sendSingleContentButton(sender, chat_content)
            }
        })
    }
}


function sendSingleContentButton(sender, chat_content) {
    console.log(chat_content, 'this is the object');
    //if chate_Content refered to the id of a missing or a non existing child
    if (!chat_content) {
        console.log('error missing child with id:', content_target_id)
    } else {

        if (typeof (chat_content) === 'undefined' || typeof (chat_content[0]) === 'undefined') {
            console.log('error in get_child_content_of', 'no object found');

        } else {
            console.log(chat_content.length, 'lenght of fectch object');
            if (chat_content.length >= 1) {

                var the_content = chat_content[0];
                var text_main = the_content.text_content;
                var image_url = the_content.image_url;
                if (typeof (text_main) === 'undefined') {
                    console.log('error in get_child_content_of', 'no attribute found')
                } else {
                    //generate card if menu, send only one if content
                    var payload_for_more = the_content.payload_for_more;
                    var payload_for_something_else = the_content.payload_for_something_else;
                    //var payload_for_something_else = the_content.text_content;
                    if (typeof (text_main) === 'undefined' || text_main === '') {
                        if (typeof (image_url) !== 'undefined' && text_main === '') {
                            sendQuickReplyTwoBtn(sender, 'text', 'What\'s next?', 'Read more', payload_for_more, 'text', 'Something else', payload_for_something_else);
                            sendImageMessage(sender, image_url);
                        } else {
                            sendTextMessage(sender, 'Sorry, this is not available for the moment. Try again later');
                            tolotrafunctions.sendTopics(sender)
                        }
                    } else {
                        tolotrafunctions.sendContentButton(sender, text_main, payload_for_more, payload_for_something_else);
                    }
                }


            }
            //  for(var i = 0; i < content_target_id.length; i++){
            // }
        }
    }
}
function get_child_content_of(sender, content_target_id) {
    console.log('getting child of', content_target_id);
    Content.find({parent_id: content_target_id}, function (err, chat_content) {
        //Content.find({}, function (err, chat_content) {
        if (err) {
            sendTextMessage(sender, "Sorry, I couldn't get what you asked for the moment. Try out later");
        } else {
            sendSingleContentButton(sender, chat_content)
        }
    })
}

function decideMessagePostBack(sender, raw_postback) {
    var postbackText = JSON.stringify(raw_postback);
    console.log('message postback', postbackText);

    //post back will always contain a prefix (as key) referring to its category, a dash separate post back key, sub key to value     f
    var postback = raw_postback.split("-");
    var postbackcategory = postback[0];
    var postbacksubcategory = postback[1];
    var postbackvalue = postback[2];
    var postbacksubvalue = postback[3];
    console.log(postback, 'post back');

    if (raw_postback == 'get_started') {
        request({
            url: "https://graph.facebook.com/v2.6/" + sender,
            qs: {
                access_token: token,
                fields: "first_name"
            },
            method: "GET"
        }, function (error, response, body) {
            var greeting = "";
            if (error) {
                console.log("Error getting user's name: " + error);
            } else {
                var bodyObj = JSON.parse(body);
                var name = bodyObj.first_name;
                greeting = "Hi " + name + " 😃 ";
            }
            var message = greeting + "My name is Sex Education Bot. I can tell you various details regarding Relationships and Sex. 👨‍❤️‍💋‍👨 💑 👫";
            sendTextMessage(sender, message)
                .then(sendTextMessage.bind(null, sender, "And to make the experience better, I'd like to get to know a bit about you."))
                .then(sendQuickReplyTwoBtn.bind(null, sender, "Check which one applies to you:", "text", "I am under 18.", "minor", "text", "I am above 18.", "major"))
                .catch(function (body) {
                    console.log('aborted');
                });

            //before proceeding, check if user in database:
            insertToSession(sender) // insert to session if not yet in there
        });
    }

    if (postbackcategory === 'nav' && postbacksubcategory === 'main' && postbackvalue === 'learn') {
        tolotrafunctions.sendTopics(sender)
    }

    if (postbackcategory === 'registration') {
        if (postbacksubcategory === 'gender') {
            var update = {
                user_id: sender,
                sexe: postbackvalue,
            };
            surveyToRegister(sender, update)
        }
        //loop again
        UserMeetsCriteria(sender)
    } else if (postbackcategory === 'get_content') {
        var content_relationship = postbacksubcategory;
        var content_target_id = postbackvalue;
        switch (content_relationship) {
            case 'child_of':
                get_child_content_of(sender, content_target_id);
                break;
            case 'more_of':
                var next_id = postbacksubvalue;
                get_more_content(sender, content_target_id, next_id);
                break;
        }
    }


    if (raw_postback === 'get_help') {
        sendTextMessage(sender, "A bit lost? 😜 No problem.")
            .then(sendTextMessage.bind(null, sender, "You can always navigate by clicking the persistent menu 👇"))
            .then(sendImageMessage.bind(null, sender, "https://i1.wp.com/thedebuggers.com/wp-content/uploads/2017/01/fb-persistent-menu.png?resize=300%2C234"))
            .then(sendQuickReplyThreeBtn.bind(null, sender, "And here is what you can do for now ☺️", "text", "Learn", "learn", "text", "Ask A Question", "ask_question", "text", "Exit", "exit"))
            .catch(function (body) {
                console.log('aborted');
            });
    }

    if (raw_postback === 'ask_questions') {
        console.log('question attempt by ', sender);
        sendTextMessage(sender, "Send your question here as a message 👇☺️")
        //Options: Post Question, Cancel Question| All Questions are posted anonymously.
    }

    if (raw_postback === 'learn') {
        tolotrafunctions.sendTopics(sender)
    }
}

function verify_and_get_asset(code_to_verify) {
    var result = symbol.filter(function (obj) {
        return obj.symbol.toLowerCase() === code_to_verify || obj.name.toLowerCase() === code_to_verify;
    });
    if (typeof result === 'undefined') {
        return null;
    }else{
        console.log("verified asset type",typeof result)
        console.log("verified asset length", result.length)
        if (result.length ===1){
            return result[0];
        }else {
            console.log("more than one findings consider proposing the user to choose between them", code_to_verify)
            return result[0]
        }
    }
}
function decideMessagePlainText(sender, text) {
    console.log('message plain text');
    if (text.is_echo) {
        return;
    }

    console.log('message is: ', text);
    var textLower = text.toLowerCase();
    var array_tolwercase = textLower.split(" ");

    if (array_tolwercase[0] === "get") {
        if (typeof array_tolwercase[1] === 'undefined') {
            sendTextMessage(sender, 'write the asset symbol or name after get. Like: get bitcoin cash');
        } else {
            var object_asset = verify_and_get_asset(array_tolwercase[1]);
            if(object_asset === null) {
                sendTextMessage(sender, 'Sorry, this asset cannot be found. Try using the name or the symbol. Like: get ethereum')
            }
            coinmarkethelper.getTicker({asset_id: object_asset.id}, function (data_array, params) {
                var data = data_array[0]
                if (data.length > 1) {
                    console.log("check this url, we have more than one result in the array")
                }
                sendTextMessage(sender, data.name +" price now is "+data.price_usd+ " USD growing at "+data.percent_change_24h+" in 24hours")
            })
        }

    }


    else {
        switch (textLower) {
            //
            // //to lower case because
            // case 'i am above 18.':
            // case 'i am under 18.':
            //     var update = {
            //         user_id: sender,
            //         minor: text,
            //     };
            //     surveyToRegister(sender, update);
            //     console.log("MINORITY OR MAJORITY REGISTERED");
            //     askGender(sender);
            //     break;

            case 'hi':
            case 'hello':
                tolotrafunctions.senderLearnOrQuestionButton(sender, "Hey there! What do you want to do? 😏 ");
                break;

            case 'exit':
                sendTextMessage(sender, 'Hope you have learnt! See you soon! 🖖😉');
                break;

            case 'learn':
                tolotrafunctions.sendTopics(sender);
                break;

            default:
                tolotrafunctions.senderLearnOrQuestionButton(sender, "👀 Here is what you can do for now 🔥")
        }
    }

}

// console.log(sender, 'before database fetching user_id')
//  getMovieDetail(sender, 'director');


//API REQUEST
function sendRequest(sender, messageData) {
    return new Promise(function (resolve, reject) { // *****
        request({
            url: 'https://graph.facebook.com/v2.6/me/messages',
            qs: {access_token: token},
            method: 'POST',
            json: {
                recipient: {id: sender},
                message: messageData,
            }
        }, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var recipientId = body.recipient_id;
                var messageId = body.message_id;
                console.log("Successfully sent message with id %s to recipient %s", messageId, recipientId);
                resolve(body); // ***
            }
            else {
                console.error("Failed calling Send API", response.statusCode,
                    response.statusMessage, body.error);
                reject(body.error); // ***
            }
        })
    })
}

function sendButtonMessage(sender, text) {
    let messageData = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": "What do you want to learn about sex?",
                "buttons": [
                    {
                        "type": "postback",
                        "title": "How to maintain Sexual Health",
                        "payload": "health"
                    },
                    {
                        "type": "postback",
                        "title": "How do women get pregnant?",
                        "payload": "pregnant"
                    },
                    {
                        "type": "postback",
                        "title": "At which age should I have sex?",
                        "payload": "age"
                    }
                ]
            }
        }
    };
    sendRequest(sender, messageData);
}

function sendTextMessage(sender, text) {
    let messageData = {text: text};
    return sendRequest(sender, messageData)
}


function callGreetingAPI(greeting) {
    request({
        uri: 'https://graph.facebook.com/v2.6/me/thread_settings',
        qs: {access_token: token},
        method: 'POST',
        json: greeting

    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log("Successfully sent greeting message to {{user_full_name}}")
        } else {
            console.error("Unable to send greeting.");
            console.error(response);
            console.error(body);
        }
    });
}

//SET UP FOR QUICK REPLY
function callSendAPI(messageData) {
    return new Promise(function (resolve, reject) { // *****
        request({
            uri: 'https://graph.facebook.com/v2.6/me/messages',
            qs: {access_token: token},
            method: 'POST',
            json: messageData

        }, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var recipientId = body.recipient_id;
                var messageId = body.message_id;

                console.log("Successfully sent message with id %s to recipient %s",
                    messageId, recipientId);
                resolve(body); // ***
            } else {
                console.error("Unable to send message.");
                console.error(response);
                console.error(error);
                reject(body.error); // ***
            }
        });
    })
}

//SET UP FOR QUICK REPLY
function callSendAPI(messageData) {
    return new Promise(function (resolve, reject) { // *****
        request({
            uri: 'https://graph.facebook.com/v2.6/me/messages',
            qs: {access_token: token},
            method: 'POST',
            json: messageData

        }, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var recipientId = body.recipient_id;
                var messageId = body.message_id;

                console.log("Successfully sent message with id %s to recipient %s",
                    messageId, recipientId);
                resolve(body); // ***
            } else {
                console.error("Unable to send message.");
                console.error(response);
                console.error(error);
                reject(body.error); // ***
            }
        });
    })
}

function sendQuickReplyTwoBtn(recipientId, messageText, contentType1, title1, playload1, contentType2, title2, playload2) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            text: messageText,
            quick_replies: [
                {
                    content_type: contentType1,
                    title: title1,
                    payload: playload1
                },
                {
                    content_type: contentType2,
                    title: title2,
                    payload: playload2
                }
            ]
        }
    };
    callSendAPI(messageData);
}

function sendQuickReplyThreeBtn(recipientId, messageText, ct1, title1, pt1, ct2, title2, pt2, ct3, title3, pt3) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            text: messageText,
            quick_replies: [
                {
                    content_type: ct1,
                    title: title1,
                    payload: pt1
                },
                {
                    content_type: ct2,
                    title: title2,
                    payload: pt2
                },
                {
                    content_type: ct3,
                    title: title3,
                    payload: pt3
                }
            ]
        }
    };
    return callSendAPI(messageData);
}

function sendImageMessage(recipientId, imageUrl) {
    console.log(imageUrl, 'url that is trying to be uploaded');
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "image",
                payload: {
                    url: imageUrl
                }
            }
        }
    };
    return callSendAPI(messageData);
}

//------------------------------------------------------------
