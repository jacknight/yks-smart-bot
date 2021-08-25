const {
  AkairoClient,
  CommandHandler,
  InhibitorHandler,
  ListenerHandler,
  MongooseProvider,
} = require("discord-akairo");
const model = require("./db/model");
require("dotenv").config();
const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const { default: fetch } = require("node-fetch");
const SessionModel = require("./db/sessions");
const { Constants, Intents } = require("discord.js");
const cors = require("cors");
const crypto = require("crypto");

class YKSSmartBot extends AkairoClient {
  constructor() {
    super(
      { ownerID: "329288617564569602" },
      {
        partials: [
          Constants.PartialTypes.REACTION,
          Constants.PartialTypes.USER,
          Constants.PartialTypes.MESSAGE,
          Constants.PartialTypes.CHANNEL,
        ],
        intents: [
          Intents.FLAGS.GUILDS,
          Intents.FLAGS.GUILD_MEMBERS,
          Intents.FLAGS.GUILD_MESSAGES,
          Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        ],
      }
    );

    // Database provider stored on the client.
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
      aliasReplacement: /-/g, // !thiscommandworks and !this-command-works
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
      process: process,
    });

    const app = express();

    app.use(cors());
    app.use(express.static(path.resolve(__dirname, "./build")));
    app.use(express.json());

    // Handle discord authorization
    app.post("/api/login", async (req, res) => {
      const code = req.body.code;
      if (code) {
        // get token
        try {
          const oauthFetch = await fetch(
            "https://discord.com/api/oauth2/token",
            {
              method: "POST",
              body: new URLSearchParams({
                client_id: process.env.DISCORD_BOT_CLIENT_ID,
                client_secret: process.env.DISCORD_BOT_CLIENT_SECRET,
                code,
                grant_type: "authorization_code",
                redirect_uri: `${process.env.REACT_APP_HOST}`,
                scope: "identify guilds",
              }),
              headers: {
                "Content-type": "application/x-www-form-urlencoded",
              },
            }
          );
          const oauthData = await oauthFetch.json();
          // Get user from discord
          const userFetch = await fetch("https://discord.com/api/users/@me", {
            headers: {
              authorization: `${oauthData.token_type} ${oauthData.access_token}`,
            },
          });
          const user = await userFetch.json();
          // Before we do anything, confirm user is a member of the
          // pisscord.
          const guildsFetch = await fetch(
            "https://discord.com/api/users/@me/guilds",
            {
              headers: {
                authorization: `${oauthData.token_type} ${oauthData.access_token}`,
              },
            }
          );
          const guilds = await guildsFetch.json();
          if (
            !guilds ||
            !Array.isArray(guilds) ||
            !guilds.some((guild) => guild.id === process.env.YKS_GUILD_ID)
          ) {
            return res.sendFile(
              path.resolve(__dirname, "./build", "index.html")
            );
          }

          // From this point on, if we find the provided session we'll just
          // assume they're still members of the pisscord. If they aren't, some
          // interactive stuff won't work.
          const expireDate = new Date(oauthData.expires_in * 1000 + Date.now());
          const sessionId = crypto.randomBytes(16).toString("base64");
          const session = new SessionModel({
            id: sessionId,
            session: {
              user: user.id,
              accessToken: oauthData.access_token,
              tokenType: oauthData.token_type,
              expirationDate: expireDate,
              refreshToken: oauthData.refresh_token,
              scope: oauthData.scope,
            },
          });

          session.save().catch((err) => console.log(err));

          return res.send({ user, session: sessionId });
        } catch (error) {
          console.log(error);
          res.sendFile(path.resolve(__dirname, "./build", "index.html"));
        }
      }
    });

    app.get("/api/clips/:page", async (req, res) => {
      // Verify session
      const session = await SessionModel.findOne({ id: req.query.session });
      if (!session || session?.expirationDate?.getTime() < Date.now()) {
        // Log them out
        return res.send({ logout: true });
      }

      // Grab array of clip URLs from the database
      var clips = [];
      clips = this.settings.get(process.env.YKS_GUILD_ID, "clips", []);
      // Get clips requested based on 1) page number 2) clips per page
      // In this case, page number is 1 since none was provided
      const clipsPerPage = req.query.clips || 1;
      const totalClips = clips.length;
      const page = req.params.page;
      const offset = clipsPerPage * (page - 1);
      clips = clips.slice(offset, offset + clipsPerPage);
      res.send({
        clips,
        totalClips,
        page,
      });
    });

    // All other GET requests not handled before will return our React app
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "./build", "index.html"));
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
    // TODO: Do a little housekeeping with the session IDs
    // stored in the db by removing expired ones. At the
    // moment, they only get removed when the user explicitly
    // click logout.
    const client = new YKSSmartBot();
    client.login(process.env.AUTH_TOKEN);

    // Using Socket.io to communicate with the frontend component
    // of the bot. Since commands can be triggered from the chat
    // or from a website, sockets keep them in sync.
    const io = require("socket.io")(client.server, {
      cors: {
        origin: "*",
      },
    });

    // We need a collection of sockets that we emit to
    // when the guild they are viewing on the control panel
    // updates in any way. The map is:
    // key: guild ID
    // value: [socket1, socket2, ..., socketN]
    //
    // TODO: This is currently stored in memory. So when the
    // bot crashes or otherwise restarts, and this information
    // is lost and the user is forced to refresh the site to
    // get updated information (and they don't know anything
    // has gone wrong!)
    client.sockets = new Map();

    // When someone connects to the web control panel,
    // we monitor the connection for emit events and
    // potentially respond to them with our own emit,
    // or if it's general server information to all
    // sockets currently observing that server.
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
      socket.on("authorize", ({ session }) => {
        // Lookup session, see if it's still valid.
        SessionModel.findOne({ id: session })
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
                // Emit the list of servers this user is a member of
                // in order to display only the servers which both
                // the bot and the user are members.
                socket.emit("servers", response);
              });
          })
          .catch((err) => {
            console.log(err);
          });
      });

      // User logged out, remove the session ID from the database.
      socket.on("logout", ({ session }) => {
        // Remove session from the database.
        SessionModel.deleteOne({ id: session }).catch((err) => {
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
            const session = crypto.randomBytes(16).toString("base64");
            const expireDate = new Date(info.expires_in * 1000 + Date.now());

            fetch("https://discord.com/api/users/@me", {
              headers: {
                authorization: `${info.token_type} ${info.access_token}`,
              },
            })
              .then((res) => res.json())
              .then((response) => {
                const session = new SessionModel({
                  id: session,
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

            socket.emit("session", session);
            fetch("https://discord.com/api/users/@me/guilds", {
              headers: {
                authorization: `${info.token_type} ${info.access_token}`,
              },
            })
              .then((res) => res.json())
              .then((response) => {
                // Emit the list of servers this user is a member of
                // in order to display only the servers which both
                // the bot and the user are members.
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
          const guildSockets = client.sockets.get(guild.id);
          guildSockets.push(socket);
          client.sockets.set(guild.id, guildSockets);
        }
      });

      // User changed servers on the web front end, and no longer
      // need updates for this guild.
      socket.on("unidentifySocket", ({ guild }) => {
        if (client.sockets.has(guild.id)) {
          const idx = client.sockets.get(guild.id).indexOf(socket);
          if (idx >= 0) {
            const guildSockets = client.sockets.get(guild.id);
            guildSockets.splice(idx, 1);
            client.sockets.set(guild.id, guildSockets);
          }
        }
      });

      // Toggle buzzer mode (chaos/normal)
      socket.on("changeMode", ({ guild, mode, session }) => {
        if (guild.id === "") return;
        // Look up user associated with session ID.
        SessionModel.findOne({ id: session }).then(async (doc) => {
          if (doc.session) {
            const guildObj = client.util.resolveGuild(
              guild.id,
              client.guilds.cache
            );
            if (guildObj) {
              // Check role permissions
              if (!userHasBuzzerRole(guildObj, doc.session.userId)) {
                // Raise an alert on the frontend
                return socket.emit("commandUnauthorized", {
                  command: "changeMode",
                });
              }
              await client.settings.set(guild.id, "buzzerMode", mode);

              socket.emit("responseMode", {
                mode: mode,
              });

              let channelObj = await getBuzzerChannel(guildObj);
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
      socket.on("changeReady", ({ guild, ready, session }) => {
        if (guild.id === "") return;
        // Look up user associated with session ID.
        SessionModel.findOne({ id: session }).then(async (doc) => {
          if (doc.session) {
            const guildObj = client.util.resolveGuild(
              guild.id,
              client.guilds.cache
            );
            if (guildObj) {
              // Check role permissions
              if (!userHasBuzzerRole(guildObj, doc.session.userId)) {
                // Raise an alert on the frontend
                return socket.emit("commandUnauthorized", {
                  command: "changeReady",
                });
              }

              await client.settings.set(guildObj.id, "buzzerReady", ready);
              socket.emit("responseReady", {
                ready: ready,
                clear: true,
              });
              const channelObj = await getBuzzerChannel(guildObj);

              if (channelObj) {
                channelObj.send(
                  `Buzzer is **${ready ? "ready" : "not ready"}**`
                );
              }
            }
          }
        });
      });

      socket.on("changeChannel", ({ guild, id, session }) => {
        if (guild.id === "") return;
        // Look up user associated with session ID.
        SessionModel.findOne({ id: session }).then(async (doc) => {
          if (doc.session) {
            const guildObj = client.util.resolveGuild(
              guild.id,
              client.guilds.cache
            );

            if (guildObj) {
              // Check role permissions
              if (!userHasBuzzerRole(guildObj, doc.session.userId)) {
                // Raise an alert on the frontend
                return socket.emit("commandUnauthorized", {
                  command: "changeChannel",
                });
              }

              const channelObj = client.util.resolveChannel(
                id,
                guildObj.channels.cache
              );
              await client.settings.set(
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

      socket.on("clearQueue", ({ guild, session }) => {
        if (guild.id === "") return;
        // Look up user associated with session ID.
        SessionModel.findOne({ id: session }).then(async (doc) => {
          if (doc.session) {
            const guildObj = client.util.resolveGuild(
              guild.id,
              client.guilds.cache
            );

            if (guildObj) {
              // Check role permissions
              if (!userHasBuzzerRole(guildObj, doc.session.userId)) {
                // Raise an alert on the frontend
                return socket.emit("commandUnauthorized", {
                  command: "clearQueue",
                });
              }
              await client.settings.set(guildObj.id, "buzzerQueue", []);
              const channelObj = await getBuzzerChannel(guildObj);
              if (channelObj) {
                channelObj.send("Cleared the dookie list.");
              }
              socket.emit(
                "buzz",
                await client.settings.get(guild.id, "buzzerQueue", [])
              );
            }
          }
        });
      });

      socket.on("randomizeQueue", ({ guild, session }) => {
        if (guild.id === "") return;
        // Look up user associated with session ID.
        SessionModel.findOne({ id: session }).then(async (doc) => {
          if (doc.session) {
            const guildObj = client.util.resolveGuild(
              guild.id,
              client.guilds.cache
            );

            if (guildObj) {
              // Check role permissions
              if (!userHasBuzzerRole(guildObj, doc.session.userId)) {
                // Raise an alert on the frontend
                return socket.emit("commandUnauthorized", {
                  command: "randomizeQueue",
                });
              }
              let buzzerQueue = await client.settings.get(
                guild.id,
                "buzzerQueue",
                []
              );
              require("./util").shuffle(buzzerQueue);
              await client.settings.set(guild.id, "buzzerQueue", buzzerQueue);
              const channelObj = await getBuzzerChannel(guildObj);

              try {
                var num = 1;
                if (channelObj) {
                  return channelObj.send(
                    `Randomized the dookie list: ${buzzerQueue.reduce(
                      (str, buzz) => {
                        const member = client.util.resolveMember(
                          JSON.parse(buzz).id,
                          guildObj.members.cache
                        );
                        return (
                          str +
                          (member
                            ? `${num++}. ${
                                member.nickname || member.user.username
                              }\n`
                            : "")
                        );
                      },
                      "\n"
                    )}`
                  );
                }
              } catch (err) {
                console.log(err);
              }
              socket.emit("buzz", buzzerQueue);
            }
          }
        });
      });

      socket.on("requestServers", () => {
        // Emit list of servers of which the bot is a member
        emitServers();
      });

      socket.on("requestChannels", ({ id }) => {
        // Emit list of channels for the given server id.
        emitChannels(id);
      });

      socket.on("requestReady", async ({ guild }) => {
        if (client.guilds.cache.has(guild.id)) {
          // Emit current buzzer status (ready/not ready)
          socket.emit("responseReady", {
            ready: await client.settings.get(guild.id, "buzzerReady", false),
            clear: false, // don't ever clear the buzzer list in this scenario
          });
        }
      });

      socket.on("requestMode", async ({ guild }) => {
        if (client.guilds.cache.has(guild.id)) {
          // Emit current buzzer mode (chaos/normal)
          socket.emit("responseMode", {
            mode: await client.settings.get(guild.id, "buzzerMode", "normal"),
          });
        }
      });

      socket.on("requestQueue", async ({ guild }) => {
        if (client.guilds.cache.has(guild.id)) {
          // Emit current buzzer list
          socket.emit(
            "buzz",
            await client.settings.get(guild.id, "buzzerQueue", [])
          );
        }
      });
    });

    // Emit list of servers of which the bot is a member
    // FIXME: Client doesn't need this. Filtering should
    // be done server side, potential privacy issue.
    function emitServers() {
      const servers = client.guilds.cache;
      let ids = [];
      servers.forEach((guild, id) => {
        ids.push({ name: guild.name, id: id });
      });
      io.sockets.emit("serversList", ids);
    }

    // Emit list of channels for the given server id
    function emitChannels(id) {
      const channels = client.guilds.resolve(id).channels.cache;
      const ids = [];
      channels.forEach((channel) => {
        // Bot currently only active on text channels.
        if (channel.type === "GUILD_VOICE") return;
        if (channel.type === "GUILD_CATEGORY") return;
        if (channel.type === "GUILD_TEXT") {
          ids.push({ guild: id, topic: channel.name, id: channel.id });
        }
      });
      io.sockets.emit("channelsList", ids);
    }

    async function getBuzzerChannel(guildObj) {
      const channel = JSON.parse(
        // Get the configured buzzer channel from the db.
        // If none set, use the system channel. This will
        // often be the "#general" topic.
        await client.settings.get(
          guildObj.id,
          "buzzerChannel",
          JSON.stringify(guildObj.systemChannel)
        )
      );

      return client.util.resolveChannel(channel.id, guildObj.channels.cache);
    }

    // Actions coming in from the frontend need to be
    // checked for permission.
    function userHasBuzzerRole(guildObj, userId) {
      const member = client.util.resolveMember(userId, guildObj.members.cache);
      return (
        member.roles.cache.some(async (role) => {
          return (
            role.name.toLowerCase() ===
            (await client.settings
              .get(guildObj.id, "buzzerRole", "buzzer")
              .toLowerCase())
          );
        }) || member.id === client.ownerID
      );
    }
  })
  .catch((err) => console.log(err));
