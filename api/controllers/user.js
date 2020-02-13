'use strinct'

var User = require('../models/user');
var bcrypt = require('bcrypt-nodejs');
var jwt = require('../services/jwt');
var mongoosePaginate = require('mongoose-pagination');

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

//metodo de login
function loginUser(req, res) {
    var params = req.body;
    var email = params.email;
    var password = params.password;

    User.findOne({email: email}, (err, user) => {
            if (err) return res.status(500).send({message: 'Error de peticion'});
            if (user) {
                bcrypt.compare(password, user.password, (err, check) => {
                    if (check) {
                        if (params.gettoken) {
                            //devolver  y generar token
                            res.status(200).send({
                                token: jwt.createToken(user)
                            });
                        } else {
                            user.password = undefined;
                            res.status(200).send({user});
                        }
                    } else {
                        return res.status(404).send({message: 'El usuario no se ha podido identificar'})
                    }
                })
            } else {
                return res.status(404).send({message: 'El usuario no se ha podido identificar!!!'})
            }
        }
    )
}

//
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

//metodo que devuelve un usuario determninado
function getUser(req, res) {
    var UserId = req.params.id;
    User.findById(UserId, (err, user) => {
        if (err)
            return res.status(500).send({message: 'Error en la petición'});
        if (!user)
            return res.status(404).send({message: 'El usuario no existe'});
        return res.status(200).send({user});
    });
}

//metodo que devuelve un listado de usuarios paginado
function getUsers(req, res) {
    var identify_user_id = req.user.sub;
    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }
    var itemsPerPage = 5;
    User.find().sort('_id').paginate(page, itemsPerPage, (err, users, total) => {
        if (err) return res.status(500).send({message: 'Error en la peticion'});
        if (!users) return res.status(400).send({message: 'No hayy usuarios disponibles.'});
        return res.status(200).send({
            users,
            total,
            pages: Math.ceil(total / itemsPerPage)
        });
    });
}

//editar los datos del usuario
function updateUser(req, res) {
    var userId = req.params.id;
    var update = req.body;
    // borrar propiedad password
    delete update.password;
    if (userId != req.user.sub) {
        return res.status(500).send({message: 'No tienes permiso para actualizar los datos del usuario.'});
    }

    User.findByIdAndUpdate(userId, update, {new:true},(err, userUpdated) => {
        if (err) return res.status(500).send({message: 'Error en la peticion.'});
        if (!userUpdated) return res.status(404).send({message: 'No se ha podido actualizar.'});
        return res.status(200).send({user: userUpdated});
    })
}

module.exports = {
    home,
    pruebas,
    saveUser,
    loginUser,
    getUser,
    getUsers,
    updateUser
}