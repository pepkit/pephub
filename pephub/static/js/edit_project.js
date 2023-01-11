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


const fetchSampleTableCSV = (projectID) => {
    fetch(`/api/v1/projects/${projectID}/sample_table`)
}

// setters to reset the original values when the user saves
const setOriginalIsPrivateValue = (val) => {
  originalIsPrivateValue = val
}
const setOriginalDescriptionValue = (val) => {
  originalDesciriptionValue = val
}
const setOriginalProjectNameValue = (val) => {
  originalProjectNameValue = val
}

// submit PATCH request to server/database
const handleMetaMetaDataSubmit = (namespace, project, tag) => {

    // update save btn for UX and feedback
    const saveBtn = document.getElementById("metadata-save-btn")
    saveBtn.innerHTML = "Saving..."
    saveBtn.disabled = true

    // send request to server
    fetch(`/api/v1/projects/${namespace}/${project}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: document.getElementById("project-name").value,
          description: document.getElementById("project-description").value,
          private: document.getElementById("is-private-toggle").checked,
    }),
    })
    .then((response) => {
      if (response.ok) {
        // update original values
        setOriginalProjectNameValue(document.getElementById("project-name").value)
        setOriginalDescriptionValue(document.getElementById("project-description").value)
        setOriginalIsPrivateValue(document.getElementById("is-private-toggle").checked)

        // update save btn for UX and feedback
        saveBtn.innerHTML = "Save"
        saveBtn.disabled = true

        // update back link
        document.getElementById("back-link").href = `/${namespace}/${document.getElementById("project-name").value}`

        createToast({
        type: "success",
        title: "Success",
        body: "Metadata updated successfully",
        })
    } else {
        // update save btn for UX and feedback
        saveBtn.innerHTML = "Save"
        saveBtn.disabled = false
        
        // throw error
        throw new Error("Something went wrong...", response.statusText)
    }
    })
    .catch((error) => {
      createToast({
          type: "danger",
          title: "Something went wrong...",
          // gracefully display any errors
          body: error.message || error,
      })
    })
} 