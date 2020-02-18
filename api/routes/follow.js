'use strinct'

var express = require('express');
var FollowController = require('../controllers/follow');
var md_auth = require('../middlewares/authenticated');
var api = express.Router();

api.post('/follow', md_auth.ensureAuth, FollowController.saveFollow);
api.delete('/follow/:id', md_auth.ensureAuth, FollowController.deleteFollow);

module.exports = api;
