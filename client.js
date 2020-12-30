const socket = io.connect("https://discord-buzzer.herokuapp.com");

(function connect() {
  socket.on("commandUnauthorized", ({ command }) => {
    if (command === "changeReady") {
      alert("You don't have permission to toggle the buzzer.");
    } else if (command === "changeMode") {
      alert("You don't have permission to toggle the mode.");
    } else if (command === "changeChannel") {
      alert("You don't have permission to change the buzzer channel.");
    } else if (command === "randomizeQueue") {
      alert("You don't have permission to randomize the list.");
    } else if (command === "clearQueue") {
      alert("You don't have permission to clear the list.");
    }
  });

  socket.on("sessionId", (sessionId) => {
    localStorage.setItem("sessionId", sessionId);
  });

  socket.on("sessionExpired", () => {
    logout();
    document.querySelector(".login-link").style.display = " block";
  });

  socket.on("servers", (response) => {
    if (response.message && response.message === "401: Unauthorized") {
      return logout();
    }

    requestServers();
    populateServersSelect(response);
    document.querySelector(".control-panel").style.display = "grid";
    document.querySelector(".logout-link").style.display = "block";
  });

  socket.on("links", ({ bot, login, logout }) => {
    document.querySelector(".login-link").href = login;
    document.querySelector(".bot-link").href = bot;
    document.querySelector(".logout-link").href = logout;
  });
  socket.on("buzz", (buzzerQueue) => {
    buzzList.innerHTML = "";
    if (buzzerQueue.length === 0) return;

    randomButton.disabled = false;
    clearButton.disabled = false;

    buzzerQueue.forEach((item) => {
      const author = JSON.parse(item);
      const contestant = document.createElement("li");
      contestant.innerHTML = `${author.username}<span style="opacity:0.5">#${author.discriminator}</div>`;
      buzzList.insertAdjacentElement("beforeend", contestant);
    });
  });

  socket.on("responseReady", ({ ready, clear }) => {
    readyP.textContent = ready ? "ready" : "not ready";
    modeButton.disabled = ready;
    readyButton.disabled = false;
    if (ready && clear) {
      clearQueue();
    }
  });

  socket.on("responseMode", ({ mode }) => {
    modeP.textContent = mode;
  });

  socket.on("serversList", (serversList) => {
    const options = Array.from(document.querySelectorAll("#servers option"));
    options.forEach((option) => {
      if (option.value == "") return;
      if (
        !serversList.some((server) => {
          return option.value === server.id;
        })
      ) {
        option.remove();
      }
    });
    serversList.forEach((server) => {
      socket.emit("requestChannels", { id: server.id });
    });
  });

  socket.on("channelsList", (channelList) => {
    channelList.forEach((channel) => {
      if (!serverChannelsMap.has(channel.guild)) {
        serverChannelsMap.set(channel.guild, [channel]);
      } else {
        serverChannelsMap.get(channel.guild).push(channel);
      }
    });
  });
})();

// Each bot server maps to an array of channels.
let serverChannelsMap = new Map();

const modeP = document.querySelector("#mode");
const modeButton = document.querySelector("button[name='mode']");
const readyButton = document.querySelector("button[name='ready']");
const clearButton = document.querySelector("button[name='clear']");
const randomButton = document.querySelector("button[name='random']");
const readyP = document.querySelector("#ready");
const servers = document.querySelector(".buzz-servers");
const channels = document.querySelector(".buzz-channels");
const serversSelect = document.querySelector("select[name='servers']");
const channelsSelect = document.querySelector("select[name='channels']");
const listenButton = document.querySelector("button[name='channelSelect']");
const buzzList = document.querySelector(".buzz-list ol");
const logoutLink = document.querySelector(".logout-link");

randomButton.addEventListener("click", randomizeQueue);
clearButton.addEventListener("click", clearQueue);
modeButton.addEventListener("click", toggleMode);
readyButton.addEventListener("click", toggleReady);
listenButton.addEventListener("click", listenChannel);
serversSelect.addEventListener("change", serverChange);
logoutLink.addEventListener("click", logout);

function logout() {
  const sessionId = localStorage.getItem("sessionId");
  if (sessionId) {
    localStorage.removeItem("sessionId");
    socket.emit("logout", { sessionId: sessionId });
  }
  window.location.href = document.querySelector(".logout-link").href;
}

function serverChange() {
  channelsSelect.innerHTML = "";
  if (serverChannelsMap.has(serversSelect.value)) {
    unidentifySocket();
    localStorage.setItem("server", serversSelect.value);
    identifySocket();
    requestMode();
    requestReady();
    requestQueue();
    listenButton.disabled = false;
    serverChannelsMap.get(serversSelect.value).forEach((channel) => {
      const option = document.createElement("option");
      option.value = channel.id;
      option.textContent = channel.topic;
      channelsSelect.appendChild(option);
    });
  } else {
    listenButton.disabled = true;
    modeButton.disabled = true;
    readyButton.disabled = true;
    readyP.innerText = "-";
    modeP.innerText = "-";
  }
}

function requestServers() {
  socket.emit("requestServers");
}

function toggleMode() {
  if (serversSelect.value === "") return;
  socket.emit("changeMode", {
    mode: modeP.textContent === "chaos" ? "normal" : "chaos",
    guild: {
      id: serversSelect.value,
    },
    sessionId: localStorage.getItem("sessionId"),
  });
}

function toggleReady() {
  if (serversSelect.value === "") return;
  const newReady = readyP.textContent === "ready" ? false : true;
  socket.emit("changeReady", {
    ready: newReady,
    guild: {
      id: serversSelect.value,
    },
    sessionId: localStorage.getItem("sessionId"),
  });
}

function clearQueue() {
  socket.emit("clearQueue", {
    guild: { id: serversSelect.value },
    sessionId: localStorage.getItem("sessionId"),
  });
}

function randomizeQueue() {
  socket.emit("randomizeQueue", {
    guild: { id: serversSelect.value },
    sessionId: localStorage.getItem("sessionId"),
  });
}

function listenChannel() {
  socket.emit("changeChannel", {
    guild: { id: serversSelect.value },
    id: channelsSelect.value,
    sessionId: localStorage.getItem("sessionId"),
  });
}

function listChannels() {
  const id = serversSelect.value;
  socket.emit("requestChannels", { id: id });
}

function unidentifySocket() {
  socket.emit("unidentifySocket", {
    guild: { id: localStorage.getItem("server") },
  });
}

function identifySocket() {
  socket.emit("identifySocket", {
    guild: { id: localStorage.getItem("server") },
  });
}

function requestMode() {
  socket.emit("requestMode", { guild: { id: serversSelect.value } });
}

function requestReady() {
  socket.emit("requestReady", { guild: { id: serversSelect.value } });
}

function requestQueue() {
  socket.emit("requestQueue", { guild: { id: serversSelect.value } });
}

function login(code) {
  socket.emit("login", { code: code });
}

function authorize(sessionId) {
  socket.emit("authorize", { sessionId: sessionId });
}

function populateServersSelect(response) {
  response.forEach(({ name, id }) => {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = name;
    serversSelect.appendChild(option);
  });
}
