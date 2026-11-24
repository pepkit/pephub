### Creating an archive of specified namespaces

Developers can create an archive of specified namespaces by following these steps:

#### 1. Set environment variables for the database connection.

!!! note "Template of the environment file"
    
    ```bash
    POSTGRES_HOST=localhost:5432
    POSTGRES_DB=pep-db
    POSTGRES_USER=docker
    POSTGRES_PASSWORD=password
    
    AWS_ACCESS_KEY_ID=key_id
    AWS_SECRET_ACCESS_KEY=secret_key
    AWS_ENDPOINT_URL=https://s3.us-west-002.backblazeb2.com/
    ```

Env file can be found here: https://github.com/pepkit/geopephub/blob/main/environment/dev.env

#### 2. Install `geopephub` package:

```bash
pip install geopephub
```

#### 3. Use geopephub help:
```bash
geopephub auto-download --help
```

??? note "help"

    ```text
    ╭─ Commands ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╮
    │ auto-download  Automatically download projects from geo namespace, tar them and upload to s3. Don't forget to set up AWS credentials                                                                                             │
    │ bedbase-stats  Download projects from the bedbase namespace and save them to the database                                                                                                                                        │
    │ check-by-date  Check if all projects were uploaded successfully in specified period and upload them if not. Additionally, you can download projects from huge period of time. e.g. if you want to download projects from         │
    │ check-by-date  Check if all projects were uploaded successfully in specified period and upload them if not. Additionally, you can download projects from huge period of time. e.g. if you want to download projects from         │
    │                2020/02/25 to 2021/05/27, you should set start_period=2020/02/25, and end_period=2021/05/27                                                                                                                       │
    │ clean-history  Clean history of the pephub                                                                                                                                                                                       │
    │ download       Download projects from the particular namespace. You can filter projects, order them, and download only part of them.                                                                                             │
    │ run-checker    Check if all projects were uploaded successfully in specified period and upload them if not. To check if all projects were uploaded successfully 3 periods ago, where one period is 1 day, and cycles are         │
    │                happening every day, you should set cycle_count=3, and period_length=1. (geopephub run_checker --cycle-count 3 --period-length 1)                                                                                 │
    │ run-queuer     Queue GEO projects that were uploaded or updated in the last period                                                                                                                                               │
    │ run-uploader   Upload projects that were queued, but not uploaded yet.                                                                                                                                                           │
    ╰──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
    
    ```

To automatically download projects from the namespace, and register them in the database, use the following command 
we will use `auto-download` command. It will download all PEPs to the chosen directory, and then tar them if needed,
and upload to the s3 bucket.

```bash
geopephub auto-download --help
```

??? note "help"
    
    ```text
    ╭─ Options ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╮
    │    --namespace                        TEXT  Namespace of the projects that have to be downloaded. Default: geo [default: geo]                                                                                                    │
    │ *  --destination                      TEXT  Output directory or s3 bucket. By default set current directory [default: None] [required]                                                                                           │
    │    --compress       --no-compress           zip downloaded projects, default: True [default: compress]                                                                                                                           │
    │    --tar-all        --no-tar-all            tar all the downloaded projects into a single file [default: tar-all]                                                                                                                │
    │    --upload-s3      --no-upload-s3          upload tar file to s3 bucket [default: upload-s3]                                                                                                                                    │
    │    --bucket                           TEXT  S3 bucket name [default: pephub]                                                                                                                                                     │
    │    --help                                   Show this message and exit.                                                                                                                                                          │
    ╰──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
    ```

`--tar-all` and `upload-s3` is defaulted to True, so if you want to download and tar all projects, and upload to the s3 bucket,
you can skip these options.

#### 4. Run the command with the desired options.

!!! note "example"
    ``` 
    geopephub auto-download --namespace geo --destination /path/to/directory
    ```

!!! warning "Warning"

    To keep everything up to date and avoid issues, the developer should set the destination to the same location every time this command is run.
    To archive a namespace without uploading to S3 and without saving the tar history to the pephub table, please use the `geopephub download` command.