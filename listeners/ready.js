const { Listener } = require('discord-akairo');
const SessionModel = require('../db/sessions');
const Parser = require('rss-parser');
const parser = new Parser();
const MAIN_FEED_RSS = process.env.MAIN_FEED_RSS;
const BONUS_FEED_RSS = process.env.BONUS_FEED_RSS;
const { createAudioPlayer, NoSubscriberBehavior } = require('@discordjs/voice');
class ReadyListener extends Listener {
  constructor() {
    super('ready', {
      emitter: 'client',
      event: 'ready',
    });
  }

  async exec() {
    console.log('Starting up.');

    // Create an audio player for the !listen command
    this.client.listen = {
      connection: null,
      player: null,
      resource: null,
      embed: null,
      message: null,
    };
    this.client.listen.player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Stop,
      },
    });

    // Set bot status and check for new episodes
    pollRss(this.client);
    setInterval(pollRss, 60 * 1000, this.client); // every 60 sec

    // Remove old mailbag messages (older than a month)
    removeOldMailbagMessages(this.client);
    setInterval(removeOldMailbagMessages, 1000 * 60 * 60 * 24, this.client);

    // Delete expired tokens
    await SessionModel.deleteMany({
      'session.expirationDate': { $lt: new Date(Date.now()) },
    });
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
    const latestMainEpTitle = await client.settings.get(client.user.id, 'latestMainEpTitle', '');

    // ...and the latest bonus ep...
    const latestBonusEpTitle = await client.settings.get(client.user.id, 'latestBonusEpTitle', '');

    // ...and compare to the RSS feed.
    const newMain = latestMainEpTitle != mainFeed.items[0].title;
    const newBonus = latestBonusEpTitle != bonusFeed.items[0].title;

    // Set bot status
    client.user.setPresence({
      status: 'dnd',
      activities: [
        {
          name: bonusFeed.items[0].title, // this is always the most recent ep
          type: 'LISTENING',
          url: null,
        },
      ],
    });

    if (newMain || newBonus) {
      const feed = newMain ? 'main' : 'bonus';
      // Store newest ep title in DB
      if (newMain) {
        await client.settings.set(client.user.id, 'latestMainEpTitle', mainFeed.items[0].title);
      }
      if (newBonus) {
        await client.settings.set(client.user.id, 'latestBonusEpTitle', bonusFeed.items[0].title);
      }
      // For each guild the bot is a member, check if there is an RSS channel
      // channel configured and if so, send a message regarding the new ep.
      client.guilds.cache.forEach(async (guild) => {
        const channel = await getRssChannel(client, guild);
        const command = await client.commandHandler.findCommand('latest');
        if (channel && command) {
          client.commandHandler.runCommand({ guild, channel }, command, {
            feed,
            newEp: 'yes',
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
    await client.settings.get(guildObj.id, 'rssChannel', null),
  );

  return channel ? client.util.resolveChannel(channel.id, guildObj.channels.cache) : null;
}

async function removeOldMailbagMessages(client) {
  // Get all mailbag messages from the database
  let mailbagMessages = await client.settings.get(process.env.YKS_GUILD_ID, 'mailbagMessages', []);

  mailbagMessages = mailbagMessages.reduce((arr, rawMessage) => {
    const diff = Date.now() - JSON.parse(rawMessage).ts;
    const thirtyDays = 1000 * 60 * 60 * 24 * 30;
    if (diff < thirtyDays) arr.push(rawMessage);
    return arr;
  }, []);

  console.log('Cleared old mailbag messages.');
  return client.settings.set(process.env.YKS_GUILD_ID, 'mailbagMessages', mailbagMessages);
}

module.exports = ReadyListener;
