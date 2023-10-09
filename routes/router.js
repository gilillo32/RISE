const express = require('express');
const {overviewView, companiesView, companiesData} = require('../controllers/pageControllers');
const router = express.Router();

/* Website routes */
router.get('/', overviewView);
router.get('/overview', overviewView);
router.get('/companies', companiesView);

// API routes
router.get('/api/getCompanies', companiesData)

module.exports = {routes: router}