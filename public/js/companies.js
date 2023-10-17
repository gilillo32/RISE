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
                            
                            '<button type="button" class="btn btn-danger btn-floating btn-delete-company">\
                                <i class="fa-solid fa-trash"></i>\
                            </button>\
                            '
                },
                className: "column-actions"
            },
        ]
    });

    $('#companiesTable').on('click', '.btn-delete-company', function() {
        const row = $(this).closest('tr');
        const _id = companiesTable.row(row).data()._id;
        const notificationContainer = $("#notification-container");
        let toastHTML;

        $.ajax({
            url: `/api/deleteCompany/${_id}`,
            method: 'DELETE',
            success: function(response) {
                // update table
                companiesTable.row(row).remove().draw();

                toastHTML = 
                    '<div class="toast align-items-center text-bg-success text-white mb-2" role="alert" aria-live="assertive" aria-atomic="true" data-bs-delay="3000">' +
                        '<div class="d-flex">' +
                            '<div class="toast-body"><i class="fa-solid fa-circle-check"></i> Company succesfully deleted</div>' +
                            '<button type="button" class="btn-close m-auto text-white" data-bs-dismiss="toast" aria-label="Close"></button>' +
                        '</div>' +
                    '</div>';
            },
            error: function(error) {
                toastHTML = 
                    '<div class="toast align-items-center text-bg-danger text-white mb-2" role="alert" aria-live="assertive" aria-atomic="true" data-bs-delay="3000">' +
                        '<div class="d-flex">' +
                            '<div class="toast-body"><i class="fa-solid fa-circle-xmark"></i> Error while deleting company</div>' +
                            '<button type="button" class="btn-close m-auto text-white" data-bs-dismiss="toast" aria-label="Close"></button>' +
                        '</div>' +
                    '</div>';
                console.log('Error on AJAX request: ', error.responseText);
            }
        }).always(function() {
            // append notification
            notificationContainer.append(toastHTML);
    
            const toastElement = notificationContainer.find(".toast:last");
            let toast = new bootstrap.Toast(toastElement);
            toast.show();

            // remove from DOM when notification gets hidden
            toastElement.on('hidden.bs.toast', function() {
                $(this).remove();
            });
        });
    });
});