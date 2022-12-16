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
    
    const pepNameToDelete = document.getElementById("delete-pep-name").textContent
    const projectCard = document.getElementById("project-card-" + pepNameToDelete)
    // send call to server to delete, simulate for now

    const deleteButton = document.querySelector("#deletePEP .btn-danger")
    deleteButton.disabled = true
    deleteButton.textContent = "Deleting..."
    
    setTimeout(() => {
      deleteButton.disabled = false
      projectCard.remove()
      modal.hide()
    }, 1000)
}

const fetchProjectsInNamespace = async (namespace, options=null) => {
    debugger;
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
          const dataWithNamespace = {
            namespace: namespace,
            ...data
          }
          searchResultDiv.innerHTML=nunjucks.render('search_results.html', dataWithNamespace)
        })
        .catch(err => {
          searchResultDiv.innerHTML=nunjucks.render('search_error.html', {
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
          searchResultDiv.innerHTML=nunjucks.render('search_results.html', dataWithNamespace)
        })
        .catch(err => {
          searchResultDiv.innerHTML=nunjucks.render('search_error.html', {
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