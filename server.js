require("dotenv").config();

const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const mongoose = require('mongoose');
const router = require('./routes/router');

const app = express();

// Database
mongoose.connect(process.env.DATABASE_URL);

mongoose.connection
   .on("open", () => console.log("Connected to database"))
   .on("close", () => console.log("Disconnected from database"))
   .on("error", (error) => console.log(error))

// Set templating engine
app.use(expressLayouts)
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

app.use(router.routes);

// Reference MDB files from /css and /js
app.use("/css", express.static(path.join(__dirname, "node_modules/mdb-ui-kit/css")));
app.use("/js", express.static(path.join(__dirname, "node_modules/mdb-ui-kit/js")));

// Reference Datatables files from /js
app.use("/js", express.static(path.join(__dirname, "node_modules/datatables.net/js")));
app.use("/css", express.static(path.join(__dirname, "node_modules/datatables.net-bs5/css")));
app.use("/js", express.static(path.join(__dirname, "node_modules/datatables.net-bs5/js")));

const PORT = process.env.PORT;
app.listen(PORT, () => {
   console.log('App listening on port ' + PORT);
})