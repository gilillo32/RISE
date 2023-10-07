const overviewView = (_, res) => {
    res.render('overview')
}

const searchView = (_, res) => {
    res.render('search')
}

const importView = (_, res) => {
    res.render('import');
}

module.exports = {
    overviewView,
    searchView,
    importView
}