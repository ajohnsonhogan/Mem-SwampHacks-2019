const mongoose = require('mongoose');

var PersonSchema = mongoose.Schema({
    personId: String,
    instagramLink: String,
    name: String,
    email: String,
    hearAbout: String,
    phoneNumber: String,
    race: Array,
    instagramPicUrl: String
});

var PersonModel = mongoose.model('Person', PersonSchema);
