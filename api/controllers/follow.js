'use strinct'

var User = require('../models/user');
var Follow = require('../models/follow');
var mongoosePaginate = require('mongoose-pagination');

function saveFollow(req, res) {
    var params = req.body;
    var follow = new Follow();
    follow.user = req.user.sub;
    follow.followed = params.followed;
    follow.save((err, followStored) => {
        if (err)
            return res.status(500).send({message: 'Error al guardar el seguimiento.'});
        if (!followStored)
            return res.status(404).send({message: 'El seguimiento no se ha guardado.'});
        return res.status(200).send({follow: followStored});
    })
}

function deleteFollow(req, res) {
    var userId = req.user.sub;

    var followId = req.params.id;
    console.log(userId, followId);
    Follow.find({'user': userId, 'followed': followId}).remove(err => {
        if (err)
            return res.status(500).send({message: 'Error al dejar de seguir.'});
        return res.status(200).send({message: 'El follow se ha eliminado!'});
    })
}



module.exports = {
    saveFollow,
    deleteFollow
}