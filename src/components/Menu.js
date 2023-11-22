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
        <h1 style={{ color: "#fff" }}>Stats Player:</h1>
        {!playersStats || playersStats.length === 0 ? (
          <h1
            style={{
              color: "#fff",
              fontStyle: "italic",
              fontSize: "16px",
            }}
          >
            Nessun player trovato
          </h1>
        ) : (
          playersStats.map((player) => (
            <StatsCard
              key={player.name}
              name={player.name}
              level={player.level}
              kills={player.kills}
              wins={player.wins}
              deaths={player.deaths}
              winstreak={player.winstreak}
            />
          ))
        )}
      </div>
    </>
  );
}

export default Menu;
