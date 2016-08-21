FROM registry.opensource.zalan.do/stups/node:5.10-9

ENV ZAPPR_HOME /opt/zappr

RUN mkdir -p $ZAPPR_HOME

WORKDIR $ZAPPR_HOME

COPY package.json $ZAPPR_HOME

RUN npm install --production && \
    npm install pg source-map

COPY dist/ $ZAPPR_HOME/dist
COPY config $ZAPPR_HOME/config
COPY migrations/ $ZAPPR_HOME/migrations
COPY scm-source.json /scm-source.json

ENV NODE_ENV production
ENV APP_PORT 3000

EXPOSE 3000

ENTRYPOINT ["npm"]
CMD ["start"]
