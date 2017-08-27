/**
 * Created by Tolotra Samuel on 26/08/2017.
 */

const request = require('request')


function http_request(headers_params, cb, params) {
    console.log(headers_params)
    request(headers_params
        , function (error, response, body) {
            if (!error && response.statusCode === 200) {
                console.log('result OK')
                cb(body, params)
                return null
            } else {
                cb(error, params)
                console.error("NOT YET");
                console.log(error)
                console.log(body)
            }
        })
}


var serialiseObject = function (obj) {
    var pairs = [];
    for (var prop in obj) {
        if (!obj.hasOwnProperty(prop)) {
            continue;
        }
        pairs.push(prop + '=' + obj[prop]);
    }
    return pairs.join('&');
}

var token = "EAAD01x8ZAgPoBAO2TS8PReCMOo4DZBuQgbcZAkBUDCwqgu4Kwvj4kVTXM3HOZAFTZBq6x6CiGq6iEcWMEzdzwZCPctoZC0ElNK9PNkFZAePtYApk7yZAb9lGgcoQ2qVq4vGHcgobwgxrZA2PITzw31ex6uN3QPEPGKKwJTaX02EyNpLAZDZD"
// EAAD01x8ZAgPoBAMU5pA2CmyacZAl5uNWJ7SHwNPo80Pck5OZAftaUpZA5zsHOZAkJcwQc0GmQiv4a6tYCqZB7VbwYgcnrKEpWOLxNZBDGhKQ3CT9BBNQZCjg2JdAbN2Y7lkqLs41lz77osfZCzZBknXHG6JKGmHaZBAllKR4djRNFjMBwZDZD
var get_params = {
    access_token: token,
    fields: "persistent_menu"
}

var params = {
    access_token: token
}

var url = "https://graph.facebook.com/v2.6/me/messenger_profile?" + serialiseObject(params)


var json_request = {

    "greeting": [
        {
            "locale": "default",
            "text": "I am a Trader Artificial Intelligence Bot Companion. I can give you the news, tips, price about the market"
        }
    ]
}

var persistant_menu = {
    "persistent_menu": [
        {
            "locale": "default",
            "composer_input_disabled": false,
            "call_to_actions": [
                {
                    "title": "My Subscriptions",
                    "type": "postback",
                    "payload": JSON.stringify({action:"subs"})
                },
                {
                    "title": "List of all assets",
                    "type": "postback",
                    "payload": JSON.stringify({action:"list"})
                },
                {
                    "title": "Help",
                    "type": "nested",
                    "call_to_actions": [
                        {
                            "title": "How to search an asset",
                            "type": "postback",
                            "payload": JSON.stringify({action: "asset_tutorial"})
                        },
                        {
                            "title": "How to get news about an asset",
                            "type": "postback",
                            "payload": JSON.stringify({action: "get_tutorial"})
                        },
                        {
                            "title": "How to subscribe to an asset",
                            "type": "postback",
                            "payload": JSON.stringify({action: "sub_tutorial"})
                        }
                    ]
                },

            ]
        },
        {
            "locale": "zh_CN",
            "composer_input_disabled": false
        }
    ]
}

http_request({
    url: url,
    method: 'POST',
    json: true,
    body: json_request
}, function (data, params) {
    console.log(JSON.stringify(data), params)
}, params)


