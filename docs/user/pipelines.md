# Using your PEPs in a pipeline
*Learn how you can seamlessly integrate your PEPs into your workflows.*

PEPs are a powerful tool for managing your workflows and pipelines. By using PEPhub, you can easily share your PEPs with collaborators and integrate them into your workflows. This guide will walk you through how to use your PEPs in a basic pipeline.

## Using a PEP in a pipeline
Lets use `python` to grab out project samples, and iterate over them, running a simple command on each sample. We will use the `requests` library to interact with the PEPhub API. Imagine we have a PEP with the sample table below:

| sample_name | file_path | genome |
|-------------|-----------|--------|
| sample1     | /path/to/sample1.bam | hg38 |
| sample2     | /path/to/sample2.bam | hg19 |
| sample3     | /path/to/sample3.bam | mm10 |


```python
import subprocess
import requests

# Get the PEP from PEPhub
pep_url = "https://pephub-api.databio.org/api/v1/projects/{github username}/{pep name}/samples?tag=default"
pep = requests.get(pep_url).json()

# Iterate over the samples in the PEP
for sample in pep['items']:
    genome = sample['genome']
    file_path = sample['file_path']

    subprocess.run(f"gatk BaseRecalibrator -I {file_path} -R /path/to/{genome}.fa")
```

This is a simple example, but you can see how you can use the PEP to manage your samples and easily integrate them into your workflows. You can use the PEPhub API to get the PEP and then iterate over the samples to run your commands.

