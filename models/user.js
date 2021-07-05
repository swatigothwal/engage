const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { ObjectId } = require("mongodb");

const UserSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  
  password: {
    type: String,
    required: true
  },
  group: [
    {
      type:ObjectId,
      ref: 'Room'
    }
  ]
})

module.exports = mongoose.model('user', UserSchema)