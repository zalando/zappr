FROM node:5.7

RUN adduser --disabled-login --disabled-password --gecos "" node
ENV HOME /home/node

WORKDIR $HOME

COPY package.json $HOME

RUN npm install --production && \
    npm install pg

COPY dist/ $HOME/dist
COPY config.yml $HOME/config.yml
COPY migrations/ $HOME/migrations

RUN chown -R node:node ${HOME} && chmod 0770 ${HOME}

COPY scm-source.json /scm-source.json

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

USER node
ENTRYPOINT ["npm"]
CMD ["start"]
