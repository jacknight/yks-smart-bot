const { Listener } = require("discord-akairo");
const SessionModel = require("../db/sessions");
const Parser = require("rss-parser");
const parser = new Parser();
const MAIN_FEED_RSS = process.env.MAIN_FEED_RSS;
const BONUS_FEED_RSS = process.env.BONUS_FEED_RSS;

class ReadyListener extends Listener {
  constructor() {
    super("ready", {
      emitter: "client",
      event: "ready",
    });
  }

  async exec() {
    console.log("I'm ready!");

    // Real or fake every day
    scheduleRealOrFakeGame(this.client);
    setInterval(scheduleRealOrFakeGame, 1000 * 60 * 60 * 24, this.client);

    // Set bot status and check for new episodes
    pollRss(this.client);
    setInterval(pollRss, 60 * 1000, this.client); // every 60 sec

    // Delete expired tokens
    await SessionModel.deleteMany({
      "session.expirationDate": { $lt: new Date(Date.now()) },
    });
  }
}

async function scheduleRealOrFakeGame(client) {
  const getEstOffset = () => {
    const stdTimezoneOffset = () => {
      var jan = new Date(0, 1);
      var jul = new Date(6, 1);
      return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
    };

    var today = new Date();

    const isDstObserved = (today) => {
      return today.getTimezoneOffset() < stdTimezoneOffset();
    };

    if (isDstObserved(today)) {
      return 4;
    } else {
      return 5;
    }
  };

  const startOfDay = require("date-fns/startOfDay");
  const add = require("date-fns/add");

  let nowUtc = new Date();
  // Make "last day of the week" a friday (week starts on saturday - 6)
  let todayEastern = startOfDay(nowUtc);
  // Get the server timezone offset in UTC (given in minutes -> convert to hours)
  let utcServerOffset = todayEastern.getTimezoneOffset() / 60;

  // New York is GMT-(4 or 5). 7pm is 19 hours into the day.
  // (19 + (easternOffset - utcServerOffset)) to get 7pm Eastern time from UTC midnight.
  todayEastern = add(todayEastern, {
    hours: 19 + (getEstOffset() - utcServerOffset),
  });

  let twoMinuteWarning = add(todayEastern, {
    minutes: -2,
  });

  const pisscord = client.guilds.cache.find(
    (guild) => guild.id === process.env.YKS_GUILD_ID
  );
  const kickstarterBotChannel = pisscord.channels.cache.find(
    (channel) => channel.id === process.env.YKS_KICKSTARTER_BOT_CHANNEL_ID
  );
  // Set a timeout for as much time between now and friday 9pm eastern.
  if (todayEastern.getTime() - nowUtc.getTime() > 0) {
    setTimeout(
      async () => {
        const command = await client.commandHandler.findCommand(
          "realorfakegame"
        );
        if (kickstarterBotChannel && command) {
          client.commandHandler.runCommand(
            { guild: pisscord, channel: kickstarterBotChannel },
            command,
            {}
          );
        }
      },
      todayEastern.getTime() - nowUtc.getTime(),
      kickstarterBotChannel,
      pisscord
    );
  }

  if (twoMinuteWarning.getTime() - nowUtc.getTime() > 0) {
    setTimeout(
      () => {
        kickstarterBotChannel.send(`
**10 ROUNDS OF REAL OR FAKE**

**TWO MINUTE WARNING**`);
      },
      twoMinuteWarning.getTime() - nowUtc.getTime(),
      kickstarterBotChannel
    );
  }
}

// Set the bot's presence.
// Currently setting to "Listening to" the latest
// main feed YKS episode. Wanted to spoof rich
// presence spotify but bots don't have that option.
async function pollRss(client) {
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
      status: "dnd",
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
        const channel = await getRssChannel(client, guild);
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

async function getRssChannel(client, guildObj) {
  const channel = JSON.parse(
    // Get the configured rss channel from the db.
    // If none set, return null
    await client.settings.get(guildObj.id, "rssChannel", null)
  );

  return channel
    ? client.util.resolveChannel(channel.id, guildObj.channels.cache)
    : null;
}

module.exports = ReadyListener;
