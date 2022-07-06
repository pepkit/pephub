-- PostgreSQL port of the MySQL "pep-db" database.
--
-- authors: ["Oleksandr Khoroshevskyi"]

SET client_encoding = 'LATIN1';


CREATE TABLE projects (
    id BIGSERIAL NOT NULL PRIMARY KEY,
    namespace TEXT NOT NULL,
    name TEXT NOT NULL,
    digest TEXT NOT NULL,  -- shoud be changed to CHARACTER
    project_value json NOT NULL,
    anno_info json  -- annotation information
);

