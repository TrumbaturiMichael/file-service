all: file-srv-db file-srv file-srv-networks

debug: file-srv-db file-srv-debug file-srv-networks

file-srv:
	-$(MAKE) -C file-service	

file-srv-db:
	-$(MAKE) -C file-service-database

file-srv-debug:
	-$(MAKE) -C file-service debug

file-srv-networks:
	-docker network create file-service-net 
	-docker network connect file-service-net file-service
	-docker network connect file-service-net file-service-db

phpmyadmin:
	-docker run --name phpmyadmin -d -e PMA_ARBITRARY=1 -p 8080:8000 phpmyadmin
	-docker network connect file-service-net phpmyadmin