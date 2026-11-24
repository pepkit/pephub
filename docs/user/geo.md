
# Accessing GEO data through PEPhub

The Gene Expression Omnibus is a major source or biological sample data and metadata. However, accessing the metadata from GEO is challenging. Now, PEPhub provides an API-oriented access to processed tabular metadata from GEO.



## Finding GEO data on PEPhub

Lots of options to find GEO metadata on PEPhub:

1. You can browse or search GEO repositories from the [GEO namespace](https://pephub.databio.org/geo), 
2. You can use the main PEPhub search interface.
3. You can also just use the URL directly, of the form: `https://pephub.databio.org/geo/{gse_accession}` (with `gse` lowercase). For example: <https://pephub.databio.org/geo/gse211892>

## Always up-to-date

PEPhub has a weekly update that keeps the PEPhub's GEO namespace in sync. So, you can be sure you're getting the latest metadata from PEPhub. You can think of PEPhub as a convenient mirror to GEO metadata. We are using [geofetch](/geofetch/) to download any updated files, which processes the data into a more compact PEP sample table, which we then store in PEPhub.

## Download all processed data from GEO

If you want to do a metadata analysis project that uses *all* the metadata from GEO, we also provide a tar archive. Just find the *Download* link on the [GEO namespace page](https://pephub.databio.org/geo). This will provide processed PEPs of all GEO projects. 

If you are looking for the *raw* GEO metadata (not already processed into a PEP), then PEPhub can't really help; we process the data into PEP and discard the raw files, which are large. For most use cases, the processed PEP is a more convenient form. If you really need the raw SOFT files, there are two options:

 - Use links to the files that are stored in the project sample table to download the data directly.
 - Use geofetch yourself on a local machine to download these files. Example: `geofetch -i GSE95654 --processed`, where `--processed` indicates that you want to download processed data, not SRA. More information about PEP can be found on the  [geofetch](/geofetch/).
