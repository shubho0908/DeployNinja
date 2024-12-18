FROM ubuntu:focal

RUN apt-get update

RUN apt-get install -y curl

RUN curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -

RUN apt-get upgrade -y

RUN apt-get install -y nodejs

RUN apt-get install -y git

WORKDIR /home/app

COPY main.sh main.sh
COPY server.js server.js
COPY .env .env
COPY package*.json .
COPY ca.pem ca.pem

RUN npm install

RUN chmod +x main.sh
RUN chmod +x server.js

# Set the entry point
ENTRYPOINT [ "/home/app/main.sh" ]
