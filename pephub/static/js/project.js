const setDeleteFormInputPlaceholder = (name) => {
  const deleteFormInput = document.getElementById("delete-confirm-input")
  const span = document.getElementById("delete-pep-name")
  span.textContent = name
  deleteFormInput.placeholder = name
}

const handleDeleteInputChange = () => {
  const deleteFormInput = document.getElementById("delete-confirm-input")
  const deleteButton = document.querySelector("#deletePEP .btn-danger")
  if (deleteFormInput.value === deleteFormInput.placeholder) {
    deleteButton.disabled = false
  } else {
    deleteButton.disabled = true
  }
}

const deleteProject = () => {
  var modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('deletePEP'), {
    keyboard: false
  })
  
  const deleteNameInput = document.getElementById("delete-confirm-input")
  const pepNameToDelete = document.getElementById("delete-pep-name").textContent
  const deleteButton = document.querySelector("#deletePEP .btn-danger")

  // split pepNameToDelete into namespace and project name
  const [namespace, projectName] = pepNameToDelete.split("/")
  
  // split project name into name and version
  const [project, tag] = projectName.split(":")

  deleteButton.disabled = true
  deleteButton.textContent = "Deleting..."

  fetch(`/api/v1/projects/${namespace}/${project}?tag=${tag}`, {
    method: "DELETE"
  })
  .then(res => {
    if(res.ok) {
      return res.json()
    } else {
      throw res
    }
  })
  .finally(() => {
    // reset UI elements
    deleteButton.textContent = "Delete"
    deleteNameInput.value = ""
    window.location.href = `/${projectName}/${namespace}/deleted?project=${projectName}&namespace=${namespace}`
    modal.hide()
  })
}

const toggleSampleName = (sel) => {
  const link = document.getElementById("sample-name-link")
  link.href=`/api/v1/{{ namespace }}/{{ project.name }}/samples/${sel.value}`
}