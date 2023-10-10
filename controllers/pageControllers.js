/* MongoDB models */
const Company = require("../models/company");

const overviewView = (_, res) => {
    res.render('overview', {activeLink: 'overview'});
}

const companiesView = async (_, res) => {
    res.render('companies', {activeLink: 'companies'});
}

const companiesData = async (req, res) => {
    const currentPage = parseInt(req.query.page) || 1;
    const rowsPerPage = parseInt(req.query.rowsPerPage) || 10;
    const skip = (currentPage - 1) * rowsPerPage;
    const searchFilter = req.query.search.value || '';

    try {
        const filter = {};
        if (searchFilter) {       
            filter.$or = [
                { NIF: { $regex: searchFilter, $options: 'i'} },
                { name: { $regex: searchFilter, $options: 'i' } },
                { province: { $regex: searchFilter, $options: 'i' } },
                { website: { $regex: searchFilter, $options: 'i' } },
                { vulnerabilities: { $regex: searchFilter, $options: 'i' } },
            ];
        }

        const data = await Company
        .find(filter)
        .skip(skip)
        .limit(rowsPerPage)
        .exec();

        const totalDocs = await Company.countDocuments();

        res.json({
            data: data,
            recordsTotal: totalDocs,
            recordsFiltered: totalDocs
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error obtaining paginated data')
    }
}

module.exports = {
    overviewView,
    companiesView,
    companiesData
}