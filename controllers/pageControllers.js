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
    console.log("vamos")
    const searchFilter = req.query.search.value || '';

    try {
        const filter = {};
        if (searchFilter) {
            const fields = Company.schema.obj;
            
            filter.$or = Object.keys(fields).map((field) => {
                if (fields[field].type === Date) {
                    console.log("es: ", fields[field]);
                    return {
                        [field]: {
                            $eq: new Date(searchFilter).toISOString()
                        }
                    };
                } else {
                    const regex = new RegExp(searchFilter, 'i');
                    return {
                      [field]: regex,
                    };
                }
            });
        }

        const data = await Company.find(filter).skip(skip).limit(rowsPerPage).exec();

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