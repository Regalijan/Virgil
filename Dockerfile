FROM node
RUN groupadd -g 999 nodeuser && useradd -m -r -u 999 -g nodeuser nodeuser
WORKDIR /home/nodeuser/virgil
COPY . .
RUN rm -rf mongo node_modules
RUN chown -R nodeuser:nodeuser .
USER nodeuser
RUN npm install
RUN npx tsc
ENV NODE_ENV=production
RUN npm prune
RUN node dist/deploy.js
RUN node dist/install_ffmpeg.js
CMD ["node", "dist"]
