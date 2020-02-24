'use strinct'

var User = require('../models/user');
var Follow = require('../models/follow');
var bcrypt = require('bcrypt-nodejs');
var jwt = require('../services/jwt');
var mongoosePaginate = require('mongoose-pagination');
var fs = require('fs');
var path = require('path');

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
//----------------------------------------User---------------------------------------//
function getUser(req, res) {
    var userId = req.params.id;
    User.findById(userId, (err, user) => {
        if (err)
            return res.status(500).send({message: 'Error en la petición'});
        if (!user)
            return res.status(404).send({message: 'El usuario no existe'});
        followThisUser(req.user.sub, userId).then((value) => {
            user.password = undefined;
            return res.status(200).send({
                user,
                "following": value.following,
                "followed": value.followed
            });
        });
    });
}

function awaitFollow(identity_user_id, user_id) {
    return new Promise(resolve => {
        Follow.findOne({"user": identity_user_id, "followed": user_id}).exec((err, follow) => {
            resolve(follow);
        });
    })
}

async function followThisUser(identity_user_id, user_id) {
    var following = await awaitFollow(identity_user_id, user_id);
    var followed = await awaitFollow(user_id, identity_user_id);
    return {
        following: following,
        followed: followed
    }
};

//-----------------------------------Users-------------------------------------------------//
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
        followUserIds(identify_user_id).then((value) => {
            return res.status(200).send({
                users,
                users_following: value.following,
                users_follow_me: value.follow,
                total,
                pages: Math.ceil(total / itemsPerPage)
            });
        });
    });
}

async function followUserIds(user_id) {
    var following = await awaitGetUserIds(user_id);
    var follow = await awaitGetFollowedId(user_id);
    return {
        following: following,
        follow: follow
    }
}

function awaitGetUserIds(userId) {
    return new Promise(resolve => {
        Follow.find({"user": userId}).select({'__id': 0, '_v': 0, 'user': 0}).exec((err, follows) => {
            var follows_clean = [];
            follows.forEach((follow) => {
                follows_clean.push(follow.followed);
            });
            resolve(follows_clean);
        });
    })
}

function awaitGetFollowedId(userId) {
    return new Promise(resolve => {
        Follow.find({"followed": userId}).select({'__id': 0, '_v': 0, 'followed': 0}).exec((err, follows) => {
            var follows_clean = [];
            follows.forEach((follow) => {
                follows_clean.push(follow.user);
                resolve(follows_clean);
            });
        })
    })
}

//-------------------------------------------Contador-------------------------------------------------//
function getCounters(req, res) {
    var userId = req.user.sub;
    if (req.params.id) {
        userId = req.params.id;
    }
    getCountFollow(userId).then((value) => {
        return res.status(200).send(value);
    });
}

async function getCountFollow(user_id) {
    var following = await awaitCountFollowing(user_id);
    var followed = await awaitCountFollowed(user_id);
    return {
        following: following,
        followed: followed
    }
}


function awaitCountFollowing(userId) {
    return new Promise(resolve => {
        Follow.count({"user": userId}).exec((err, follow) => {
            resolve(follow);
        });
    });
}

function awaitCountFollowed(userId) {
    return new Promise(resolve => {
        Follow.count({"followed": userId}).exec((err, follow) => {
            resolve(follow);
        });
    });
}


//-----------------------------------------------------------------------------------------------------//
//editar los datos del usuario
function updateUser(req, res) {
    var userId = req.params.id;
    var update = req.body;
    // borrar propiedad password
    delete update.password;
    if (userId != req.user.sub) {
        return res.status(500).send({message: 'No tienes permiso para actualizar los datos del usuario.'});
    }

    User.findByIdAndUpdate(userId, update, {new: true}, (err, userUpdated) => {
        if (err) return res.status(500).send({message: 'Error en la peticion.'});
        if (!userUpdated) return res.status(404).send({message: 'No se ha podido actualizar.'});
        return res.status(200).send({user: userUpdated});
    })
}

function uploadImage(req, res) {
    var userId = req.params.id;

    if (req.files) {
        var file_path = req.files.image.path;
        //  console.log(file_path);
        var file_split = file_path.split('\\');
        //   console.log(file_split);
        var file_name = file_split[2];
        console.log(file_name);
        var ext_split = file_name.split('\.');
        //     console.log(ext_split);
        var file_ext = ext_split[1];
        //     console.log(file_ext);
        if (userId != req.user.sub) {
            return removeFilePathUploads(res, file_path, 'No tienes permiso para actualizar los datos del usuario.');
        }
        if (file_ext == 'png' || file_ext == 'jpg' || file_ext == 'gif' || file_ext == 'jpeg') {
            //Actualizar documento usuario logueado
            User.findByIdAndUpdate(userId, {image: file_name}, {new: true}, (err, userUpdated) => {
                if (err) return res.status(500).send({message: 'Error en la peticion.'});
                if (!userUpdated) return res.status(404).send({message: 'No se ha podido actualizar.'});
                return res.status(200).send({user: userUpdated});
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
    var path_file = './uploads/users/' + image_file;
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
    home,
    pruebas,
    saveUser,
    loginUser,
    getUser,
    getUsers,
    updateUser,
    uploadImage,
    getImageFile,
    getCounters
}