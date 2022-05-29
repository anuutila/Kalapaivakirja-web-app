const mongoose = require('mongoose')

if ( process.env.NODE_ENV !== 'production' ) {
  require('dotenv').config()
}

const url = process.env.MONGODB_URI

mongoose.connect(url)

const Entry = mongoose.model('Entry', {
    fish: String,
    date: String,
    length: String,
    weight: String,
    lure: String,
    place: String,
    time: String,
    person: String
})

module.exports = Entry