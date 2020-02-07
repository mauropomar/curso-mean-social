'use strinct'

var User = require('../models/user');
var bcrypt = require('bcrypt-nodejs');

function home(req, res) {
    res.status(200).send({
        message: 'Hola mundo desde el servidor NodeJs'
    })
}

function pruebas(req, res) {
    res.status(200).send({
        message: 'Accion de pruebas en el servidor NodeJs'
    })
}

function loginUser(req, res) {
    var params = req.body;
}

function saveUser(req, res) {
    var params = req.body;
    var user = new User();

    if (params.name && params.surname && params.nick && params.email && params.password) {
        user.name = params.name;
        user.surname = params.surnanme;
        user.nick = params.nick;
        user.email = params.email;
        user.role = 'ROLE_USER';
        user.image = null;

        User.find({
            $or: [{email: user.email.toLowerCase()},
                {nick: user.nick.toLowerCase()}]
        }).exec((err, users) => {
                if (err) return res.status(500).send({mesage: 'Error en la petición de usuarios.'});
                if (users && users.length > 1) {
                    return res.status(200).send({message: 'El usuario que intentas registrar ya existe.'})
                } else {
                    bcrypt.hash(params.password, null, null, (err, hash) => {
                        user.password = hash;
                        user.save((err, userStore) => {
                            if (err) return res.status(500).send({message: 'Error al guardar el usuario'});
                            if (userStore) {
                                res.status(200).send({user: userStore});
                            } else {
                                res.status(404).send({message: 'No se ha registrado el usuario'});
                            }
                        });
                    });
                }
            }
        )
    } else {
        res.status(200).send({
            message: 'Envia todos los campos necesarios'
        });
    }
}

module.exports = {
    home,
    pruebas,
    saveUser
}