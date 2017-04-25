//https://dashboard.heroku.com/apps/rocky-beyond-32293/logs
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
app.listen(app.get('port'), function () {
    console.log('running on port', app.get('port'))
})

app.post('/webhook/', function (req, res) {
    var data = req.body;
    console.log('IT STARTS HERE')
    // Set FB bot greeting text
    facebookThreadAPI('./fb-greeting-text.json', 'Greeting Text')
    console.log('HERE IS FACEBOOKTHREAD')
    //sendGreeting()
    sendGetStarted()
    //Make sure its a page subscription
    if (data.object==='page'){
        let messaging_events = data.entry[0].messaging
        //iterate over each messaging events
        for (let i = 0; i < messaging_events.length; i++) {
            let event = data.entry[0].messaging[i]
            let sender = event.sender.id

            if (event.message && event.message.text) {
                let text = event.message.text
                decideMessage(sender, text)
                receivedMessage(event)
            }

            if (event.postback) {
                let text = event.postback.payload
                decideMessage(sender, text) 
                continue
            }
        }
        res.sendStatus(200)
    }
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

    console.log(text)
    text.toLowerCase()

    if (text == 'get_started') {
        sendTextMessage(sender, "Hello there {{user_first_name}}!")
        getUserProfile()
    }

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

function callGreetingAPI(greeting) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/thread_settings',
    qs: { access_token: token},
    method: 'POST',
    json: greeting

  }, function(error, response, body) {
    if(!error && response.statusCode == 200) {
      console.log("Successfully sent greeting message to {{user_full_name}}")
      console.log(body)
      } else {
        console.error("Unable to send greeting.");
        console.error(response);
        console.error(body);
      }
    });
  }


function getUserProfile(){
    request({
        uri: 'https://graph.facebook.com/v2.6/<USER_ID>?fields=first_name,last_name,profile_pic,locale,timezone,gender',
        qs: {access_token:token},
        method: 'POST',
        json: true, 

        function(error, response, body) {
            if(!error && response.statusCode == 200) {
                console.log("Successfully sent userProfile")
                console.log("LOOOOOK" + body.first_name + " "  + body.last_name);

            } else {

                console.error("Unable to send userProfile.");
                console.error(response);
                console.error(body);
            }
        }
    })
}

function sendGetStarted() {
  var greeting = {
    setting_type:"call_to_actions",
    thread_state:"new_thread",
    call_to_actions:[
      {
        payload:"get_started"
      }
    ]
  }
  callGreetingAPI(greeting)
}
/*
function sendGreeting() {
  var greeting = {
    setting_type: "greeting",
    greeting: {
      text: "Hi {{user_first_name}}, welcome to this bot."
    }
  };
  callGreetingAPI(greeting)
}*/

// Calls the Facebook graph api to change various bot settings
function facebookThreadAPI(jsonFile, cmd){
    // Start the request
    request({
        uri: 'https://graph.facebook.com/v2.6/me/thread_settings',
        qs: { access_token: token},
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        form: require(jsonFile)
    },

    function (error, response, body) {
        if (!error && response.statusCode == 200) {
            // Print out the response body
            console.log(cmd+": Updated.");
            console.log(body);
        } else { 
            // TODO: Handle errors
            console.log(cmd+": Failed. Need to handle errors.");
            console.log(body);
        }
    });
}