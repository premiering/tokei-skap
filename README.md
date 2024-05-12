# 🪁 tokei-skap
The bot that's always watching... A statistics bot for skap.io, which sits in game and collects data about areas which have been reached. It provides a public API for fetching this data.

## Running tokei-skap
tokei-skap requires an installation of npm and Node.js
```shell
git clone https://github.com/premiering/tokei-skap.git
cd tokei-skap
npm i
```
And then if you're using pm2 to manage Node processes
```shell
pm2 start npm -- start
```
Or if you just want to start it normally
```shell
npm start
```
That simple! Upon start, tokei-skap will setup the database (using sqlite3) and start the bot.

## Configuring tokei-skap
tokei-skap is limited in configuring, but you change simple things like the power, debug mode, etc.
```dosini
# .env
PORT=3000
DEBUGMODE=TRUE
SKAPURL=ws://skap.io
# How often in milliseconds should we ask the server what the player count is?
PLAYERCOUNTINTERVALMS=5000
```

## License
tokei-skap is licensed under the MIT license.