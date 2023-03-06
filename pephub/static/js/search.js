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

const runSearchQuery = (
    query=undefined, 
    pageLoad=false
) => {

    const limit = document.getElementById('searchLimit').value;
    const offset = document.getElementById('searchOffset').value;
    const scoreThreshold = document.getElementById('scoreThreshold').value/100;

    // update the url with the search query
    if ('URLSearchParams' in window) {
        var searchParams = new URLSearchParams(window.location.search)
    } else {
        var searchParams = new URLSearchParams()
    }
    if (query !== undefined && query !== "" && query !== null) {
        searchParams.set("query", query);
    }
    if (limit !== undefined) {
        searchParams.set("limit", limit);
    }
    if (offset !== undefined) {
        searchParams.set("offset", offset);
    }
    if (scoreThreshold !== undefined) {
        searchParams.set("scoreThreshold", scoreThreshold);
    }

    // only add search parmas if they are not empty and dont do it on pageload
    if (searchParams.toString().length > 0 && !pageLoad) {
        var newRelativePathQuery = window.location.pathname + '?' + searchParams.toString();
        history.pushState(null, '', newRelativePathQuery);
    }
    

    // populate the search query.
    // we do not want to run a query if the search bar is empty ("").
    var searchQuery = "";
    if (query === undefined) {
        searchQuery = document.getElementById('search-bar').value;
    } else if (query.length > 0) {
        searchQuery = query;
    } else {
        return
    }

    if (!pageLoad) {
        const searchResultDiv = document.getElementById('search-results');
        searchResultDiv.innerHTML = nunjucks.render('search_spinner.html', {});
    }

    // // set query param in url
    // const urlParams = new URLSearchParams(window.location.search);
    // urlParams.set('q', searchQuery);

    // // update url
    // window.location.search = urlParams
    

    // run the query and populate using nunjucks.
    fetch(
        `/api/v1/search/`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${getCookie("access_token")}`
                  },
            },
            body: JSON.stringify({
                query: searchQuery,
                limit: limit,
                offset: offset,
                score_threshold: scoreThreshold
            })
        }
    )
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error('Network response was not ok.');
        }
    })
    .then(data => {
        // map data to extract some more info
        var data_enriched = {
            ...data
        }
        data_enriched.results = data.results.map(r => {
            var r_enriched = {
                ...r
            }
            // split pepNameToDelete into namespace and project name
            const [namespace, projectName] = r.payload.registry.split("/")
            
            // split project name into name and version
            const [project, tag] = projectName.split(":")
            
            r_enriched.payload.namespace = namespace;
            r_enriched.payload.name = project;
            r_enriched.payload.tag = tag;
            return r_enriched;
        })
        const searchResultDiv = document.getElementById('search-results');
        searchResultDiv.innerHTML = nunjucks.render('search_results.html', data_enriched);
    })

}


// update parameters and run search query
const pageRight = () => {
    const limit = document.getElementById('searchLimit').value;
    const offset = document.getElementById('searchOffset').value;
    document.getElementById('searchOffset').value = parseInt(offset) + parseInt(limit);
    runSearchQuery();
}

// update parameters and run search query
const pageLeft = () => {
    const limit = document.getElementById('searchLimit').value;
    const offset = document.getElementById('searchOffset').value;
    let newOffset = parseInt(offset) - parseInt(limit);
    if (newOffset < 0) {
        newOffset = 0;
    }
    document.getElementById('searchOffset').value = newOffset;
    runSearchQuery();
}

// update parameters and run search query
const pageReset = () => {
    document.getElementById('searchLimit').value = 100;
    document.getElementById('searchOffset').value = 0;
    runSearchQuery();
}

const updateScoreThresholdDisplay = () => {
    const scoreThreshold = document.getElementById('scoreThreshold').value;
    const scoreThresholdDisplay = document.getElementById('scoreThresholdValue');
    scoreThresholdDisplay.innerHTML = scoreThreshold/100;
}

const resetAdvancedSettings = () => {
    document.getElementById('searchLimit').value = 10;
    document.getElementById('searchOffset').value = 0;
    document.getElementById('scoreThreshold').value = 50;
    updateScoreThresholdDisplay();
}