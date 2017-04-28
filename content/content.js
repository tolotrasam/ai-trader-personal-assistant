var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var ContentSchema = new Schema({
    content_id: {type: String},
    parent_id: {type: String},
    text_content: {type: String},
    payload_for_more: {type: String},
    payload_for_something_else: {type: String},
    url: {type: String},
    image_url: {type:String},
    type_of_content: {type:String},
    payload_for_similar: {type: String},
    view_count: {type: String},
    active: {type: String}
});

module.exports = mongoose.model("Content", ContentSchema);