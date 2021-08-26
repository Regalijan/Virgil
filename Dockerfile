FROM node
WORKDIR /opt/virgil
COPY . /opt/virgil/
RUN npm install
RUN npx tsc
ENV NODE_ENV=production
RUN npm prune
CMD ["node", "dist"]