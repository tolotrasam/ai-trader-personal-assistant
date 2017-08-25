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


var params = {access_token: "EAAD01x8ZAgPoBAMU5pA2CmyacZAl5uNWJ7SHwNPo80Pck5OZAftaUpZA5zsHOZAkJcwQc0GmQiv4a6tYCqZB7VbwYgcnrKEpWOLxNZBDGhKQ3CT9BBNQZCjg2JdAbN2Y7lkqLs41lz77osfZCzZBknXHG6JKGmHaZBAllKR4djRNFjMBwZDZD"}
var url = "https://graph.facebook.com/v2.6/me/messenger_profile?" + serialiseObject(params)


var json_request = {

    "greeting": [
        {
            "locale": "default",
            "text": "Trader Artificial Intelligence Companion."
        }
    ]
}
http_request({
    url: url, method: 'POST', json: json_request
}, function (data, params) {
    console.log(data, params)
}, params)