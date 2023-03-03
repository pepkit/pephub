const extractTokenFromUrl = () => {
    // get token from url
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    // decode token
    // https://stackoverflow.com/a/38552302/13175187
    // 
    // Note: this does not validate the signature, 
    // it just extracts the JSON payload from the token, 
    // which could have been tampered with - thats ok
    // because token validation is done on the server later
    // when requests are made.
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    const payload = JSON.parse(jsonPayload)
    const exp = payload.exp // seconds since epoch

    // set token as cookie
    document.cookie = `pephub_session=${token}; path=/; expires=${new Date(exp * 1000)};`;

    // redirect after set
    window.location.href = `/${payload.login}`
}

const signOut = () => {
    // remove cookie
    document.cookie = 'pephub_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    // reload page
    window.location.reload();
}
    