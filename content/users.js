var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var UserSchema = new Schema({
    user_id: {type: String},
    first_name: {type: String},
    last_name: {type: String},
    date_joined: {type: String},
    age: {type: String},
    sexe: {type: String},
    interests: {type: String},
    preferences: {type: String},
    profile_url: {type: String}
});

module.exports = mongoose.model("Users", MovieSchema);