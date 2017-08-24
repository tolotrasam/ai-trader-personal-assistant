var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var SubscriptionSchema = new Schema({
    user_id: {type: String},
    asset_id: {type: String},
    asset_symbol: {type: String},
    from: {type: Object},
    frequency: {type: String},
    frequency_count: {type: String},
    frequency_label: {type: String},
    last_update: {type: String},
    ideal_timing: {type: String}
});

module.exports = mongoose.model("Subscription", SubscriptionSchema);