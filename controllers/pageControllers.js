/* MongoDB models */
const Company = require("../models/company");
const columnNames = ["NIF", "name", "province", "website", "lastScanDate", "vulnerabilties"];

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
                { website: { $regex: searchFilter, $options: 'i' } },
                { vulnerabilities: { $regex: searchFilter, $options: 'i' } },
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
                { website: { $regex: searchFilter, $options: 'i' } },
                { vulnerabilities: { $regex: searchFilter, $options: 'i' } },
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
            website: company.website
        });

        res.json({ success: true, message: `company with NIF ${company.NIF} added successfully` });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: `Errow while adding company with NIF ${company.NIF}` });
    }
}

const importCompanyFile = async (req, res) => {
    const file = req.file;

    // Validate file extension
    const fileExtension = file.originalname.split('.').pop().toLowerCase();
    switch (fileExtension) {
        case "csv":
            return res.status(400).json({ error: "Not implemented yet" });
            break;

        case "json":
            return res.status(400).json({ error: "Not implemented yet" });
            break;

        case "txt":
            break;
        default:
            return res.status(400).json({ error: "File type no allowed" });
    }

    // Read file content
    const fileContent = file.buffer.toString("utf-8");
    const lines = fileContent.split('\n');

    // Check headers
    const headers = lines[0].match(/(?:[^\s"]+|"[^"]*")+/g).map(value => value.replace(/"/g, ''));
    const expectedHeaders = ["NIF", "name", "province", "web"];

    if (!headers.every((header, index) => header === expectedHeaders[index])) {
        return res.status(400).json({ error: `Invalid column headers. Headers must be ${expectedHeaders.join(", ")}` });
    }

    // Process each line
    const NIFPattern = /^[A-Z]\d{8}$/;
    const webPattern = /^(https?:\/\/)?([0-9A-Za-zñáéíóúü0-9-]+\.)+[a-z]{2,6}([\/?].*)?$/i;

    const validCompanies = [];
    const errorMessages = [];

    let numCompanies = 0;

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i]) continue; // skip blank lines

        numCompanies++;

        const values = lines[i].match(/(?:[^\s"]+|"[^"]*")+/g).map(value => value.replace(/"/g, ''));

        // Verify NIF format
        if (!NIFPattern.test(values[0])) {
            errorMessages.push(`Row ${i + 1}: Incorrect NIF format "${values[0]}".`);
            continue;
        }

        // Verify web format
        if (!webPattern.test(values[3])) {
            errorMessages.push(`Row ${i + 1}: Invalid web format "${values[3]}"`);
            continue;
        }

        const nifExists = await localFindByNIF(values[0]);
        if (nifExists) {
            errorMessages.push(`Row ${i + 1}: A company with NIF "${values[0]}" already exists in the DB.`)
            continue;
        }

        // Create document for the database
        const company = {
            NIF: values[0],
            name: values[1],
            province: values[2],
            website: values[3]
        }

        validCompanies.push(company);
    }

    let insertedCount = 0;

    // Insert valid data in the DB
    if (validCompanies.length > 0) {
        const result = await Company.insertMany(validCompanies);
        insertedCount = result.length;
    }

    const response = {
        totalRows: numCompanies, // except headers
        insertedRows: insertedCount,
        errors: errorMessages
    }

    if (errorMessages.length > 0) {
        return res.status(207).json(response); // 207 => partial success
    }

    res.status(200).json(response);
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
                website: company.website
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

    // API
    getCompanies,
    getCompaniesPage,
    findByNIF,
    insertCompany,
    updateCompany,
    deleteCompany,
    importCompanyFile,
}