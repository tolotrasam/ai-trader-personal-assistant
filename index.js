'use strict'

const token = process.env.PAGE_ACCESS_TOKEN
const vtoken = process.env.VERIFICATION_TOKEN

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()

app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

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
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'))
})


function decideMessage(sender, text) {
    text.toLowerCase()
    if (text === 'image') {
        sendGenericMessage(sender)
    }
    if (text ==='health') {
        sendTextMessage(sender, "Wear condom")
    }
    if (text ==='age'){

        sendTextMessage(sender, "18")
    }
    if(text ==='pregnant'){
        sendTextMessage(sender, "Sexual rapport")
    }else {

    }
    //sendButtonMessage(sender,text)
}
app.post('/webhook/', function (req, res) {
    let messaging_events = req.body.entry[0].messaging
    for (let i = 0; i < messaging_events.length; i++) {
        let event = req.body.entry[0].messaging[i]
        let sender = event.sender.id
        if (event.message && event.message.text) {
            let text = event.message.text
            decideMessage(sender, text)
          }
        if (event.postback) {
            let text = JSON.stringify(event.postback)
            decideMessage(sender, text)
            continue
        }
    }
    res.sendStatus(200)
})

function sendRequest(sender, messageData) {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })

}
function sendButtonMessage(sender, text) {
    let messageData = {
        "attachment":{
            "type":"template",
            "payload":{
                "template_type":"button",
                "text":"What do you want to learn about sex?",
                "buttons":[
                    {
                        "type":"postback",
                        "title":"How to maintain Sexual Health",
                        "payload":"health"
                    },
                    {
                        "type":"postback",
                        "title":"How do women get pregnant?",
                        "payload":"pregnant"
                    },
                    {
                        "type":"postback",
                        "title":"At which age should I have sex?",
                        "payload":"age"
                    }
                ]
            }
        }
    }
    sendRequest(sender, messageData);
}

function sendTextMessage(sender, text) {
    let messageData = { text:text }
   sendRequest(sender, text)
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
                        "url": "pregnant",
                        "title": "Read more"
                    }, {
                        "type": "postback",
                        "title": "Read more",
                        "payload": "Later",
                    }],
                }, {
                    "title": "Should I kiss?",
                    "subtitle": "Effect of kiss one health",
                    "image_url": "https://images.washingtonpost.com/?url=http://img.washingtonpost.com/news/morning-mix/wp-content/uploads/sites/21/2015/07/iStock_000046134044_Medium.jpg&w=1484&op=resize&opt=1&filter=antialias",
                    "buttons": [{
                        "type": "postback",
                        "title": "Read more",
                        "payload": "Later",
                    }],
                }]
            }
        }
    }

    sendRequest(sender, messageData)
}
