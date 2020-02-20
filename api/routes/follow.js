'use strinct'

var express = require('express');
var FollowController = require('../controllers/follow');
var md_auth = require('../middlewares/authenticated');
var api = express.Router();

api.post('/follow', md_auth.ensureAuth, FollowController.saveFollow);
api.delete('/follow/:id', md_auth.ensureAuth, FollowController.deleteFollow);
api.get('/following/:id?/:page?', md_auth.ensureAuth, FollowController.getFollowingsUser);
api.get('/followed/:id?/:page?', md_auth.ensureAuth, FollowController.getFollowedUser);
api.get('/get-my-follows/:followed?', md_auth.ensureAuth, FollowController.getMyFollows);

module.exports = api;
