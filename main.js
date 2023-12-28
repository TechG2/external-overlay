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
async function manageJoin() {
  // Check if it's a game join event
  console.log("sended data");
  playersData = [];

  // Get the list of players
  const players = Object.keys(client.players);

  try {
    // Fetch player
    const fetchPromises = players.map(async (player) => {
      const response = await fetch(`https://api.coralmc.it/api/user/${player}`);
      const jsonData = await response.json();

      // Check for bedwars data
      return jsonData.bedwars
        ? jsonData
        : {
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
          };
    });

    // Wait for all fetch request
    const results = (await Promise.all(fetchPromises)).filter(
      (result) => result
    );

    // Update playersData
    playersData = [...playersData, ...results];
  } catch (error) {
    // Handle errors
    console.error("Parallel request error:", error);
  }

  // Send the aggregated playersData to the main window
  mainWindow.webContents.send("send_players", playersData);
}

client.on("message", async (message) => {
  const json = message.json;

  // Check for valid JSON properties
  if (!json.extra || !json.extra[1] || !json.extra[1].text) return;

  // Check for player entry or exit events
  if (
    json.extra[1].text.includes("uscito (") ||
    (json.extra[1].text.includes("entrato (") &&
      json.extra[1].color === "yellow")
  ) {
    const player = json.extra[0].text;

    // Ignore the current user
    if (player === username) return;

    // Handle player entry event
    if (json.extra[1].text.includes("entrato (")) {
      // Ignore entries of the bot itself
      if (player === nickname) return;

      try {
        // Fetch player data from the API
        const response = await fetch(
          `https://api.coralmc.it/api/user/${player}`
        );
        const jsonData = await response.json();

        // Check if bedwars data is available, else create default
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
      } catch (error) {
        // Log and handle errors during fetch
        console.error(`Error fetching data for ${player}: ${error.message}`);
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
      }
    }

    // Handle player exit event
    if (json.extra[1].text.includes("uscito (")) {
      // If the bot left, perform /leave command
      if (player !== nickname) {
        // Find and remove the player from the playersData array
        const playerIndex = playersData.findIndex(
          (playerData) => playerData.bedwars.name === player
        );
        if (playerIndex !== -1) {
          playersData.splice(playerIndex, 1);
          mainWindow.webContents.send("send_players", playersData);
        }
      }
    }

    // Send data
    mainWindow.webContents.send("send_players", playersData);
  }
});

// Spawn Manager
let time = 0;
client.on("spawn", () => {
  if (time === 0) {
    client.chat("/l checkStats");
    console.log(`Logged as ${username}`);
  }
  time++;
});

// Player send and exit manager
client.on("message", async (message) => {
  const json = message.json;

  if (
    json.extra &&
    json.extra[0].text === username &&
    json.extra[1].text.includes("entrato")
  ) {
    setTimeout(async () => {
      await manageJoin(time);
    }, 250);
  } else if (
    json.extra &&
    json.extra[0].text === nickname &&
    json.extra[1].text.includes("uscito")
  ) {
    console.log("uscito");
    client.chat(`/l`);
    mainWindow.webContents.send("send_players", []);
  } else if (
    json.extra &&
    json.extra[0].text.includes("La partita inizia tra ") &&
    json.extra[0].color === "yellow"
  ) {
    const coutdown = parseInt(json.extra[1].text);

    if (!isNaN(coutdown) && coutdown < 5) {
      client.chat(`/leave`);
      mainWindow.webContents.send("send_players", []);
    }
  }
});

// Manage bot commands
client.on("message", (message) => {
  const messageJson = message.json;

  if (!messageJson.extra || !messageJson.extra[1]) return;

  if (messageJson.extra[1] && messageJson.extra[1].text === nickname) {
    const message = messageJson.extra.pop();
    if (message.text === "-join") client.chat(`/p join ${nickname}`);
    if (message.text === "-joinme") {
      client.chat(`/join ${nickname}`);
    }
    if (
      message.text === "-left" ||
      message.text === "-l" ||
      message.text === "-leave" ||
      message.text === "-quit"
    ) {
      client.chat(`/l`);
      mainWindow.webContents.send("send_players", []);
    }
  }
});
