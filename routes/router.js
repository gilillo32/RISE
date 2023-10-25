const express = require('express');
const {
    overviewView, 
    companiesView,
    companiesData,
    findByNIF,
    insertCompany,
    updateCompany,
    deleteCompany
} = require('../controllers/pageControllers');
const router = express.Router();

/* Website routes */
router.get('/', overviewView);
router.get('/overview', overviewView);
router.get('/companies', companiesView);

// API routes
router.get('/api/getCompanies', companiesData);
router.get('/api/findByNIF/:NIF', findByNIF);
router.post('/api/insertCompany', insertCompany);
router.put('/api/updateCompany', updateCompany);
router.delete('/api/deleteCompany/:id', deleteCompany);

module.exports = {routes: router}