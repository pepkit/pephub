const getCookie = (cname) => {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for(let i = 0; i <ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
      c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
      }
  }
  return "";
}

const validatingIndicator = document.getElementById("is-validating-indicator")
const validIndicator = document.getElementById("valid-indicator")
const invalidIndicator = document.getElementById("invalid-indicator")

const showIsValidatingIndicator = () => {
  validIndicator.classList.add("d-none")
  validIndicator.classList.remove("d-flex")


  validatingIndicator.classList.remove("d-none")
  validatingIndicator.classList.add("d-flex")

  invalidIndicator.classList.add("d-none")
  invalidIndicator.classList.remove("d-flex")
}

const showValidIndicator = () => {
  validIndicator.classList.remove("d-none")
  validIndicator.classList.add("d-flex")

  validatingIndicator.classList.add("d-none")
  validatingIndicator.classList.remove("d-flex")

  invalidIndicator.classList.add("d-none")
  invalidIndicator.classList.remove("d-flex")
}

const showInvalidIndicator = () => {
  validIndicator.classList.add("d-none")
  validIndicator.classList.remove("d-flex")
  
  validatingIndicator.classList.add("d-none")
  validatingIndicator.classList.remove("d-flex")

  invalidIndicator.classList.remove("d-none")
  invalidIndicator.classList.add("d-flex")
}

// validation hook
const validateProject = async () => {
  // disabled for now
  const currentSampleTableCsv = handsOnTable.getData().map(row => row.join(",")).join("\n")
  const currentProjectConfigYaml = editor.getValue()
  const validateButton = document.getElementById("validate-button")

  // set the validate button to disabled by default
  validateButton.disabled = true
  validateButton.innerText = "Validating..."

  showIsValidatingIndicator()

  // call the validation endpoint
  let res;
  try {
      res = await fetch("/api/v1/eido/validate/raw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authoprization": `Bearer ${getCookie("pephub_session")}`
        },
        body: JSON.stringify({
          project_config: currentProjectConfigYaml,
          sample_table: currentSampleTableCsv
      })
    })
    // validate the response
    if (res.ok) {
      showValidIndicator()
      return res.json()
    // if not ok (failed validation on server),
    // update the validation indicators
    } else {
      showInvalidIndicator()
      validateButton.disabled = false
      validateButton.innerText = "Validate"
      const json = await res.json()
      const errorBox = document.getElementById("validation-error-box")
      errorBox.innerText = JSON.stringify({
        error: json.detail.error
      }, null, 2)
    }
  } catch (err) {
    showInvalidIndicator()
    const errorBox = document.getElementById("validation-error-box")
    errorBox.innerText = JSON.stringify({
      error: json.detail.error
    }, null, 2)
  } finally {
    validateButton.disabled = false
    validateButton.innerText = "Validate"
  }
}

// detect changes to the form
const detectMetadataChanges = () => {
  const isPrivateToggle = document.getElementById("is-private-toggle")
  const projectDescription = document.getElementById("project-description")
  const projectName = document.getElementById("project-name")
  const tag = document.getElementById("project-tag")

  const saveButton = document.querySelector("button.btn-success")

  const isPrivateChanged = isPrivateToggle.checked !== originalIsPrivateValue
  const descriptionChanged = projectDescription.value !== originalDesciriptionValue
  const nameChanged = projectName.value !== originalProjectNameValue
  const tagChanged = tag.value !== originalProjectTagValue

  if (isPrivateChanged || descriptionChanged || nameChanged || tagChanged) {
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

// store the original values of the project
var originalIsPrivateValue = document.getElementById("is-private-toggle").checked
var originalDesciriptionValue = document.getElementById("project-description").placeholder
var originalProjectNameValue = document.getElementById("project-name").placeholder
var originalProjectTagValue = document.getElementById("project-tag").placeholder

// setters to reset the original values when the user saves
const setOriginalIsPrivateValue = (val) => {
  originalIsPrivateValue = val
}
const setOriginalDescriptionValue = (val) => {
  document.getElementById("project-description").placeholder = val
  originalDesciriptionValue = val
}
const setOriginalProjectNameValue = (val) => {
  document.getElementById("project-name").placeholder = val
  originalProjectNameValue = val
}
const setOriginalProjectTagValue = (val) => {
  document.getElementById("project-tag").placeholder = val
  originalProjectTagValue = val
}

const form = document.getElementById("metadata-form")
form.addEventListener("change", detectMetadataChanges)

// submit PATCH request to server/database
const handleMetaMetaDataSubmit = async () => {

  // get the settings to submit it to
  const namespace = document.getElementById("namespace-store").value
  const projectToSubmit = document.getElementById("project-name").placeholder
  const tagToSubmit = document.getElementById("project-tag").placeholder

  // update save btn for UX and feedback
  const saveBtn = document.getElementById("metadata-save-btn")
  saveBtn.innerHTML = "Saving..."
  saveBtn.disabled = true

  // send request to server
  fetch(`/api/v1/projects/${namespace}/${projectToSubmit}?tag=${tagToSubmit}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${getCookie("pephub_session")}`
    },
    body: JSON.stringify({
        name: document.getElementById("project-name").value,
        description: document.getElementById("project-description").value,
        is_private: document.getElementById("is-private-toggle").checked,
        tag: document.getElementById("project-tag").value,
    }),
  })
  .then(async (response) => {
    if (response.ok) {
      // update original values and placeholders
      setOriginalProjectNameValue(document.getElementById("project-name").value)
      setOriginalDescriptionValue(document.getElementById("project-description").value)
      setOriginalIsPrivateValue(document.getElementById("is-private-toggle").checked)
      setOriginalProjectTagValue(document.getElementById("project-tag").value)

      // update save btn for UX and feedback
      saveBtn.innerHTML = "Save"
      saveBtn.disabled = true

      // update back link
      document.getElementById("back-link").href = `/${namespace}/${document.getElementById("project-name").value}?tag=${document.getElementById("project-tag").value}`

      createToast({
        type: "success",
        title: "Success",
        body: "Metadata updated successfully",
      })

    } else {
      const json = await response.json()
      throw new Error(json.detail || "Something went wrong...")
    }
  })
  .catch((error) => {
    createToast({
      type: "danger",
      title: "Something went wrong...",
      // gracefully display any errors
      body: error.message || error,
    })
    .finally(() => {
      saveBtn.innerHTML = "Save"
      saveBtn.disabled = false
    })
  })
}

var handsOnTable;
var originalSampleTableCsv = "Fetching..."

const setOriginalSampleTableCsv = (val) => {

  originalSampleTableCsv = val
}

// remove trailing commas
const removeTrailingCommas = (s) => {
  while (s[s.length - 1] === ",") {
    s = s.slice(0, -1)
  }
  return s
}

// detect any changes to the sample table
const detectSampleTableChanges = () => {
  var currentSampleTableCsv = handsOnTable.getData().map(row => row.join(",")).join("\n")

  // remove trailing commas
  currentSampleTableCsv = removeTrailingCommas(currentSampleTableCsv)
  
  // detect any changes
  if (currentSampleTableCsv !== originalSampleTableCsv) {
    document.getElementById("sample-table-save-btn").disabled = false
  } else {
    document.getElementById("sample-table-save-btn").disabled = true
  }
}
  
const loadHandsOnTable = (data) => {

  if (handsOnTable) return handsOnTable

  const csvEditorDiv = document.querySelector('#csv-editor-div');
  handsOnTable = new Handsontable(csvEditorDiv, {
    data: Papa.parse(originalSampleTableCsv).data, // using serverside csv to initialize
    rowHeaders: true,
    colHeaders: true,
    stretchH: 'all',
    stretchW: 'all',
    height: 'auto',
    contextMenu: true,
    licenseKey: 'non-commercial-and-evaluation' // for non-commercial use only
  });
  handsOnTable.addHook("afterChange", detectSampleTableChanges)
  return handsOnTable
}

const getSampleTableFromDatabase = () => {
  // get the latest values
  const namespace = document.getElementById("namespace-store").value
  const projectName = document.getElementById("project-name").placeholder
  const projectTag = document.getElementById("project-tag").placeholder

  fetch(
    `/api/v1/projects/${namespace}/${projectName}/samples?tag=${projectTag}&format=csv`,
    {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${getCookie("pephub_session")}`
      }
    }
  )
  .then(response =>  response.text())
  .then(data => {
    if (!handsOnTable) {
      handsOnTable = loadHandsOnTable()
    }
    setOriginalSampleTableCsv(data)
    handsOnTable.loadData(Papa.parse(data).data)
  })
}

const addRow = () => {
  handsOnTable.alter("insert_row_above", handsOnTable.countRows(), 1)
}
const addCol = () => { 
  handsOnTable.alter("insert_col_start", handsOnTable.countCols(), 1)
}
const removeRow = () => {
  handsOnTable.alter("remove_row", handsOnTable.countRows(), 1)
}
const removeCol = () => {
  handsOnTable.alter("remove_col", handsOnTable.countCols(), 1)
}

// submit edited sample table to the server/database
const handleSampleTableEditorSubmit = async () => {

  // get the latest values
  const tag = document.getElementById("project-tag").placeholder
  const namespace = document.getElementById("namespace-store").value
  const projectName = document.getElementById("project-name").placeholder

  // update save btn for UX and feedback
  const sampleTableSaveBtn = document.getElementById("sample-table-save-btn")
  sampleTableSaveBtn.innerText = "Saving..."
  sampleTableSaveBtn.disabled = true

  // fetch current state of the table
  let csv = handsOnTable.getData().map(row => row.join(",")).join("\n")
  csv = removeTrailingCommas(csv)

  // send PATCH request to server
  fetch(`/api/v1/projects/${namespace}/${projectName}?tag=${tag}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${getCookie("pephub_session")}`
    },
    body: JSON.stringify({
      "sample_table_csv": csv
    }, null, 2)
  })
  .then(async (res) => {
    if (res.ok) {

      // update original values and placeholders
      setOriginalSampleTableCsv(csv)
      createToast({
        title: "Success",
        body: "Sample table saved successfully",
        type: "success",
      })
    } else {
      const json = await res.json()
      throw new Error(json.detail || res.statusText || "Something went wrong...")
    }
  })
  .catch((error) => {
    createToast({
      type: "danger",
      title: "Something went wrong...",
      // gracefully display any errors
      body: error.message || error,
      timout: 3000
    })
  })
  .finally(() => {
    // reset button state
    sampleTableSaveBtn.innerText = "Save"
  })
}


var editor
var originalProjectConfigYaml = "Fetching..."

const setOriginalConfigYaml = (val) => {
  originalConfigYaml = val
}

const loadMonaco = () => {
  if (editor) return editor
  
  require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.26.1/min/vs' } });
  require(['vs/editor/editor.main'], () => {
    editor = monaco.editor.create(document.getElementById('yaml-editor-div'), {
      value: originalProjectConfigYaml, // initialize with serverside yaml
      language: 'yaml',
      tabSize: 2,
      insertSpaces: true,
      automaticLayout: true
    });
  });
  return editor
}

const loadYAMLEditor = () => {
  editor = loadMonaco()
  return editor
}

editor = loadYAMLEditor()

// detect any changes to the yaml editor
const detectYamlChanges = () => {
  if (editor.getValue() !== originalProjectConfigYaml) {
    document.getElementById("yaml-save-btn").disabled = false
  } else {
    document.getElementById("yaml-save-btn").disabled = true
  }
}

const getProjectConfigYamlFromDatabase = () => {
  // get the latest values
  const namespace = document.getElementById("namespace-store").value
  const projectName = document.getElementById("project-name").placeholder
  const projectTag = document.getElementById("project-tag").placeholder

  fetch(
    `/api/v1/projects/${namespace}/${projectName}/convert?tag=${projectTag}&filter=yaml`,
   {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${getCookie("pephub_session")}`
    },
  })
  .then(response =>  response.text())
  .then(data => {
    if (!editor) {
      editor = loadYAMLEditor()
    }
    setOriginalConfigYaml(data)
    editor.setValue(data)
  })
}
  
// submit edited yaml to the server/database
const handleProjectConfigYamlSubmit = async () => {

  const namespace = document.getElementById("namespace-store").value
  const projectName = document.getElementById("project-name").placeholder
  const tag = document.getElementById("project-tag").placeholder
  
  // update save button for UX and feedback
  const yamlSaveBtn = document.getElementById("yaml-save-btn")
  yamlSaveBtn.innerText = "Saving..."
  yamlSaveBtn.disabled = true

  // fetch current state of the editor
  const yaml = editor.getValue()

  // send PATCH request to the server/database
  fetch(
    `/api/v1/projects/${namespace}/${projectName}?tag=${tag}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${getCookie("pephub_session")}`
    },
    body: JSON.stringify({
      "project_config_yaml": yaml
    }, null, 2)
  })
  .then(async (res) => {
    if (res.ok) {
      originalProjectConfigYaml = yaml
      createToast({
        title: "Success",
        body: "Project config saved successfully",
        type: "success",
      })
    } else {
      const json = await res.json()
      throw new Error(json.detail || res.statusText || res.status || "Something went wrong...")
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
  .finally(() => {
    // reset button state
    yamlSaveBtn.innerText = "Save"
  })
}