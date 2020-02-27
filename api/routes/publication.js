'use strinct'

var express = require('express');
var PublicationController = require('../controllers/publication');
var md_auth = require('../middlewares/authenticated');

var multipart = require('connect-multiparty');
var md_upload = multipart({uploadDir: './uploads/publication'});

var api = express.Router();
api.get('/probando',md_auth.ensureAuth, PublicationController.probando);
api.post('/publication',md_auth.ensureAuth, PublicationController.savePublication);
api.get('/publications/:page?',md_auth.ensureAuth, PublicationController.getPublication);

module.exports = api;