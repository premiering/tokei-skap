# 🪁 tokei-skap
A statistics bot for skap.io, which sits in game and collects data about areas which have been reached. It provides a public API for fetching this data.

## Using the public API
The public tokei-skap API lives on https://tokei.nightly.pw.

### Fetching timely leaderboards
Timely leaderboards are leaderboards that are sorted by the fastest to reach a certain area. The time starts when you enter the first area of a level, and ends when you reach the target area.
#### Request format
`https://tokei.nightly.pw/api/leaderboard/timely`

Your request should contain an `area` as a search param. Options are `Exodus 50 VICTORY`, `Exodus 100 VICTORY`, `Exodus 150 VICTORY`, `Space Advanced 20 VICTORY`, `Infernus 25`, `Inferno 25`, and `Nightmare 20`.

You can also optionally add a limit to the results by adding a `limit` search param. It can at most be 250 and is by default 35.

Example: to fetch the leaderboards for `Exodus 50 VICTORY` with the limit 50, your URL would be `https://tokei.nightly.pw/api/leaderboard/timely?area=Exodus 50 VICTORY&limit=50`.
#### Response format
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

Each placement object contains the player's name, the UTC date time reached (YYYY/mm/dd HH:mm:ss), and the area reached.

### Fetching completion leaderboards
Completion leaderboards are leaderboards that are ranked by the highest area achieved for a level. If this area achieved is the same (for example, Infernus 25), then it is ranked by who reached it at an earlier date/time.
#### Request format
`https://tokei.nightly.pw/api/leaderboard/completion`

Your request should contain an `area` as a search param. Options are `Exodus`, `Space Advanced`, `Infernus`, `Inferno`, `Nightmare`, `Glacier Advanced`, and `April Fools`

You can also optionally add a limit to the results by adding a `limit` search param. It can at most be 250 and is by default 35.

Example: to fetch the leaderboards for `Exodus` with a limit of 50, your URL would be `https://tokei.nightly.pw/api/leaderboard/completion?area=Exodus&limit=50`.
#### Response format
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

Each placement object contains the player's name, the UTC date time reached (YYYY/mm/dd HH:mm:ss), and the area reached.

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
tokei-skap is limited in configuring. The most important things to change here are changing ports, and enabling/configuring SSL.

An example `config.env` (should be placed in the root project folder):
```dosini
# config.env
PORT=80
SSLPORT=443
DEBUGMODE=TRUE
SKAPURL=ws://skap.io
# How often in milliseconds should we ask the server what the player count is?
PLAYERCOUNTINTERVALMS=5000
SECONDARYOVERWORLDBOT=true
SSL=TRUE
PRIVATEKEY="/etc/coolcertificate/privkey.pem"
CERTIFICATE="/etc/coolcertificate/fullchain.pem"
ALLOWINVALIDSKAPSSL=true
```

## License
tokei-skap is licensed under the MIT license.