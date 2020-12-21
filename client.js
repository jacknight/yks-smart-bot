(function connect() {
  let socket = io.connect(`https://discord-buzzer.herokuapp.com`);

  const modeP = document.querySelector("#mode");
  const modeButton = document.querySelector("button[name='mode']");
  const readyButton = document.querySelector("button[name='ready']");
  const readyP = document.querySelector("#ready");
  const servers = document.querySelector(".buzz-servers");
  const channels = document.querySelector(".buzz-channels");
  const serversSelect = document.querySelector("select[name='servers']");
  const channelsSelect = document.querySelector("select[name='channels']");
  const listChannelsButton = document.querySelector(
    "button[name='serverSelect']"
  );
  const listenChannelsButton = document.querySelector(
    "button[name='channelSelect']"
  );
  const buzzList = document.querySelector(".buzz-list ol");

  modeButton.addEventListener("click", toggleMode);
  readyButton.addEventListener("click", toggleReady);
  listChannelsButton.addEventListener("click", listChannels);
  listenChannelsButton.addEventListener("click", listenChannel);

  socket.on("buzz", (buzzerQueue) => {
    buzzList.innerHTML = "";
    buzzerQueue.forEach((author) => {
      const contestant = document.createElement("li");
      contestant.innerText = author.username + " #" + author.discriminator;
      buzzList.insertAdjacentElement("beforeend", contestant);
    });
  });

  socket.on("changeMode", ({ mode }) => {
    modeP.textContent = mode;
  });

  socket.on("changeReady", ({ ready }) => {
    readyP.textContent = ready ? "ready" : "not ready";
    modeButton.disabled = ready;
  });

  socket.on("initResponse", ({ mode, ready, channel, buzz }) => {
    modeP.textContent = mode;
    readyP.textContent = ready ? "ready" : "not ready";
    modeButton.disabled = ready;
    if (!channel) {
      channels.hidden = true;
      servers.hidden = true;
      servers.style.display = "none";
      channels.style.display = "none";

      // request list of servers and wait for the emit
      // FIXME: this eventually has to cross-reference the
      // authenticated user with servers the bot is actually
      // in, and return only those servers.
      requestServers();
    } else {
      servers.hidden = true;
      servers.style.display = "none";
      socket.emit("requestChannels", { id: channel.guild });
    }
  });

  socket.on("serversList", (serversList) => {
    serversList.forEach(({ guild, id }) => {
      // create an option
      const option = document.createElement("option");
      option.value = id;
      option.textContent = guild;
      serversSelect.appendChild(option);
    });
    servers.style.display = "grid";
    servers.hidden = false;
  });

  socket.on("channelsList", (channelList) => {
    channelsSelect.innerHTML = "";
    channelList.forEach(({ topic, id }) => {
      const option = document.createElement("option");
      option.value = id;
      option.textContent = topic;
      channelsSelect.appendChild(option);
    });
    channels.style.display = "grid";
    channels.hidden = false;
  });

  function initRequest() {
    socket.emit("initRequest");
  }

  function requestServers() {
    socket.emit("requestServers");
  }

  function toggleMode() {
    modeP.textContent = modeP.textContent === "normal" ? "chaos" : "normal";
    socket.emit("changeMode", { mode: modeP.textContent });
  }

  function toggleReady() {
    readyP.textContent = readyP.textContent === "ready" ? "not ready" : "ready";
    modeButton.disabled = readyP.textContent === "ready";
    socket.emit("changeReady", { ready: readyP.textContent });
  }

  function listChannels() {
    const id = serversSelect.value;
    servers.hidden = true;
    servers.style.display = "none";
    socket.emit("requestChannels", { id: id });
  }

  function listenChannel() {
    socket.emit("changeChannel", { id: channelsSelect.value });
  }

  initRequest();
})();
