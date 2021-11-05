docker run --rm -p 5000:80 \
--name pephubservercon \
-e MODULE_NAME="pephub.main" \
-v $(pwd)/pephub:/app/pephub \
pephubserver /start-reload.sh