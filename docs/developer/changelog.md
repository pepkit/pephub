# Changelog

This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) and [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format.

## [0.11.0] - 2024-01-16

### Added

- Group of PEPs, create a new type of PEP called a "POP" (a PEP of PEPs)
- Ability to star/favorite a PEP
- Updated search functionality to be more robust

### Changed

- Switch to `fastembed` for query embeddings to lower container size
- Minor UI updates

## [0.10.5] - 2023-12-04

### Changed

- optimized web interface fetching of PEP annotation data.

### Added

- project annotation endpoint (#234)

## [0.10.4] - 2023-10-02

### Fixed

- PEP zip downloading

## [0.10.3] - 2023-08-31

### Changed

- Add support for twitter cards, change some things.

## [0.10.2] - 2023-08-31

### Changed

- Changed image link for open graph image

## [0.10.1] - 2023-08-30

### Changed

- Add opengraph image link

## [0.10.0] - 2023-08-24

### Added

- Date filter to project annotation endpoint

## [0.9.9] - 2023-08-22

### Changed

- schema tag URL to route to schema splash page

## [0.9.8] - 2023-07-24

### Fixed

- cant add a PEP to a namespace if you don't have any to begin with

## [0.9.7] - 2023-07-24

### Fixed

- sample table would exhibit odd, erratic behavior if column names were left blank
- landing page styling was not optimal

## [0.9.6] - 2023-07-20

### Fixed

- Upload raw project errors

### Changed

- More stylish landing page that exemplifies pephub features
- Better error handling on queries

## [0.9.5] - 2023-07-19

### Fixed

- Changing sample_name error

### Added

- Landing sample table
- UI tweaks
- About page (In progress)
- Sample, subsample, config update simultaneously when saved

### Changed

- Landing page

## [0.9.4] - 2023-07-18

### Fixed

- Typo in tooltip for search bar

### Added

- Tooltip on landing page namespace list

### Changed

- Styling of landing namespaces to more clearly indicate they are links

## [0.9.3] - 2023-07-17

### Changed

- Styling updates
- Landing tooltips
- Minor UI updates

## [0.9.2] - 2023-07-12

### Fixed

- validating was not firing when updating sample table, subsample table, or config

### Added

- github organizations UI visibility
- schema tag has link to schema

## [0.9.1] - 2023-07-11

### Fixed

- forking was broken
- order in config file was incorrect

### Added

- config endpoint

## [0.9.0] - 2023-07-05

### Fixed

- description updating was broken
- strip markdown in description of projects in project list
- sample table stability updates

### Added

- better authentication awareness, app now checks for login status on every render, removes session if no longer valid
- added basic subsample table editing
- better validation error messages for universal validator

## [0.8.4] - 2023-06-21

### Fixed

- lots of sample table editing bugs
- sample table editing now works as expected
- logging in sent you to the homepage no matter what

### Changed

- authentication uses `localStorage` instead of browser cookies
- forking a PEP brings in the description of the PEP
- landing page changes

## [0.8.3] - 2023-06-11

### Fixed

- schema validation error causing crash in production.

## [0.8.2] - 2023-06-11

### Fixed

- Dockerfile build error due to missing `gcc` dependency.

## [0.8.1] - 2023-06-11

### Fixed

- Dockerfile build error due to `psycopg2` issue.

## [0.8.0] - 2023-06-09

### Fixed

- Sample table editing had bugs
- Width of sample table was incorrect
- Not found projects would load forever
- Case-sensitivity was causing errors
- Search links were not working

### Added

- Interface updated to support new features
- Markdwon support for PEPs
- Assign schemas to PEPs
- Ability to sort PEPs on namespace page
- Database setup is now streamlined

### Removed

- `cli` is now deprecated

## [0.7.4] - 2022-04-15

### Fixed

- Couldnt remove columns from sample table
- Drag n Drop was broken -> now fixed
- Fix sample table editing due to trailing commas
- File upload now fixed

### Changed

- Redesign project page for a better user experience
- Key binding for global search is now better

### Added

- CSS utility classes for better styling

## [0.7.4] - 2022-04-15

### Fixed

- Dockerfile not pulling in `/public` from `web/`

## [0.7.3] - 2022-04-15

### Changed

- Fixed dependencies to _actually_ install the `cpu` only version of `torch`
- Added new macOS dependencies to support native development/deployment

## [0.7.2] - 2022-04-14

### Changed

- Fix bug that was deleting images from the frontend

## [0.7.1] - 2022-04-14

### Changed

- Optimized Dockerfile for faster, slimmer deployments

## [0.7.0] - 2022-04-14

### Fixed

- Private projects were viewable to those not logged in
- Some projects were causing 500 server errors

### Added

- Device authentication flow
- Ability to "fork" a PEP
- Web interface lets you download a zip file of a PEP
- New submission flow for JSON representation of a PEP

### Changed

- Reimplemented web interface in React.js
- New deployment strategy that uses `uvicorn` instead of `pip install .`

## [0.6.0] - 2022-03-06

### Fixed

- Buffering configuration file
- Saving failures in production
- Renewed login bug

### Added

- Advanced searching features like score, offset, limit
- Ability to add a "blank" PEP
- Web-based metadata builder UI basics

### Changed

- Use `Authorization Bearer` headers to authenticate requests with the API
- Include nunjucks through CDN
- Switch `env` files to take advantage of `pass`

## [0.5.0] - 2022-01-17

### Added

- New landing page
- New namespace page
- Ability to edit PEPs with the new project edit page
- Vector search for PEPs

### Changed

- Moved api endpoints to `/api/v1`

### Removed

- Removed `/view` endpoints

## [0.4.0] - 2022-11-09

### Added

- Sort PEP's by authentication state (private PEPs)
- New and improbed web validator (thanks Alip!)

### Changed

- Revamped `pepdbagent` with better stability and type safety

## [0.3.0] - 2022-09-07

### Added

- User authentication to submit PEPs
- More thorough out `/view` endpoints
- More PEPs 🎉
- Users can now specify a `?tag=` query parameter to fetch a PEP by its tag.

### Changed

- PEPhub is now backed by a postgres database
- Utilizes `pepgbagent` to interface with database

## [0.2.0] - 2022-06-16

### Added

- Better `/view` endpoints (switch from cards to tables)
- More namespace endpoints
- Sample view endpoints

### Fixed

- Poor output of `/pep-list`
- filters wrapped in `json`
- `pephub` version missing

## [0.1.0] - 2022-05-16

### Added

- Endpoints for converting stored PEPs using filters.
- dotfiles (`.pep.yaml`) are now standardized
- removed redundant `_project` representation from endpoints

### Fixed:

- project endpoints are no longer case-sensitive
- don't open demo links in new window
- better splash page styling
- no more pinned requirements file

## [0.0.1] - 2021-11-03

### Added

- Initial release
