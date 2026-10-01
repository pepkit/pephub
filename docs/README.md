#<img src="img/pephub_logo_big.svg" class="img-header">

<p align="center">
<a href="https://pep.databio.org" alt="PEP compatible"><img src="https://pepkit.github.io/img/PEP-compatible-green.svg"/></a>
<a href="https://github.com/pepkit/pephub" alt="GitHub source code"><img src="https://img.shields.io/badge/source-github-354a75?logo=github"/></a>
</p>



PEPhub is an open-source database, web interface, and API for sharing, retrieving, and validating metadata. PEPhub consists of:

- **Public user interface**: <a href="https://pephub.databio.org/" target="_blank">https://pephub.databio.org/</a>
- **API**: <a href="https://pephub-api.databio.org/api/v1/docs" target="_blank">https://pephub-api.databio.org/api/v1/docs</a>
- **DEV API**: <a href="https://pephub-api-dev.databio.org/api/v1/docs" target="_blank">https://pephub-api-dev.databio.org/api/v1/docs</a>


## Features at-a-glance


- **Validation**. Users specify a schema for a project (using an extended [JSON Schema](https://json-schema.org/)), and use it to validate sample metadata. 

- **Semantic search**. The PEPhub search interface provides an extremely fast and powerful semantic search of sample metadata. It is built using cutting-edge machine learning (sentence transformers) and stored in a fast vector databases. 

- **Authorization**. PEPhub has a robust user authorization system to allow users to submit and edit their own metadata. Users authenticate via GitHub. Data may be either public or private, and can be restricted to individual or group-level permissions using GitHub organizations. 


- **Re-processing of GEO metadata**. The public PEPhub instance [geo namespace](https://pephub.databio.org/geo)  holds metadata from nearly 99% of the [Gene Expression Omnibus](https://www.ncbi.nlm.nih.gov/geo/). PEPhub is updated weekly using [GEOfetch](/geofetch/) to produce standardized PEP sample tables, providing a convenient API interface to GEO metadata.

- **Command-line client**. You can use [PEPHubClient](/pephubclient/) for  command-line tool and Python API, which allows authentication, download, upload of public or private projects.

- **Group PEPs with using a PEP of PEPs (POP)**. A PEP of PEPs, or simply a POP, is a type of PEP in which each row is itself a PEP. POPs allow users to organize projects into groups.

## Next steps

Choose your adventure:

<div class="grid cards" markdown>

-  [**User guide**](user/getting-started.md)  
  Teaches you how to use PEPhub to manage, share, and validate your sample metadata.

-  [**Developer guide**](developer/setup.md)  
  Teaches you how to contribute to PEPhub, build tools on the PEPhub API, or deploy your own instance.

</div>

