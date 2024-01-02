# pephub scripts

These are useful scripts for pephub. They provide utilities to manage the interface between PEPs, a PEP database, and PEPhub. Read below about each script.

### `load_db.py`

This will help you load a database of PEPs from a directory of PEPs. Note, that a namespace is **required** for each PEP. This is the name of the folder that the PEP is in. For example, if you have a PEP in `peps/ChangLab/PEP_1`, then the namespace is `ChangLab`. If you have a PEP in `peps/demo/basic`, then the namespace is `demo`. The namespace is used to identify the PEP in the database.

**Usage:**

```console
python load_db.py \
--username $POSTGRES_USERNAME \
--password $POSTGRES_PASSWORD \
--database $POSTGRES_DB
/path/to/peps
```

Default values for the postgres PEP database are:

- Username: postgres
- Password: docker
- database: pep-base-sql
- hostname: localhost
- port: 5432

The `/path/to/peps` should be pointing to a folder structure somewhere on the machine that has a structure like so:

```console
peps
├── ChangLab
│   ├── PEP_1
│   │   ├── 180113_mergeTable.csv
│   │   ├── README.md
│   │   ├── TCGA_AllSamples_FinalBamList_annotation.csv
│   │   ├── TCGA_AllSamples_FinalBamList_config.yaml
│   │   └── pbcopy
│   └── PEP_2
│       ├── 180113_mergeTable.csv
│       ├── README.md
│       ├── TCGA_AllSamples_FinalBamList_annotation.csv
│       └── TCGA_AllSamples_FinalBamList_config.yaml
├── demo
│   ├── basic
│   │   ├── project_config.yaml
│   │   └── sample_table.csv
│   ├── remove
│   │   ├── project_config.yaml
│   │   └── sample_table.csv
│   ├── subtable1
│   │   ├── project_config.yaml
│   │   ├── sample_table.csv
│   │   └── subsample_table.csv
├── geo
│   ├── GSE100494
│   │   ├── GSE100494_samples.csv
│   │   └── GSE100494_samples.yaml
│   ├── GSE100750
│   │   ├── GSE100750_samples.csv
│   │   └── GSE100750_samples.yaml
│   ├── GSE101426
│   │   ├── GSE101426_samples.csv
│   │   └── GSE101426_samples.yaml
│   ├── GSE101512
│   │   ├── GSE101512_samples.csv
│   │   └── GSE101512_samples.yaml
│   ├── GSE101516
│   │   ├── GSE101516_samples.csv
│   │   └── GSE101516_samples.yaml
```
