$(function () {
    /* Initialise companies DataTable */
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
                    return '<button type="button" class="btn btn-primary btn-floating">\
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

    /* Request provinces data for provinces select */
    $.getJSON('json/provinces.json', function(data) {
        var select = $('#provinceSelect');

        data.results.forEach(result => {
            select.append('<option value="' + result.provincia + '">' + result.provincia + '</option>');
        });

        $("#provinceSelect").val("Gipuzcoa");
    });

    /* Delete company event */
    $('#companiesTable').on('click', '.btn-delete-company', function() {
        const row = $(this).closest('tr');
        const _id = companiesTable.row(row).data()._id;

        $.ajax({
            url: `/api/deleteCompany/${_id}`,
            method: 'DELETE',
            success: function(response) {
                // update table
                companiesTable.row(row).remove().draw();

                notify("success", "Company succesfully deleted");
            },
            error: function(error) {
                notify("danger", "Error while deleting company");
                console.log('Error on AJAX request: ', error.responseText);
            }
        });
    });

    /* Add new company form validation and request */
    $("#newCompanyForm").on('submit', function(event) {
        event.preventDefault();

        let error = 0;
        let formData = new FormData(event.target);
        let formProps = Object.fromEntries(formData);

        // check whether the NIF format is correct or not
        const nifPattern = /^[A-Z]\d{8}$/;
        if (!nifPattern.test(formProps.NIF)) {
            $("#NIF").removeClass("is-valid").addClass("is-invalid"); 
            $("#NIFFeedback").text("Please use correct format (e.g. A01234567).");
            error = 1;
        } else {
            $("#NIFFeedback").text("");
            $("#NIF").removeClass("is-invalid").addClass("is-valid");
        }

        // check whether the name is empty or not
        if (formProps.name === "") {
            $("#newCompanyName").removeClass("is-valid").addClass("is-invalid");
            error = 1;
        } else {
            $("#newCompanyName").removeClass("is-invalid").addClass("is-valid");
        }

        // check whether the website format is correct or not
        const urlPattern = /^(https?:\/\/)?([0-9A-Za-zñáéíóúü0-9-]+\.)+[a-z]{2,6}([\/?].*)?$/i;
        if (!urlPattern.test(formProps.website)) {
            $("#website").removeClass("is-valid");
            $("#website").addClass("is-invalid");
            error = 1;
        } else {
            $("#website").removeClass("is-invalid");
            $("#website").addClass("is-valid");
        }

        if (!error) {
            // check whether the NIF is already registered or not
            $.ajax({
                url: `/api/findByNIF/${formProps.NIF}`,
                method: 'GET',
                success: function(response) {
                    if (response.data) {
                        $('#NIF').removeClass('is-valid').addClass('is-invalid');
                        $('#NIFFeedback').text('A company with the specified NIF number already exists.');
                    } else {
                        // insert new company
                        console.log(formProps);
                        $.ajax({
                            url: '/api/insertCompany',
                            method: 'POST',
                            data: formProps,
                            success: function(response) {
                                notify('success', 'Company added succesfully');

                                // clear form styles/values
                                $('#newCompanyForm input').each(function() {
                                    $(this).removeClass("is-valid is-invalid");
                                });

                                // close modal
                                $('#newCompanyModal').modal('hide');

                                // refresh table
                                companiesTable.clear().draw();
                            },
                            error: function(error) {
                                notify('danger', 'Error while adding the new company');
                                console.log('Error on AJAX request: ', error.responseText);
                            }
                        });
                    }
                },
                error: function(error) {
                    notify('danger', `Error while finding a company with NIF ${formProps.NIF}`);
                    console.log('Error on AJAX request: ', error.responseText);
                }
            });
        }
    })
});