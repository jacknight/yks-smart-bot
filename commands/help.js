const { Command } = require("discord-akairo");

class HelpCommand extends Command {
  constructor() {
    super("help", {
      aliases: ["help", "buzz.help"],
      channel: "guild",
      cooldown: 60000,
      ratelimit: 1,
    });
  }

  exec(message) {
    const buzzerRoleName = this.client.settings.get(
      message.guild.id,
      "buzzerRole",
      "buzzer"
    );
    let buzzerRole = this.client.util.resolveRole(
      buzzerRoleName,
      message.guild.roles.cache,
      false,
      true
    );
    if (!buzzerRole) buzzerRole = "@" + buzzerRoleName;

    const buzzerChannelID = JSON.parse(
      this.client.settings.get(
        message.guild.id,
        "buzzerChannel",
        JSON.stringify(message.channel)
      )
    ).id;

    const buzzerChannel = this.client.util.resolveChannel(
      buzzerChannelID,
      message.guild.channels.cache
    );

    const buzzerNick = message.guild.me.nickname
      ? message.guild.me.nickname
      : message.guild.me.user.username;

    const helpEmbed = {
      color: 0xffff00,
      title: "Help",
      author: {
        icon_url:
          "https://raw.githubusercontent.com/jacknight/buzzer/main/assets/bolt.png?token=AAEN3TXSCUCW6TQNMO3JAOS75R4G2",
        url: "https://buzzerd.herokuapp.com",
      },
      thumbnail: {
        url:
          "https://raw.githubusercontent.com/jacknight/buzzer/main/assets/bolt.png?token=AAEN3TXSCUCW6TQNMO3JAOS75R4G2",
      },
      fields: [
        {
          name: "List latest episodes",
          value: "`!latest`",
          inline: false,
        },
        {
          name: "Best episode",
          value: "`!best <episode number>`",
          inline: false,
        },
        {
          name: "Buzz in",
          value: "`!heep`",
          inline: false,
        },
        {
          name: "Configure buzzer role",
          value: `\`!buzz.role\` ${buzzerRole} `,
          inline: false,
        },
        {
          name: `Display the buzzer list`,
          value: `\`!buzz.list\` (${buzzerRole} only)`,
          inline: false,
        },
        {
          name: `Randomize the buzzer list`,
          value: `\`!buzz.random\` (${buzzerRole} only)`,
          inline: false,
        },
        {
          name: `Clear the buzzer list`,
          value: `\`!buzz.clear\` (${buzzerRole} only)`,
          inline: false,
        },
        {
          name: `Toggle buzzer mode (chaos/normal)`,
          value: `\`!buzz.mode\` (${buzzerRole} only)`,
          inline: false,
        },
        {
          name: `Enable/disable buzzer`,
          value: `\`!buzz.ready\` (${buzzerRole} only)`,
          inline: false,
        },
        {
          name: `Change buzzer channel`,
          value: `\`!buzz.channel #${buzzerChannel.name}\` (${buzzerRole} only)`,
          inline: false,
        },
        {
          name: `Change bot nickname`,
          value: `\`!buzz.nick "${buzzerNick}"\` (${buzzerRole} only)`,
          inline: false,
        },
      ],
      timestamp: new Date(),
      footer: {
        text: "Created by Jack Knight",
        icon_url:
          "https://cdn.discordapp.com/avatars/329288617564569602/ef0db6f6c0f10ff08c125c77acab390d.png",
      },
    };
    return message.channel.send({ embed: helpEmbed });
  }
}

module.exports = HelpCommand;
