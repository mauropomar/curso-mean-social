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
//listado de usuarios que yo sigo paginado
function getFollowingsUser(req, res){
    var userId = req.user.sub;
    if(req.params.id){
        userId = req.params.id;
    }

    var page = 1;
    if(req.params.page){
        page = req.params.page;
    }
    var itemsPerPage = 3;
    Follow.find({user:userId}).populate({path:'follows'}).paginate(page, itemsPerPage, (err, follows, total)=>{
        if(err) return res.status(500).send({message:'Error en el servidor'});
        if(!follows)return res.status(404).send({message:'No estas siguiendo a ningun usuario'});
        return res.status(200).send({
            total:total,
            pages:Math.ceil(total/itemsPerPage),
            follows
        });
    })

}
//listado de usuarios que me siguen paginado
function getFollowedUser(req, res){
    var userId = req.user.sub;
    if(req.params.id && req.params.page){
        userId = req.params.id;
    }

    var page = 1;
    if(req.params.page){
        page = req.params.page;
    }
    var itemsPerPage = 3;
    Follow.find({followed:userId}).populate('user followed').paginate(page, itemsPerPage, (err, follows, total)=>{
        if(err) return res.status(500).send({message:'Error en el servidor'});
        if(!follows)return res.status(404).send({message:'No te sigue a ningun usuario'});
        return res.status(200).send({
            total:total,
            pages:Math.ceil(total/itemsPerPage),
            follows
        });
    })
}
//listado de usuarios que me siguen o que yo sigo sin paginar
function getMyFollows(req, res){
    var userId = req.user.sub;
    var find = Follow.find({user:userId});
    var messageError404 = 'No sigues a ningun usuario';
    if(req.params.followed){
        find = Follow.find({followed:userId});
        messageError404 = 'No te sigue ningun usuario';
    }
    find.populate('user followed').exec((err, follows)=>{
        if(err) return res.status(500).send({message:'Error en el servidor'});
        if(!follows)return res.status(404).send({message:messageError404});
        res.status(200).send({follows});
    })
}

module.exports = {
    saveFollow,
    deleteFollow,
    getFollowingsUser,
    getFollowedUser,
    getMyFollows
}