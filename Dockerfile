FROM node:5.2-slim

RUN adduser --disabled-login --disabled-password --gecos "" node
ENV HOME /home/node

WORKDIR $HOME

COPY package.json $HOME

RUN npm install --production

COPY dist/ $HOME/dist

RUN chown -R node:node ${HOME} && chmod 0770 ${HOME}

USER node
ENTRYPOINT ["npm"]
CMD ["start"]
