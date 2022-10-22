const { Command } = require('discord-akairo');
const { getHelpEmbed } = require('../util');
class HelpCommand extends Command {
  constructor() {
    super('help', {
      aliases: ['help', 'buzz.help'],
      channel: 'guild',
      cooldown: 1000 * 60,
      ratelimit: 10,
      args: [
        {
          id: 'category',
          type: ['buzzer', 'kickstarters', 'listen', 'other', 'none'],
          default: 'none',
        },
      ],
    });
  }

  exec(message, { category }) {
    const buzzerRoleName = this.client.settings.get(message.guild.id, 'buzzerRole', 'buzzer');
    let buzzerRole = this.client.util.resolveRole(
      buzzerRoleName,
      message.guild.roles.cache,
      false,
      true,
    );
    if (!buzzerRole) buzzerRole = '@' + buzzerRoleName;

    const buzzerChannelID = JSON.parse(
      this.client.settings.get(message.guild.id, 'buzzerChannel', JSON.stringify(message.channel)),
    ).id;

    const buzzerChannel = this.client.util.resolveChannel(
      buzzerChannelID,
      message.guild.channels.cache,
    );

    const buzzerNick = message.guild.me.nickname
      ? message.guild.me.nickname
      : message.guild.me.user.username;

    const buzzerCommands = [
      {
        name: '`!heep` / `!meep`',
        value: 'Buzz in.',
      },
      {
        name: `\`!buzz.role @${buzzerRoleName}\``,
        value: `Configure the role required to control the buzzer.
**Requires**: Admin privileges or the ${buzzerRole} role.`,
      },
      {
        name: `\`!buzz.list\``,
        value: `List all the current users that have buzzed in.
**Requires**: The ${buzzerRole} role.`,
      },
      {
        name: `\`!buzz.random\``,
        value: `Randomize the list of users buzzed in.
**Requires**: The ${buzzerRole} role.`,
      },
      {
        name: `\`!buzz.clear\``,
        value: `Clear the buzzer list.
**Requires**: The ${buzzerRole} role.`,
      },
      {
        name: `\`!buzz.mode\``,
        value: `Toggle the buzzer mode between **normal** and **chaos** mode. In chaos mode, the list is randomized every time someone new buzzes in.
**Requires**: The ${buzzerRole} role.`,
      },
      {
        name: `\`!buzz.ready\``,
        value: `Enable/disable the buzzer.
**Requires**: The ${buzzerRole} role.`,
      },
      {
        name: `\`!buzz.channel #${buzzerChannel ? buzzerChannel.name : '<not set>'}\``,
        value: `Change the channel of the buzzer channel. Currently ${
          buzzerChannel ? `set to ${buzzerChannel}.` : 'not set.'
        }
**Requires**: The ${buzzerRole} role.`,
      },
      {
        name: `\`!buzz.nick "${buzzerNick}"\``,
        value: `Change the name of ${this.client.user}. Use the command with no nickname to reset.
**Requires**: The ${buzzerRole} role.`,
      },
    ];

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
        name: '`!help buzzer`',
        value: 'List all the buzzer commands',
      },
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
        category === 'buzzer'
          ? buzzerCommands
          : category === 'kickstarters'
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

const helpCommands = [
  {
    name: '`!help buzzer`',
    value: 'List all the buzzer commands',
  },
  {
    name: '`!help kickstarters`',
    value: 'List all commands associated with AI-generated kickstarters, including real or fake',
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

module.exports = HelpCommand;
