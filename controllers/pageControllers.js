/* MongoDB models */
const Company = require("../models/company");
const columnNames = ["name", "province", "web", "lastScanDate", "vulnerabilties", "detectedTech", "actions"];

const webPattern = /^(https?:\/\/)?([0-9A-Za-zñáéíóúü0-9-]+\.)+[a-z]{2,6}([\/?].*)?$/i;

const insertCompaniesCsvOrTxt = async file => {
    let fileContent, lines;
    let regexp = /("[^"]*")/g;

    // Read file content
    fileContent = file.buffer.toString("utf-8");
    lines = fileContent.split('\n');

    // Check headers
    headers = lines[0].match(regexp).map(value => value.slice(1, -1));

    if (!validateKeys(Company, headers)) {
        console.log(Company, headers);
        throw { statusCode: 400, message: "Invalid or missing headers" };
    }

    // Process each line
    const response = {
        totalRows: 0,
        insertedRows: 0,
        errors: []
    };
    const validCompanies = [];
    let values;

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i]) continue; // skip blank lines

        response.totalRows++;

        values = lines[i].match(regexp).map(value => value.replace(/"/g, ''));

        const NIF = values[headers.indexOf("NIF")];
        const website = values[headers.indexOf("web")];

        // Verify web format
        if (!webPattern.test(website)) {
            response.errors.push(`Row ${i + 1}: Invalid web format "${website}"`);
            continue;
        }

        // Check if company with same NIF exist
        const nifExists = await localFindByNIF(NIF);
        if (nifExists) {
            response.errors.push(`Row ${i + 1}: A company with NIF "${NIF}" already exists in the DB.`)
            continue;
        }

        // Create company document
        const company = {}

        for (let i = 0; i < headers.length; i++) {
            const key = headers[i];
            const value = values[i];
            company[key] = value;
        }

        companyInstance = new Company(company);
        validCompanies.push(companyInstance);
    }

    // Insert valid data in the DB
    if (validCompanies.length > 0) {
        const result = await Company.insertMany(validCompanies);
        response.insertedRows = result.length;
    }

    return response;
}

const insertCompaniesJson = async file => {
    const data = JSON.parse(file.buffer);
    const response = {
        totalRows: data.length,
        insertedRows: 0,
        errors: []
    };

    let validCompanies = [];

    for (const [index, company] of data.entries()) {
        // Check if object keys are valid
        if (!validateKeys(Company, Object.keys(company))) {
            response.errors.push(`Object ${index}: Invalid or missing headers`);
            continue;
        }

        // Verify web format
        if (!webPattern.test(company.web)) {
            response.errors.push(`Object ${index}: Invalid web format "${company.web}"`);
            continue;
        }

        // Check if company with same NIF exist
        const nifExists = await localFindByNIF(company.NIF);
        if (nifExists) {
            response.errors.push(`Object ${index}: A company with NIF "${company.NIF}" already exists in the DB.`)
            continue;
        }

        companyInstance = new Company(company);
        validCompanies.push(companyInstance);
    };

    // Insert valid data in the DB
    if (validCompanies.length > 0) {
        const result = await Company.insertMany(validCompanies);
        response.insertedRows = result.length;
    }

    return response;
}

/**
 * Verifies if the key array exists in the schema passed by parameter.
 * In addition, it checks if at least the fields required by the schema are present in the key array.
 * @param {*} schema mongoDB schema.
 * @param {*} keys set of keys.
 * @returns true <==> whole key array exists in the schema and required fields are present in the key array. Otherwise fase.
 */
function validateKeys(schema, keys) {
    schemaKeys = Object.keys(schema.schema.paths);
    requiredSchemaKeys = schemaKeys.filter(key => schema.schema.paths[key].isRequired);

    // Check if every key is in the schema
    const everyKeyInSchema = keys.every(key => schemaKeys.includes(key));
    if (!everyKeyInSchema) return false;

    // Verify if every required key exist
    const everyRequiredKeyExists = requiredSchemaKeys.every(requiredKey => keys.includes(requiredKey));

    return everyRequiredKeyExists;
}

const localFindByNIF = async (nif) => {
    try {
        const existingCompany = await Company.findOne({ 'NIF': nif });

        return !!existingCompany;
    } catch (error) {
        console.error("Error while verifying the NIF in the DB:", error);
        throw error;
    }
}

const overviewView = (_, res) => {
    res.render('overview', { activeLink: 'overview' });
}

const companiesView = async (_, res) => {
    res.render('companies', { activeLink: 'companies' });
}

const loginView = (_, res) => {
    res.render('login', { activeLink: 'overview' });
}


/* Send all information abount companies that match filter */
const getCompanies = async (req, res) => {
    const searchFilter = req.query.filter || '';

    try {
        /* Filtering */
        const filter = {};
        if (searchFilter) {
            filter.$or = [
                { NIF: { $regex: searchFilter, $options: 'i' } },
                { name: { $regex: searchFilter, $options: 'i' } },
                { province: { $regex: searchFilter, $options: 'i' } },
                { web: { $regex: searchFilter, $options: 'i' } },
                { vulnerabilities: { $regex: searchFilter, $options: 'i' } },
                { detectedTech: { $regex: searchFilter, $options: 'i' } },
            ];
        }

        /* Sorting */
        const sort = req.query.sort.map(item =>
            [columnNames[item[0]], item[1] === 'asc' ? 1 : -1]
        );

        const data = await Company.find(filter).sort(sort).exec();

        res.json({ data: data });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error obtaining company's data");
    }
}

/* Send pagged data about companies */
const getCompaniesPage = async (req, res) => {
    const currentPage = parseInt(req.query.page) || 1;
    const rowsPerPage = parseInt(req.query.rowsPerPage) || 10;
    const skip = (currentPage - 1) * rowsPerPage;
    const searchFilter = req.query.filter || '';

    try {
        /* Filtering */
        const filter = {};
        if (searchFilter) {
            filter.$or = [
                { NIF: { $regex: searchFilter, $options: 'i' } },
                { name: { $regex: searchFilter, $options: 'i' } },
                { province: { $regex: searchFilter, $options: 'i' } },
                { web: { $regex: searchFilter, $options: 'i' } },
                { vulnerabilities: { $regex: searchFilter, $options: 'i' } },
                { detectedTech: { $regex: searchFilter, $options: 'i' } },
            ];
        }

        /* Sorting */
        const sort = req.query.sort.map(item => ([
            columnNames[item.column], item.dir === 'asc' ? 1 : -1
        ]));

        const data = await Company
            .find(filter)
            .skip(skip)
            .limit(rowsPerPage)
            .sort(sort)
            .exec();

        // format dates to 'dd-mm-aaaa'
        for (let i = 0; i < data.length; i++) {
            if (data[i].lastScanDate instanceof Date) {
                /* cannot assign string to a date field, so a new key is created */
                data[i].formattedDate = data[i].lastScanDate.toLocaleDateString('es-ES'); // 'es-ES' para el formato 'dd-mm-aaaa'
            }
        }

        const totalDocs = await Company.countDocuments(filter);

        res.json({
            data: data,
            recordsTotal: totalDocs,
            recordsFiltered: totalDocs
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error obtaining paginated company's data");
    }
}

const findByNIF = async (req, res) => {
    const NIF = req.params.NIF;

    try {
        const company = await Company.findOne({ 'NIF': NIF });
        res.json({ data: company });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: `Errow while querying a company with NIF ${NIF}` })
    }
}

const insertCompany = async (req, res) => {
    const company = req.body;

    try {
        await Company.create({
            NIF: company.NIF,
            name: company.name,
            province: company.province,
            web: company.web
        });

        res.json({ success: true, message: `company with NIF ${company.NIF} added successfully` });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: `Error while adding company with NIF ${company.NIF}` });
    }
}

const importCompanyFile = async (req, res) => {
    const file = req.file;

    // Validate file extension
    const fileExtension = file.originalname.split('.').pop().toLowerCase();

    // Check file size
    if (file.size > 1000000000) {
        return res.status(400).json({ error: `File ${file.originalname} exceeds the allowed maximum file size (1 GB)` });
    }

    // Process file depending on the extension
    try {
        switch (fileExtension) {
            case "csv":
            case "txt":
                result = await insertCompaniesCsvOrTxt(file);
                break;

            case "json":
                result = await insertCompaniesJson(file);

                break;

            default:
                return res.status(400).json({ error: "File type no allowed" });
        }

        if (result.errors.length > 0) {
            return res.status(207).json(result); // 207 => partial success
        }

        res.status(200).json(result);
    } catch (error) {
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({ error: error.message });
    }
}

const updateCompany = async (req, res) => {
    const company = req.body;

    try {
        const c = await Company.findOne({ NIF: company.NIF });
        if (!c || c._id == company._id) {
            await Company.findOneAndUpdate({ _id: company._id }, {
                NIF: company.NIF,
                name: company.name,
                province: company.province,
                web: company.web
            });
            res.json({ success: true, message: `company with _id ${company._id} updated successfully` });
        } else { // there is another company with same NIF => abort
            res.status(409).json({ success: false, message: "Error when updating the company: another company with the same NIF already exists." });
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: `Error while updating company with _id ${company._id}` });
    }
}

const deleteCompany = async (req, res) => {
    const _id = req.params.id;

    try {
        await Company.deleteOne({ _id: _id });

        res.json({ success: true, message: `Company with ${_id} deleted successfully` });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: `Errow while deleting company with id ${_id}` })
    }
}

module.exports = {
    overviewView,
    companiesView,
    loginView,

    // API
    getCompanies,
    getCompaniesPage,
    findByNIF,
    insertCompany,
    updateCompany,
    deleteCompany,
    importCompanyFile,
}