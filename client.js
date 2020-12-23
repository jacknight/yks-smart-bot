const socket = io.connect("https://discord-buzzer.herokuapp.com");
(function connect() {
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

  socket.on("responseReady", ({ ready }) => {
    readyP.textContent = ready ? "ready" : "not ready";
    modeButton.disabled = ready;
    readyButton.disabled = false;
  });

  socket.on("responseMode", ({ mode }) => {
    modeP.textContent = mode;
  });

  socket.on("changeMode", ({ mode }) => {
    modeP.textContent = mode;
  });

  socket.on("changeReady", ({ ready }) => {
    readyP.textContent = ready ? "ready" : "not ready";
    modeButton.disabled = ready;
  });

  socket.on("serversList", (serversList) => {
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

randomButton.addEventListener("click", randomizeQueue);
clearButton.addEventListener("click", clearQueue);
modeButton.addEventListener("click", toggleMode);
readyButton.addEventListener("click", toggleReady);
listenButton.addEventListener("click", listenChannel);
serversSelect.addEventListener("focus", serverSave);
serversSelect.addEventListener("change", serverChange);
serversSelect.addEventListener("focus", serverSave);

let prevServer = "";
function serverSave() {
  prevServer = serversSelect.value;
}

function serverChange() {
  channelsSelect.innerHTML = "";
  if (serverChannelsMap.has(serversSelect.value)) {
    unidentifySocket();
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
  modeP.textContent = modeP.textContent === "normal" ? "chaos" : "normal";
  socket.emit("changeMode", {
    mode: modeP.textContent,
    guild: {
      id: serversSelect.value,
    },
  });
}

function toggleReady() {
  if (serversSelect.value === "") return;
  readyP.textContent = readyP.textContent === "ready" ? "not ready" : "ready";
  modeButton.disabled = readyP.textContent === "ready";
  socket.emit("changeReady", {
    ready: readyP.textContent === "ready" ? true : false,
    guild: {
      id: serversSelect.value,
    },
  });
}

function listChannels() {
  const id = serversSelect.value;
  socket.emit("requestChannels", { id: id });
}

function listenChannel() {
  socket.emit("changeChannel", {
    guild: { id: serversSelect.value },
    id: channelsSelect.value,
  });
}

function clearQueue() {
  socket.emit("clearQueue", { guild: { id: serversSelect.value } });
}

function randomizeQueue() {
  socket.emit("randomizeQueue", { guild: { id: serversSelect.value } });
}

function unidentifySocket() {
  socket.emit("unidentifySocket", { guild: { id: prevServer } });
}

function identifySocket() {
  socket.emit("identifySocket", { guild: { id: serversSelect.value } });
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
