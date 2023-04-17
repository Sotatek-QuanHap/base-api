FROM node:lts-alpine as builder

WORKDIR /usr/src/app
COPY . .
RUN yarn install && yarn build

EXPOSE 4156
USER node
CMD [ "yarn", "start:dev" ]
