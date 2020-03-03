'use strict'
var moment = require('moment');
var mongoosePaginate = require('mongoose-pagination');

var User = require('../models/user');
var Follow = require('../models/follow');
var Publication = require('../models/publication');
var Message = require('../models/message');


function probando(req, res) {
    return res.status(200).send({message: 'Hola desde el servidor de mensajes...'});
}

function saveMessage(req, res) {
    var params = req.body;
    console.log(req.user.sub);
    if (!params.text || !params.receiver) {
        return res.status(200).send({message: 'Envia los datos necesarios.'});
    }
    var message = new Message();
    message.emitter = req.user.sub;
    message.receiver = params.receiver;
    message.text = params.text;
    message.created_at = moment().unix();
    message.viewed = 'false';

    message.save((err, messageStored) => {
        if (err) return res.status(500).send({message: 'Error en la petición.'});
        if (!messageStored) return res.status(500).send({message: 'Error al enviar el mensae.'});
        return res.status(200).send({message: messageStored});
    });
}

function getMessageReceives(req, res) {
    var userId = req.user.sub;
    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }
    var itemsPerPage = 4;
    Message.find({receiver: userId}).populate('emitter', 'name surname _id nick image').paginate(page, itemsPerPage, (err, messages, total) => {
        if (err) return res.status(500).send({message: 'Error en la peticion'});
        if (!messages) return res.status(400).send({message: 'No hay mensajes disponibles.'});
        return res.status(200).send({
            messages,
            total,
            pages: Math.ceil(total / itemsPerPage)
        });
    });
}

function getMessageEmitter(req, res) {
    var userId = req.user.sub;
    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }
    var itemsPerPage = 4;
    Message.find({emitter: userId}).populate('emitter receiver', 'name surname _id nick image').paginate(page, itemsPerPage, (err, messages, total) => {
        if (err) return res.status(500).send({message: 'Error en la peticion'});
        if (!messages) return res.status(400).send({message: 'No hay mensajes disponibles.'});
        return res.status(200).send({
            messages,
            total,
            pages: Math.ceil(total / itemsPerPage)
        });
    });
}

function getUnViewedMessages(req, res) {
    var userId = req.user.sub;
    Message.count({receiver: userId, viewed: 'false'}).exec((err, count) => {
        if (err) return res.status(500).send({message: 'Error en la peticion'});
        return res.status(200).send({
            'unviewed':count
        });
    })
}

function setViewedMessages(req, res) {
    var userId = req.user.sub;
    Message.update({receiver:userId, viewed:'false'}, {viewed:'true'}, {multi:'true'}, (err, messageUpdate) => {
        if (err) return res.status(500).send({message: 'Error en la peticion'});
        return res.status(200).send({
            messages:messageUpdate
        });
    })
}

module.exports = {
    probando,
    saveMessage,
    getMessageReceives,
    getMessageEmitter,
    getUnViewedMessages,
    setViewedMessages
}