const allowedExtensions = ["csv", "json", "txt"];
let columns = ["NIF", "name", "province", "web"];
const nifPattern = /^[A-Z]\d{8}$/;
const urlPattern = /^(https?:\/\/)?([0-9A-Za-zñáéíóúü0-9-]+\.)+[a-z]{2,6}([\/?].*)?$/i;

function updatePreviewTable(data) {
    $("#dropzoneTable > tbody").text("");

    if (data.length == 0) {
        $("#dropzoneTable > tbody").html("<tr><td class='text-center' colspan='100%'>Drop files here</td></tr>");
    } else {
        for (let l = 0; l < data.length; l++) {
            let row = "<tr>";
            for (let m = 0; m < columns.length; m++) {
                row += "<td>" + data[l][columns[m]] + "</td>";
            }

            // add status column
            row += "<td></td></tr>";
            $("#dropzoneTable > tbody").append(row);
        }
    }
}

function appendFileElement(fileList, file) {
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const fileSizeInKB = Math.round(file.size * 100 / 1024) / 100;
    const index = fileList.indexOf(file);

    // get file icon
    switch (fileExtension) {
        case "csv":
            icon = "fa-file-csv";
            break;

        case "json":
            icon = "fa-file";
            break;

        case "txt":
            icon = "fa-file-lines";
            break;

        default:
            icon = "fa-file";
            break;
    }

    $("#fileList").append(`
        <li class="d-flex file-wrapper mb-3">
            <div class="flex-fill">
                <div class="d-flex justify-content-between mb-3">
                    <div>
                        <i class="fa-solid ${icon}"></i>
                        <span class="file-name">${file.name}</span>
                        <span class="file-size disabled">${fileSizeInKB} KB</span>
                    </div>
                <div>
                    <span class="percentage">0</span>%
                </div>
            </div>

            <div class="progress">
                <div class="progress-bar" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
            </div>

            <div class="px-3">
            <i class="remove-file fa-solid fa-circle-xmark"></i>
            </div>
        </li>

        <hr>
    `);

    $('.remove-file').last().on("click", function () {
        // remove from DOM
        const parentli = $(this).closest("li");
        parentli.next("hr").remove();
        parentli.remove();

        // remove from array of files
        let index = fileList.map(item => item.name).indexOf(file.name);
        fileList.splice(index, 1);
    })
}

function prepareFiles(fileList, files) {
    for (file of files) {
        const fileExtension = file.name.split('.').pop().toLowerCase();

        if (!allowedExtensions.includes(fileExtension)) {
            alert(`File ${file.name} not allowed. Allowed extensions: ${allowedExtensions.join(', ')}.`);
            continue;
        }

        if (file.size > 1000000000) {
            alert(`File ${file.name} exceeds the allowed maximum file size (1 GB)`);
            continue;
        }

        fileList.push(file);
        appendFileElement(fileList, file);
    }
}

function updateProgressBar(progressBar, percentage) {
    progressBar.css("width", percentage + "%");
    progressBar.attr("aria-valuenow", percentage);
}

function uploadFiles(files) {
    for (const [index, file] of files.entries()) {
        const progressBar = $(`#fileList li:eq(${index})`).find(".progress-bar");
        const formData = new FormData();
        formData.append('file', file);

        $.ajax({
            url: 'api/importCompanyFile',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            xhr: function () {
                const xhr = new window.XMLHttpRequest();

                xhr.upload.addEventListener("progress", function (event) {
                    if (event.lengthComputable) {
                        const percentage = (event.loaded / event.total) * 100;
                        updateProgressBar(progressBar, percentage);
                    }
                })

                return xhr;
            },
            success: function (data) {
                console.log(data);
            },
            error: function (error) {
                console.error("Error in ajax request:", error.responseText);
            }
        })
    }
}

function changeRowStatus(row, status, message = "") {
    let icon;

    switch (status) {
        case "success":
            icon = "check";
            break;
        case "danger":
            icon = "xmark"
            break;
        default:
            break;
    }

    // change row bg and icon
    row.removeClass().addClass(`text-center row-${status}`);
    row.find('td:last').html(`<i class="fa-solid fa-${icon} text-${status}"></i>`);
}

$(function () {
    let fileList = [];

    /* Initialise companies DataTable */
    let companiesTable = $('#companiesTable').DataTable({
        paging: true,
        searching: true,
        responsive: true,
        lengthMenu: [10, 25, 50, 75, 100],
        processing: true,
        serverSide: true,
        ajax: {
            url: '/api/getCompaniesPage',
            data: function (data) {
                data.page = data.start / data.length + 1;
                data.rowsPerPage = data.length;
                data.filter = data.search.value;
                data.sort = data.order;
            },
            dataSrc: 'data'
        },
        columns: [
            { data: 'NIF', defaultContent: '' },
            { data: 'name', defaultContent: '' },
            { data: 'province', defaultContent: '' },
            {
                data: 'website',
                render: function (data) {
                    return `<a href="//${data}">${data}</a>`;
                },
                defaultContent: ''
            },
            { data: 'lastScanDate', defaultContent: '' },
            {
                data: 'vulnerabilities',
                render: function (data) {
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
                render: function () {
                    return '<button type="button" class="btn btn-primary btn-floating" data-mdb-toggle="modal" data-mdb-target="#companyModal" data-action="edit">\
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
    $.getJSON('json/provinces.json', function (data) {
        var select = $('#provinceSelect');

        data.results.forEach(result => {
            select.append('<option value="' + result.provincia + '">' + result.provincia + '</option>');
        });

        $("#provinceSelect").val("Gipuzcoa");
    });

    /* Delete company event */
    $('#companiesTable').on('click', '.btn-delete-company', function () {
        const row = $(this).closest('tr');
        const _id = companiesTable.row(row).data()._id;

        $.ajax({
            url: `/api/deleteCompany/${_id}`,
            method: 'DELETE',
            success: function (response) {
                // update table
                companiesTable.row(row).remove().draw();

                notify("success", "Company successfully deleted");
            },
            error: function (error) {
                notify("danger", "Error while deleting company");
                console.error('Error on AJAX request: ', error.responseText);
            }
        });
    });

    /* Add new company form validation and request */
    $("#companyForm").on('submit', function (event) {
        let action = $("#companyModal").data("action");

        event.preventDefault();

        let error = 0;
        let formData = new FormData(event.target);
        let formProps = Object.fromEntries(formData);

        // check whether the NIF format is correct or not
        if (nifPattern.test(formProps.NIF)) {
            $("#NIFFeedback").text("");
            $("#NIF").removeClass("is-invalid").addClass("is-valid");
        } else {
            $("#NIF").removeClass("is-valid").addClass("is-invalid");
            $("#NIFFeedback").text("Please use correct format (e.g. A01234567).");
            error = 1;
        }

        // check whether the name is empty or not
        if (formProps.name === "") {
            $("#companyName").removeClass("is-valid").addClass("is-invalid");
            error = 1;
        } else {
            $("#companyName").removeClass("is-invalid").addClass("is-valid");
        }

        // check whether a province has been selected or not
        if (formProps.province) {
            $(".invalid-province-feedback-active")
                .css("display", "none")
                .removeClass("invalid-province-feedback-active");
            $("#provinceSelect")
                .removeClass("select-invalid")
                .addClass("select-valid");
        } else {
            $(".invalid-province-feedback").css("display", "block");
            $("#provinceSelect")
                .removeClass("select-valid")
                .addClass("select-invalid");
            setTimeout(function () { // needed for switch from display none to block
                $(".invalid-province-feedback").addClass("invalid-province-feedback-active");
            }, 10);
        }

        // check whether the website format is correct or not
        if (urlPattern.test(formProps.website)) {
            $("#website").removeClass("is-invalid");
            $("#website").addClass("is-valid");
        } else {
            $("#website").removeClass("is-valid");
            $("#website").addClass("is-invalid");
            error = 1;
        }

        if (!error) {
            if (action === "create") {
                // check whether the NIF is already registered or not
                $.ajax({
                    url: `/api/findByNIF/${formProps.NIF}`,
                    method: "GET",
                    success: function (response) {
                        if (response.data) {
                            $("#NIF").removeClass("is-valid").addClass("is-invalid");
                            $("#NIFFeedback").text("A company with the specified NIF number already exists.");
                        } else {
                            // insert new company
                            $.ajax({
                                url: "/api/insertCompany",
                                method: 'POST',
                                data: formProps,
                                success: function (response) {
                                    notify("success", "Company added successfully");

                                    // close modal
                                    $("#companyModal").modal("hide");

                                    // refresh table
                                    companiesTable.draw();
                                },
                                error: function (error) {
                                    notify("danger", "Error while adding the new company");
                                    console.error("Error on AJAX request: ", error.responseText);
                                }
                            });
                        }
                    },
                    error: function (error) {
                        notify("danger", `Error while finding a company with NIF ${formProps.NIF}`);
                        console.error("Error on AJAX request: ", error.responseText);
                    }
                });
            } else { // edit company data
                // update data
                formProps._id = $("#companyModal").attr("data-id");

                $.ajax({
                    url: "/api/updateCompany",
                    method: "PUT",
                    data: formProps,
                    success: function (response) {
                        notify("success", "Company updated successfully");

                        // close modal
                        $("#companyModal").modal("hide");

                        // refresh table
                        companiesTable.draw();
                    },
                    error: function (error) {
                        if (error.status === 409) { // NIF already exists
                            $("#NIF").removeClass("is-valid").addClass("is-invalid");
                            $("#NIFFeedback").text("A company with the specified NIF number already exists.");
                        } else {
                            notify("danger", "Error while updating company data");
                            console.error("Error on AJAX request: ", error.responseText);
                        }
                    }
                });
            }
        }
    });

    // change modal data base on clicked button (add company or edit company)
    $("#companyModal").on("show.bs.modal", function (event) {
        let action = $(event.relatedTarget).data("action");
        const title = $("#companyModalTitle");
        const submitBtn = $("#saveCompanyBtn");

        if (action === "create") {
            $(this).data("action", "create");
            $(this).removeAttr("data-id");

            title.text("Add company");
            submitBtn.text("Add company");
            $("#NIF").val("");
            $("#companyName").val("");
            $("#provinceSelect").val("");
            $("#website").val("");
        } else { // edit company data
            const row = $(event.relatedTarget).closest('tr');
            const rowData = companiesTable.row(row).data();

            $(this).data("action", "edit");
            $(this).attr("data-id", rowData._id);

            title.text("Edit company");
            submitBtn.text("Save changes");
            $("#NIF").val(rowData.NIF);
            $("#companyName").val(rowData.name);
            $("#provinceSelect").val(rowData.province);
            $("#website").val(rowData.website);
        }
    });

    // reset modal styles when closing
    $("#companyModal").on("hidden.bs.modal", function () {
        // clear form styles/values
        $("#companyForm input").each(function () {
            $(this).removeClass("is-valid is-invalid");
        });

        $("#provinceSelect").removeClass("select-valid select-invalid");
        $(".invalid-province-feedback").css("display", "none").removeClass("invalid-province-feedback-active");
    });

    // update filename extension based on radio button click
    $('#exportFormat input:radio').on("click", function () {
        let extension = $(this).val();
        $("#extension").text("." + extension);
    });

    $("#confirmExportCompanies").on("click", async function (event) {

        let format = $('input[name="exportFormat"]:checked').val();
        let dataToExport = $('input[name="exportDataAmount"]:checked').val();
        let data, exportData, allKeys, headerRow, bodyRows;

        // select data
        if (dataToExport === "page") {
            data = companiesTable.rows().data().toArray();
        } else if (dataToExport === "all") {
            try {
                let response = await $.ajax({
                    url: '/api/getCompanies',
                    method: 'GET',
                    data: {
                        filter: companiesTable.search(),
                        sort: companiesTable.order()
                    }
                });

                data = response.data;
            } catch (error) {
                notify("danger", "Error while retrieving information about the companies");
                console.error("Error on AJAX request: ", error.responseText);
                return;
            }
        }

        // format
        switch (format) {
            case "csv":
                allKeys = Array.from(new Set(data.flatMap(obj => Object.keys(obj))));

                headerRow = allKeys.join(',');

                bodyRows = data.map(obj => {
                    return allKeys.map(key => {
                        return obj[key] || ''; // if key does not exist, simply write empty string
                    }).join(',');
                });

                exportData = [headerRow, ...bodyRows].join('\n');
                break;

            case "json":
                exportData = JSON.stringify(data);
                break;

            case "txt":
                allKeys = Array.from(new Set(data.flatMap(obj => Object.keys(obj))));

                headerRow = allKeys.join('\t');

                bodyRows = data.map(obj => {
                    return allKeys.map(key => {
                        return obj[key] || ''; // if key does not exist, simply write empty string
                    }).join('\t');
                });

                exportData = [headerRow, ...bodyRows].join('\n');
            default:
                break;
        }

        // create temporal anchor for the download
        let a = document.createElement("a");
        a.href = "data:application/json;charset=utf-8," + encodeURIComponent(exportData);
        a.download = $("#filename").val() + "." + format;
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });

    $("#dropZone").on("dragenter", function (event) {
        event.preventDefault();
        event.stopPropagation();
    });

    $("#dropZone").on("dragover", function (event) {
        event.preventDefault();
        event.stopPropagation();
    });

    $("#dropZone").on("drop", function (event) {
        event.preventDefault();
        event.stopPropagation();
        prepareFiles(fileList, event.originalEvent.dataTransfer.files);
    });

    $("#importFileBtn").on("click", function () {
        $("#importFileInput").click();
    });

    $("#importFileInput").on("change", function () {
        prepareFiles(fileList, this.files);
    });

    $("#uploadImport").on("click", function () {
        uploadFiles(fileList);
    });
});