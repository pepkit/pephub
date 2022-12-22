const runSearchQuery = (query=undefined, pageLoad=false) => {
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