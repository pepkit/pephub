// original values
let originalIsPrivateValue = false
let originalDesciriptionValue = ""
let originalProjectNameValue = ""


// fetch the original values from the server
const fetchMetaData = async () => {
  fetch(`/api/v1/projects/${namespace}/${project}`)
    .then((response) => response.json())
    .then((data) => {

      // set values on the page
      document.getElementById("project-name").value = data.name
      document.getElementById("project-description").value = data.description
      document.getElementById("is-private").checked = data.is_private

      return data
    })
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
  fetchMetaData()
  .then((data) => {
  document.getElementById("is-private-toggle").checked = data.is_private
  document.getElementById("project-description").value = data.description
  document.getElementById("project-name").value = data.name

  // reset original values
  setOriginalIsPrivateValue(data.is_private)
  setOriginalDescriptionValue(data.description)
  setOriginalProjectNameValue(data.name)

  detectMetadataChanges()
  })
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


var handsOnTable;

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

const loadHandsOnTable = () => {

  if (handsOnTable) return handsOnTable

  const csvEditorDiv = document.querySelector('#csv-editor-div');
  handsOnTable = new Handsontable(csvEditorDiv, {
    data: Papa.parse(`{{ sample_table_csv}}`).data, // using serverside csv to initialize
    rowHeaders: true,
    colHeaders: true,
    stretchH: 'all',
    stretchW: 'all',
    height: 'auto',
    licenseKey: 'non-commercial-and-evaluation' // for non-commercial use only
  });
  handsOnTable.addHook("afterChange", detectSampleTableChanges)
  return handsOnTable
}

const getSampleTableFromDatabase = (namespace, project, tag) => {
  fetch(`/api/v1/projects/${namespace}/${project}/samples?format=csv&tag=${tag}`)
  .then(response =>  response.text())
  .then(data => {
    if (!handsOnTable) {
      handsOnTable = loadHandsOnTable()
    }
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
const handleSampleTableEditorSubmit = () => {

  // update save btn for UX and feedback
  const sampleTableSaveBtn = document.getElementById("sample-table-save-btn")
  sampleTableSaveBtn.innerText = "Saving..."
  sampleTableSaveBtn.disabled = true

  // fetch current state of the table
  let csv = handsOnTable.getData().map(row => row.join(",")).join("\n")
  csv = removeTrailingCommas(csv)

  // send PATCH request to server
  fetch("/api/v1/projects/{{namespace}}/{{ project.name }}", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      "sample_table_csv": csv
    }, null, 2)
  })
  .then((res) => {
    // chech k ok response
    if (!res.ok) {
      throw new Error(res.statusText)
    } else {
      createToast({
        title: "Success",
        body: "Sample table saved successfully",
        type: "success",
      })
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
    sampleTableSaveBtn.innerText = "Save"
  })
}

var editor;

const getProjectConfigYamlFromDatabase = () => {
  fetch("/api/v1/projects/{{namespace}}/{{ project.name }}/convert?filter=yaml")
  .then(response =>  response.text())
  .then(data => {
    if (!editor) {
      editor = loadYAMLEditor()
    }
    editor.setValue(data)
  })
}

const loadMonaco = () => {
  if (editor) return editor

  // fetch yaml from server
  
  require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.26.1/min/vs' } });
  require(['vs/editor/editor.main'], () => {
    editor = monaco.editor.create(document.getElementById('yaml-editor-div'), {
      value: "", // initialize with serverside yaml
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

// TODO: CHANGE THIS!!!
// supply detector to a hook, it takes a second for it to load
// so I just run a setTimeout THIS IS BAD but easy
setTimeout(() => editor.onKeyUp(detectYamlChanges), 1000)

// submit edited yaml to the server/database
const handleProjectConfigYamlSubmit = () => {
  // update save button for UX and feedback
  const yamlSaveBtn = document.getElementById("yaml-save-btn")
  const yamlSaveBtnText = yamlSaveBtn.innerText = "Saving..."
  yamlSaveBtn.disabled = true

  // fetch current state of the editor
  const yaml = editor.getValue()

  // send PATCH request to the server/database
  fetch("/api/v1/projects/{{namespace}}/{{ project.name }}", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      "project_config_yaml": yaml
    }, null, 2)
  })
  .then(() => {
    originalProjectConfigYaml = yaml
    createToast({
      title: "Success",
      body: "Project config saved successfully",
      type: "success",
    })
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