//https://dashboard.heroku.com/apps/rocky-beyond-32293/logs
'use strict';

const token = process.env.PAGE_ACCESS_TOKEN;
const vtoken = process.env.VERIFICATION_TOKEN;
const db_token = process.env.MONGODB_URI

const express = require('express');
const bodyParser = require('body-parser');
var mongoose = require("mongoose");
var Subscription = require("./content/subscription_model");

const request = require('request');
const app = express();
var Promise = require('promise');
var userSession = [];
var globalvars = {sendRequest: sendRequest, userData: userSession};

var db = mongoose.connect(db_token);
//for messages sequence

var tolotrafunctions = require('./tolotrafunctions');
var Users = require("./content/user_model");
var Content = require("./content/content");
// Process application/x-www-form-urlencoded
var coinmarkethelper = require('./api/coinmarketcap')
var tips_how_to_get_list = "If you need help because you don't know the asset name, just type 'list' and I'll help you";
var tips_how_to_sub = 'Write the asset symbol or name after get. Like: subscribe bitcoin cash';
var tips_example_subs = '. Try using the name or the symbol of the asset. Something like: subscribe ethereum or sub ltc. ';

var next_timeout_interval;

var symbol = null;
updateSymbols(function (data, params) {
})

start_timeout_interval()

function getFrequencyInMillisOfSubscription(subscriber) {
    var frequency_count = subscriber.frequency_count;
    var times_interval_millis = 0;
    switch (subscriber.frequency_label) {
        case 'minutes':
        case 'minute':
        case 'min':
            times_interval_millis = 60 * 1000
            break;
        case 'hours':
        case 'hour':
            times_interval_millis = 60 * 1000 * 60
            break;
        case 'day':
        case 'days':
            times_interval_millis = 60 * 1000 * 60 * 24
            break;
        case 'week':
        case 'weeks':
            times_interval_millis = 60 * 1000 * 60 * 24 * 7
            break;
        case 'month':
        case 'months':
            times_interval_millis = 60 * 1000 * 60 * 24 * 30
            break;
    }
    var frequency_millis = frequency_count * times_interval_millis
    return frequency_millis;
}
function sendUpdatesToEachSubscripbers(subscribers) {
    for (var subscriber of subscribers) {
        var current_time_stamp = new Date().getTime();
        var last_update = subscriber.last_update;
        if (typeof last_update === 'undefined') {
            last_update = 0
        }

        var frequency_millis = getFrequencyInMillisOfSubscription(subscriber)

        var diff = current_time_stamp - last_update;
        console.log(frequency_millis, "frequency millis of " + subscriber.frequency)
        if (diff >= frequency_millis) {

            var data = verify_and_get_asset(subscriber.asset_id)
            if (data === null) {
                sendTextMessage(subscriber.user_id, "Sorry, Your subscription to the asset with id " + subscriber.asset_id + "( " + subscriber.asset_symbol + ") seems to be missing. Trying using get " + subscriber.asset_symbol)
            } else {

                let messageData = {
                    "attachment": {
                        "type": "template",
                        "payload": {
                            "template_type": "generic",
                            "elements": []
                        }
                    }
                };
                var element = {
                    "title": data.name + " (" + subscriber.asset_symbol + ")" + " price now is " + data.price_usd + " USD growing at " + data.percent_change_24h + "% in 24 hours",

                    "subtitle": "This update is recurring every " + subscriber.frequency,
                    "buttons": [{
                        "type": "postback",
                        "payload": JSON.stringify({action: "get", asset_id: subscriber.asset_id}),
                        "title": "Get "
                    }, {
                        "type": "postback",
                        "title": "Edit",
                        "payload": JSON.stringify({action: "edit", asset_id: subscriber.asset_id}),
                    }, {
                        "type": "postback",
                        "title": "Unsubscribe",
                        "payload": JSON.stringify({
                            action: "unsub",
                            _id: subscriber._id,
                            asset_name: subscriber.asset_name,
                            asset_symbol: subscriber.system,
                            interval: subscriber.interval
                        }),
                    }],
                }
                messageData.attachment.payload.elements.push(element)
                sendRequest(subscriber.user_id, messageData)
            }

            var query = {_id: subscriber._id};
            var options = {upsert: true};
            var update = {last_update: new Date().getTime()};
            //Updating the last_update time to the current timestamp
            Subscription.findOneAndUpdate(query, update, options, function (err, mov) {
                if (err) {
                    console.log("Database error: " + err);
                } else {
                    console.log('sending update to user', subscriber.user_id)

                }

            })
        }
    }
    start_timeout_interval()
}
function sendUpdatesToSubscripbers() {
    console.log('updating all subscribers')

    updateSymbols(function (data, params) {

        Subscription.find({active: true}, function (err, user) {
            if (err) {
                console.log("no subscription not found or something weirder");
                return false; // user not found or something weirder

            } else {
                if (user) {
                    console.log(user, "subs found on database");

                    sendUpdatesToEachSubscripbers(user)
                    return true; //user found
                } else {
                    console.log('no result from database for');
                    return false;
                }
            }
        })
    })
}
function start_timeout_interval() {
    var current_time = new Date()
    var currentMin = current_time.getMinutes()
    var currentHour = current_time.getHours()
    var currentWeekDay = current_time.getDay()
    var currentDay = current_time.getDate()
    var next_update = current_time.getTime();

    if (currentMin >= 45) {
        next_update = (60 - currentMin) * 60 * 1000
    } else if (currentMin >= 30) {
        next_update = (45 - currentMin) * 60 * 1000
    } else if (currentMin >= 15) {
        next_update = (30 - currentMin) * 60 * 1000
    } else {
        next_update = (15 - currentMin) * 60 * 1000
    }

    next_update = 5 * 60 * 1000 //only for debugging

    console.log('current min is' + currentMin + ' and next update in milliseconds: ', next_update)
    next_timeout_interval = setTimeout(function () {
        sendUpdatesToSubscripbers()
    }, next_update)

}
function updateSymbols(cb) {

    coinmarkethelper.getTicker(null, function (data, param) {
        symbol = data;
        cb(data, param)
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
    //Make sure its a page subscription
    if (data.object === 'page') {
        let messaging_events = data.entry[0].messaging;
        //iterate over each messaging events
        if (typeof messaging_events !== 'undefined') {
            for (let i = 0; i < messaging_events.length; i++) {
                let event = messaging_events[i];
                let sender = event.sender.id;

                if (event.message && event.message.text) {
                    console.log('NEW MESSAGE STARTS HERE');
                    receivedMessageLog(event)
                    let text = event.message.text;
                    decideMessagePlainText(sender, text, event);
                }

                else if (event.postback) {
                    console.log('NEW POSTBACK STARTS HERE');
                    receivedMessageLog(event)
                    let payload = event.postback.payload;
                    decideMessagePostBack(sender, payload, event)
                }
            }
        } else {
            console.log("Fresh received", JSON.stringify(data))
        }
    }
    res.sendStatus(200)
})

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
function ModifyOrRegisterUserById(senderId, update) {
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
    if (typeof (userSession.sender) === 'undefined') {
        userSession.sender = {userdId: sender}
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

function add_new_user(sender) {
    request({
        url: "https://graph.facebook.com/v2.6/" + sender,
        qs: {
            access_token: token,
            fields: "first_name,last_name,locale,timezone,gender"
        },
        method: "GET"
    }, function (error, response, body) {
        var greeting = "";
        console.log(JSON.stringify(response))
        if (error) {
            console.log("Error getting user's profile: " + error);
        } else {
            var bodyObj = JSON.parse(body);
            console.log(bodyObj, 'profile graph api')
            var update = {
                user_id: sender,
                first_name: bodyObj.first_name,
                last_name: bodyObj.last_name,
                profile_pic: bodyObj.profile_pic,
                locale: bodyObj.locale,
                timezone: bodyObj.timezone,
                gender: bodyObj.gender,
                date_joined: new Date().getTime(),
            }
            ModifyOrRegisterUserById(sender, update)

            greeting = "Hi " + bodyObj.first_name + " 😃 ";

            var message = greeting + "My name is AI Trader Personal Assistant. I can tell you various details about the market such as prices and news. I can also provide trading tips.  🔥🔥";
            sendTextMessage(sender, message)
                .then(sendTextMessage.bind(null, sender, "Let's get started right now. Ask me the price of an asset using: get (symbol or the asset name) "))
                .then(sendQuickReplyTwoBtn.bind(null, sender, "Or click here to try", "text", "get bitcoin", JSON.stringify({action:"get", asset_id:"bitcoin", tutorial:true}), "text", "get ltc", JSON.stringify({action:"get", asset_id:"bitcoin", tutorial:true})))
                .catch(function (body) {
                    console.log('aborted');
                });

            //before proceeding, check if user in database:
            insertToSession(sender) // insert to session if not yet in there
        }
    });
}
function unsubscribeForUser(sender, asset_obj) {
    var query = {_id: asset_obj._id};
    var options = {upsert: true};
    var update = {
        active: false,
        from: new Date().getTime()
    };

    Subscription.findOneAndUpdate(query, update, options, function (err, mov) {
        if (err) {
            console.log("Database error: " + err);
        } else {
            console.log("Database sucess end subscription", JSON.stringify(mov));
            sendTextMessage(sender, "Okay! You successfully unsubscribed for " + mov.asset_name + " (" + mov.asset_symbol + ") every " + mov.interval + " . Check out your subscription list by typing: my subs or my subscription");
        }
    })
}
function decideMessagePostBack(sender, payload) {
    var postbackText = JSON.stringify(payload);
    console.log('message postback', postbackText);
    try {
        var postback_object = JSON.parse(payload)
    } catch (e) {

    }
    if (typeof postback_object !== 'undefined') {
        if (typeof postback_object.action !== 'undefined') {
            if (postback_object.action === 'get') {
                sendAssetPrice(sender, postback_object.asset_id)
            }
            else if (postback_object.action === 'unsub') {
                unsubscribeForUser(sender, postback_object)
            }

            else if (postback_object.action === 'edit') {
                sendSubscriptionFrequencyPicker(sender, postback_object.asset_id)
            }
            if (postback_object.action === 'list') {
                sendListAsset(sender, 0)
            }
            if (postback_object.action === 'subs') {
                sendSubscriptionList(sender)
            }
            else if (postback_object.action === 'page_list') {
                sendListAsset(sender, postback_object.from)
            }
            return
        } else {
            console.log('post back action not defined, check array split instead')
        }
    } else {
        console.log('post back action not defined, check array split instead')
    }
    //post back will always contain a prefix (as key) referring to its category, a dash separate post back key, sub key to value     f
    var postback = payload.split("-");
    var postbackcategory = postback[0];
    var postbacksubcategory = postback[1];
    var postbackvalue = postback[2];
    var postbacksubvalue = postback[3];
    console.log(postback, 'post back');


    if (payload === 'get_started') {
        add_new_user(sender)
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
            ModifyOrRegisterUserById(sender, update)
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


    if (payload === 'get_help') {
        sendTextMessage(sender, "A bit lost? 😜 No problem.")
            .then(sendTextMessage.bind(null, sender, "You can always navigate by clicking the persistent menu 👇"))
            .then(sendImageMessage.bind(null, sender, "https://i1.wp.com/thedebuggers.com/wp-content/uploads/2017/01/fb-persistent-menu.png?resize=300%2C234"))
            .then(sendQuickReplyThreeBtn.bind(null, sender, "And here is what you can do for now ☺️", "text", "Learn", "learn", "text", "Ask A Question", "ask_question", "text", "Exit", "exit"))
            .catch(function (body) {
                console.log('aborted');
            });
    }

    if (payload === 'ask_questions') {
        console.log('question attempt by ', sender);
        sendTextMessage(sender, "Send your question here as a message 👇☺️")
        //Options: Post Question, Cancel Question| All Questions are posted anonymously.
    }

    if (payload === 'learn') {
        tolotrafunctions.sendTopics(sender)
    }
}

function verify_and_get_asset(code_to_verify) {
    code_to_verify = code_to_verify.toLowerCase()
    var result = symbol.filter(function (obj) {
        return obj.symbol.toLowerCase() === code_to_verify || obj.name.toLowerCase() === code_to_verify || obj.id.toLowerCase() === code_to_verify;
    });
    if (result.length === 0) {
        console.log("no asset found in coinmarket cap for " + code_to_verify)
        return null;
    } else {
        console.log("verified asset type", typeof result)
        console.log("verified asset length", result.length)
        if (result.length === 1) {
            return result[0];
        } else {
            console.log("more than one findings consider proposing the user to choose between them", code_to_verify)
            return result[0]
        }
    }
}
function sendSubscriptionList(sender) {
    Subscription.find({user_id: sender, active: true}, function (err, user) {
        if (err) {
            console.log("no subscription not found or something weirder");
            return false; // user not found or something weirder

        } else {
            if (user.length !== 0) {
                console.log(user.length, "subs found on database");
                sendTextMessage(sender, "You have " + user.length + " active subscriptions:")
                let messageData = {
                    "attachment": {
                        "type": "template",
                        "payload": {
                            "template_type": "generic",
                            "elements": []
                        }
                    }
                };
                user = user.sort(function (a, b) {
                    var f_a = getFrequencyInMillisOfSubscription(a)
                    var f_b = getFrequencyInMillisOfSubscription(b)
                    return f_a - f_b;
                });

                for (var user_subs of user) {
                    var element = {
                        "title": user_subs.asset_name + " (" + user_subs.asset_symbol + ")",
                        "subtitle": "Every " + user_subs.frequency,
                        "buttons": [{
                            "type": "postback",
                            "payload": JSON.stringify({action: "get", asset_id: user_subs.asset_id}),
                            "title": "Get "
                        }, {
                            "type": "postback",
                            "title": "Edit",
                            "payload": JSON.stringify({action: "edit", asset_id: user_subs.asset_id}),
                        }, {
                            "type": "postback",
                            "title": "Unsubscribe",
                            "payload": JSON.stringify({
                                action: "unsub",
                                _id: user_subs._id,
                                asset_name: user_subs.asset_name,
                                asset_symbol: user_subs.system,
                                interval: user_subs.interval
                            }),
                        }],
                    }
                    messageData.attachment.payload.elements.push(element)
                }
                sendRequest(sender, messageData)
                return true; //user found
            } else {
                sendTextMessage(sender, "You have no active subscription yet. " + tips_how_to_sub + " " + tips_example_subs)
                console.log('no subs result from database for ' + sender);
                return false;
            }
        }
    })
}
function sendAssetPrice(sender, asset_code) {

    var object_asset = verify_and_get_asset(asset_code);
    if (object_asset === null) {
        sendTextMessage(sender, 'Sorry, I don\'t know what\'s a ' + asset_code + '. Try using the name or the symbol of the asset. Something like: get ethereum or get ltc. ' + tips_how_to_get_list)
    } else {
        coinmarkethelper.getTicker({asset_id: object_asset.id}, function (data_array, params) {
            var data = data_array[0]
            if (data.length > 1) {
                console.log("check this url, we have more than one result in the array")
            }
            sendTextMessage(sender, data.name + " price now is " + data.price_usd + " USD growing at " + data.percent_change_24h + "% in 24 hours")
        })
    }
}

function isInt(value) {
    return !isNaN(value) &&
        parseInt(Number(value)) == value &&
        !isNaN(parseInt(value, 10));
}
function addSubscriptionForUser(sender, asset_obj) {
    var query = {user_id: sender, asset_id: asset_obj.asset_id, asset_symbol: asset_obj.asset_symbol};
    var options = {upsert: true};
    var frequency_key_val = asset_obj.interval.split(" ")
    var update = {
        user_id: sender,
        asset_id: asset_obj.asset_id,
        asset_symbol: asset_obj.asset_symbol,
        asset_name: asset_obj.asset_name,
        frequency: asset_obj.interval,
        frequency_count: frequency_key_val[0],
        active: true,
        frequency_label: frequency_key_val[1],
        from: new Date().getTime()
    };

    var frequency_millis = getFrequencyInMillisOfSubscription(update)
    if (!isInt(update.frequency_count)) {
        sendTextMessage(sender, 'Sorry, I don\'t know what\'s a ' + update.frequency_count + '. I don\'t think it\'s a number . Please start only numbers').then(sendSubscriptionFrequencyPicker.bind(null, sender, update.asset_id))
    } else if (frequency_millis === 0) {
        sendTextMessage(sender, 'Sorry, I don\'t know what\'s a ' + update.frequency_label + ' . Please use only minutes, hours, days or weeks (or min, hours, days, weeks').then(sendSubscriptionFrequencyPicker.bind(null, sender, update.asset_id))
    } else if (frequency_millis < 5 * 60 * 1000) {
        sendTextMessage(sender, 'Wow, That\'s too fast! Please choose at least 5 minutes').then(
            sendSubscriptionFrequencyPicker.bind(null, sender, update.asset_id))
    } else {
        Subscription.findOneAndUpdate(query, update, options, function (err, mov) {
            if (err) {
                console.log("Database error: " + err);
            } else {
                console.log("Database sucess new subscription", JSON.stringify(mov));
                sendTextMessage(sender, "Cool! I\'ll update you about everything I can find about about " + asset_obj.asset_name + " (" + asset_obj.asset_symbol + ") every " + asset_obj.interval + " . Check out your subscription list by typing: my subs or my subscription");
            }
        })
    }
}
function setCoockiePayload(sender, action, payload) {
    var coockie = {user_id: sender, action: action, payload: payload, active: true}
    userSession.push(coockie)
}
function sendSubscriptionFrequencyPicker(sender, asset_code) {
    var object_asset = verify_and_get_asset(asset_code);
    if (object_asset === null) {
        sendTextMessage(sender, 'Sorry, I don\'t know what\'s a ' + array_tolwercase[1] + tips_example_subs + tips_how_to_get_list)
    } else {
        var quick_replies = []
        var sub_intervals = [{title: '30 minutes', interval: '30 min'}, {
            title: 'Hourly',
            interval: '1 hour'
        }, {title: 'Daily', interval: '1 day'}, {title: 'Weekly', interval: '1 week'}, {
            title: 'Monthly',
            interval: '1 month'
        }];
        for (var interval_obj of sub_intervals) {
            var json_payload = {
                "sender": sender,
                "action": "subscribe",
                "asset_id": object_asset.id,
                "asset_name": object_asset.name,
                "asset_symbol": object_asset.symbol,
                "interval": interval_obj.interval
            }
            var reply = {
                content_type: "text",
                title: interval_obj.title,
                payload: JSON.stringify(json_payload)
            }
            quick_replies.push(reply)
        }
        quick_replies.push({
            content_type: "text",
            title: "cancel",
            payload: JSON.stringify({action: "subscribe", cancel: true})
        })
        setCoockiePayload(sender, 'subscribe', json_payload)
        sendCustomQuickReplyBtn(sender, " Choose how often do you me want to send you news and price about " + object_asset.name + " (" + object_asset.symbol + ") or just tell me a custom interval. Like: 6 hours, 3 days, 2 weeks", quick_replies)

    }
}
function getUserCoockie(sender) {
    var n = 0
    var found = false
    for (var userCoockie of userSession) {
        if (userCoockie.user_id === sender) {
            found = true;
            break;
        }
        n++
    }
    if (!found) {
        return -1;
    }
    return n;
}
function sendListAsset(sender, from) {
    if (typeof from === 'undefined') {
        from = 0
    }
    let messageData = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": "PALCEHOLDER",
                "buttons": []
            }
        }
    };

    if (from >= 30) {
        messageData.attachment.payload.buttons.push({
            "type": "postback",
            "title": "Previous Page ",
            "payload": JSON.stringify({action: "page_list", from: from - 30}),
        })
    }
    messageData.attachment.payload.buttons.push(
        {
            "type": "postback",
            "title": "Next Page",
            "payload": JSON.stringify({action: "page_list", from: from + 30}),
        })


    var element_str = "";

    for (var n = from; n < from + 30; n++) {
        element_str += symbol[n].symbol + ": " + symbol[n].name + " " + symbol[n].percent_change_24h + "\n"
    }

    messageData.attachment.payload.text = element_str
    sendRequest(sender, messageData)

}
function sendSearchAsset(sender, keyword, search_index, backward) {

    let messageData = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": "PALCEHOLDER",
                "buttons": []
            }
        }
    };


    var element_str = "";
    if (typeof keyword !== "undefined") {
        var keyword_size = 0;
        var new_search_index = 0
        if (backward) {
            for (var n = search_index; n >=0; n--) {
                var temp_str = symbol[n].symbol + ": " + symbol[n].name + " " + symbol[n].percent_change_24h + "\n"
                if (temp_str.indexOf(keyword) !== -1) {
                    element_str += temp_str
                    keyword_size++
                    if (keyword_size >= 30) {
                        new_search_index = n;
                        break;
                    }
                }
            }
        } else {
            for (var n = search_index; n < symbol.length; n++) {
                var temp_str = symbol[n].symbol + ": " + symbol[n].name + " " + symbol[n].percent_change_24h + "\n"
                if (temp_str.indexOf(keyword.toLowerCase()) !== -1) {
                    element_str += temp_str
                    keyword_size++
                    if (keyword_size >= 30) {
                        new_search_index = n;
                        break;
                    }
                }
            }
        }
        if (element_str === "") {
            element_str = "No results. End of search"
        }
        if (new_search_index >= 0) {
            messageData.attachment.payload.buttons.push({
                "type": "postback",
                "title": "Previous Page ",
                "payload": JSON.stringify({
                    action: "page_search",
                    backward: true,
                    keyword: keyword,
                    search_index: search_index
                }),
            })
        }

        if (keyword_size <= 30 && !backward) {

            messageData.attachment.payload.buttons.push(
                {
                    "type": "postback",
                    "title": "Next Page",
                    "payload": JSON.stringify({
                        action: "page_search",
                        backward: false,
                        keyword: keyword,
                        search_index: new_search_index
                    }),
                })
        }
    }

    messageData.attachment.payload.text = element_str

    sendRequest(sender, messageData)
}
function decideMessagePlainText(sender, text, event) {
    console.log('message plain text');


    if (event.message.is_echo) {
        console.log('is_echo, come back :) ')
        return;
    }

    console.log('message is: ', text);
    var textLower = text.toLowerCase();
    if (typeof event.message.quick_reply !== 'undefined') {
        try {
            var payload = JSON.parse(event.message.quick_reply.payload)
        } catch (e) {

        }
    }

    //QUICK REPLIES
    if (typeof payload !== "undefined") {
        //ADDING NEW SUBSCRIPTION, PAYLOAD FROM QUICK REPLY FREQUENCY
        if (payload.action === 'subscribe') {
            //removing coockie
            var userIndexInCoockie = getUserCoockie(sender)
            if (userIndexInCoockie !== -1) {
                var coockie_payload = userSession[userIndexInCoockie].payload
                if (userSession[userIndexInCoockie].action === 'subscribe') {
                    userSession.splice(userIndexInCoockie, 1); //removing user from coockie
                }
            }
            if (payload.cancel !== true) {
                addSubscriptionForUser(sender, payload)
            } else {
                sendTextMessage(sender, "Okay!")
                return
            }
        } else if (payload.action === 'list') {
            sendListAsset(sender, 0)
        } else if (payload.action === 'my subs') {
            sendSubscriptionList(sender)
        } else if (payload.action === 'search') {
            sendSearchAsset(sender, 0, payload.keyword, false)
        } else if (payload.action === 'page_list') {
            sendListAsset(sender, payload.from)
        }else if (payload.action === 'page_search') {
            sendListAsset(sender,payload.search_index, payload.backward)
        } else if (payload.action === 'get') {
            sendAssetPrice(sender, payload.asset_id)
            if(payload.tutorial ===true){
                quick_replies.push({
                    content_type: "text",
                    title: "List",
                    payload: JSON.stringify({action: "list", from: 0, tutorial: true})
                }, {
                    content_type: "text",
                    title: "Search Bitcoin",
                    payload: JSON.stringify({action: "search", keyword: "Bitcoin", tutorial: true})
                })
                sendTextMessage(sender, "Great! You can see the list all the asset that I know by typing: list or search keyword")
                sendTextMessage(sender, "Or Try clicking in one the buttons below:").then(
                    sendCustomQuickReplyBtn.bind(null, sender, "This is how to get the list of the assets:", quick_replies))
            }
            var quick_replies = []
         }
        return;
    }


    //COOCKIE CONVERSATION
    var userIndexInCoockie = getUserCoockie(sender)
    if (userIndexInCoockie !== -1) {
        var coockie_payload = userSession[userIndexInCoockie].payload
        if (userSession[userIndexInCoockie].action === 'subscribe') {
            userSession.splice(userIndexInCoockie, 1); //removing user from coockie
            coockie_payload.interval = textLower;
            addSubscriptionForUser(sender, coockie_payload)
            return
        }
    }


    var array_tolwercase = textLower.split(" ");
    if (textLower === 'get started') {
        add_new_user(sender)
    }

    //GETTING THE USER SUBSCRIPTION LIST
    else if (textLower === 'my subs' || textLower === 'my subscriptions' || textLower === 'subs') {
        sendSubscriptionList(sender)
    } else if (array_tolwercase[0] === "get") {
        if (typeof array_tolwercase[1] === 'undefined') {
            sendTextMessage(sender, 'write the asset symbol or name after get. Like: get bitcoin cash');
        } else {

            // var asset_code = array_tolwercase[1]
            var asset_code = textLower.substr(textLower.indexOf(' ') + 1);
            sendAssetPrice(sender, asset_code)

        }
    } else if (array_tolwercase[0] === "list" ) {
        if (typeof array_tolwercase[1] === 'undefined') {
            sendTextMessage(sender, 'I found ' + symbol.length + ' Assets corresponding to your search');
            sendListAsset(sender)
        } else {

            // var asset_code = array_tolwercase[1]
            // var asset_code = textLower.substr(textLower.indexOf(' ') + 1);
            // sendAssetPrice(sender, asset_code)

        }
    } else if (array_tolwercase[0] === "search" ) {
        if (typeof array_tolwercase[1] === 'undefined') {
            sendTextMessage(sender, 'Here is what I found');
            sendSearchAsset(sender,array_tolwercase[1], 0,false )
        } else {
            sendListAsset(sender)
            // var asset_code = array_tolwercase[1]
            // var asset_code = textLower.substr(textLower.indexOf(' ') + 1);
            // sendAssetPrice(sender, asset_code)

        }
    }


    //BINARY COMMAND WITH SPACE
    //ASKING FOR FREQUENCY BEFORE ADDING SUBSCRIPTION
    else if (array_tolwercase[0] === "sub" || array_tolwercase[0] === "subscribe") {
        if (typeof array_tolwercase[1] === 'undefined') {

            sendTextMessage(sender, tips_how_to_sub);
        } else {
            sendSubscriptionFrequencyPicker(sender, array_tolwercase[1])

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
                var quick_replies = []
                quick_replies.push({
                    content_type: "text",
                    title: "List",
                    payload: JSON.stringify({action: "list", from: 0})
                }, {
                    content_type: "text",
                    title: "My Subs",
                    payload: JSON.stringify({action: "subs"})
                })
                sendCustomQuickReplyBtn(sender, "Sorry, I don't know what's a " + textLower + " . However, I've cooler stuff for you:", quick_replies)
            // tolotrafunctions.senderLearnOrQuestionButton(sender, "👀 Here is what you can do for now 🔥")
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

function sendCustomQuickReplyBtn(recipientId, messageText, quick_replies) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            text: messageText,
            quick_replies,
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
