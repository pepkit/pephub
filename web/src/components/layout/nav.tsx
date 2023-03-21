import { FC } from "react";

// bootstrap nav bar
export const Nav: FC = () => {
    return (
      <nav className="py-2 mb-4 navbar navbar-expand-md border-bottom navbar-light" aria-label="navbar" style={{backgroundColor: '#EFF3F6'}}>
		  <div className="container">
		    <a href="/" className="mb-3 align-items-center mb-md-0 me-md-auto text-dark text-decoration-none">
		      <img src="/static/img/pephub_logo.svg" alt="PEPhub" height="60" />
		    </a>
		    <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
		      <span className="navbar-toggler-icon"></span>
		    </button>
		    <div className="collapse navbar-collapse me-auto" id="navbarSupportedContent">
		      <ul className="mb-2 navbar-nav ms-auto mb-sm-0">  
				<li>
				  <div className="mt-1 input-group">
				    <input disabled id="global-search-bar" type="text" className="form-control border-end-0" placeholder="Search pephub" aria-label="search" aria-describedby="search" />
					<span style={{backgroundColor: 'rgba(255, 255, 255, 255) !important' }} className="input-group-text border-start-0">
						<div className="px-2 border rounded border-secondary text-secondary">
							/
						</div>
					</span>
				  </div>
				  <div className="dropdown">
					<button id="search-dropdown-toggle" className="dropdown-toggle d-none" type="button" data-bs-toggle="dropdown" aria-expanded="false">
					  Search dropdown
					</button>
					<ul className="dropdown-menu" aria-labelledby="search-dropdown">
					  <li>
						<span className="dropdown-item">
						  Search pephub for <em><span id="search-dropdown-query"></span></em>
						  <button className="btn btn-sm btn-outline-secondary ms-3">
							Search
							<i className="bi bi-arrow-return-left"></i>
						  </button>
						</span>
					  </li>
					</ul>
				  </div>
				</li>      
		      <li className="mx-2 my-0 nav-item h5 pt-1">
		        <a className="nav-link" href="/api/v1/docs">
					<i className="me-1 bi bi-journal"></i>
					API docs
				</a>
		      </li>
		      <li className="mx-2 my-0 nav-item h5 pt-1">
		      <a className="nav-link" href="https://github.com/pepkit/pephub" target="_blank">
				<i className="me-1 bi bi-github"></i>
				GitHub
			  </a>
			  </li>
			  <li className="mx-2 my-0 nav-item h5">
			    <a href="/auth/login?client_redirect_uri=/login/success">
			    	<button className="btn btn-dark"><i className="fa fa-github"></i>Login</button>
			    </a>
			  </li>
		      </ul>
		    </div>
		  </div>
		</nav>
    )
}