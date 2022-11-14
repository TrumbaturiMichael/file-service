FROM node:18.7.0

WORKDIR /app

COPY .app/package*.json ./

RUN mkdir .config
RUN mkdir .appData

RUN npm ci --only=production

COPY .app/ .

EXPOSE 3000

CMD [ "node", "index.js" ]