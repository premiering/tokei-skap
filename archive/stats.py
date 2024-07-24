# Calculates some stats from archived the stats.db file

import sqlite3
con = sqlite3.connect("stats.db")
cursor = con.cursor()

# Query the names of all the tables
table_query = cursor.execute("""SELECT name FROM sqlite_master WHERE type='table';""")
tables = table_query.fetchall()
tables = [ele for ele in tables if ele[0] != "SecondaryOverworldRooms"]

# Collect stats from the tables
player_names = set()
play_time_ms = 0
unique_runs = 0

def ms_to_formatted(ms):
    m, s = divmod(int(ms / 1000), 60)
    h, m = divmod(m, 60)
    return f'{h:d} days, {m:02d} hours, {s:02d} seconds'

for table_tuple in tables:
    table = table_tuple[0]
    # Add player names to set and count unique runs
    player_query = cursor.execute("SELECT PlayerName FROM " + table).fetchall()
    for player in player_query:
        unique_runs += 1
        player_names.add(player[0])

    # Add play time to the sum
    if table.endswith("Timely"):
        total_run_time = cursor.execute("SELECT Sum(RunTime) AS TotalRunTime FROM " + table + ";").fetchall()
        print(table + " play time: " + ms_to_formatted(total_run_time[0][0]))
        play_time_ms += total_run_time[0][0]

print("Unique players: " + str(len(player_names)))

print(f'Timely leaderboards playtime (high scores only): ' + ms_to_formatted(play_time_ms))