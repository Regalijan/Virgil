FROM node:24-trixie
RUN curl -s https://packagecloud.io/install/repositories/ookla/speedtest-cli/script.deb.sh | bash
RUN apt-get install -y speedtest
RUN groupadd -g 999 nodeuser && useradd -m -r -u 999 -g nodeuser nodeuser
USER nodeuser
RUN mkdir ~/virgil
WORKDIR /home/nodeuser/virgil
COPY --chown=999 . .
RUN npm install
RUN npx tsc
RUN npm prune
RUN node dist/deploy.js
CMD ["node", "dist"]

