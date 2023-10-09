const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const mongoose = require('mongoose');

const router = require('./routes/router');

const app = express();

// Set templating engine
app.use(expressLayouts)
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

app.use(router.routes);

// Reference MDB files from /css and /js
app.use("/css", express.static(path.join(__dirname, "node_modules/mdb-ui-kit/css")));
app.use("/js", express.static(path.join(__dirname, "node_modules/mdb-ui-kit/js")));

// Database
mongoose.connect('mongodb://localhost/' + "RISE");

mongoose.connection.once('open',function(){
   console.log('Database connected Successfully');
}).on('error',function(err){
   console.log('Error connecting to database: ', err);
})

app.listen(3000, () => {
   console.log('App listening on port 3000');
})