const express = require('express');
const {overviewView, companiesView} = require('../controllers/pageControllers');
const router = express.Router();

router.get('/', overviewView);
router.get('/overview', overviewView);
router.get('/companies', companiesView);

module.exports = {routes: router}