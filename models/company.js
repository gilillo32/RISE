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
    province: {
        type: String,
    },
    website: {
        type: String,
    }, 
    lastScanDate: {
        type: Date
    },
    vulnerabilities: {
        type: [String],
        unique: true
    }
})

module.exports = mongoose.model('Company', companySchema)