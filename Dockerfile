FROM node:bullseye
RUN curl https://install.speedtest.net/app/cli/ookla-speedtest-1.1.1-linux-$(uname -i).tgz > speedtest.tgz
RUN tar xzf speedtest.tgz
RUN rm speedtest.tgz
RUN rm speedtest.5
RUN mv ./speedtest /usr/bin/
RUN chmod +x /usr/bin/speedtest
RUN groupadd -g 999 nodeuser && useradd -m -r -u 999 -g nodeuser nodeuser
WORKDIR /home/nodeuser/virgil
COPY . .
RUN npm install
RUN node ./ffmpeg.js
RUN chown -R nodeuser:nodeuser .
USER nodeuser
RUN npx tsc
RUN cp -r ./interaction_data ./dist/
ENV NODE_ENV=production
RUN npm prune
RUN node dist/deploy.js
CMD ["node", "dist"]
