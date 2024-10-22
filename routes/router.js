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
    getTagRanking,
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
        // Return 401
        return res.status(401).send('Unauthorized');
    }
}

/* Website routes */
router.get(process.env.LOGIN_PATH, loginView);
router.get('/', isAuthenticated, overviewView);
router.get('/overview', isAuthenticated, overviewView);
router.get('/companies', isAuthenticated, companiesView);

// Get login path from env
router.post(process.env.LOGIN_PATH, async (req, res) => {
    const { username, password } = req.body;
    try{
        const user = await User.findOne({ username });
        if (!user) {
            console.log('User not found');
            return res.redirect(process.env.LOGIN_PATH)
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            console.log('Password does not match');
            return res.redirect(process.env.LOGIN_PATH)
        }
        req.session.user = user;
        req.session.isAuthenticated = true;
        return res.redirect('/overview');
    }
    catch (error) {
        console.log('Error while logging in:', error);
        return res.redirect(process.env.LOGIN_PATH)
    }
})

router.post('/logout', (req, res) => {
    req.session.destroy();
    res.status(200).send('Logged out');
})

// API routes
router.get('/api/getCompanies', isAuthenticated, getCompanies);
router.get('/api/getCompaniesPage', isAuthenticated, getCompaniesPage);
router.get('/api/findByNIF/:NIF', isAuthenticated, findByNIF);
router.get('/api/scanInfo/:NIF/:severity?', isAuthenticated, getScanInfo);
router.get('/api/scannedSitesCount', isAuthenticated, getScannedSitesCount);
router.get('/api/vulnerabilityCount/:severity?', isAuthenticated, getVulnerabilityCount);
router.get('/api/vulnerabilityWebRanking', isAuthenticated, getVulnerabilityWebRanking);
router.get('/api/tagRanking', isAuthenticated, getTagRanking);
router.get('/api/knownVulnerabilitiesCount/', isAuthenticated, getKnownVulnerabilitiesCount);

router.get('/api/service-status', isAuthenticated, getServiceStatus);

router.post('/api/insertCompany', isAuthenticated, insertCompany);
router.post('/api/importCompanyFile', isAuthenticated, upload.single("file"), importCompanyFile);
router.put('/api/updateCompany', isAuthenticated, updateCompany);
router.delete('/api/deleteCompany/:id', isAuthenticated, deleteCompany);

router.post('/api/createUser', createUser);

module.exports = { routes: router }