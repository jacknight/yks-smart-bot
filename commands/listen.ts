import { Message } from 'discord.js';

const { Command } = require('discord-akairo');
const Parser = require('rss-parser');
const parser = new Parser();
const MAIN_FEED_RSS = process.env.MAIN_FEED_RSS;
const {
  joinVoiceChannel,
  AudioPlayerStatus,
  createAudioResource,
  VoiceConnectionStatus,
  entersState,
  StreamType,
} = require('@discordjs/voice');
const prettyMilliseconds = require('pretty-ms');

class ListenCommand extends Command {
  constructor() {
    super('listen', {
      aliases: ['listen'],
      args: [
        {
          id: 'action',
          type: 'string',
          default: 'play',
        },
        {
          id: 'episode',
          type: 'content',
          default: '0',
        },
      ],
    });
  }

  async exec(message: Message, { action, episode }: { action: string; episode: string | number }) {
    if (!message.guild || !message.member) return;

    let respond = async (response: any) => {
      if (this.client.listen.response) {
        this.client.listen.response.edit(response);
      } else {
        this.client.listen.response = await this.client.listen.message.reply(response);
      }
    };

    if (
      action !== 'play' &&
      action !== 'random' &&
      action !== 'url' &&
      this.client.listen.player.state.status === AudioPlayerStatus.Idle
    ) {
      return message.channel.send('Nothing playing.');
    }

    if (action !== 'url') {
      episode = parseInt(episode as string);
    }

    if (this.client.listen.player.state.status !== AudioPlayerStatus.Idle) {
      switch (action) {
        case 'random':
        case 'url':
          return respond('Stop the current episode first.');

        case 'play':
          if (
            this.client.listen.player.state.status === AudioPlayerStatus.Paused ||
            this.client.listen.player.state.status === AudioPlayerStatus.AutoPaused
          ) {
            if (episode === 0) {
              // No arg passed
              this.client.listen.player.unpause();
              return;
            }
          }
          return respond('Stop the current episode first.');

        case 'pause':
          this.client.listen.player.pause();
          return;

        case 'stop':
          this.client.listen.player.stop(true);
          return;

        default:
          return respond('Not a valid option for the command `!listen`.');
      }
    }

    let mainFeed = await parser
      .parseURL(MAIN_FEED_RSS)
      .catch((e: any) => console.error('Failed to parse main feed RSS: ', e.message));

    // Sometimes bonus episodes and other things get released into the main feed
    // We need to filter those out.
    mainFeed = mainFeed.items.filter((ep: any) => ep.title.match(/ [0-9]+:/));
    // url: "https://<path>.mp3"
    // length: "<milliseconds>"
    // type: "audio/mpeg"
    let ep = mainFeed[0];
    if (action === 'random') {
      episode = Math.floor(Math.random() * mainFeed.length);
      // Episode 101 doesn't exist.
      if (episode > 100) episode++;
    } else if (action === 'url') {
      ep = {
        enclosure: { url: episode },
        title: `Episode 1: ${episode}`,
        itunes: { duration: '1:00' },
      };
    }

    if (typeof episode === 'number' && episode > 0) {
      const mainArray = mainFeed[0].title.split(':');
      const latestEpNum = Number(mainArray[0].trim().split(' ')[1]);
      if (episode > latestEpNum) {
        ep = null;
      }
      const item = mainFeed.find((ep: any, idx: number) => {
        return ep.title.includes(` ${episode}:`);
      });
      if (item) {
        ep = item;
      } else {
        ep = null;
      }
    }
    if (!ep) {
      return message.channel.send(`Couldn't find episode ${episode}.`);
    }

    if (!message.member.voice.channel)
      return message.channel.send('Please join a voice channel first.');

    // Join the same channel as the member
    const channel = message.member.voice.channel;
    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
    });

    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 30000);
      this.client.listen.connection = connection;
      this.client.listen.connection.subscribe(this.client.listen.player);

      const resource = createAudioResource(ep.enclosure.url, {
        inputType: StreamType.Arbitrary,
      });
      this.client.listen.player.play(resource);
    } catch (e) {
      message.channel.send('Failed to join the voice channel');
      connection?.destroy();
      this.client.listen.connection = null;
      console.error(e);
    }

    this.client.listen.player.on(AudioPlayerStatus.Idle, (oldState: any, newState: any) => {
      if (oldState.status === newState.status) return;
      clearInterval(this.client.listen.interval);
      respond('Finished playing episode.');
      this.client.listen.connection?.destroy();
      this.client.listen.connection = null;
      this.client.listen.player.removeAllListeners();
      this.client.listen.embed = null;
      this.client.listen.message = null;
      this.client.listen.response = null;
    });

    this.client.listen.player.on(AudioPlayerStatus.Paused, (oldState: any, newState: any) => {
      if (oldState.status === newState.status) return;
      respond(`Paused at ${prettyMilliseconds(newState.playbackDuration)}.`);
    });

    this.client.listen.player.on(AudioPlayerStatus.Buffering, () => {});

    this.client.listen.player.on(AudioPlayerStatus.Playing, (oldState: any, newState: any) => {
      if (oldState.status === newState.status) return;
      if (
        oldState.status === AudioPlayerStatus.Paused ||
        oldState.status === AudioPlayerStatus.AutoPaused
      ) {
        respond('Resuming.');
      }
    });

    this.client.listen.player.on('error', console.error);

    const epNum = ep.title.match(/Episode [0-9]+/i);
    let epTitle =
      ep.title.substring(0, epNum.index) +
      ep.title
        .substring(epNum.index + epNum[0].length)
        .split(':')
        .join(' ');

    const duration =
      1000 *
      ep.itunes.duration.split(':').reduce((totalMs: string, curr: string) => {
        return Number(totalMs) * 60 + Number(curr);
      });
    let progressStr = '------------------------';
    let mainEmbed = {
      color: 0x83c133,
      title: `Now playing in ${message.member.voice.channel.name}`,
      author: {
        icon_url:
          'https://content.production.cdn.art19.com/images/c8/38/41/df/c83841df-2683-4baf-8959-28a8e7d66774/3e98f6d3fffcf5ebd7e02df5609cfe5fe9997e62f24382a26649e59061a6d029a0e16417689b0ccd00f7fc7638344abe1f61bc8d9e3c7235e4e60f43efec8c38.jpeg',
        url: 'https://art19.com/shows/your-kickstarter-sucks',
      },
      thumbnail: {
        url: 'https://content.production.cdn.art19.com/images/c8/38/41/df/c83841df-2683-4baf-8959-28a8e7d66774/3e98f6d3fffcf5ebd7e02df5609cfe5fe9997e62f24382a26649e59061a6d029a0e16417689b0ccd00f7fc7638344abe1f61bc8d9e3c7235e4e60f43efec8c38.jpeg',
      },
      fields: [
        {
          name: epNum[0],
          value: epTitle ? epTitle : '.',
          inline: false,
        },
        {
          name: `Progress (${prettyMilliseconds(0, {
            colonNotation: true,
          })} / ${prettyMilliseconds(duration, { colonNotation: true })})`,
          value: '|' + '🟢' + progressStr + '|',
          inline: false,
        },
      ],
    };

    this.client.listen.embed = mainEmbed;

    this.client.listen.message = await message.channel
      .send({ embeds: [mainEmbed] })
      .catch((err) => console.error(err));

    await this.client.listen.message.react('⏸');
    await this.client.listen.message.react('⏹');
    await this.client.listen.message.react('▶️');
    const listen = this.client.listen;
    this.client.listen.interval = setInterval(
      () => {
        listen.embed.fields[1].name = `Progress (${prettyMilliseconds(
          listen.player.state.playbackDuration ? listen.player.state.playbackDuration : 0,
          { colonNotation: true },
        )} / ${prettyMilliseconds(duration, { colonNotation: true })})`;

        const progress = Math.ceil((100 * listen.player.state.playbackDuration) / duration / 4);

        listen.embed.fields[1].value =
          '\\|' +
          '||' +
          progressStr.substring(0, progress) +
          '||' +
          '🟢' +
          progressStr.substring(progress) +
          '\\|';
        listen.message.edit({ embeds: [listen.embed] });
      },
      10 * 1000, // every 10 sec
      // @ts-ignore
      duration,
      progressStr,
      listen,
    );
  }
}

module.exports = ListenCommand;
