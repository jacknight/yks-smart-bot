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
const { emit } = require("./db/model");
const { default: fetch } = require("node-fetch");
const SessionModel = require("./db/sessions");

class BuzzerClient extends AkairoClient {
  constructor() {
    super({ ownerID: "329288617564569602" }, { disableMentions: "everyone" });

    this.settings = new MongooseProvider(model);

    // Rate limit certain commands per guild in memory.
    // I don't think it's necessary to do this with the
    // database, it's not that crucial.
    // Key: guild.id
    // Value: Set<command>
    this.globalRates = new Map();

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
    const client = new BuzzerClient();
    client.login(process.env.AUTH_TOKEN);
    const io = require("socket.io")(client.server, {
      cors: {
        origin: "*",
      },
    });

    // Need this here before we reference other "client.on" items.
    // According to documentation, this is important.
    client.on("ready", () => {});

    // New member greeting.
    client.on("guildMemberAdd", (member) => {
      try {
        if (member.id === "141822351321989120") {
          // gorb
          member.guild.systemChannel.send("gorb");
        } else if (member.id === "251217007045902348") {
          // tay
          member.guild.systemChannel.send("Tay is back!");
        } else if (member.id === client.ownerID) {
          member.guild.systemChannel.send(
            "My master! My master has returned! I kept telling them you would!"
          );
        } else {
          member.guild.systemChannel.send(
            `Welcome, ${member}! You don't have to be insane to post here, but it helps.`
          );
        }
      } catch (err) {
        console.log(err);
      }
    });

    // We need a collection of sockets that we emit to
    // when the guild they are viewing on the control panel
    // updates in any way. The map is:
    // key: guild ID
    // value: [socket1, socket2, ..., socketN]
    client.sockets = new Map();

    // When someone connects to the web control panel,
    // we monitor the connection for emit events and
    // potentially respond to them with our own emit.
    io.on("connection", (socket) => {
      // Provide the web control panel with the right
      // href values to authorize the bot, login, logout.
      // This is mainly just to make dev/prod switching
      // easier for me.
      socket.emit("links", {
        bot: process.env.DISCORD_BOT_LINK,
        login: process.env.DISCORD_LOGIN_LINK,
        logout: process.env.DISCORD_LOGOUT_LINK,
      });

      // The user already had a session ID stored in their
      // browser so they'll try to use it here.
      socket.on("authorize", ({ sessionId }) => {
        // Lookup session, see if it's still valid.
        SessionModel.findOne({ id: sessionId })
          .then((doc) => {
            const today = new Date();
            if (!doc || !doc.session || doc.session.expirationDate <= today) {
              return socket.emit("sessionExpired");
            }
            const tokenType = doc.session.tokenType;
            const accessToken = doc.session.accessToken;

            fetch("https://discord.com/api/users/@me/guilds", {
              headers: {
                authorization: `${tokenType} ${accessToken}`,
              },
            })
              .then((res) => res.json())
              .then((response) => {
                socket.emit("servers", response);
              });
          })
          .catch((err) => {
            console.log(err);
          });
      });

      // User logged out, remove the session ID from the database.
      socket.on("logout", ({ sessionId }) => {
        // Remove sessionId from the database.
        SessionModel.deleteOne({ id: sessionId }).catch((err) => {
          console.log(err);
        });
      });

      // User logged in. We need to:
      // 1. Try the code provided by discord on this login.
      // 2. Generate a random session ID for the user to store in
      //    their browser, and also for the server to use as a key
      //    in the database to:
      // 3. Store the resulting access token, expiration, user, etc.
      // 4. Indicate login success to the web front end with the
      //    session ID.
      // 5. Emit the list of servers the user is a member of. This
      //    is then cross-referenced with the list of servers the
      //    bot is a member of and the list is whittled down to only
      //    the relevant servers.
      socket.on("login", ({ code, redirect_uri }) => {
        // Exchange code for access token,
        // and associate it with a session ID in the db.
        console.log(code, redirect_uri);
        const data = {
          client_id: process.env.DISCORD_BOT_CLIENT_ID,
          client_secret: process.env.DISCORD_BOT_CLIENT_SECRET,
          grant_type: "authorization_code",
          redirect_uri: redirect_uri,
          code: code,
          scope: "identify guilds",
        };
        fetch("https://discord.com/api/oauth2/token", {
          method: "POST",
          body: new URLSearchParams(data),
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        })
          .then((res) => res.json())
          .then((info) => {
            if (!info.access_token) {
              return socket.emit("sessionExpired");
            }
            const crypto = require("crypto");
            const sessionId = crypto.randomBytes(16).toString("base64");
            const expireDate = new Date(info.expires_in * 1000 + Date.now());

            fetch("https://discord.com/api/users/@me", {
              headers: {
                authorization: `${info.token_type} ${info.access_token}`,
              },
            })
              .then((res) => res.json())
              .then((response) => {
                const session = new SessionModel({
                  id: sessionId,
                  session: {
                    accessToken: info.access_token,
                    tokenType: info.token_type,
                    expirationDate: expireDate,
                    refreshToken: info.refresh_token,
                    scope: info.scope,
                    userId: response.message ? "" : response.id,
                  },
                });
                session
                  .save()
                  .then((doc) => {})
                  .catch((err) => console.log(err));
              });

            socket.emit("sessionId", sessionId);
            fetch("https://discord.com/api/users/@me/guilds", {
              headers: {
                authorization: `${info.token_type} ${info.access_token}`,
              },
            })
              .then((res) => res.json())
              .then((response) => {
                socket.emit("servers", response);
              });
          })
          .catch((err) => console.log(err));
      });

      // There is a socket connection for this particular guild, so
      // any changes made to this guild's settings need to be propagated
      // to this socket.
      socket.on("identifySocket", ({ guild }) => {
        if (!client.sockets.has(guild.id)) {
          client.sockets.set(guild.id, [socket]);
        } else {
          client.sockets.get(guild.id).push(socket);
        }
      });

      // User changed servers on the web front end, and no longer
      // need updates for this guild.
      socket.on("unidentifySocket", ({ guild }) => {
        if (client.sockets.has(guild.id)) {
          const idx = client.sockets.get(guild.id).indexOf(socket);
          if (idx >= 0) {
            client.sockets.get(guild.id).splice(idx, 1);
          }
        }
      });

      // Toggle buzzer mode.
      socket.on("changeMode", ({ guild, mode, sessionId }) => {
        if (guild.id === "") return;
        SessionModel.findOne({ id: sessionId }).then((doc) => {
          if (doc.session) {
            const guildObj = client.util.resolveGuild(
              guild.id,
              client.guilds.cache
            );
            if (guildObj) {
              // Check role permissions
              if (!userHasBuzzerRole(guildObj, doc.session.userId)) {
                return socket.emit("commandUnauthorized", {
                  command: "changeMode",
                });
              }
              client.settings.set(guild.id, "buzzerMode", mode);

              socket.emit("responseMode", {
                mode: mode,
              });

              let channelObj = getBuzzerChannel(guildObj);
              if (channelObj) {
                if (mode === "chaos") {
                  channelObj.send(`Buddy...you are now in **${mode} mode!!!**`);
                } else {
                  channelObj.send(`You are now in **${mode} mode**`);
                }
              }
            }
          }
        });
      });

      // Enable/disabled the buzzer.
      socket.on("changeReady", ({ guild, ready, sessionId }) => {
        if (guild.id === "") return;
        SessionModel.findOne({ id: sessionId }).then((doc) => {
          if (doc.session) {
            const guildObj = client.util.resolveGuild(
              guild.id,
              client.guilds.cache
            );
            if (guildObj) {
              // Check role permissions
              if (!userHasBuzzerRole(guildObj, doc.session.userId)) {
                return socket.emit("commandUnauthorized", {
                  command: "changeReady",
                });
              }

              client.settings.set(guildObj.id, "buzzerReady", ready);
              socket.emit("responseReady", {
                ready: ready,
                clear: true,
              });
              const channelObj = getBuzzerChannel(guildObj);

              if (channelObj) {
                channelObj.send(
                  `Buzzer is **${ready ? "ready" : "not ready"}**`
                );
              }
            }
          }
        });
      });

      socket.on("changeChannel", ({ guild, id, sessionId }) => {
        if (guild.id === "") return;
        SessionModel.findOne({ id: sessionId }).then((doc) => {
          if (doc.session) {
            const guildObj = client.util.resolveGuild(
              guild.id,
              client.guilds.cache
            );

            if (guildObj) {
              // Check role permissions
              if (!userHasBuzzerRole(guildObj, doc.session.userId)) {
                return socket.emit("commandUnauthorized", {
                  command: "changeChannel",
                });
              }

              const channelObj = client.util.resolveChannel(
                id,
                guildObj.channels.cache
              );
              client.settings.set(
                guildObj.id,
                "buzzerChannel",
                JSON.stringify(channelObj)
              );
              if (channelObj) {
                channelObj.send(
                  "Buzzer now listening on " + channelObj.toString()
                );
              }
            }
          }
        });
      });

      socket.on("clearQueue", ({ guild, sessionId }) => {
        if (guild.id === "") return;
        SessionModel.findOne({ id: sessionId }).then((doc) => {
          if (doc.session) {
            const guildObj = client.util.resolveGuild(
              guild.id,
              client.guilds.cache
            );

            if (guildObj) {
              // Check role permissions
              if (!userHasBuzzerRole(guildObj, doc.session.userId)) {
                return socket.emit("commandUnauthorized", {
                  command: "clearQueue",
                });
              }
              client.settings.set(guildObj.id, "buzzerQueue", []);
              const channelObj = getBuzzerChannel(guildObj);
              if (channelObj) {
                channelObj.send("Cleared the dookie list.");
              }
              socket.emit(
                "buzz",
                client.settings.get(guild.id, "buzzerQueue", [])
              );
            }
          }
        });
      });

      socket.on("randomizeQueue", ({ guild, sessionId }) => {
        if (guild.id === "") return;
        SessionModel.findOne({ id: sessionId }).then((doc) => {
          if (doc.session) {
            const guildObj = client.util.resolveGuild(
              guild.id,
              client.guilds.cache
            );

            if (guildObj) {
              // Check role permissions
              if (!userHasBuzzerRole(guildObj, doc.session.userId)) {
                return socket.emit("commandUnauthorized", {
                  command: "randomizeQueue",
                });
              }
              require("./util").shuffle(
                client.settings.get(guild.id, "buzzerQueue", [])
              );
              const channelObj = getBuzzerChannel(guildObj);

              try {
                var num = 1;
                if (channelObj) {
                  return channelObj.send(
                    `Randomized the dookie list: ${client.settings
                      .get(guild.id, "buzzerQueue", [])
                      .reduce((str, buzz) => {
                        return (
                          str +
                          `${num++}. ${client.util.resolveUser(
                            JSON.parse(buzz).id,
                            guildObj.members.cache
                          )}\n`
                        );
                      }, "\n")}`
                  );
                }
              } catch (err) {
                console.log(err);
              }
              socket.emit(
                "buzz",
                client.settings.get(guild.id, "buzzerQueue", [])
              );
            }
          }
        });
      });

      socket.on("requestServers", () => {
        emitServers();
      });

      socket.on("requestChannels", ({ id }) => {
        emitChannels(id);
      });

      socket.on("requestReady", ({ guild }) => {
        if (client.guilds.cache.has(guild.id)) {
          socket.emit("responseReady", {
            ready: client.settings.get(guild.id, "buzzerReady", false),
            clear: false,
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

    function getBuzzerChannel(guildObj) {
      const channel = JSON.parse(
        client.settings.get(
          guildObj.id,
          "buzzerChannel",
          JSON.stringify(
            guildObj.channels.cache
              .filter((channel) => {
                return channel.type === "text";
              })
              .first()
          )
        )
      );

      return client.util.resolveChannel(channel.id, guildObj.channels.cache);
    }

    function userHasBuzzerRole(guildObj, userId) {
      const member = client.util.resolveMember(userId, guildObj.members.cache);
      return (
        member.roles.cache.some((role) => {
          return (
            role.name.toLowerCase() ===
            client.settings
              .get(guildObj.id, "buzzerRole", "buzzer")
              .toLowerCase()
          );
        }) || member.id === client.ownerID
      );
    }
  })
  .catch((err) => console.log(err));
