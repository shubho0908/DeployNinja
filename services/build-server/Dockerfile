FROM ubuntu:focal

RUN apt-get update

RUN apt-get install -y curl

RUN curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -

RUN apt-get upgrade -y

RUN apt-get install -y nodejs

RUN apt-get install -y git

WORKDIR /home/app

COPY main.sh main.sh
COPY script.ts script.ts
COPY package*.json .

RUN npm install

RUN chmod +x main.sh
RUN chmod +x script.ts

# Set the entry point
ENTRYPOINT [ "/home/app/main.sh" ]
