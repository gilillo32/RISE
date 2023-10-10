$(function () {
    let companiesTable;
    
    companiesTable = $('#companiesTable').DataTable({
        paging: true,
        searching: true,
        processing: true,
        serverSide: true,
        ajax: {
            url: '/api/getCompanies',
            data: function (data) {
                data.page = data.start / data.length + 1;
                data.rowsPerPage = data.length;
                data.search.value = data.search.value;
            },
            dataSrc: 'data'
        },
        columns: [
            {data: 'NIF', defaultContent: ''},
            {data: 'name', defaultContent: ''},
            {data: 'province', defaultContent: ''},
            {data: 'website', defaultContent: ''},
            {data: 'lastScanDate', defaultContent: ''},
            {
                data: 'vulnerabilities', 
                render: function(data, type, row) {
                    if (Array.isArray(data)) {
                        return data.join(', ');
                    } else {
                        return data;
                    }
                },
                defaultContent: ''
            },
        ]
    });
});