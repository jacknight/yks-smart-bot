import { Guild, Message } from 'discord.js';
import YKSSmartBot from '../bot';
import { ApplicationCommand, Client } from 'discord.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import commandList from '../commands/slash/_commands';

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
    console.info('Starting up.');

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
    setInterval(pollRss, 20 * 1000, this.client); // every 20 sec

    // Remove old mailbag messages (older than a month)
    removeOldMailbagMessages(this.client);
    setInterval(removeOldMailbagMessages, 1000 * 60 * 60 * 24, this.client);

    // Delete expired tokens
    await SessionModel.deleteMany({
      'session.expirationDate': { $lt: new Date(Date.now()) },
    });

    await setupSlashCommands(this.client);

    //- Break in case of emergency -//
    if (process.env.GATHER_ALL_CLIPS === 'true') {
      await gatherAllClips(this.client);
    }
    //- Break in case of emergency -//
  }
}

const setupSlashCommands = async (client: Client) => {
  if (!client.application) return;

  const rest = new REST().setToken(process.env.AUTH_TOKEN!);

  const commandData = commandList.map((command) => command.data.toJSON());

  const promises: Promise<ApplicationCommand>[] = [];
  client.application.commands.cache.forEach((command) => {
    promises.push(command.delete());
  });
  client.guilds.cache.forEach((guild) => {
    guild.commands.cache.forEach((command) => {
      promises.push(command.delete());
    });
  });
  await Promise.all(promises);

  console.info('Global and guild commands deleted. Registering most recent versions.');

  await client.guilds.fetch();
  await Promise.all(
    client.guilds.cache.map(async (guild) => {
      await Promise.all([guild.members.fetch(), guild.channels.fetch()]);
    }),
  );

  await rest.put(Routes.applicationCommands(client.application.id), {
    body: commandData,
  });

  console.info('Commands registered.');
};

const pollRss = async (client: YKSSmartBot) => {
  await pollMainRss(client);
  await pollBonusRss(client);
};

async function pollMainRss(client: YKSSmartBot) {
  if (!client.user) return;

  const mainFeed = await parser
    .parseURL(MAIN_FEED_RSS)
    .catch((e: any) => console.error('Failed to parse main feed RSS: ', e.message));

  if (mainFeed && mainFeed.items && mainFeed.items.length > 0) {
    const latestMainEpTitle: string = (
      await client.settings.get(client.user.id, 'latestMainEpTitle', '')
    ).trim();
    const feedMainEpTitle: string = mainFeed.items[0].title.trim();
    const newMain: boolean = latestMainEpTitle !== feedMainEpTitle;

    if (newMain) {
      console.info(
        `New main episode!\n  Previous: ${latestMainEpTitle}\n  Latest: ${feedMainEpTitle}`,
      );
      await client.settings.set(client.user.id, 'latestMainEpTitle', feedMainEpTitle);

      // For each guild the bot is a member, check if there is an RSS channel
      // channel configured and if so, send a message regarding the new ep.
      client.guilds.cache.forEach(async (guild) => {
        const channel = await getRssChannel(client, guild);
        const command = await client.commandHandler.findCommand('latest');
        if (channel && command) {
          client.commandHandler.runCommand({ guild, channel } as Message<boolean>, command, {
            feed: 'main',
            newEp: 'yes',
          });
        }
      });
    }
  }
}

async function pollBonusRss(client: YKSSmartBot) {
  if (!client.user) return;

  const bonusFeed = await parser
    .parseURL(BONUS_FEED_RSS)
    .catch((e: any) => console.error('Failed to parse bonus feed RSS: ', e.message));

  if (bonusFeed && bonusFeed.items && bonusFeed.items.length > 0) {
    const latestMainEpTitle: string = (
      await client.settings.get(client.user.id, 'latestMainEpTitle', '')
    ).trim();
    const latestBonusEpTitle: string = (
      await client.settings.get(client.user.id, 'latestBonusEpTitle', '')
    ).trim();
    const feedBonusEpTitle: string = bonusFeed.items[0].title.trim();
    const newBonus: boolean = latestBonusEpTitle !== feedBonusEpTitle;

    if (newBonus) {
      console.info(
        `New bonus episode!\n  Previous: ${latestBonusEpTitle}\n  Latest: ${feedBonusEpTitle}`,
      );
      await client.settings.set(client.user.id, 'latestBonusEpTitle', feedBonusEpTitle);

      // Set bot status
      client.user?.setPresence({
        status: 'dnd',
        activities: [
          {
            name: feedBonusEpTitle, // this is always the most recent ep
            type: 'LISTENING',
          },
        ],
      });

      if (feedBonusEpTitle !== latestMainEpTitle) {
        console.info(
          `New bonus ep is not the same as main feed:\n '${latestMainEpTitle}'\n '${feedBonusEpTitle}'`,
        );
        // For each guild the bot is a member, check if there is an RSS channel
        // channel configured and if so, send a message regarding the new ep.
        client.guilds.cache.forEach(async (guild) => {
          const channel = await getRssChannel(client, guild);
          const command = await client.commandHandler.findCommand('latest');
          if (channel && command) {
            client.commandHandler.runCommand({ guild, channel } as Message<boolean>, command, {
              feed: 'bonus',
              newEp: 'yes',
            });
          }
        });
      }
    }
  }
}

async function getRssChannel(client: YKSSmartBot, guildObj: Guild) {
  const channel = JSON.parse(
    // Get the configured rss channel from the db.
    // If none set, return null
    await client.settings.get(guildObj.id, 'rssChannel', null),
  );

  return channel ? client.util.resolveChannel(channel.id, guildObj.channels.cache) : null;
}

async function removeOldMailbagMessages(client: YKSSmartBot) {
  // Get all mailbag messages from the database
  let mailbagMessages = await client.settings.get(process.env.YKS_GUILD_ID!, 'mailbagMessages', []);

  mailbagMessages = mailbagMessages.reduce((arr: string[], rawMessage: string) => {
    const diff = Date.now() - JSON.parse(rawMessage).ts;
    const thirtyDays = 1000 * 60 * 60 * 24 * 30;
    if (diff < thirtyDays) arr.push(rawMessage);
    return arr;
  }, []);

  console.info('Cleared old mailbag messages.');
  return client.settings.set(process.env.YKS_GUILD_ID!, 'mailbagMessages', mailbagMessages);
}

const gatherAllClips = async (client: YKSSmartBot) => {
  const guild = client.util.resolveGuild(process.env.YKS_GUILD_ID!, client.guilds.cache);
  if (!guild) return null;
  const channel = client.util.resolveChannel(
    process.env.YKS_CLIP_CHANNEL_ID!,
    guild.channels.cache,
  );
  if (!channel || !channel.isText()) return null;

  console.info('Fetching all messages in the YKS clips channel and fillng in the gaps.');
  let messages = Array.from((await channel.messages.fetch({ limit: 100 }))?.values() || []);
  while (messages.length > 0) {
    const message = messages.pop();
    if (!message) continue;

    const clipListener = client.listenerHandler.findCategory('default').get('clip');
    await clipListener?.exec(message);
    if (messages.length === 0) {
      console.info('Fetching more messages before ID: ', message.id);
      messages = Array.from(
        (await channel.messages.fetch({ limit: 100, before: message.id }))?.values() || [],
      );
      messages.reverse();
    }
  }
  console.info('Ah. Done updating clips.');
};

module.exports = ReadyListener;
