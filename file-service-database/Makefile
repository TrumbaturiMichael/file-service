cnf ?= Makefile.env
include $(cnf)

all: build

build:
	docker build -f Dockerfile -t $(IMG_NAME):$(IMG_TAG) .