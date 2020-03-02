'use strict'

var express = require('express');
var MessageController = require('../controllers/message');
var multipart = require('connect-multiparty');

var api = express.Router();
var md_auth = require('../middlewares/authenticated');
api.get('/probando-md', md_auth.ensureAuth, MessageController.probando);
api.post('/message', md_auth.ensureAuth, MessageController.saveMessage);
api.get('/my-messages', md_auth.ensureAuth, MessageController.getMessageByUser);

module.exports = api;