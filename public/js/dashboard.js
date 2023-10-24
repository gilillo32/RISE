
function notify(type, msg) {
    const notificationContainer = $("#notification-container");

    // get icon depending on message type
    let icon = '<i class="fa-solid fa-';
    switch(type) {
        case "primary": 
            icon += "circle-info";
            break;
        case "secondary": 
            icon += "circle-info";
            break;
        case "success": 
            icon += "circle-check";
            break;

        case "danger": 
            icon += "circle-xmark";
            break;
        case "warning": 
            icon += "triangle-exclamation";
            break;
        case "info":
            icon += "circle-info";
            break;
        default:
            icon += "circle-info";
            break;
    }
    icon += '"></i>';

    // build toast
    const toastHTML = 
        '<div class="toast align-items-center text-bg-' + type + ' text-white mb-2" role="alert" aria-live="assertive" aria-atomic="true" data-bs-delay="3000">' +
            '<div class="d-flex">' +
                '<div class="toast-body">' + icon + " " + msg + '</div>' +
                '<button type="button" class="btn-close btn-close-white m-auto" data-bs-dismiss="toast" aria-label="Close"></button>' +
            '</div>' +
        '</div>';

    // append it to the last toast
    notificationContainer.append(toastHTML);
    const toastElement = notificationContainer.find(".toast:last");
    let toast = new bootstrap.Toast(toastElement);
    toast.show();

    // remove from DOM when notification gets hidden
    toastElement.on('hidden.bs.toast', function() {
        $(this).remove();
    });
}