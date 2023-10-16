$(function () {
    let companiesTable = $('#companiesTable').DataTable({
        paging: true,
        searching: true,
        responsive: true,
        lengthMenu: [10, 25, 50, 75, 100],
        processing: true,
        serverSide: true,
        ajax: {
            url: '/api/getCompanies',
            data: function (data) {
                data.page = data.start / data.length + 1;
                data.rowsPerPage = data.length;
                data.search.value = data.search.value;
                data.order = data.order;
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
                render: function(data) {
                    if (data != null && Array.isArray(data)) {
                        return data.join(', ');
                    } else {
                        return data;
                    }
                },
                defaultContent: ''
            },
            {
                data: null,
                render: function() {
                    return '<button type="button" class="btn btn-success btn-floating">\
                                <i class="fa-solid fa-pen"></i>\
                            </button>'+
                            
                            '<button type="button" class="btn btn-danger btn-floating">\
                                <i class="fa-solid fa-trash"></i>\
                            </button>\
                            '
                },
                className: "column-actions"
            },
        ]
    });

    $("#companiesTable tbody").on("click", 'tr', function () {
        const companyId = companiesTable.row(this).data()._id;

        $.ajax({
            url: `/deleteCompany/$(companyId)`,
            type: "DELETE",
            success: function(_) {
                companiesTable.row($(this).closest("tr")).remove().draw();
            },
            error: function(_, _, error) {
                console.error("Error while deleting company", error);
            }
        })
    })
});