const express = require('express');
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const {
    overviewView,
    companiesView,
    getCompanies,
    getCompaniesPage,
    findByNIF,
    insertCompany,
    importCompanyFile,
    updateCompany,
    deleteCompany
} = require('../controllers/pageControllers');

const router = express.Router();

/* Website routes */
router.get('/', overviewView);
router.get('/overview', overviewView);
router.get('/companies', companiesView);

// API routes
router.get('/api/getCompanies', getCompanies);
router.get('/api/getCompaniesPage', getCompaniesPage);
router.get('/api/findByNIF/:NIF', findByNIF);

router.post('/api/insertCompany', insertCompany);
router.post('/api/importCompanyFile', upload.single("file"), importCompanyFile);

router.put('/api/updateCompany', updateCompany);

router.delete('/api/deleteCompany/:id', deleteCompany);

module.exports = { routes: router }