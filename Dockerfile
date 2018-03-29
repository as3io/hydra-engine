FROM node:8

WORKDIR /app
COPY . /app

EXPOSE 2112

ENV NODE_ENV production
ENTRYPOINT ["node", "src/index.js"]
