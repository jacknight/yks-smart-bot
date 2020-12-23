const {
  AkairoClient,
  CommandHandler,
  InhibitorHandler,
  ListenerHandler,
  MongooseProvider,
  ClientUtil,
} = require("discord-akairo");
const model = require("./db/model");
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");

class BuzzerClient extends AkairoClient {
  constructor() {
    super({ ownerID: "329288617564569602" }, { disableMentions: "everyone" });

    this.settings = new MongooseProvider(model);

    this.commandHandler = new CommandHandler(this, {
      directory: "./commands/",
      prefix: "!",
      defaultCooldown: 1000,
      allowMention: true,
      aliasReplacement: /-/g,
    });
    this.inhibitorHandler = new InhibitorHandler(this, {
      directory: "./inhibitors/",
    });
    this.listenerHandler = new ListenerHandler(this, {
      directory: "./listeners",
    });

    this.listenerHandler.setEmitters({
      commandHandler: this.commandHandler,
      inhibitorHandler: this.inhibitorHandler,
      listenerHandler: this.listenerHandler,
    });

    const app = express();
    app.set("view engine", "ejs");
    app.use(express.static(__dirname));
    app.get("/", (req, res) => {
      res.render("index");
    });

    this.server = app.listen(process.env.PORT || 3000, () => {
      console.log("Server running on port: " + process.env.PORT || 3000);
    });

    this.commandHandler.loadAll();
    this.commandHandler.useInhibitorHandler(this.inhibitorHandler);
    this.inhibitorHandler.loadAll();
    this.commandHandler.useListenerHandler(this.listenerHandler);
    this.listenerHandler.loadAll();
  }

  async login(token) {
    await this.settings.init();
    return super.login(token);
  }
}

mongoose
  .connect(
    `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PW}@cluster0.fnwjf.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    const util = require("util");
    const client = new BuzzerClient();
    client.login(process.env.AUTH_TOKEN);
    const io = require("socket.io")(client.server, {
      cors: {
        origin: "*",
      },
    });

    client.sockets = new Map();
    io.on("connection", (socket) => {
      socket.on("identifySocket", ({ guild }) => {
        if (!client.sockets.has(guild.id)) {
          client.sockets.set(guild.id, [socket]);
        } else {
          client.sockets.get(guild.id).push(socket);
        }
      });

      socket.on("unidentifySocket", ({ guild }) => {
        if (client.sockets.has(guild.id)) {
          const idx = client.sockets.get(guild.id).indexOf(socket);
          if (idx >= 0) {
            client.sockets.get(guild.id).splice(idx, 1);
          }
        }
      });

      socket.on("changeMode", ({ guild, mode }) => {
        client.settings.set(guild.id, "buzzerMode", mode);
        const guildObj = client.util.resolveGuild(
          guild.id,
          client.guilds.cache
        );
        if (guildObj) {
          let channel = JSON.parse(
            client.settings.get(
              guild.id,
              "buzzerChannel",
              JSON.stringify(guildObj.channels.cache.first())
            )
          );

          let channelObj = client.util.resolveChannel(
            channel.id,
            guildObj.channels.cache
          );

          if (mode === "chaos") {
            channelObj.send(`Buddy...you are now in **${mode} mode!!!**`);
          } else {
            channelObj.send(`You are now in **${mode} mode**`);
          }
        }
      });

      socket.on("changeReady", ({ guild, ready }) => {
        if (guild.id === "") return;

        client.settings.set(guild.id, "buzzerReady", ready);
        const guildObj = client.util.resolveGuild(
          guild.id,
          client.guilds.cache
        );
        if (guildObj) {
          const channel = JSON.parse(
            client.settings.get(
              guild.id,
              "buzzerChannel",
              JSON.stringify(guildObj.channels.cache.first())
            )
          );

          const channelObj = client.util.resolveChannel(
            channel.id,
            guildObj.channels.cache
          );

          channelObj.send(`Buzzer is **${ready ? "ready" : "not ready"}**`);
        }
      });

      socket.on("requestServers", () => {
        emitServers();
      });

      socket.on("requestChannels", ({ id }) => {
        emitChannels(id);
      });

      socket.on("changeChannel", ({ guild, id }) => {
        const guildObj = client.util.resolveGuild(
          guild.id,
          client.guilds.cache
        );
        const channelObj = client.util.resolveChannel(
          id,
          guildObj.channels.cache
        );
        client.settings.set(
          guildObj.id,
          "buzzerChannel",
          JSON.stringify(channelObj)
        );
        channelObj.send("Now listening on: " + channelObj.toString());
      });

      socket.on("clearQueue", ({ guild }) => {
        const guildObj = client.util.resolveGuild(
          guild.id,
          client.guilds.cache
        );
        if (guildObj) {
          client.settings.set(guildObj.id, "buzzerQueue", []);
          socket.emit("buzz", client.settings.get(guild.id, "buzzerQueue", []));
        }
      });

      socket.on("randomizeQueue", ({ guild }) => {
        util.shuffle(client.settings.get(guild.id, "buzzerQueue", []));
        socket.emit("buzz", client.settings.get(guild.id, "buzzerQueue", []));
      });

      socket.on("requestReady", ({ guild }) => {
        if (client.guilds.cache.has(guild.id)) {
          socket.emit("responseReady", {
            ready: client.settings.get(guild.id, "buzzerReady", false),
          });
        }
      });

      socket.on("requestMode", ({ guild }) => {
        if (client.guilds.cache.has(guild.id)) {
          socket.emit("responseMode", {
            mode: client.settings.get(guild.id, "buzzerMode", "normal"),
          });
        }
      });

      socket.on("requestQueue", ({ guild }) => {
        if (client.guilds.cache.has(guild.id)) {
          socket.emit("buzz", client.settings.get(guild.id, "buzzerQueue", []));
        }
      });
    });

    function emitServers() {
      const servers = client.guilds.cache;
      let ids = [];
      servers.forEach((guild, id) => {
        ids.push({ name: guild.name, id: id });
      });
      io.sockets.emit("serversList", ids);
    }

    function emitChannels(id) {
      const channels = client.guilds.resolve(id).channels.cache;
      const ids = [];
      channels.forEach((item) => {
        if (item.type === "voice") return;
        if (item.type === "category") return;
        if (item.type === "text") {
          ids.push({ guild: id, topic: item.name, id: item.id });
        }
      });
      io.sockets.emit("channelsList", ids);
    }
  })
  .catch((err) => console.log(err));
