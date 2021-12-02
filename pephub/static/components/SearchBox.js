const SearchBox = () => {

    const [searchText, setSearchText] = React.useState('')
    const [error, setError] = React.useState(null)
    const [peps, setPeps] = React.useState([]);
    const [loading, setLoading] = React.useState(false);

    function searchPeps() {
        setLoading(true)
        fetch(`/pep/${searchText.toLowerCase()}/`)
        .then(res => {
            if(res.ok) {
                return res.json()
                throw res
            }
        })
        .then(peps => {
            let pepList = Object.keys(peps).map(p => p)
            setPeps(pepList)
        })
        .catch(err => {
            setError(err)
            setPeps([])
            console.error("An error occured:", err)
        })
        .finally(() => {
            setLoading(false)
        })
    }

    return (
        <div className="card">
            <div className="card-header">
            <div className="form-inline my-2 my-lg-0">
                <input 
                    className="form-control mr-sm-2 w-50" placeholder="Search for a namespace..." aria-label="Search" 
                    onChange={(e) => setSearchText(e.target.value)}
                    value={searchText}
                    onKeyDown={e => {
                        if(e.keyCode === 13) {
                            searchPeps()
                        }
                    }}
                />
                <button className="btn btn-outline-primary my-2 my-sm-0" onClick={searchPeps}>Search</button>
            </div>
            </div>
            <div className="card-body" style={{minHeight: '10rem'}}>
            {
                loading ?
                <div className="font-italic text-secondary d-flex justify-content-center h-100 align-items-center my-5">
                    Loading...
                </div>
                : peps.length > 0 ?
                <div>
                <h5 class="card-title">Available endpoints</h5>
                    <ul className="list-group">
                    {
                        peps.map((p,i) => {
                            return (
                                <li key={i} className="list-group-item">
                                  <a href={`/pep/${searchText}/${p}/`} target="_blank">
                                    <button className="btn btn-outline-primary mr-2">Visit 💊 </button>
                                  </a>
                                  <span style={{color: '#FFF'}} className="rounded py-2 px-4 bg-primary border-primary border">
                                    <span class="p-1 mr-4 rounded bg-light text-primary">GET</span>{`/pep/${searchText}/${p}/`}
                                  </span>
                                </li>
                            )
                        })
                    }
                    </ul>
                </div>
                : <div className="font-italic text-secondary d-flex justify-content-center h-100 align-items-center my-5">No Peps found :(</div>
            }
            </div>
        </div>
    )
}
const domContainer = document.querySelector('#_search_box');
ReactDOM.render(<SearchBox />, domContainer);