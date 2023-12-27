import path from 'path';
import express from 'express';
import mongoose, { ConnectOptions } from 'mongoose';
import { Channel, CommandInteraction, Constants, Guild, Intents } from 'discord.js';
import cors from 'cors';
import {
  AkairoClient,
  CommandHandler,
  InhibitorHandler,
  ListenerHandler,
  MongooseProvider,
} from 'discord-akairo';
import commandList from './commands/slash/_commands';
import { CommandInterface } from './interfaces/command';
require('dotenv').config();
import guildModel from './db/model';
import clipsModel from './db/clips';

class YKSSmartBot extends AkairoClient {
  settings: MongooseProvider;
  clips: MongooseProvider;
  slashCommands: CommandInterface[];
  globalRates: Map<any, any>;
  commandHandler: CommandHandler;
  inhibitorHandler: InhibitorHandler;
  listenerHandler: ListenerHandler;
  server: import('http').Server<
    typeof import('http').IncomingMessage,
    typeof import('http').ServerResponse
  >;
  clientID: string;
  commandInteractions: CommandInteraction[];
  constructor() {
    super(
      { ownerID: '329288617564569602' },
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
          Intents.FLAGS.GUILD_VOICE_STATES,
        ],
      },
    );

    this.slashCommands = commandList;
    this.clientID = '';
    this.commandInteractions = [];
    // Database provider stored on the client.
    this.settings = new MongooseProvider(guildModel);
    this.clips = new MongooseProvider(clipsModel);

    // Rate limit certain commands per guild in memory.
    // I don't think it's necessary to do this with the
    // database, it's not that crucial.
    // Key: guild.id
    // Value: Set<command>
    this.globalRates = new Map();

    this.commandHandler = new CommandHandler(this, {
      directory: './commands/',
      prefix: '!',
      defaultCooldown: 1000,
      allowMention: true,
      aliasReplacement: /-/g, // !thiscommandworks and !this-command-works
    });
    this.inhibitorHandler = new InhibitorHandler(this, {
      directory: './inhibitors/',
    });
    this.listenerHandler = new ListenerHandler(this, {
      directory: './listeners',
    });

    this.listenerHandler.setEmitters({
      commandHandler: this.commandHandler,
      inhibitorHandler: this.inhibitorHandler,
      listenerHandler: this.listenerHandler,
      process: process,
    });

    const app = express();

    app.use(cors());
    app.use(express.static(path.resolve(__dirname, './build')));
    app.use(express.json());
    app.post('/api/share-clip', async (req, res) => {
      // check for basic auth header
      if (!req.headers.authorization || req.headers.authorization.indexOf('Basic ') === -1) {
        return res.status(401).json({ message: 'Missing Authorization Header' });
      }

      // verify auth credentials
      const base64Credentials = req.headers.authorization.split(' ')[1];
      const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
      const [username, password] = credentials.split(':');

      if (
        username !== process.env.BOT_AUTH_USERNAME ||
        password !== process.env.BOT_AUTH_PASSWORD
      ) {
        return res.status(401).send({
          message: `Invalid credentials.`,
        });
      }

      const { userId, page, url } = req.body;
      if (!userId || !page || !url) {
        console.error('Missing params on share-clip request.');
        return res.status(400).end();
      }

      console.debug('share-clip: Fetching guilds');
      await this.guilds.fetch();
      const pisscord = this.guilds?.cache?.find(
        (guild: Guild) => guild.id === process.env.YKS_GUILD_ID,
      );
      console.debug('share-clip: Fetching channels');
      await pisscord?.channels.fetch();
      const clipChannel = pisscord?.channels?.cache?.find(
        (channel: Channel) => channel.id === process.env.YKS_CLIP_CHANNEL_ID,
      );
      console.debug('share-clip: Sending clip - ', Date.now());
      if (clipChannel?.isText()) {
        clipChannel
          ?.send({
            embeds: [
              { description: `<@${userId}> shared a clip from https://im-at.work/clips/${page}` },
            ],
            files: [url],
          })
          .then(() => console.info('share-clip: Message sent. - ', Date.now()));
      }
    });

    this.server = app.listen(process.env.PORT || 3000, () => {
      console.info('Server running on port: ' + process.env.PORT || 3000);
    });

    this.commandHandler.loadAll();
    this.commandHandler.useInhibitorHandler(this.inhibitorHandler);
    this.inhibitorHandler.loadAll();
    this.commandHandler.useListenerHandler(this.listenerHandler);
    this.listenerHandler.loadAll();
  }

  async login(token: string) {
    try {
      console.info('Initalizing settings model.');
      await this.settings.init();
      console.info('Initializing clips model.');
      await this.clips.init();
    } catch (e: any) {
      console.error(`Failed to initialize models: ${JSON.stringify(e)}`);
    }

    console.info('Logging on.');
    return super.login(token);
  }
}

mongoose
  .connect(
    `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PW}@cluster0.fnwjf.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    } as ConnectOptions,
  )
  .then(async () => {
    const client = new YKSSmartBot();
    await client.login(process.env.AUTH_TOKEN!);
  })
  .catch((err) => console.error(err));

export default YKSSmartBot;
