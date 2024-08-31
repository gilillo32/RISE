const express = require('express');
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const {
    overviewView,
    companiesView,
    loginView,
    getCompanies,
    getCompaniesPage,
    findByNIF,
    insertCompany,
    importCompanyFile,
    updateCompany,
    deleteCompany,
    getScanInfo
} = require('../controllers/pageControllers');

const router = express.Router();

function isAuthenticated(req, res, next){
    if(req.session.user){
        return next();
    }
    else{
        res.redirect('/login');
    }
}
/* Website routes */
router.get('/login', loginView);
router.get('/', isAuthenticated, overviewView);
router.get('/overview', isAuthenticated, overviewView);
router.get('/companies', isAuthenticated, companiesView);

router.post('/login', (req, res) => {
    const{username, password} = req.body;
    if(username === process.env.PLATFORM_USERNAME && password === process.env.PLATFORM_PASSWORD){
        req.session.user = username;
        overviewView(req, res);
    }
    else{
        res.redirect('/login');
    }
})

router.post('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
})

// API routes
router.get('/api/getCompanies', getCompanies);
router.get('/api/getCompaniesPage', getCompaniesPage);
router.get('/api/findByNIF/:NIF', findByNIF);
router.get('/api/scaninfo/:NIF', getScanInfo);

router.post('/api/insertCompany', insertCompany);
router.post('/api/importCompanyFile', upload.single("file"), importCompanyFile);

router.put('/api/updateCompany', updateCompany);

router.delete('/api/deleteCompany/:id', deleteCompany);

module.exports = { routes: router }