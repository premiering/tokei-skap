# 🪁 tokei-skap
The bot that's always watching... A statistics bot for skap.io, which sits in game and collects data about areas which have been reached. It provides a public API for fetching this data.

## Using the public API
The public tokei-skap API lives on https://tokei.nightly.pw.

It has two endpoints that you are most interested in.
### Fetching leaderboards
#### Request format
`https://tokei.nightly.pw/api/leaderboard`

Your request to this endpoint should contain a search parameter of the `area` you want to request. Options are `Exodus`, `Space Advanced`, `Infernus`, `Inferno`, `Nightmare`, `Glacier Advanced`, and `April Fools`

To fetch the leaderboards for `Exodus`, your URL would be `https://tokei.nightly.pw/api/leaderboard?area=Exodus`.
#### Response format
Responded is a JSON object containing the name of the requested area, and an array of placements of players on the leaderboards.

Each placement object contains the player's name, the UTC date time reached (YYYY/mm/dd HH:mm:ss), and the area reached.

*Note: the placements are sorted first by the players reaching the highest area, then sorted by the earliest to reach that level.*

An example response:
```json
{
  "areaName": "Exodus",
  "placements": [
    {
      "playerName": "coolguy1234",
      "dateReached": "2024-05-12 12:00:00",
      "areaReached": "Exodus 100 VICTORY"
    },
  ]
}
```

### Fetching live player count
#### Request format
`https://tokei.nightly.pw/api/playerCount`
#### Response format
Returned is a JSON object with the field `playerCount` containing the number of players at the current moment, not including the bot itself.

An example response:
```json
{
  "playerCount": 113
}
```

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
# config.env
PORT=3000
DEBUGMODE=TRUE
SKAPURL=ws://skap.io
# How often in milliseconds should we ask the server what the player count is?
PLAYERCOUNTINTERVALMS=5000
```

## License
tokei-skap is licensed under the MIT license.