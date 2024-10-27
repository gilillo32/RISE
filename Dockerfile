FROM node:20-alpine

WORKDIR /app

COPY package.json /app

RUN npm install

COPY . .

EXPOSE 80

EXPOSE 443

CMD ["node", "server.js"]