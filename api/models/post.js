const mongoose = require("mongoose");
const moment = require("moment");

const postSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  title: { type: String, required: true },
  date: {
    type: Date,
    default: () => moment().utc(),
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  image: { type: String, required: true },
});

module.exports = mongoose.model("Post", postSchema);
