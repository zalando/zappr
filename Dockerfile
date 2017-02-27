FROM registry.opensource.zalan.do/stups/node:6.9-cd35

ENV ZAPPR_HOME /opt/zappr
ENV ZAPPR_CONFIG $ZAPPR_HOME/config

RUN mkdir -p $ZAPPR_HOME

WORKDIR $ZAPPR_HOME

COPY package.json $ZAPPR_HOME

RUN npm install --production && \
    npm install pg source-map

COPY dist/ $ZAPPR_HOME/dist
COPY config/config.yaml $ZAPPR_CONFIG/config.yaml
COPY migrations/ $ZAPPR_HOME/migrations
COPY scm-source.json /scm-source.json

ENV NODE_ENV production
ENV APP_PORT 3000

EXPOSE 3000

ENTRYPOINT ["npm"]
CMD ["start"]
