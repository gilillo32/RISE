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
        /* Filtering */
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

        /* Sorting */
        const columnNames =  ["NIF", "name", "province", "website", "lastScanDate", "vulnerabilties"];
        const sort = req.query.order.map(item => ([
            columnNames[item.column], item.dir === 'asc' ? 1 : -1
        ]));
        
        const data = await Company
        .find(filter)
        .skip(skip)
        .limit(rowsPerPage)
        .sort(sort)
        .exec();

        // Formatear campos de tipo fecha a 'dd-mm-aaaa'
        for (let i = 0; i < data.length; i++) {
            data[i].javi = "a";
            if (data[i].lastScanDate instanceof Date) {
                /* cannot assign string to a date field, so a new key is created */
                data[i].formattedDate = data[i].lastScanDate.toLocaleDateString('es-ES'); // 'es-ES' para el formato 'dd-mm-aaaa'
                console.log(data[i])
            }
        }
        console.log("-------------------")
        console.log(data);

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