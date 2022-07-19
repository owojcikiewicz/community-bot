FROM node:15.5.0-alpine3.10

RUN mkdir -p /app/src/

COPY package.json . 

RUN apk add --no-cache make gcc g++ python && \
  npm install && \
  npm rebuild bcrypt --build-from-source && \
  apk del make gcc g++ python

COPY . . 

EXPOSE 3000 4000

RUN npm run build

CMD ["npm run", "production"]