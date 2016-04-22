FROM registry.opensource.zalan.do/stups/node:5.10-23

ENV ZAPPR_HOME /opt/zappr

RUN mkdir -p $ZAPPR_HOME
ARG APP_CONFIG=opensource

WORKDIR $ZAPPR_HOME

COPY package.json $ZAPPR_HOME

RUN npm install --production && \
    npm install pg source-map

COPY dist/ $ZAPPR_HOME/dist
COPY config $ZAPPR_HOME/config
COPY migrations/ $ZAPPR_HOME/migrations
COPY scm-source.json /scm-source.json

RUN mv config/app-${APP_CONFIG}.yaml config/app.yaml

ENV DB_DRIVER postgres
ENV DB_NAME postgres
ENV DB_USER postgres
ENV DB_PORT 5432
ENV DB_SCHEMA zappr

ENV MORGAN_FORMAT short
ENV MORGAN_THRESH 299

ENV NODE_ENV production
ENV APP_PORT 3000

EXPOSE 3000

ENTRYPOINT ["npm"]
CMD ["start"]
