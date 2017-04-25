//https://dashboard.heroku.com/apps/rocky-beyond-32293/logs
'use strict'

const token = process.env.PAGE_ACCESS_TOKEN
const vtoken = process.env.VERIFICATION_TOKEN

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()

var mongoose = require("mongoose");
var db = mongoose.connect(process.env.MONGODB_URI);

var Movie = require("./content/users");
// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))
// Process application/json
app.use(bodyParser.json())
app.set('port', (process.env.PORT || 5000))

// Index route
app.get('/', function (req, res) {
    res.send('Hello world, I am a chat bot')
})

// for Facebook verification
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === vtoken) {
        res.send(req.query['hub.challenge'])
    }
    res.send('No sir')
})

// Spin up the server
app.listen(app.get('port'), function () {
    console.log('running on port', app.get('port'))
})

app.post('/webhook/', function (req, res) {
    let messaging_events = req.body.entry[0].messaging
    for (let i = 0; i < messaging_events.length; i++) {
        let event = req.body.entry[0].messaging[i]
        let sender = event.sender.id

        if (event.message && event.message.text) {
            let text = event.message.text
            decideMessage(sender, text)
            receivedMessage(event)
        }

        if (event.postback) {
            let text = JSON.stringify(event.postback)
            decideMessage(sender, text)
            continue
        }

    }
    res.sendStatus(200)
})

//To get information about received messages
function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;
  var news;

  console.log("Received message for user %d and page %d at %d with message:",
    senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  var messageId = message.mid;
  var messageText = message.text;
  var messageAttachments = message.attachments;

}

function decideMessage(sender, text) {
    var query = {user_id: sender};
    var update = {
        user_id: sender,
        title: 'Bouba',
        plot: 'Chart',
        date: 'today',
        runtime: 'haawai',
        director: 'Nancia',
        cast: 'AutoCast',
        rating: '5 stars',
        poster_url:'nice url .com'
    };
    var options = {upsert: true};
    Movie.findOneAndUpdate(query, update, options, function(err, mov) {
        if (err) {
            console.log("Database error: " + err);
        } else {
            console.log("Database sucess");
        }
    })
    console.log(text)
    text.toLowerCase()
    if (text === 'image') {
        sendGenericMessage(sender)
    }
    if (text === 'health') {
        sendTextMessage(sender, "No risks condom")
    }
    if (text === 'health') {
        sendTextMessage(sender, "Wear condom")
    }
    if (text === 'age') {
        console.log('age detected')
        sendTextMessage(sender, "18")
        console.log('age end')
    }
    if (text === 'pregnant') {
        sendTextMessage(sender, "Sexual rapport")
    } else {
        sendButtonMessage(sender, text)
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
    }
    sendRequest(sender, messageData);
}

function sendTextMessage(sender, text) {
    let messageData = {text: text}
    sendRequest(sender, messageData)
}

function sendGenericMessage(sender) {
    let messageData = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [{
                    "title": "Are you pregrant?",
                    "subtitle": "Symptom of pregnancy",
                    "image_url": "http://cdnimage.vishwagujarat.com/wp-content/uploads/2016/10/25121628/PregnantWoman.jpg",
                    "buttons": [{
                        "type": "postback",
                        "payload": "pregnant",
                        "title": "Read more"
                    }, {
                        "type": "postback",
                        "title": "Later",
                        "payload": "later",
                    }],
                }, {
                    "title": "Should I kiss?",
                    "subtitle": "Effect of kiss one health",
                    "image_url": "https://images.washingtonpost.com/?url=http://img.washingtonpost.com/news/morning-mix/wp-content/uploads/sites/21/2015/07/iStock_000046134044_Medium.jpg&w=1484&op=resize&opt=1&filter=antialias",
                    "buttons": [{
                        "type": "postback",
                        "title": "Read more",
                        "payload": "kiss",
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
