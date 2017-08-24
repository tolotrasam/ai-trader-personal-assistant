/**
 * Created by Tolotra Samuel on 24/08/2017.
 */


var coinma = require ('coinmarketcap')
console.log(test)


function processCommand(cmd, cb) {
    cmd.action = cmd.action.toLowerCase()

    if (cmd.action === 'getmarketsummaries') {
        bittrex.getmarketsummaries(function (data) {
            console.log(data);
            cb(data)
        });
    }

    else if (cmd.action === 'getmarkethistory') {
        var m = cmd.market
        bittrex.getmarkethistory({market: m}, function (data) {
            console.log(data);
            cb(data)
        });
    }
    else if (cmd.action === 'getbalances') {
        bittrex.getbalances(function (data) {
            console.log(data);
            cb(data)
        });
    }
    else if (cmd.action === 'getmarketsummaries') {
        bittrex.getmarketsummaries(function (data) {
            console.log(data);
            cb(data)
        });
    }
    else if (cmd.action === 'getticks') {
        var m = cmd.market
        var interval = cmd.interval
        var timestamp = cmd.timestamp
        var params = {order: cmd.order}

        url = "https://bittrex.com/Api/v2.0/pub/market/GetTicks?marketName=" + m + "&tickInterval=" + interval + "&_=" + timestamp
        if (!timestamp || !interval || !m) {
            cb('Invalid parameters' + url)
            return
        }
        http_request({url: url, method: 'GET'}, function (data, params) {
            cb(data, params)
        }, params)
    }
    else if (cmd.action === 'getbtcprice') {
        var m = cmd.market

        url = "https://api.coinmarketcap.com/v1/ticker/bitcoin/?convert=" + m
        if (!m) {
            cb('Invalid forex' + url)
            return
        }
        http_request({url: url, method: 'GET'}, function (data, params) {
            cb(data, params)
        }, params)
    }

    else if (cmd.action === 'getlastestticks') {
        var m = cmd.market
        var interval = cmd.interval
        var timestamp = cmd.timestamp

        url = "https://bittrex.com/Api/v2.0/pub/market/GetLatestTick?marketName=" + m + "&tickInterval=" + interval + "&_=" + timestamp
        if (!timestamp || !interval || !m) {
            cb('Invalid parameters' + url)
            return
        }
        http_request({url: url, method: 'GET'}, function (data) {
            cb(data)
        })
    }


    else if (cmd.action === 'getorderhistory') {
        bittrex.getorderhistory('', function (data) {
            console.log(data);
            cb(data)
        });
    }

    else if (cmd.action === 'getwithdrawalhistory') {
        bittrex.getwithdrawalhistory('', function (data) {
            console.log(data);
            cb(data)
        });
    }
    else if (cmd.action === 'getopenorderswithlimits') {
        function replacer(key, value) {
            if (key == "interval_ticker") return undefined;
            else return value;
        }

        cb(orderstolisten_array, replacer)
    }

    else if (cmd.action === 'getopenorder') {
        var m = cmd.market
        var interval = cmd.interval
        var timestamp = cmd.timestamp

        if (!timestamp || !interval || !m) {
            cb('Invalid parameters', cmd)
            return
        }

        var index = orderstolisten_array.map(function (e) {
            return e.Exchange;
        }).indexOf(m);

        var requested_openOrder = orderstolisten_array[index]
        //finding new ticks from timestamp request
        var ticks_response = []

        for (var i = requested_openOrder.ticks_since_purchase.length - 1; i >= 0; i--) {
            var tick = requested_openOrder.ticks_since_purchase[i]
            if (getMillisFromZoulou(tick.T) > timestamp) {
                ticks_response.unshift(tick)
            } else {
                break
            }
        }
        var object_response = {
            "ticks_since_purchase": ticks_response,
            "Exchange": cmd.m,
            "limits": requested_openOrder.limits,
            "net_profit": requested_openOrder.net_profit,
            "net_profit_in_usd": requested_openOrder.net_profit_in_usd,
            "order.drop_fromTop": requested_openOrder.drop_fromTop
        }
        cb(object_response)
    }


    else if (cmd.action === 'getopenorders') {
        bittrex.getopenorders('', function (data) {
            console.log(data);
            cb(data)
        });
    }

    else {
        cb('Invalid Command')
    }

}