FROM node:20-bullseye
RUN curl -s https://packagecloud.io/install/repositories/ookla/speedtest-cli/script.deb.sh | bash
RUN apt-get install -y speedtest
RUN groupadd -g 999 nodeuser && useradd -m -r -u 999 -g nodeuser nodeuser
WORKDIR /home/nodeuser/virgil
COPY . .
RUN npm install
RUN node ./ffmpeg.js
RUN chown -R nodeuser:nodeuser .
USER nodeuser
RUN npx tsc
ENV NODE_ENV=production
RUN npm prune
RUN node dist/deploy.js
CMD ["node", "dist"]
