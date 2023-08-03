const mongoose = require('mongoose')

const Entry = mongoose.model('Entry', {
    fish: String,
    date: String,
    length: String,
    weight: String,
    lure: String,
    place: String,
    coordinates: String,
    time: String,
    person: String
})

module.exports = Entry