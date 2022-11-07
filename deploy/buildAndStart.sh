docker build . -t test/files-service:1.0.0

docker run -d -p 3000:3000 test/files-service:1.0.0