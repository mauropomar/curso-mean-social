'use strict'
var mongoose = require('mongoose');
var app = require('./app');
var port = 3800;
mongoose.Promise = global.Promise;

//conexion a la base de datos
mongoose.connect('mongodb://localhost:27017/curso_mean_social', {useMongoClient:true})
     .then(() =>{
          console.log("La conexion a la base de datos curso_mean_social se ha realizado con exito");
          app.listen(port,()=>{
              console.log("Servidor corriendo en http://localhost:3800");
          })
     })
      .catch(err =>console.log(err));

