# Changelog

This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) and [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format.

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
