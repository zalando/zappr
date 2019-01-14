FROM registry.opensource.zalan.do/stups/node:6.9-cd35

RUN apt-get update && apt-get dist-upgrade -y

ENV ZAPPR_HOME /opt/zappr
ENV ZAPPR_CONFIG $ZAPPR_HOME/config/config.yaml

RUN mkdir -p $ZAPPR_HOME

WORKDIR $ZAPPR_HOME

COPY package.json $ZAPPR_HOME
RUN npm -v
RUN npm install --production
RUN npm install pg@4.5.6 source-map-support

COPY dist/ $ZAPPR_HOME/dist
COPY config/config.yaml $ZAPPR_CONFIG
COPY migrations/ $ZAPPR_HOME/migrations

ENV NODE_ENV production
ENV APP_PORT 3000

EXPOSE 3000

CMD ["npm", "start"]
