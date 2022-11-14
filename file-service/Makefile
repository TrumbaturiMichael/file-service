cnf ?= Makefile.env
include $(cnf)

all: build run-db run

debug: build-debug run-db run-debug

build:
	docker build -f Dockerfile -t $(IMG_NAME):$(IMG_TAG) .	

build-debug: 
	docker build -f Dockerfile.debug -t $(IMG_NAME).debug:$(IMG_TAG) .	

run:
	docker run -d -p $(APP_PORT):3000 --name $(APP_NAME) $(IMG_NAME):$(IMG_TAG)

run-debug:
	docker run -d -p $(APP_PORT):3000 -v"$(CURDIR)/.app:/app" --name $(APP_NAME) $(IMG_NAME).debug:$(IMG_TAG)

attach-net:
	docker network connect $(net) $(APP_NAME) 

run-db:
	docker run -d --env-file "$(CURDIR)/.app/.config/.env" -v"$(DB_NAME)-lib:/var/lib/mysql" -v"$(DB_NAME)-log:/var/log/mysql" -p 3306:3306 -p 33060:33060 --name $(DB_NAME) mysql:latest