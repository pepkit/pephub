function setDeleteFormInputPlaceholder(name) {
  const deleteFormInput = document.getElementById("delete-confirm-input")
  const span = document.getElementById("delete-pep-name")
  span.textContent = name
  deleteFormInput.placeholder = name
}

function handleDeleteInputChange() {
  const deleteFormInput = document.getElementById("delete-confirm-input")
  const deleteButton = document.querySelector("#deletePEP .btn-danger")
  if (deleteFormInput.value === deleteFormInput.placeholder) {
    deleteButton.disabled = false
  } else {
    deleteButton.disabled = true
  }
}

function deleteProject() {
  var modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('deletePEP'), {
    keyboard: false
  })

  // send call to server to delete, simulate for now
  const deleteButton = document.querySelector("#deletePEP .btn-danger")
  deleteButton.disabled = true
  deleteButton.textContent = "Deleting..."

  setTimeout(() => {
    deleteButton.disabled = false
    window.location.href = "/{{ project.name }}/{{ namespace }}/deleted?project={{ project.name }}&namespace={{ namespace }}";
    modal.hide()
  }, 1000)

}

function toggleSampleName(sel) {
  const link = document.getElementById("sample-name-link")
  link.href=`/api/v1/{{ namespace }}/{{ project.name }}/samples/${sel.value}`
}