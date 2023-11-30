const { app, BrowserWindow } = require("electron");
const mineflayer = require("mineflayer");
const path = require("node:path");
const Nicks = require("./electron/nicks");

const nickname = Nicks.PlayerNick;
const username = Nicks.BotNick;

// electron
let mainWindow;
const createWindows = () => {
  mainWindow = new BrowserWindow({
    width: 1080,
    height: 720,
    icon: path.join(__dirname, "build", "favicon.icon"),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, "electron", "preload.js"),
    },
  });

  mainWindow.loadFile(path.join(__dirname, "build", "index.html"));
};

app.whenReady().then(() => {
  createWindows();
});

// Create client
const client = mineflayer.createBot({
  host: "play.coralmc.it",
  username: username,
});

// Join/Quit Manager
let playersData = [];
function manageJoin(current) {
  const isGameJoin = current % 2 === 1 ? true : false;

  if (isGameJoin) {
    playersData = [];

    const players = Object.keys(client.players).filter(
      (player) => player !== username
    );

    players.forEach(async (player) => {
      fetch(`https://api.coralmc.it/api/user/${player}`)
        .then(async (data) => {
          let jsonData = await data.json();
          if (!jsonData.bedwars)
            return playersData.push({
              bedwars: {
                name: player,
                level: 0,
                kills: 0,
                deaths: 0,
                final_kills: 0,
                final_deaths: 0,
                wins: 0,
                played: 0,
                winstreak: 0,
                h_winstreak: 0,
              },
            });

          playersData.push(jsonData);
        })
        .catch(() => {
          return playersData.push({
            bedwars: {
              name: player,
              level: 0,
              kills: 0,
              deaths: 0,
              final_kills: 0,
              final_deaths: 0,
              wins: 0,
              played: 0,
              winstreak: 0,
              h_winstreak: 0,
            },
          });
        });
    });
    const interval = setInterval(() => {
      if (playersData.length === players.length) {
        clearInterval(interval);
        mainWindow.webContents.send("send_players", playersData);
      }
    }, 500);
  }
}

client.on("message", (message) => {
  const json = message.json;

  if (!json.extra || !json.extra[1] || !json.extra[1].text) return;

  if (
    json.extra[1].text.includes("uscito (") ||
    (json.extra[1].text.includes("entrato (") &&
      json.extra[1].color === "yellow")
  ) {
    const player = json.extra[0].text;
    if (player === username) return;

    if (json.extra[1].text.includes("entrato (")) {
      if (player === nickname) return;

      fetch(`https://api.coralmc.it/api/user/${player}`)
        .then(async (data) => {
          let jsonData = await data.json();

          if (!jsonData.bedwars) {
            playersData.push({
              bedwars: {
                name: player,
                level: 0,
                kills: 0,
                deaths: 0,
                final_kills: 0,
                final_deaths: 0,
                wins: 0,
                played: 0,
                winstreak: 0,
                h_winstreak: 0,
              },
            });
          } else {
            playersData.push(jsonData);
          }
        })
        .catch(() => {
          playersData.push({
            bedwars: {
              name: player,
              level: 0,
              kills: 0,
              deaths: 0,
              final_kills: 0,
              final_deaths: 0,
              wins: 0,
              played: 0,
              winstreak: 0,
              h_winstreak: 0,
            },
          });
        });
    }

    if (json.extra[1].text.includes("uscito (")) {
      if (player === nickname) {
        client.chat("/leave");
      } else {
        playersData.forEach((playerData) => {
          const playerName = playerData.bedwars.name;
          if (playerName !== player) return;

          playersData.splice(playersData.indexOf(playerData), 1);
          mainWindow.webContents.send("send_players", playersData);
        });
      }
    }

    mainWindow.webContents.send("send_players", playersData);
  } else if (
    json.extra[0].text.includes("La partita inizia tra ") &&
    json.extra[0].color === "yellow"
  ) {
    const coutdown = parseInt(json.extra[1].text);

    if (!isNaN(coutdown) && coutdown < 5) {
      client.chat(`/leave`);
    }
  }
});

// Spawn Manager
let time = 0;
client.on("spawn", () => {
  if (time === 0) {
    client.chat("/l checkStats");
    console.log(`Logged as ${username}`);
  } else if (time === 1) {
    client.setQuickBarSlot(4);
    client.activateItem();
  } else if (time > 2) {
    manageJoin(time);
  }

  time++;
});

// Window Manager
client.on("windowOpen", (window) => {
  const getBed = window.slots
    .filter((slot) => slot)
    .filter((slot) => slot.name === "red_bed")[0];
  if (getBed) client.clickWindow(getBed.slot, 1, 0);
});

// Manage bot commands
client.on("message", (jsonMessage) => {
  const messageJson = jsonMessage.json;

  if (!messageJson.extra || !messageJson.extra[1]) return;

  if (messageJson.extra[1] && messageJson.extra[1].text === nickname) {
    const message = messageJson.extra.pop();
    if (message.text === "-join") client.chat(`/p join ${nickname}`);
    if (message.text === "-joinme") {
      client.chat(`/join ${nickname}`);
    }
    if (
      message.text === "-left" ||
      message.text === "-leave" ||
      message.text === "-quit"
    )
      client.chat(`/l`);
  }
});
