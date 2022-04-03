FROM node:bullseye-slim
RUN apt-get update
RUN apt-get install -y curl gcc g++ make python3.10
RUN curl -s https://install.speedtest.net/app/cli/install.deb.sh | bash
RUN apt-get install -y speedtest
RUN groupadd -g 999 nodeuser && useradd -m -r -u 999 -g nodeuser nodeuser
WORKDIR /home/nodeuser/virgil
COPY . .
RUN rm -rf mongo node_modules
RUN npm install
RUN node ./ffmpeg.js
RUN chown -R nodeuser:nodeuser .
USER nodeuser
RUN npx tsc
ENV NODE_ENV=production
RUN npm prune
RUN node dist/deploy.js
CMD ["node", "dist"]
