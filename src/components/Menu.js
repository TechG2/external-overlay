import React, { useEffect, useState } from "react";
import "./Menu.css";
import StatsCard from "./StatsCard";

function Menu() {
  const [playersStats, setPlayersStats] = useState([]);

  useEffect(() => {
    const { ipcRenderer, Notification } = window.require("electron");

    const handlePlayersUpdate = (e, players) => {
      const updatedPlayersStats = players.map((player) => player.bedwars);
      setPlayersStats(updatedPlayersStats);
      playersStats.sort(function (a, b) {
        return b.level - a.level;
      });

      const notification = new Notification({
        title: "Nuove stats",
        body: "L'applicazione ha segnalato nuove stats",
      });
      notification.show();
    };

    ipcRenderer.on("send_players", handlePlayersUpdate);

    return () => {
      ipcRenderer.removeListener("send_players", handlePlayersUpdate);
    };
  }, []);

  return (
    <>
      <div className="statsContainer">
        <h1 style={{ color: "#fff", textAlign: "center" }}>Stats Player:</h1>
        {!playersStats || playersStats.length === 0 ? (
          <h1
            style={{
              color: "#fff",
              fontStyle: "italic",
              fontSize: "16px",
              textAlign: "center",
            }}
          >
            Nessun player trovato
          </h1>
        ) : (
          <div className="lowerStats">
            <StatsCard
              name="Player: "
              level="Level: "
              kd="K/D: "
              fkd="FK/D: "
              wins="Wins: "
              games="Games: "
              ws="WS: "
              maxws="Max WS: "
              type="0"
            />

            {playersStats.map((player) => (
              <StatsCard
                key={player.name}
                name={player.name}
                level={player.level}
                kd={
                  Math.round(
                    (player.kills / player.deaths + Number.EPSILON) * 100
                  ) / 100
                }
                fkd={
                  Math.round(
                    (player.final_kills / player.final_deaths +
                      Number.EPSILON) *
                      100
                  ) / 100
                }
                wins={player.wins}
                games={player.played}
                ws={player.winstreak}
                maxws={player.h_winstreak}
                type="1"
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default Menu;
