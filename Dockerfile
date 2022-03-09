FROM node
RUN groupadd -g 999 nodeuser && useradd -m -r -u 999 -g nodeuser nodeuser
WORKDIR /home/nodeuser/virgil
COPY . .
RUN rm -rf mongo node_modules
RUN chown -R nodeuser:nodeuser .
RUN if [ "$INSTALL_FFMPEG" = "1" ]; then \
      DEBIAN_FRONTEND=noninteractive apt install -y ffmpeg \
    fi
USER nodeuser
RUN npm install
RUN npx tsc
ENV NODE_ENV=production
RUN npm prune
RUN node dist/deploy.js
USER root
RUN node /home/nodeuser/virgil/dist/install_ffmpeg.js
USER nodeuser
CMD ["node", "dist"]
