const runSearchQuery = (
    query=undefined, 
    limit=undefined, 
    offset=undefined, 
    scoreThreshold=undefined, 
    pageLoad=false
) => {
    // update the url with the search query
    if ('URLSearchParams' in window) {
        var searchParams = new URLSearchParams(window.location.search)
    } else {
        var searchParams = new URLSearchParams()
    }
    if (query !== undefined) {
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

    var newRelativePathQuery = window.location.pathname + '?' + searchParams.toString();
    history.pushState(null, '', newRelativePathQuery);

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
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: searchQuery
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

const updateScoreThresholdDisplay = () => {
    const scoreThreshold = document.getElementById('scoreThreshold').value;
    const scoreThresholdDisplay = document.getElementById('scoreThresholdValue');
    scoreThresholdDisplay.innerHTML = scoreThreshold/100;
}