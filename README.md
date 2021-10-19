# Virgil V2

## Self-hosting (production)
1. Install [Docker Compose](https://docs.docker.com/compose/install/)
2. Create a `.env` file with the variables in the table at the bottom
3. Clone repo: `git clone https://github.com/Wolftallemo/Virgil`
4. Checkout to the `rewrite` branch: `git checkout rewrite`
5. Run `docker-compose up -d` to start the bot.

## Self-hosting (development)
1. Install [Node.js](https://nodejs.org/en/download/current)
2. Install [MongoDB](https://www.mongodb.com/try/download/community)
3. Install [Redis](https://redis.io/download) - on Windows you will be better off using WSL
4. Install [Python](https://www.python.org) - you may want to use your package manage on linux
5. Linux: Install `gcc` `g++` `make` | Windows: Install [Visual Studio Build Tools](https://visualstudio.microsoft.com/thank-you-downloading-visual-studio/?sku=BuildTools&rel=16)
6. Create a `.env` file with the variables in the table at the bottom
7. Compile: `npx tsc`
8. Deploy the slash commands: `node dist/deploy.js`
9. Start the mongo and redis servers if they are not already running
10. Start the bot: `node dist`

## Environment Variables
```
DISCORDTOKEN: The bot token
DSN: Your sentry dsn
MONGOURL?: Mongo connection string, only needed if using external mongo instance or development copy outside of docker.
REDIS?: Redis connection string, only needed if using external redis instance or development copy outside of docker.
SKIPDEPLOY?: Set this to anything to skip deploying slash commands when starting container.
```
- "?" denotes an optional variable