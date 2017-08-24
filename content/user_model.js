var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var UserSchema = new Schema({
    user_id: {type: String},
    first_name: {type: String},
    last_name: {type: String},
    date_joined: {type: String},
    date_left: {type: String},
    locale: {type: String},
    timezone: {type:Object},
    subscription: {type:Object},
    gender: {type: String},
    base_currency: {type: String},
    preferences: {type: Object},
    last_ad_referral: {type: Object},
    is_payment_enabled: {type: String},
    profile_pic: {type: String}
});





module.exports = mongoose.model("Users", UserSchema);