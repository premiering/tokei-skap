> [!WARNING]  
> The public API has been shutdown. See [archive/README.md](https://github.com/premiering/tokei-skap/blob/archive) for more info.
> Some stats from the archived data:
> Unique players: 2476
> Timely leaderboards playtime (high scores only): 196 days, 44 hours, 46 seconds

# tokei-skap
Bot that joins the skap.io game and collects data, then provides an API on the data

## Using the public API
The public tokei-skap API lives on https://tokei.nightly.pw.

### Fetching timely leaderboards
Timely leaderboards are sorted by the fastest to reach the area. Time is started when you entering the first area of a level, and ends when reaching the target area.
#### Request URL
`https://tokei.nightly.pw/api/leaderboard/timely`

#### Required search param: `area` 

Options are `Exodus 50 VICTORY`, `Exodus 100 VICTORY`, `Exodus 150 VICTORY`, `Space Advanced 20 VICTORY`, `Infernus 25`, `Inferno 25`, and `Nightmare 20`.

#### Optional search param: `limit` 

It can at most be 250 and is by default 35.

i.e. to fetch the `Exodus 50 VICTORY` leaderboard with limit 50, URL would be `https://tokei.nightly.pw/api/leaderboard/timely?area=Exodus 50 VICTORY&limit=50`.
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

Date reached is encoded in (YYYY/mm/dd HH:mm:ss).

### Fetching completion leaderboards
Completion leaderboards are ranked by the highest area achieved for a level. If multiple playerse reach the max possible area, it's ranked by who reached it first.
#### Request URL
`https://tokei.nightly.pw/api/leaderboard/completion`

#### Required search param: `area` 

Options are `Exodus`, `Space Advanced`, `Infernus`, `Inferno`, `Nightmare`, `Glacier Advanced`, and `April Fools`

#### Optional search param: `limit` 

It can at most be 250 and is by default 35.

i.e. fetching leaderboards for `Exodus` with limit 50 would give URL `https://tokei.nightly.pw/api/leaderboard/completion?area=Exodus&limit=50`.
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

Date reached is encoded in (YYYY/mm/dd HH:mm:ss).

### Fetching live player count
Just hit the URL `https://tokei.nightly.pw/api/playerCount`, and you will get a response looking like the one below.

```json
{
  "playerCount": 113
}
```

## Running tokei-skap
tokei-skap requires Node and npm
```shell
git clone https://github.com/premiering/tokei-skap.git
cd tokei-skap
npm i
```
Then start it normally
```shell
npm start
```
Or if you're like me use pm2 to manage Node processes
```shell
pm2 start npm -- start
```
No extra setup! Note that tokei-skap uses sqlite so the .db file will be relative to your working directory.

## Configuring tokei-skap
Most important things to change here is the port, and SSL configuration.

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