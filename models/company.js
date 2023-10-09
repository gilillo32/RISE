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
    website: {
        type: String,
    },
    province: {
        type: String,
    },
    lastScanDate: {
        type: Date
    },
    vulnerabilities: {
        type: Set,
        default: new Set()
    }
})

module.exports = mongoose.model('Company', companySchema)