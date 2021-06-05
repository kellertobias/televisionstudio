# Use the specific version of Node expected by your Meteor release, per https://docs.meteor.com/changelog.html; this is expected for Meteor 1.10.1
FROM node:12.16.1-buster

# Runtime dependencies; if your dependencies need compilation (native modules such as bcrypt) or you are using Meteor <1.8.1, use app-with-native-dependencies.dockerfile instead
RUN apt update && apt install -y python3-pip libpython3-dev libffi-dev ca-certificates python make g++ jq bash

RUN apt-get update && \
	apt-get install -y \
	wget build-essential ca-certificates \
	openssl libssl-dev yasm \
	&& \
	rm -rf /var/lib/apt/lists/*

COPY package.json /app/package.json

RUN cd /app/ && npm i --production

COPY . /app/

RUN cd /app/ && ls -lach
RUN cd /app/ && node fonts.js

EXPOSE 8080
WORKDIR /app

RUN mkdir -p /var/logs

ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8
ENV NODE_TLS_REJECT_UNAUTHORIZED='0'


RUN echo "#!/bin/bash" > /init.sh && \
	echo "echo \"Starting Init Script\"" >> /init.sh && \
	echo "cd /app" >> /init.sh && \
	echo "node server.js" >> /init.sh && \
	chmod a+x /init.sh && \
	cat /init.sh

ENTRYPOINT ["/init.sh"]
