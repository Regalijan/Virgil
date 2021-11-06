FROM node:16
RUN groupadd -g 999 nodeuser && useradd --create-home -r -u 999 -g nodeuser nodeuser
WORKDIR /home/nodeuser/virgil
RUN chown -R nodeuser:nodeuser .
USER nodeuser
COPY . /home/nodeuser/virgil/
RUN rm -rf mongo
RUN npm install
RUN npx tsc
ENV NODE_ENV=production
RUN npm prune
RUN node dist/deploy.js
CMD ["node", "dist"]
