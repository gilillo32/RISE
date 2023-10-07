const mongoose = require('mongoose')

const companySchema = new mongoose.Schema({
    NIF: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    city: {
        type: String,
    },
    country: {
        type: String,
        required: true
    },
    lastAvailableYear: {
        type: Date,
        required: true
    },
    operatingIncome: {
        type: Number
    },
    website: {
        type: String
    },
    lastScanDate: {
        type: Date
    },
    timesScanned: {
        type: Number
    },
    vulnerabilities: {
        type: [String]
    }
})

module.exports = mongoose.model('Company', companySchema)