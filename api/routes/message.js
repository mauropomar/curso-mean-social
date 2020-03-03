'use strict'

var express = require('express');
var MessageController = require('../controllers/message');
var multipart = require('connect-multiparty');

var api = express.Router();
var md_auth = require('../middlewares/authenticated');
api.get('/probando-md', md_auth.ensureAuth, MessageController.probando);
api.post('/message', md_auth.ensureAuth, MessageController.saveMessage);
api.get('/receives', md_auth.ensureAuth, MessageController.getMessageReceives);
api.get('/emitter', md_auth.ensureAuth, MessageController.getMessageEmitter);
api.get('/unviewed-messages', md_auth.ensureAuth, MessageController.getUnViewedMessages);
api.get('/set-viewed-messages', md_auth.ensureAuth, MessageController.setViewedMessages);

module.exports = api;