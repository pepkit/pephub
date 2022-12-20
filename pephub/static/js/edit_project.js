const handleMetadataSave = (e) => {
    e.preventDefault()
    alert(JSON.stringify({
      isPrivate: document.getElementById("is-private-toggle").checked,
      description: document.getElementById("project-description").value,
      name: document.getElementById("project-name").value
    }))
}

// detect changes to the form
const detectMetadataChanges = () => {
    const isPrivateToggle = document.getElementById("is-private-toggle")
    const projectDescription = document.getElementById("project-description")
    const projectName = document.getElementById("project-name")

    const saveButton = document.querySelector("button.btn-success")

    const isPrivateChanged = isPrivateToggle.checked !== originalIsPrivateValue
    const descriptionChanged = projectDescription.value !== originalDesciriptionValue
    const nameChanged = projectName.value !== originalProjectNameValue

    if (isPrivateChanged || descriptionChanged || nameChanged) {
        saveButton.disabled = false
    } else {
        saveButton.disabled = true
    }
}

// reset the values to the original values when the user cancels
const cancelChanges = () => {
  document.getElementById("is-private-toggle").checked = originalIsPrivateValue
  document.getElementById("project-description").value = originalDesciriptionValue
  document.getElementById("project-name").value = originalProjectNameValue
  detectMetadataChanges()
}

const fetchSampleTableCSV = () => {
    fetch(`/api/v1/projects/${projectID}/sample_table`)
}