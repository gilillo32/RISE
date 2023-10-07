const express = require('express');
const {overviewView, searchView, importView} = require('../controllers/pageControllers');
const router = express.Router();

router.get('/', overviewView);
router.get('/overview', overviewView);
router.get('/search', searchView);
router.get('/import', importView);

module.exports = {routes: router}