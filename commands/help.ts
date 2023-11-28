import { Message } from 'discord.js';

const { Command } = require('discord-akairo');
class HelpCommand extends Command {
  constructor() {
    super('help', {
      aliases: ['help'],
      channel: 'guild',
      cooldown: 1000 * 60,
      ratelimit: 10,
      args: [
        {
          id: 'category',
          type: ['kickstarters', 'listen', 'other', 'none'],
          default: 'none',
        },
      ],
    });
  }

  exec(message: Message, { category }: { category: string }) {
    if (!message.guild) return;

    const kickstarterCommands = [
      {
        name: '`!kickstarter <name>` / `!ks <name>`',
        value: 'Generate a fake kickstarter using AI trained on 200k real kickstarters (GPT-3).',
      },
      {
        name: '`!realorfake` / `!rof`',
        value: 'Real or fake? You decide.',
      },
      {
        name: '`!topkickstarters` / `!topks`',
        value: 'List the top 10 fake kickstarters the AI has generated.',
      },
    ];

    const listenCommands = [
      {
        name: '`!listen`',
        value: 'Listen to the latest episode of the main feed.',
      },
      {
        name: '`!listen play <episode number>`',
        value: 'Listen to a specific episode of the main feed.',
      },
      {
        name: '`!listen random`',
        value: 'Listen to a random episode of the main feed.',
      },
      {
        name: '`!listen pause`',
        value: 'Pause the current episode being played.',
      },
      {
        name: '`!listen stop`',
        value: 'Stop the current episode being played.',
      },
    ];

    const clipChannel = this.client.util.resolveChannel(
      process.env.YKS_CLIP_CHANNEL_ID,
      message.guild.channels.cache,
    );

    const otherCommands = [
      {
        name: '`!latest <feed>`',
        value:
          'List the latest episodes.\nThe argument `<feed>` is optional and can be `main`, `bonus`, or `both`.',
      },
      {
        name: '`!best <episode number>`',
        value:
          'Let everyone know your favorite episode of the main feed.\nYou can change this later.\n_It goes by the episode number listed in the title_.',
      },
      {
        name: '`!clip` / `!climp`',
        value: `Grab a random clip that has been posted in ${
          clipChannel ? clipChannel : 'the clip channel'
        }.`,
      },
      {
        name: '`!topmail`',
        value: `List the top messages posted in the mailbag channel within the last 30 days.`,
      },
    ];

    const helpCommands = [
      {
        name: '`!help kickstarters`',
        value:
          'List all commands associated with AI-generated kickstarters, including real or fake',
      },
      {
        name: '`!help listen`',
        value: 'List all commands for listening to the podcast in voice chat',
      },
      {
        name: '`!help other`',
        value: 'List almost all other commands',
      },
    ];

    const helpEmbed = {
      color: 0x83c133,
      fields:
        category === 'kickstarters'
          ? kickstarterCommands
          : category === 'listen'
          ? listenCommands
          : category === 'other'
          ? otherCommands
          : helpCommands,
    };

    return message.channel.send({ embeds: [helpEmbed] });
  }
}

module.exports = HelpCommand;
