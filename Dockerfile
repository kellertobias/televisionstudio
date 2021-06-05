ARG UBUNTU_VERSION="16.04"

FROM ubuntu:${UBUNTU_VERSION}

RUN apt-get update && \
	apt-get install -y --no-install-recommends \
	ca-certificates curl wget sudo psmisc \
	git gcc cmake g++ libtool patch make unzip zip \
	python3 python python-pip python3-setuptools python-setuptools \
	build-essential libssl-dev libffi-dev python-dev python3-dev netcat-openbsd jq build-essential \
	&& apt-get clean;

# This script will install the Meteor binary installer (called the launchpad) in /usr/local and consequently requires to be root.
# Then, when we will run the "meteor" command later on for the first time, it will call the launchpad that will copy the Meteor binaries in ~/.meteor.
# This way every user can run Meteor under the user space.
RUN curl https://install.meteor.com/?release=1.10.1 | sh

RUN useradd -ms /bin/bash ubuntu && mkdir -p /home/ubuntu; groupadd docker && usermod -a -G sudo ubuntu && usermod -a -G docker ubuntu
RUN echo "ubuntu ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers; echo "#!/bin/bash" > /init.sh && echo "sudo chown root:docker /var/run/docker.sock" >> /init.sh && echo "sudo chmod ug+rwx /var/run/docker.sock" >> /init.sh && echo 'exec "$@"' >> /init.sh && chmod a+x /init.sh && echo "echo 'Deprecated'" > /start.sh && chmod a+x /start.sh

USER ubuntu
RUN meteor --version

USER root
ADD app /source
RUN mkdir /bundle -p && chown -R ubuntu /bundle && mkdir -p /source && chown -R ubuntu /source

USER ubuntu
ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8
RUN cd /source && meteor npm ci --save-dev && TOOL_NODE_FLAGS="--max-old-space-size=4096" METEOR_PROFILE=100 meteor build --directory /bundle --architecture os.linux.x86_64

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

COPY --from=0 /bundle/bundle/programs/server/package.json /app/programs/server/package.json

RUN cd /app/programs/server/ && \
	npm i --production

COPY --from=0 /bundle/bundle /app/

EXPOSE 8080
WORKDIR /app

RUN mkdir -p /var/logs

ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8
ENV NODE_TLS_REJECT_UNAUTHORIZED='0'


RUN echo "#!/bin/bash" > /init.sh && \
	echo "echo \"Starting Init Script\"" >> /init.sh && \
	echo "cd /app" >> /init.sh && \
	echo "node main.js" >> /init.sh && \
	chmod a+x /init.sh && \
	cat /init.sh

ENTRYPOINT ["/init.sh"]
