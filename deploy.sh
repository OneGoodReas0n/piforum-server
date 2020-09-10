echo Write a version 
read VERSION

docker build -t r345on/piforum:$VERSION .
docker push r345on/piforum:$VERSION

ssh root@138.68.99.242 "docker pull r345on/piforum:$VERSION && docker tag r345on/piforum:$VERSION dokku/api:$VERSION && dokku deploy api $VERSION"



