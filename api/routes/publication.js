'use strinct'

var express = require('express');
var PublicationController = require('../controllers/publication');
var md_auth = require('../middlewares/authenticated');

var multipart = require('connect-multiparty');
var md_upload = multipart({uploadDir: './uploads/publications'});

var api = express.Router();
api.get('/probando',md_auth.ensureAuth, PublicationController.probando);
api.post('/publication',md_auth.ensureAuth, PublicationController.savePublication);
api.get('/publication/:id',md_auth.ensureAuth, PublicationController.getPublication);
api.get('/publications/:page?',md_auth.ensureAuth, PublicationController.getPublications);
api.delete('/publication/:id',md_auth.ensureAuth, PublicationController.deletePublication);
api.post('/upload-image-publication/:id', [md_auth.ensureAuth, md_upload], PublicationController.uploadImage);
api.get('/get-image-publication/:imageFile',  PublicationController.getImageFile);

module.exports = api;