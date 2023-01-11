const TOAST_CONTAINER_ID = "toasts-container-global"

const generateToastHTML = (type, title, body) => {
    return `
            <div class="toast bg-${type} text-white" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header">
                    <strong class="me-auto">${title}</strong>
                    <small>Just now</small>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">
                    ${body}
                </div>
            </div>
    `
}

// create a toast
const createToast = (params) => {
    if (params.type === undefined) {
        params.type = 'primary'
    }
    if (params.title === undefined) {
        params.title = ''
    }
    if (params.body === undefined) {
        params.body = ''
    }
    const toastHTML = generateToastHTML(params.type, params.title, params.body)
    const toast = document.createElement('div')
    toast.innerHTML = toastHTML

    const toastContainer = document.getElementById(TOAST_CONTAINER_ID)
    toastContainer.appendChild(toast);

    // Show the toast
    toast.firstElementChild.classList.add('show');

    // Hide the toast after a certain amount of time
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        toastContainer.removeChild(toast);
      }, 500);
    }, 3000);
}

