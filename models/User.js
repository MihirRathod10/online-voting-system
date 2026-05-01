const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    aadhaar: String,
    hasVoted: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model("User", userSchema);