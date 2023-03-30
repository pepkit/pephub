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
const downloadZip = () => {
  const completeName = document.getElementById("registry-header").innerText

  const [namespace, projectName] = completeName.split("/")
  const [project, tag] = projectName.split(":")


  fetch(`/api/v1/projects/${namespace}/${project}/zip?tag=${tag}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${getCookie("pephub_session")}`
    },
  }).then( res => res.blob() )
  .then( blob => {
    var a = document.createElement("a");
    var file = window.URL.createObjectURL(blob);
    a.href = file;
    a.download = completeName+".zip";
    a.click();
    window.URL.revokeObjectURL(file);
  })
}

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
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${getCookie("pephub_session")}`
    },
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
    window.location.href = `/${namespace}`
    modal.hide()
  })
}

const toggleSampleName = (sel) => {
  const link = document.getElementById("sample-name-link")
  link.href=`/api/v1/{{ namespace }}/{{ project.name }}/samples/${sel.value}`
}
// https://stackoverflow.com/a/30810322/13175187
const copyDigestToClipboard = (digest) => {
  const copyText = document.getElementById("project-uid-digest")

  navigator.clipboard.writeText(copyText.value)

  // update button + icon
  const copyButtonText = document.getElementById("copy-btn-text")
  const copyIcon = document.getElementById("copy-digest-icon")
  copyButtonText.textContent = "Copied!"
  copyIcon.classList.remove("bi-clipboard")
  copyIcon.classList.add("bi-clipboard-check")

  // update after 2 seconds
  setTimeout(() => {
    copyButtonText.textContent = "Copy"
    copyIcon.classList.remove("bi-clipboard-check")
    copyIcon.classList.add("bi-clipboard")
  }, 2000)
}

const submitFork = () => {
  // get params for project we are forking
  const [namespaceOfFork, projectAndTag] = document.getElementById("registry-header").innerText.split("/")
  const [projectToFork, tagToFork] = projectAndTag.split(":")

  // get params for new project
  const forkNamespace = document.getElementById("fork-namespace-select").value
  const forkProjectName = document.getElementById("fork-project-name").value
  const forkTag = document.getElementById("fork-tag").value
  const forkDescription = document.getElementById("fork-description").value

  // submit btn for UX
  const submitBtn = document.getElementById("fork-submit-btn")
  submitBtn.disabled = true
  submitBtn.textContent = "Forking..."

  // make fork request
  fetch(`/api/v1/projects/${namespaceOfFork}/${projectToFork}/forks?tag=${tagToFork}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${getCookie("pephub_session")}`
    },
    body: JSON.stringify({
      fork_to: forkNamespace,
      fork_name: forkProjectName,
      fork_tag: forkTag,
      fork_description: forkDescription
    })
  })
  .then(res => {
    if(res.ok) {
      return res.json()
    } else {
      throw res
    }
  })
  .then(() => {
    window.location.href = `/${forkNamespace}/${forkProjectName}?tag=${forkTag}`
  })
  .catch(err => {
    console.log(err)
    alert(JSON.stringify(err.json, null, 2))
  })
  .finally(() => {
    submitBtn.disabled = false
    submitBtn.textContent = "Fork"
  })
}