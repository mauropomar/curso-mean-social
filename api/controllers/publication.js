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
    var publicationId = req.params.id;
    Publication.findById(publicationId, (err, publication) => {
        if (err) return res.status(500).send({message: 'Error al devolver una publicacion.'});
        if (err) return res.status(404).send({message: 'No existe la publicacion.'});
        return res.status(200).send({publication});
    })
}

function getPublications(req, res) {
    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }
    var itemPerPage = 4;
    Follow.find({user: req.user.sub}).populate('followed').exec((err, follows) => {
        if (err) return res.status(500).send({message: 'Error en devolver el seguimiento.'});
        var follows_clean = [];
        follows.forEach((follow) => {
            follows_clean.push(follow.followed);
        });
        Publication.find({user: {'$in': follows_clean}}).sort('-created_at').populate('user').paginate(page, itemPerPage, (err, publications, total) => {
            if (err) return res.status(500).send({message: 'Error al devolver publicaciones.'});
            if (!publications) return res.status(404).send({message: 'No hay publicaciones.'});
            return res.status(200).send({
                total_items: total,
                pages: Math.ceil(total / itemPerPage),
                page: page,
                publications
            });
        })
    });
}

function deletePublication(req, res) {
    var publicationId = req.params.id;
    Publication.find({'user': req.user.sub, '_id': publicationId}).remove((err, publicationRwemoved) => {
        if (err) return res.status(500).send({message: 'Error al borrar publicación.'});
        if (!publicationRwemoved) return res.status(404).send({message: 'No existe esta publicación.'});
        return res.status(200).send({message: 'Publicacion eliminada correctamente.'});
    });
}

function uploadImage(req, res) {
    var publicationId = req.params.id;
    if (req.files) {
        var file_path = req.files.image.path;
        var file_split = file_path.split('\\');
        var file_name = file_split[2];
        var ext_split = file_name.split('\.');
        var file_ext = ext_split[1];
        if (file_ext == 'png' || file_ext == 'jpg' || file_ext == 'gif' || file_ext == 'jpeg') {
            //si la publicacion pertence a ese usuario
            Publication.findOne({'user': req.user.sub, '_id': publicationId}).exec((err, publication) => {
                if(publication) {
                    //Actualizar documento de la publicacion
                    Publication.findByIdAndUpdate(publicationId, {file: file_name}, {new: true}, (err, publicationUpdated) => {
                        if (err) return res.status(500).send({message: 'Error en la peticion.'});
                        if (!publicationUpdated) return res.status(404).send({message: 'No se ha podido actualizar.'});
                        return res.status(200).send({publication: publicationUpdated});
                    })
                }
            })
        } else {
            return removeFilePathUploads(res, file_path, 'Extensión no válida.');
        }
    } else {
        return res.status(200).send({message: 'No se han subido imagenes.'});
    }
}

function getImageFile(req, res) {
    var image_file = req.params.imageFile;
    var path_file = './uploads/publications/' + image_file;
    fs.exists(path_file, (exists) => {
        if (exists) {
            res.sendFile(path.resolve(path_file));
        } else {
            res.status(200).send({message: 'No existe la imagen...'});
        }
    });
}

function removeFilePathUploads(res, filepath, message) {
    fs.unlink(filepath, (err) => {
        return res.status(200).send({message: message});
    })
}


module.exports = {
    probando,
    savePublication,
    getPublication,
    getPublications,
    deletePublication,
    getImageFile,
    uploadImage
}