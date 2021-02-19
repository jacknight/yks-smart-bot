const {
  AkairoClient,
  CommandHandler,
  InhibitorHandler,
  ListenerHandler,
  MongooseProvider,
} = require("discord-akairo");
const model = require("./db/model");
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const { default: fetch } = require("node-fetch");
const SessionModel = require("./db/sessions");
const Parser = require("rss-parser");
const parser = new Parser();
const MAIN_FEED_RSS = process.env.MAIN_FEED_RSS;
const BONUS_FEED_RSS = process.env.BONUS_FEED_RSS;
const Canvas = require("canvas");

class BuzzerClient extends AkairoClient {
  constructor() {
    super({ ownerID: "329288617564569602" }, { disableMentions: "everyone" });

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
    // TODO: Do a little housekeeping with the session IDs
    // stored in the db by removing expired ones. At the
    // moment, they only get removed when the user explicitly
    // click logout.
    const client = new BuzzerClient();
    client.login(process.env.AUTH_TOKEN);

    // Using Socket.io to communicate with the frontend component
    // of the bot. Since commands can be triggered from the chat
    // or from a website, sockets keep them in sync.
    const io = require("socket.io")(client.server, {
      cors: {
        origin: "*",
      },
    });

    client.on("ready", async () => {
      // Set bot status and check for new episodes
      pollRss();
      setInterval(() => {
        pollRss();
      }, 10 * 1000); // every 10 sec (too often?)

      // 5pm Friday Pacific time... do something to celebrate.
      createWeekendTimeout();

      // Delete expired tokens
      await SessionModel.deleteMany({
        "session.expirationDate": { $lt: new Date(Date.now()) },
      });
    });

    // New member greetings
    client.on("guildMemberAdd", async (member) => {
      if (member.id === client.ownerID) return;
      if (client.settings.get(member.guild.id, "welcomeMsgDisabled", false))
        return;

      // Check if they've already been welcomed
      const welcomedMembers = await client.settings.get(
        member.guild.id,
        "welcomedMembers",
        []
      );
      if (welcomedMembers.some((id) => id === member.id)) return;

      // Add to welcomed members for guild so we don't do this again.
      welcomedMembers.push(member.id);
      client.settings.set(member.guild.id, "welcomedMembers", welcomedMembers);

      // Build a dynamic composite image that welcomes the user with
      // their own display name and avatar.

      const canvas = Canvas.createCanvas(1000, 1000);
      const ctx = canvas.getContext("2d");
      const background = await Canvas.loadImage("./assets/jf-blessing.png");
      ctx.drawImage(background, 0, 0, 423, canvas.height);

      ctx.font = applyText(
        canvas,
        `${member.displayName},\nJF has blessed\nyour timeline.\nsay "thank you\nmr. jf" for\ngood fortune\nin the new year`
      );
      ctx.fillStyle = "#83c133";
      ctx.fillText(
        `${member.displayName},\nJF has blessed\nyour timeline.\nsay "thank you\nmr. jf" for\ngood fortune\nin the new year`,
        450,
        300,
        550
      );

      ctx.beginPath();
      // X-Coordinate (550) - center of the circle is to the right of the bg image
      // Y-Coordinate (120) - 20px padding from the top for the 100px radius circle.
      // Radius (100) - circle has 200px diameter.
      // Start Angle, End Angle - Go from 0º to 360º
      // Counterclockwise - true
      ctx.arc(550, 120, 100, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();

      // Load avatar into that clipped off circle
      const avatar = await Canvas.loadImage(
        member.user.displayAvatarURL({ format: "jpg" })
      );
      ctx.drawImage(avatar, 450, 20, 200, 200);

      const attachment = client.util.attachment(
        canvas.toBuffer(),
        "welcome-image.png"
      );

      if (member.id === "141822351321989120") {
        // gorb
        member.guild.systemChannel.send("gorb", attachment);
      } else if (member.id === "251217007045902348") {
        // tay
        member.guild.systemChannel.send("Tay is back!", attachment);
      } else if (member.id === client.ownerID) {
        member.guild.systemChannel.send(
          "My master! My master has returned! I kept telling them you would!",
          attachment
        );
      } else {
        const responses = [
          "You don't have to be insane to post here, but it's a \"good to have.\"",
          "I give it a month.",
          "Make yourself at home.\nOh ok, you're going straight for the nasty channel. Ah! Well. Nevertheless,",
          "It's not too late to just turn around and walk away. No one would blame you.",
          "Grab an empty chair in the circle. We're just about to start sharing how YKS ruined our lives.",
          "If you need to know what episode something happened in, ask vinny.",
          "If you see JF or DB in here, avert your eyes from their posts as a sign of respect.",
        ];
        member.guild.systemChannel.send(
          `Welcome, ${member}! ${
            responses[Math.floor(Math.random() * responses.length)]
          }`,
          attachment
        );
      }
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

      // Toggle buzzer mode (chaos/normal)
      socket.on("changeMode", ({ guild, mode, sessionId }) => {
        if (guild.id === "") return;
        // Look up user associated with session ID.
        SessionModel.findOne({ id: sessionId }).then(async (doc) => {
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
      socket.on("changeReady", ({ guild, ready, sessionId }) => {
        if (guild.id === "") return;
        // Look up user associated with session ID.
        SessionModel.findOne({ id: sessionId }).then(async (doc) => {
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

      socket.on("changeChannel", ({ guild, id, sessionId }) => {
        if (guild.id === "") return;
        // Look up user associated with session ID.
        SessionModel.findOne({ id: sessionId }).then(async (doc) => {
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

      socket.on("clearQueue", ({ guild, sessionId }) => {
        if (guild.id === "") return;
        // Look up user associated with session ID.
        SessionModel.findOne({ id: sessionId }).then(async (doc) => {
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

      socket.on("randomizeQueue", ({ guild, sessionId }) => {
        if (guild.id === "") return;
        // Look up user associated with session ID.
        SessionModel.findOne({ id: sessionId }).then(async (doc) => {
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
        if (channel.type === "voice") return;
        if (channel.type === "category") return;
        if (channel.type === "text") {
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

    async function getRssChannel(guildObj) {
      const channel = JSON.parse(
        // Get the configured rss channel from the db.
        // If none set, return null
        await client.settings.get(guildObj.id, "rssChannel", null)
      );

      return channel
        ? client.util.resolveChannel(channel.id, guildObj.channels.cache)
        : null;
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

    // Set the bot's presence.
    // Currently setting to "Listening to" the latest
    // main feed YKS episode. Wanted to spoof rich
    // presence spotify but bots don't have that option.
    async function pollRss() {
      const mainFeed = await parser.parseURL(MAIN_FEED_RSS);
      const bonusFeed = await parser.parseURL(BONUS_FEED_RSS);

      if (mainFeed && mainFeed.items && bonusFeed && bonusFeed.items) {
        // See what's stored in the DB for the latest main ep...
        const latestMainEpTitle = await client.settings.get(
          client.user.id,
          "latestMainEpTitle",
          ""
        );

        // ...and the latest bonus ep...
        const latestBonusEpTitle = await client.settings.get(
          client.user.id,
          "latestBonusEpTitle",
          ""
        );

        // ...and compare to the RSS feed.
        const newMain = latestMainEpTitle != mainFeed.items[0].title;
        // Bonus feed is trickier because it has both the bonus episodes
        // and the main feed episodes. We don't know which will go up first
        // for certain, so we have to do a bit of regex to make sure it's
        // a "true" premium episode. If they change this title format, it
        // will at least default to not working instead of over-working.
        //
        // We'll also do a sanity check to make sure the bonus ep title
        // and main feed title aren't the same thing.
        const newBonus =
          bonusFeed.items[0].title.match(/S[0-9]+E[0-9]+/i) &&
          latestBonusEpTitle != bonusFeed.items[0].title &&
          mainFeed.items[0].title != bonusFeed.items[0].title;

        // Set bot status
        client.user.setPresence({
          status: "online",
          activity: {
            name: bonusFeed.items[0].title, // this is always the most recent ep
            type: "LISTENING",
            url: null,
          },
        });

        if (newMain || newBonus) {
          const feed = newMain ? "main" : "bonus";
          // Store newest ep title in DB
          if (newMain) {
            await client.settings.set(
              client.user.id,
              "latestMainEpTitle",
              mainFeed.items[0].title
            );
          }
          if (newBonus) {
            await client.settings.set(
              client.user.id,
              "latestBonusEpTitle",
              bonusFeed.items[0].title
            );
          }
          // For each guild the bot is a member, check if there is an RSS channel
          // channel configured and if so, send a message regarding the new ep.
          client.guilds.cache.forEach(async (guild) => {
            const channel = await getRssChannel(guild);
            const command = await client.commandHandler.findCommand("latest");
            if (channel && command) {
              client.commandHandler.runCommand({ guild, channel }, command, {
                feed,
                newEp: "yes",
              });
            }
          });
        }
      }
    }

    // On Friday 5pm Pacific time, drop a little celebratory
    // gif or video that it's finally the weekend.
    function createWeekendTimeout() {
      const lastDayOfWeek = require("date-fns/lastDayOfWeek");
      const add = require("date-fns/add");

      let nowUtc = new Date();
      // Make "last day of the week" a friday (week starts on saturday - 6)
      let friday5pmPacificInUTC = lastDayOfWeek(nowUtc, { weekStartsOn: 6 });
      // Get the server timezone offset in UTC (given in minutes -> convert to hours)
      let utcServerOffset = friday5pmPacificInUTC.getTimezoneOffset() / 60;
      // California is UTC-8. 5pm is 17 hours into the day.
      // (17 + 8 - utcServerOffset) to get 5pm Pacific time from UTC midnight.
      friday5pmPacificInUTC = add(friday5pmPacificInUTC, {
        hours: 17 + 8 - utcServerOffset,
      });

      // Set a timeout for as much time between now and friday 5pm pacific.
      setTimeout(() => {
        client.guilds.cache.forEach((guild) => {
          guild.systemChannel.send("It's Friday 5pm Pacific.", {
            files: ["./assets/weekend.mp4"],
          });
        });
      }, friday5pmPacificInUTC.getTime() - nowUtc.getTime());
    }

    // New member greeting helper to reduce size of text as necessary.
    function applyText(canvas, text) {
      const ctx = canvas.getContext("2d");

      // Declare a base size of the font
      let fontSize = 70;

      do {
        // Assign the font to the context and decrement it so it can be measured again
        ctx.font = `${(fontSize -= 10)}px sans-serif`;
        // Compare pixel width of the text to the canvas minus the approximate avatar size
      } while (ctx.measureText(text).width > canvas.width - 400);

      // Return the result to use in the actual canvas
      return ctx.font;
    }
  })
  .catch((err) => console.log(err));

process.on("unhandledRejection", (reason, promise) => {
  console.log("Unhandled rejection. Reason: '", reason, "'\n", promise);
});
