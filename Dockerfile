FROM node:5.2-slim

RUN adduser --disabled-login --disabled-password --gecos "" node
ENV HOME /home/node

WORKDIR $HOME

COPY package.json $HOME

RUN npm install --production

COPY dist/ $HOME/dist

RUN chown -R node:node ${HOME} && chmod 0770 ${HOME}

COPY scm-source.json /scm-source.json

ENV LOG_FORMAT short
ENV NODE_ENV production
ENV APP_PORT 3000

EXPOSE 3000

USER node
ENTRYPOINT ["npm"]
CMD ["start"]
