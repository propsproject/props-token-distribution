FROM node:carbon

WORKDIR /usr/src/workdir

COPY . .

RUN chmod +x "./docker-utils/run.sh"
RUN npm install 
RUN npm install express body-parser
RUN npm install -g ganache-cli
RUN npm install -g truffle

EXPOSE 8000 3000
ENTRYPOINT [ "./docker-utils/run.sh" ]