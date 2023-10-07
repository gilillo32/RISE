const overviewView = (_, res) => {
    res.render('overview', {activeLink: 'overview'})
}

const companiesView = (_, res) => {
    res.render('companies', {activeLink: 'companies'})
}

module.exports = {
    overviewView,
    companiesView
}