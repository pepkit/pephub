#!/bin/bash
docker run --rm \
  --name pephubserver-tests \
  -v $(pwd)/pephub:/app/pephub \
  -v $(pwd)/tests:/app/tests \
pephubserver-tests