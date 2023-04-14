function allowDrop(ev) {
    ev.preventDefault();
    ev.stopPropagation();
  }

  function handleDrop(ev) {
    ev.preventDefault();
    var files = ev.dataTransfer.files;
    var fileBuffer = new DataTransfer()

    Array.from(files).forEach(file => fileBuffer.items.add(file))
    document.getElementById("files").files = fileBuffer.files;

    onFileInputChange();
}

function clickFileInput () {
    document.getElementById("files").click();
}

function clearFileInput () {
    document.getElementById("files").value = "";
    onFileInputChange();
}

function showDragAndDrop() {
    document.getElementById("dnd-box").classList.remove("d-none");
    document.getElementById("dnd-box").classList.add("d-block");
}

function hideDragAndDrop() {
    document.getElementById("dnd-box").classList.remove("d-block");
    document.getElementById("dnd-box").classList.add("d-none");
}

function showFileList() {
    document.getElementById("file-list-container").classList.remove("d-none");
    document.getElementById("file-list-container").classList.add("d-block");
}

function hideFileList() {
    document.getElementById("file-list-container").classList.remove("d-block");
    document.getElementById("file-list-container").classList.add("d-none");
}

// remove a specific file from the list
function removeFileFromList (i) {
    const files = fileInput.files;
    const newFiles = Array.from(files).filter((f, j) => i !== j);

    var fileBuffer = new DataTransfer();
    newFiles.forEach(f => fileBuffer.items.add(f));
    fileInput.files = fileBuffer.files;
    onFileInputChange();
    }

    // onChange handler
    function onFileInputChange () {
    const files = fileInput.files
    if (files.length > 0) {
        // clear out old file names
        document.getElementById("file-list").innerHTML = "";

        // add a file div for each file in the list to the file list to the "file-list" div
        Array.from(files).forEach((f, i) => {
        const fileDiv = document.createElement("div");
        fileDiv.innerHTML = `
            <div class="d-flex flex-row align-items-center justify-content-start">
              <code><span id="file-${i}-name"></span></code>
              <span id="file-${i}-size" class="text-secondary ms-1"></span>
              <button class="btn btn-sm btn-link text-danger" onclick="removeFileFromList(${i})">Remove</button>
            </div>
        `
        fileDiv.querySelector(`#file-${i}-name`).innerHTML = f.name;
        fileDiv.querySelector(`#file-${i}-size`).innerHTML = `(${f.size} bytes)`;
        document.getElementById("file-list").appendChild(fileDiv);
        })
        showFileList();
        hideDragAndDrop();
    } else {
        // remove all file divs from the file list
        document.getElementById("file-list").innerHTML = "";
        showDragAndDrop();
        hideFileList();
    }
}

// reset form 
function resetForm () {
    document.getElementById("new-project-form").reset();

    // reset form submit button
    document.getElementById("new-project-submit-btn").disabled=true;

    clearFileInput();
}

// reset blank form
function resetBlankForm () {
    document.getElementById("blank-project-form").reset();

    // reset form submit button
    document.getElementById("blank-project-submit-btn").disabled=true;
}