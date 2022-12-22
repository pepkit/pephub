const toggleSearchDropdown = () => {

    const dropdown = document.getElementById('search-dropdown-toggle');
    dropdownToggle = new bootstrap.Dropdown(dropdown);
    const searchBar = document.getElementById('global-search-bar');
    const searchQuerySpan = document.getElementById('search-dropdown-query');
    searchQuery = searchBar.value;
    searchQuerySpan.innerText = `"${searchQuery}"`;

    if (searchQuery.length > 0) {
        dropdownToggle.show();
    } else {
        dropdownToggle.hide();
    }
}

const detectSearchSubmit = (event) => {
    const searchBar = document.getElementById('global-search-bar');
    const searchQuery = searchBar.value;
    if (event.key === 'Enter' && searchQuery.length) {
        window.location.href = `/search/?query=${searchQuery}`;
    }
}

const submitSearchQuery = () => {
    const searchBar = document.getElementById('global-search-bar');
    const searchQuery = searchBar.value;
    window.location.href = `/search/?query=${searchQuery}`;
}