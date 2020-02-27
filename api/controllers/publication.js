'use strict'

var path = require('path');
var fs = require('fs');
var moment = require('moment');
var mongoosePaginate = require('mongoose-pagination');

var User = require('../models/user');
var Publication = require('../models/publication');
var Follow = require('../models/follow');

function probando(req, res) {
    return res.status(200).send({message: 'Hola desde el servidor de publicaciones...'});
}

function savePublication(req, res) {
    var params = req.body;
    if (!params.text) {
        return res.status(200).send({message: 'Debo enviar un texto'});
    }
    var publication = new Publication();
    publication.text = params.text;
    publication.file = 'null';
    publication.user = req.user.sub;
    publication.created_at = moment().unix();
    publication.save((err, publicationStore) => {
        if (err) return res.status(500).send({message: 'Error al guardar la publicacion'});
        if (!publicationStore) return res.status(404).send({message: 'No se ha registrado la publicacion'});
        return res.status(200).send({user: publicationStore});
    });
}

function getPublication(req, res) {
    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }
    var itemPerPage = 4;
    Follow.find({user: req.user.sub}).populate('followed').exec((err, follows) => {
       if(err) return res.status(500).send({message: 'Error en devolver el seguimiento.'});
       var follows_clean = [];
       follows.forEach((follow) => {
           follows_clean.push(follow.followed);
        });
       Publication.find({user:{'$in':follows_clean}}).sort('-created_at').populate('user').paginate(page, itemPerPage, (err, publications, total) => {
           if(err) return res.status(500).send({message: 'Error al devolver publicaciones.'});
           if(!publications) return res.status(404).send({message: 'No hay publicaciones.'});
           return res.status(200).send({
               total_items:total,
               pages:Math.ceil(total/itemPerPage),
               page:page,
               publications
           });
       })
    });
}


module.exports = {
    probando,
    savePublication,
    getPublication
}