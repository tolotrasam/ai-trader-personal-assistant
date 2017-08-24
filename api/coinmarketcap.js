/**
 * Created by Tolotra Samuel on 24/08/2017.
 */


var coinma = require ('coinmarketcap')

const request = require('request')


function http_request(headers_params, cb, params) {
    console.log(headers_params)
    request(headers_params
        , function (error, response, body) {
            if (!error && response.statusCode === 200) {
                console.log('coinmarkethelper result OK')
                cb(JSON.parse(body), params)
                return null
            } else {
                cb(error, params)
                console.error("NOT YET");
            }
        })
}
module.exports = {
    getTicker: function (params, cb) {

        if (params === null) {
            params = {}
        }
        if (typeof params.asset_id==='undefined') {
            params.asset_id = ''
        }
        if (typeof params.convert==='undefined') {
            params.convert = 'USD'
        }
        if (typeof params.limit==='undefined') {
            delete params.limit ;
        }

       var  url = "https://api.coinmarketcap.com/v1/ticker/"+params.asset_id+"/?"+serialiseObject(params)

        http_request({url: url, method: 'GET'}, function (data, params) {
            cb(data, params)
        }, params)
    }
}


var serialiseObject = function(obj) {
    var pairs = [];
    for (var prop in obj) {
        if (!obj.hasOwnProperty(prop)) {
            continue;
        }
        pairs.push(prop + '=' + obj[prop]);
    }
    return pairs.join('&');
}


// module.exports.getTicker({limit:5, convert:'USD'},function (data) {
//   console.log(data)
// })

// processCommand({action: 'getbtcprice', market: 'USD'}, function (data, param) {
//     // console.log(data)
// })