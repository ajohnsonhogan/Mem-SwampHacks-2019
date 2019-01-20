const express = require('express');
const fileUpload = require('express-fileupload');
const mongoose = require('mongoose');
const _request = require('request');
const fs = require('fs');
const person_group_id = 'mem-swamphacks-19';
require('./models');
const bodyParser = require('body-parser');

var mongoDB = 'mongodb://localhost/db';
mongoose.connect(mongoDB);
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(fileUpload());
app.get('/', (request, result) => {result.status(200).send('HERRO!')})
app.post('/update', (req,res)=>{mongoose.model('Person').update({name:req.body.name}, {instagramPicUrl:req.body.pictureUrl}).exec((error)=>{if(error){console.log(error)}});res.status(200).send('')});
app.post('/upload', (request, result) => {
try{
    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    var sampleFile = Buffer.from(request.body.image, 'base64');
	console.log(sampleFile);
    _request.post({
        url: 'https://centralus.api.cognitive.microsoft.com/face/v1.0/detect?returnFaceId=true',
        body: sampleFile,
        headers: {
            'Ocp-Apim-Subscription-Key': '837e05b464ce4d7185f216cd5f693d20',
            'Content-Type': 'application/octet-stream'
        }
    }, (error, response, body) => {
	console.log(body);
        let json = JSON.parse(body);
        _request.post({
            url: 'https://centralus.api.cognitive.microsoft.com/face/v1.0/identify',
            json: {
                "faceIds": [json[0].faceId],
                "personGroupId": person_group_id
            },
            headers: {
                'Ocp-Apim-Subscription-Key': '837e05b464ce4d7185f216cd5f693d20',
                'Content-Type': 'application/json'
            }
        }, (error, response, body) => {
            let canidates = body[0].candidates;
            console.log(canidates);
            if (canidates.length){
                mongoose.model('Person').find({personId: canidates[0].personId}).exec((error, person) => {
                    result.json(person);
                });
            } else {
                result.json({});
            }
        });
    });
} catch (error) {
console.log(error);
result.json({});
}

});
app.post('/addface', (request, result) => {
console.log(request.body)
    _request.post({
        url: `https://centralus.api.cognitive.microsoft.com/face/v1.0/persongroups/${person_group_id}/persons`,
        json: {
            "name": request.body.name,
        },
        headers: {
            'Ocp-Apim-Subscription-Key': '837e05b464ce4d7185f216cd5f693d20',
            'Content-Type': 'application/json'
        }
    }, (error, response, body) => {
        let personId = body.personId;
        let pictureUrl = request.body.pictureUrl;
        _request.post({
            url: 'https://centralus.api.cognitive.microsoft.com/face/v1.0/detect?returnFaceId=true',
            json: {url: pictureUrl},
            headers: {
                'Ocp-Apim-Subscription-Key': '837e05b464ce4d7185f216cd5f693d20'
            }
        }, (error, response, body) => {

            _request.post({
                url: `https://centralus.api.cognitive.microsoft.com/face/v1.0/persongroups/${person_group_id}/persons/${personId}/persistedFaces`,
                json: {url: pictureUrl},
                headers: {
                    'Ocp-Apim-Subscription-Key': '837e05b464ce4d7185f216cd5f693d20',
                    'Content-Type': 'application/json'
                }
            }, (error, response, body) => {
                mongoose.model('Person')({
                    personId: personId,
                    instagramLink: request.body.instagram,
                    name: request.body.name,
                    email: request.body.email,
                    hearAbout: request.body.hearAbout,
                    phoneNumber: request.body.phone,
                    race: request.body.race,
		    instagramPicUrl: pictureUrl
                }).save((error)=>{if(error){result.status(403)}else{result.status(200).send(body);}});
            });
        });
    });
});
app.listen(80);
process.on('uncaughtException', function (err) {
  console.log('Caught exception: ', err);
});
