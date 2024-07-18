
const urlPattern = /^(https?:\/\/)?([0-9A-Za-zñáéíóúü0-9-]+\.)+[a-z]{2,6}([\/?].*)?$/i;

let companiesTable;
let fileList = [];
let fileCounter = 0;

function getFileExtesion(fileName) {
    return fileName.split('.').pop().toLowerCase();
}

function isAllowedExtension(extension) {
    const allowedExtensions = ["csv", "json", "txt"];
    return allowedExtensions.includes(extension);
}

function updateFilesToUploadCount() {
    $("#filesToUpload").text(fileList.length);
}

function formatBytes(bytes) {
    const kilobyte = 1024;
    const megabyte = kilobyte * 1024;

    if (bytes < kilobyte) {
        return bytes + ' Bytes';
    } else if (bytes < megabyte) {
        return (bytes / kilobyte).toFixed(2) + ' KB';
    } else {
        return (bytes / megabyte).toFixed(2) + ' MB';
    }
}

function appendFileElement(file) {
    const fileExtension = getFileExtesion(file.name);
    const fileSize = formatBytes(file.size);
    const uniqueId = `collapse${fileCounter}`;

    let fileIconClass;
    switch (fileExtension) {
        case "csv":
            fileIconClass = "fa-solid fa-file-csv";
            break;

        case "json":
            fileIconClass = "fa-solid fa-file"
            break;

        case "txt":
            fileIconClass = "fa-solid fa-file-lines"
            break;

        default:
            fileIconClass = "fa-solid fa-file"
    }

    $("#fileList").append(`
        <li class="mb-3 file-item">
            <div class="d-flex file-wrapper collapsed" data-mdb-toggle="collapse" data-mdb-target="#${uniqueId}" aria-expanded="false" aria-controls="${uniqueId}">
                <div class="flex-fill">
                    <div class="d-flex justify-content-between mb-3">
                        <div>
                            <i class="fa-solid fa-chevron-down me-3"></i>
                            <i class="${fileIconClass} fa-lg me-2"></i>
                            <span class="file-name">${file.name}</span>
                            <span class="file-size disabled">${fileSize}</span>
                        </div>
                        <div>
                            <span class="percentage">0 %</span>
                        </div>
                    </div>

                    <div class="progress">
                        <div class="progress-bar" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                </div>

                <div class="px-3">
                    <button type="button" class="btn btn-danger btn-floating btn-sm remove-file-btn" data-mdb-ripple-init>
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            </div>

            <div class="collapse mt-3" id="${uniqueId}">
                Waiting for upload.
            </div>
        </li>

        <hr>
    `);

    $('.remove-file-btn').last().on("click", function () {
        // remove from DOM
        const parentli = $(this).closest("li");
        parentli.next("hr").remove();
        parentli.remove();

        // remove from array of files
        let index = fileList.map(item => item.name).indexOf(file.name);
        fileList.splice(index, 1);

        if (fileList.length === 0) {
            $("#uploadImport").attr("disabled", true);
        }

        updateFilesToUploadCount();
    })

    fileCounter++;
}

function prepareFiles(files) {
    for (file of files) {
        const fileExtension = getFileExtesion(file.name);

        if (!isAllowedExtension(fileExtension)) {
            alert(`File ${file.name} not allowed.`);
            continue;
        }

        if (file.size > 1000000000) {
            alert(`File ${file.name} exceeds the allowed maximum file size (1 GB)`);
            continue;
        }

        fileList.push(file);
        appendFileElement(file);
        updateFilesToUploadCount();
    }

    if (fileList.length > 0) {
        $("#uploadImport").attr("disabled", false);
    }
}

function updateProgress(progressBar, percentageIndicator, percentage) {
    progressBar.css("width", percentage + "%");
    percentageIndicator.text(`${percentage} %`);
    progressBar.attr("aria-valuenow", percentage);
}

async function uploadFile(formData, progressBar, percentageIndicator) {
    return new Promise((resolve, reject) => {
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
                        updateProgress(progressBar, percentageIndicator, percentage);
                    }
                });

                return xhr;
            },
            success: function (data) {
                resolve(data);
            },
            error: function (error) {
                reject(error);
            }
        });
    });
}

async function uploadFiles(companiesTable) {
    // disable select, upload and remove file buttons
    $("#uploadImport").prop("disabled", true);
    $("#importFileBtn").prop("disabled", true);
    $(".remove-file-btn").prop("disabled", true);

    // prevent modal from being closed while uploading
    let modal = mdb.Modal.getInstance($("#importCompanyModal").modal());
    modal._config.backdrop = "static";
    modal._config.keyboard = false;
    $("#closeImportModalBtn").prop("disabled", true);

    let totalInsertedRows = 0;

    // upload files one by one
    for (const [index, file] of fileList.entries()) {
        const progressBar = $(`#fileList .file-item:eq(${index})`).find(".progress-bar:first");
        const percentageIndicator = $(`#fileList li:eq(${index})`).find(".percentage:first");
        const feedbackSection = $(`#fileList .collapse:eq(${index})`);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const data = await uploadFile(formData, progressBar, percentageIndicator);
            totalInsertedRows += data.insertedRows;

            let feedback = `${data.insertedRows}/${data.totalRows} companies imported successfully.`;

            if (data.insertedRows === data.totalRows) { // total success
                progressBar.addClass("bg-success");
            } else {
                const errorList = data.errors.map(error => `<li>${error}</li>`);
                feedback += `<ul>${errorList.join("")}<ul>`
                if (data.insertedRows === 0) { // zero success
                    progressBar.addClass("bg-danger");
                } else { // partial success
                    progressBar.addClass("bg-warning");
                }
            }

            feedbackSection.html(feedback);

            let oldFilesUploaded = parseInt($("#filesUploaded").text());
            $("#filesUploaded").text(oldFilesUploaded + 1);
        } catch (error) {
            errorMsg = `Error in ajax request: ${error?.responseJSON?.error ?? "No response from server."}`
            feedbackSection.html(errorMsg);
        }
    }

    if (totalInsertedRows > 0) {
        companiesTable.draw();
    }

    // enable modal closing options
    modal._config.backdrop = true;
    modal._config.keyboard = true;
    $("#closeImportModalBtn").prop("disabled", "false");
}

function clearFileList() {
    fileList = [];
    $("#fileList").empty();
    $("#filesUploaded").text("0");
    $("#filesToUpload").text("0");
}

function deleteCompany() {
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
}

function submitCompanyForm(event) {
    event.preventDefault();
    let action = $("#companyModal").data("action");

    let error = 0;
    let formData = new FormData(event.target);
    let formProps = Object.fromEntries(formData);

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
    if (urlPattern.test(formProps.web)) {
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
}

function changeCompanyModalData(event) {
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
        $("#website").val(rowData.web);
    }
}

function resetCompanyModalStyles() {
    // clear form styles/values
    $("#companyForm input").each(function () {
        $(this).removeClass("is-valid is-invalid");
    });

    $("#provinceSelect").removeClass("select-valid select-invalid");
    $(".invalid-province-feedback").css("display", "none").removeClass("invalid-province-feedback-active");
}

function resetImportCompanyModalStyles() {
    clearFileList();
    $("#importFileBtn").prop("disabled", false);
    $("#uploadImport").prop("disabled", true);
}

function updateFileExtensionText() {
    let extension = $(this).val();
    $("#extension").text("." + extension);
}

async function exportCompanies() {
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

    // delete _id and __v before exporting
    data.forEach(document => {
        delete document._id;
        delete document.__v;
    });

    // format
    switch (format) {
        case "csv":
            allKeys = Array.from(new Set(data.flatMap(obj => Object.keys(obj))));
            headerRow = allKeys.map(key => `"${key}"`).join(',');

            bodyRows = data.map(obj => {
                return allKeys.map(key => {
                    return `"${obj[key] || ''}"`; // if key does not exist, simply write empty string
                }).join(',');
            });
            exportData = [headerRow, ...bodyRows].join('\n');
            break;

        case "json":
            exportData = JSON.stringify(data);
            break;

        case "txt":
            allKeys = Array.from(new Set(data.flatMap(obj => Object.keys(obj))));

            headerRow = allKeys.map(key => `"${key}"`).join('\t');

            bodyRows = data.map(obj => {
                return allKeys.map(key => {
                    return `"${obj[key] || ''}"`; // if key does not exist, simply write empty string
                }).join('\t');
            });

            exportData = [headerRow, ...bodyRows].join('\n');
            break;
        default:
            break;
    }

    // create temporal anchor for the download
    let a = document.createElement("a");
    a.href = "data:application/json;charset=utf-8," + encodeURIComponent(exportData);
    a.download = $("#filename").val() + "." + format;
    a.download = $("#filename").val() + "." + format;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

$(function () {
    // Initialise companies DataTable
    companiesTable = $('#companiesTable').DataTable({
        scrollX: true,
        paging: true,
        searching: true,
        lengthMenu: [10, 25, 50, 75, 75, 100],
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
            { data: 'name', defaultContent: '' },
            { data: 'province', defaultContent: '' },
            {
                data: 'web',
                render: function (data) {
                    return `<a href="//${data}" target="_blank">${data}</a>`;
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
                data: 'detectedTech',
                orderable: true,
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
                orderable: false,
                render: function () {
                    return '<button type="button" class="btn btn-primary btn-floating btn-sm" data-mdb-toggle="modal" data-mdb-target="#companyModal" data-action="edit">\
                                <i class="fa-solid fa-pen"></i>\
                            </button>'+

                        '<button type="button" class="btn btn-danger btn-floating btn-delete-company btn-sm">\
                                <i class="fa-solid fa-trash"></i>\
                            </button>\
                            '
                },
                className: "column-actions"
            },
        ]
    }).columns.adjust().draw();

    // Request provinces data for provinces select
    $.getJSON('json/provinces.json', function (data) {
        var select = $('#provinceSelect');

        data.results.forEach(result => {
            select.append('<option value="' + result.provincia + '">' + result.provincia + '</option>');
        });

        $("#provinceSelect").val("Gipuzcoa");
    });

    // Delete company event
    $('#companiesTable').on('click', '.btn-delete-company', deleteCompany);

    // Add new company form validation and request
    $("#companyForm").on('submit', submitCompanyForm);

    // Change modal data base on clicked button (add company or edit company)
    $("#companyModal").on("show.bs.modal", changeCompanyModalData);

    // Reset modal styles when closing
    $("#companyModal").on("hidden.bs.modal", resetCompanyModalStyles);

    // Update filename extension based on radio button click
    $('#exportFormat input:radio').on("click", updateFileExtensionText);

    $("#confirmExportCompanies").on("click", exportCompanies);

    // File upload drag and drop managing
    let dropZone = $("#dropZone");
    let innerDropZone = $("#innerDropZone")
    dropZone
        .on("dragenter", function (event) {
            event.preventDefault();
            event.stopPropagation();
            dropZone.addClass("drop-zone-dragenter");
            innerDropZone.addClass("inner-drop-zone-dragenter");
        })
        .on("dragover", function (event) {
            event.preventDefault();
            event.stopPropagation();
        })
        .on("dragleave", function (event) {
            event.preventDefault();
            event.stopPropagation();

            var dropZoneRect = dropZone[0].getBoundingClientRect();
            if (
                event.relatedTarget === null ||
                !dropZone[0].contains(event.relatedTarget) ||
                event.clientY < dropZoneRect.top ||
                event.clientY >= dropZoneRect.bottom ||
                event.clientX < dropZoneRect.left ||
                event.clientX >= dropZoneRect.right
            ) {
                dropZone.removeClass("drop-zone-dragenter");
                innerDropZone.removeClass("inner-drop-zone-dragenter");
            }
        })
        .on("drop", function (event) {
            event.preventDefault();
            event.stopPropagation();

            dropZone.removeClass("drop-zone-dragenter");
            innerDropZone.removeClass("inner-drop-zone-dragenter");
            prepareFiles(event.originalEvent.dataTransfer.files);
        });

    $("#importFileBtn").on("click", function () {
        $("#importFileInput").click();
    });

    $("#importFileInput").on("change", function () {
        prepareFiles(this.files);
    });

    $("#uploadImport").on("click", function () {
        uploadFiles(companiesTable);
    });

    // Reset import companies modal styles when closing
    $("#importCompanyModal").on("hidden.bs.modal", resetImportCompanyModalStyles)

});