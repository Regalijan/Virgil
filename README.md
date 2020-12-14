# Virgil

## Self-Hosting Instructions

### Windows

1. Download the <a href="https://nodejs.org/en/download/current/">current release</a> of NodeJS.
2. Launch the installer, and check the box to install Chocolatey.
3. When Chocolatey finishes installing, open a PowerShell or Command Prompt window as administrator and run the following: `choco install visualstudio2019buildtools`
4. Navigate into the repo folder and install the node modules: `npm i`
5. To ensure the bot stays online, a process manager such as PM2 will be handy.
6. To enable music, install ffmpeg: `npm i -g ffmpeg-static`.
7. Run `node setup.js` and follow the prompts.
8. Start the bot: `npm start`

### Linux

This guide assumes you are using Ubuntu

1. Install the current release of NodeJS by <a href="https://github.com/nodejs/node/blob/master/BUILDING.md#building-nodejs-on-supported-platforms">building from source</a>, <a href="https://nodejs.org/en/download/package-manager/">adding the repo to your package manager</a>, or <a href="https://snapcraft.io/node">the snap store</a>.
2. Install the necessary build tools: `sudo apt install build-essential`
3. Clone the repo: `git clone https://github.com/Wolftallemo/Virgil`
4. Install the modules: `npm i`
5. Install ffmpeg with `sudo apt install ffmpeg`
6. Create the file `config.json` and add the necessary credentials, see `sample-config.json` for reference.
7. Create system user for the bot to run under: `sudo adduser --system --disabled-login --group virgil`
8. Add the newly made system user group to the folder (MAKE SURE YOU ARE IN THE PROJECT FOLDER): `sudo chown -R yourusername:virgil *`
9. Give the group write permissions to the files: `sudo chmod -R +w yourusername *`
10. Create a systemd service to ensure the bot stays online, a sample service is provided below:
   ```
   [Unit]
   Description=Virgil systemd service
   Documentation=https://github.com/Wolftallemo/Virgil/blob/main/README.md
   After=network.target
   
   [Service]
   Type=simple
   User=virgil
   ExecStart=/usr/bin/node /full/path/to/index.js
   Restart=on-failure
   
   [Install]
   WantedBy=multi-user.target
   ```
   If you installed node from the snap store, the path of the node executable is `/snap/bin/node`
   
11. Enable the service: `sudo systemctl start virgil`

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

## Common Errors
1. NPM install errors: Visual Studio Build Tools 2017 or later is required to build certain modules. You can download it <a href="https://download.visualstudio.microsoft.com/download/pr/9b3476ff-6d0a-4ff8-956d-270147f21cd4/ccfb9355f4f753315455542f966025f96de734292d3908c8c3717e9685b709f0/vs_BuildTools.exe">here</a>. On linux, `gcc` and `python3` must be installed (if you get a `distutils` error, install `python3-distutils`).
2. Mailgun authentication issues: Do not base64 encode your api key, this will be done automatically. Otherwise, ensure you typed it in correctly and you aren't using a sandbox domain.
3. Database connection issues: Did you enter the correct information, if so, make sure any firewall you may have set up isn't blocking connections.
