FROM node:carbon

WORKDIR /usr/src/workdir

COPY . .
RUN mv ./docker-utils/* .
RUN chmod +x "./run.sh"
RUN npm install 
RUN npm install express body-parser
RUN npm install -g ganache-cli@beta
RUN npm install -g truffle
RUN npm install forever -g

EXPOSE 8000 3000
ENTRYPOINT [ "./run.sh" ]