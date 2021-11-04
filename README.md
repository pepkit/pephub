# pephub
[TODO]

## How to `serve`

### Building container

In the same directory as the `Dockerfile`:

```
docker build -t pephub .
```

### Running container for development:

You can run it directly after installing with `pip install`, like this:

```
pephub serve -p 5000
```

Better, though, is to use the container. Mount the source code directory:

```
docker run --rm -p 80:80 \   
-v $(pwd)/pephub:/app/pephub \
pephub pephub serve  
```