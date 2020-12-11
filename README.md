# Virgil

## Self-Hosting Instructions

### Windows

1. Download the <a href="https://nodejs.org/en/download/current/">current release</a> of NodeJS.
2. Launch the installer, and check the box to install Chocolatey.
3. When Chocolatey finishes installing, open a PowerShell or Command Prompt window as administrator and run the following: `choco install visualstudio2019buildtools`
4. Navigate into the repo folder and install the node modules: `npm i`
5. To ensure the bot stays online, a process manager such as PM2 will be handy.
6. Create the file `config.json` and add the necessary credentials, see `sample-config.json` for reference.
7. Start the bot: `npm start`

### Linux

1. Install the current release of NodeJS by <a href="https://github.com/nodejs/node/blob/master/BUILDING.md#building-nodejs-on-supported-platforms">building from source</a>, <a href="https://nodejs.org/en/download/package-manager/">adding the repo to your package manager</a>, or <a href="https://snapcraft.io/node">the snap store</a>.
2. Install the necessary build tools: `sudo apt install build-essential`
3. Clone the repo: `git clone https://github.com/Wolftallemo/Virgil`
4. Install the modules: `npm i`
5. Create the file `config.json` and add the necessary credentials, see `sample-config.json` for reference.
6. Create system user for the bot to run under: `sudo adduser --system --disabled-login --group virgil`
7. Add the newly made system user group to the folder (MAKE SURE YOU ARE IN THE PROJECT FOLDER): `sudo chown -R yourusername:virgil *`
8. Give the group write permissions to the files: `sudo chmod -R +w yourusername *`
9. Create a systemd service to ensure the bot stays online, a sample service is provided below:
   ```
   [Unit]
   Description=Virgil systemd service
   Documentation=https://github.com/Wolftallemo/Virgil/blob/main/README.md
   After=network.target
   
   [Service]
   Type=simple
   User=virgil
   ExecStart=/usr/bin/node /full/path/to/index.js
   Restart=always
   
   [Install]
   WantedBy=multi-user.target
   ```
   If you installed node from the snap store, the path of the node executable is `/snap/bin/node`
   
10. Enable the service: `sudo systemctl start virgil`

If the bot is not online, check the logs with `sudo journalctl -eu virgil`

## Config Options
```
"token": The bot token needed to log in to discord.
"prefix": Please tell me this is obvious.
"gameModeratorUsers": Array of user IDs which can execute game mod commands (roles array takes precedence).
"bucket": Ban files are uploaded to this bucket.
"serviceKeyPath": Full path of service key for google cloud.
"banFilesPath": Full path to directory where outputted json files are uploaded.
"appealsManagerRole": Array of roles that are allowed to execute the appeals commands.
"databaseAddress": Hostname/IP address of database.
"databaseUser": Username of connecting user.
"databasePassword": Password of database user (socketed connections currently not supported).
"databaseName": Name of database to connect to.
```
