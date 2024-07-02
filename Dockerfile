FROM registry.opensource.zalan.do/library/node-18-alpine:latest

ENV ZAPPR_HOME /opt/zappr
ENV ZAPPR_CONFIG $ZAPPR_HOME/config/config.yaml

RUN mkdir -p $ZAPPR_HOME

WORKDIR $ZAPPR_HOME

COPY package.json $ZAPPR_HOME
RUN apk update && apk upgrade
RUN npm -v
RUN npm install --production --legacy-peer-deps
RUN npm install pg@4.5.6 source-map-support --legacy-peer-deps

COPY dist/ $ZAPPR_HOME/dist
COPY config/config.yaml $ZAPPR_CONFIG
COPY migrations/ $ZAPPR_HOME/migrations

ENV NODE_ENV production
ENV APP_PORT 3000

EXPOSE 3000

CMD ["npm", "start"]
