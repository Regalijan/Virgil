FROM node:22-bookworm
RUN curl -s https://packagecloud.io/install/repositories/ookla/speedtest-cli/script.deb.sh | bash
RUN apt-get install -y speedtest
RUN groupadd -g 999 nodeuser && useradd -m -r -u 999 -g nodeuser nodeuser
WORKDIR /home/nodeuser/virgil
USER nodeuser
COPY --chown=999  . .
RUN npm install
RUN chown -R nodeuser:nodeuser .
RUN npx tsc
RUN npm prune
RUN node dist/deploy.js
CMD ["node", "dist"]
