const debounce = (func, wait, immediate) => {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};

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
    const projectCard = document.getElementById("project-card-" + pepNameToDelete)
    const projectNameToastSpan = document.getElementById("project-delete-name-toast-success")
    const deleteButton = document.querySelector("#deletePEP .btn-danger")

    // split pepNameToDelete into namespace and project name
    const [namespace, projectName] = pepNameToDelete.split("/")
    
    // split project name into name and version
    const [project, tag] = projectName.split(":")

    projectNameToastSpan.textContent = pepNameToDelete
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
    .then(data => {
      // show success toast
      var toastEl = document.getElementById('project-delete-toast-success')
      var toast = new bootstrap.Toast(toastEl)
      toast.show()
    })
    .finally(() => {
      // reset UI elements
      deleteButton.textContent = "Delete"
      projectCard.remove()
      deleteNameInput.value = ""
      modal.hide()
    })
}

const fetchProjectsInNamespace = async (namespace, options=null) => {
    // get div for search results
    const searchResultDiv = document.getElementById("search-results")

    // check for a search string
    const searchBar = document.getElementById("search-bar")
    const query = searchBar.value

    // check if query was overridden
    if (options?.q) {
      
    }
    // populate with query value if it exists
    else if(query && query.length > 0) {
      options = {
        ...options,
        q: query
      }
    }
    // otherwise set to empty string
    else {
      options = {
        ...options,
        q: ""
      }
    }

    // if options is not null build a query string
    if(options) {
      queryParamString = Object.keys(options).map(key => `${key}=${options[key]}`).join('&')
      return fetch(`/api/v1/namespaces/${namespace}/projects?${queryParamString}`)
        .then(res => {
          if(res.ok) {
            return res.json()
          } else {
            throw res
          }
        })
        .then(data => {
          // reformat all the dates in the data
          data.items.forEach(project => {
            try {
              // format as Month Day, Year
              project.submission_date = new Date(project.submission_date).toLocaleString(
                'en-US', {month: 'long', day: 'numeric', year: 'numeric'}
              )
            } catch {
              // do nothing
            }
          })
          const dataWithNamespace = {
            namespace: namespace,
            ...data
          }
          
          searchResultDiv.innerHTML=nunjucks.render('namespace_search_results.html', dataWithNamespace)
        })
        .catch(err => {
          searchResultDiv.innerHTML=nunjucks.render('namespace_search_error.html', {
            error_string: JSON.stringify(err, null, 2), query: options?.query || ""
          })
        })
    } else {
      return fetch(`/api/v1/namespaces/${namespace}/projects`)
        .then(res => {
          if(res.ok) {
            return res.json()
          } else {
            throw res
          }
        })
        .then(data => {
          const dataWithNamespace = {
            namespace: namespace,
            ...data
          }
          searchResultDiv.innerHTML=nunjucks.render('namespace_search_results.html', dataWithNamespace)
        })
        .catch(err => {
          searchResultDiv.innerHTML=nunjucks.render('namespace_search_error.html', {
            error_string: JSON.stringify(err.json(), null, 2),
            error_code: err.status,
          })
        })
    }
}

// small wrapper around fetchProjectsInNamespace
const handleSearch = () => {
    // fetch query and namespace from page
    const searchBar = document.getElementById("search-bar")
    const searchResultDiv = document.getElementById("search-results")
    const query = searchBar.value
    const namespace = document.getElementById("namespace-header").textContent

    // set the spinner
    searchResultDiv.innerHTML = nunjucks.render('search_spinner.html', {})

    fetchProjectsInNamespace(namespace, {q: query})
}

// create debounced version of handleSearch
const handleSearchDebounced = debounce(handleSearch, 500)


const submitNewProject = (event) => {
  event.preventDefault()

  var modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('newProject'), {
    keyboard: false
  })

  const submitButton = document.getElementById("new-project-submit-btn")
  const form = document.getElementById("new-project-form")
  const formData = new FormData(form)
  const namespace = document.getElementById("namespace-select").value
  const user = document.getElementById("namespace-header").textContent

  submitButton.disabled = true
  submitButton.textContent = "Submitting..."

  // submit 
  fetch(`/api/v1/namespaces/${namespace}/projects`, {
    method: form.method,
    body: formData
  })
  .then(res => {
    if(res.ok) {
      return res.json()
    } else {
      throw res
    }
  })
  .then(data => {

    // notify the user it was successful with a toast
    const toastDiv = document.getElementById("new-project-success-toast")
    const nameSpan = document.getElementById("project-name-toast-success")
    
    // set name
    nameSpan.textContent = data.registry_path

    // show toast
    const bsToast = new bootstrap.Toast(toastDiv)
    bsToast.show()

    // if the user submitted to their own namespace, update the search results
    // otherwise push them to the new project page
    if (namespace === user) {
      fetchProjectsInNamespace(namespace)
    } else {
      if (formData.get("tag") === "") {
        formData.set("tag", "default")
      }
      window.location.href = `/${namespace}/${formData.get("project_name")}?tag=${formData.get("tag")}`
    }
  })
  .catch(err => {

    // notify the user there was an error
    const toastDiv = document.getElementById("new-project-error-toast")
    const errorMessageDiv = document.getElementById("new-project-creation-error-message")
    
    // set name and error message
    errorMessageDiv.textContent = JSON.stringify(err, null, 2)
    
    // show toast
    const bsToast = new bootstrap.Toast(toastDiv)
    bsToast.show()
  })
  .finally(() => {
    //auto hide the modal
    modal.hide()
    submitButton.disabled = false
    submitButton.innerHTML = `
      <i class="bi bi-plus-circle"></i>
      Add
    `
  })

}


const submitBlankProject = () => {
  const projectName = document.getElementById("blank-project-name").value;
  const namespace = document.getElementById("namespace").value;
  const tag = document.getElementById("blank-project-tag").value;
  const description = document.getElementById("blank-project-description").value;
  const formData = new FormData();
  formData.append("project_name", projectName);
  formData.append("tag", tag);
  formData.append("description", description);

  // submit the form
  submitForm(formData, namespace);
}

const onFormChange = () => {

  const submitButton = document.getElementById("new-project-submit-btn")

  // check if files input has at least one file
  // and that the name is not empty
  files = document.getElementById("files")
  projectName = document.getElementById("project-name")

  if(files.files.length > 0 && projectName.value.length > 0) {
    submitButton.disabled = false
  } else {
    submitButton.disabled = true
  }
}

const onBlankFormChange = () => {
  
    const submitButton = document.getElementById("blank-project-submit-btn")
  
    // check if files input has at least one file
    // and that the name is not empty
    projectName = document.getElementById("blank-project-name")
  
    if(projectName.value.length > 0) {
      submitButton.disabled = false
    } else {
      submitButton.disabled = true
    }
  }