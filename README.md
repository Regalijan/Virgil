# Virgil V2

[Were you looking for the user manual?](MANUAL.md)

## Self-hosting (production)

1. Install [Docker Compose](https://docs.docker.com/compose/install/)
2. Create a `.env` file with the variables in the table at the bottom
3. Clone repo: `git clone https://github.com/Regalijan/Virgil`
4. Checkout to the `tests-passed` branch: `git checkout tests-passed`
5. Run `docker-compose up -d` to start the bot.

## Self-hosting (development)

Use WSL on Windows<br>
Node 17.5.0 or later is required

1. Install [Node.js](https://nodejs.org/en/download/current)
2. Install [MongoDB](https://www.mongodb.com/try/download/community)
3. Install [Redis](https://redis.io/download)
4. Install [Python](https://www.python.org) - you may want to use your package manage on linux
5. Linux: Install `gcc` `g++` `make` | Windows: Install [Visual Studio Build Tools](https://aka.ms/vs/17/release/vs_BuildTools.exe)
6. Create a `.env` file with the variables in the table at the bottom
7. Compile: `npx tsc`
8. Deploy the slash commands: `node dist/deploy.js`
9. Start the mongo and redis servers if they are not already running
10. Start the bot: `node dist`

## Environment Variables

```
DISCORDTOKEN: The bot token
DSN?: Your Sentry dsn
INSTALL_FFMPEG?: Set to any value to install FFmpeg.
MFA_API?: Base URL of MFA bridge service.
MFA_API_TOKEN?: API token of MFA bridge service.
MFA_CLIENT_ID?: Discord client id of MFA service OAuth2 app.
MFA_CLIENT_SECRET?: Discord client secret of MFA service OAuth2 app.
MFA_VERIFY_SITE?: User-facing URL of MFA verification site.
MONGOURL?: Mongo connection string, only needed if using external mongo instance or development copy outside of docker.
REDIS?: Redis connection string, only needed if using external redis instance or development copy outside of docker.
REGISTRY_API_KEY?: Virgil Registry API key, can be obtained at https://registry.virgil.gg/developers
SKIPDEPLOY?: Set this to anything to skip deploying slash commands when starting container.
```

- "?" denotes an optional variable
