const express = require('express');
const multer = require("multer");
const storage = multer.memoryStorage();
const bcrypt = require('bcryptjs');
const upload = multer({ storage: storage });
const User = require('../models/user');

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
    getScanInfo,
    getScannedSitesCount,
    getVulnerabilityCount,
    getVulnerabilityWebRanking,
    getKnownVulnerabilitiesCount,
    getServiceStatus,
    createUser
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

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try{
        const user = await User.findOne({ username });
        if (!user) {
            console.log('User not found');
            return res.redirect('/login')
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            console.log('Password does not match');
            return res.redirect('/login')
        }
        req.session.user = user;
        req.session.isAuthenticated = true;
        return res.redirect('/overview');
    }
    catch (error) {
        console.log('Error while logging in:', error);
        return res.redirect('/login')
    }
})

router.post('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
})

// API routes
router.get('/api/getCompanies', isAuthenticated, getCompanies);
router.get('/api/getCompaniesPage', isAuthenticated, getCompaniesPage);
router.get('/api/findByNIF/:NIF', isAuthenticated, findByNIF);
router.get('/api/scanInfo/:NIF/:severity?', isAuthenticated, getScanInfo);
router.get('/api/scannedSitesCount', isAuthenticated, getScannedSitesCount);
router.get('/api/vulnerabilityCount/:severity?', isAuthenticated, getVulnerabilityCount);
router.get('/api/vulnerabilityWebRanking', isAuthenticated, getVulnerabilityWebRanking);
router.get('/api/knownVulnerabilitiesCount/', isAuthenticated, getKnownVulnerabilitiesCount);

router.get('/api/service-status', isAuthenticated, getServiceStatus);

router.post('/api/insertCompany', isAuthenticated, insertCompany);
router.post('/api/importCompanyFile', isAuthenticated, upload.single("file"), importCompanyFile);
router.put('/api/updateCompany', isAuthenticated, updateCompany);
router.delete('/api/deleteCompany/:id', isAuthenticated, deleteCompany);

router.post('/api/createUser', createUser);

module.exports = { routes: router }