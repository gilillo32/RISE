const express = require('express');
const {
    overviewView, 
    companiesView,
    companiesData,
    deleteCompany
} = require('../controllers/pageControllers');
const router = express.Router();

/* Website routes */
router.get('/', overviewView);
router.get('/overview', overviewView);
router.get('/companies', companiesView);

// API routes
router.get('/api/getCompanies', companiesData);
router.delete('/api/deleteCompany/:id', deleteCompany);

module.exports = {routes: router}