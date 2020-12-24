const { Command } = require("discord-akairo");

class HelpCommand extends Command {
  constructor() {
    super("help", {
      aliases: ["help", "buzz.help"],
      channel: "guild",
      cooldown: 60000,
      ratelimit: 1,
      ignoreCooldown: ["329288617564569602"], // me :)
    });
  }

  exec(message) {
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

    const helpEmbed = {
      color: 0x83c133,
      title: "Help",
      author: {
        icon_url:
          "https://res.cloudinary.com/pippa/image/fetch/h_500,w_500,f_auto/https://assets.pippa.io/shows/5d137ece8b774eb816199f63/1562125598000-ef38e8a9cd086f609f806209d1341102.jpeg",
        url: "https://shows.acast.com/yourkickstartersucks",
      },
      thumbnail: {
        url:
          "https://res.cloudinary.com/pippa/image/fetch/h_500,w_500,f_auto/https://assets.pippa.io/shows/5d137ece8b774eb816199f63/1562125598000-ef38e8a9cd086f609f806209d1341102.jpeg",
      },
      fields: [
        {
          name: "Buzz in",
          value: "!heep",
          inline: false,
        },
        {
          name: "Change buzzer channel",
          value: `!buzz.channel ${buzzerChannel}`,
          inline: false,
        },
        {
          name: "Change bot nickname",
          value: `!buzz.nick "${this.client.user.username}"`,
          inline: false,
        },
        {
          name: "Toggle buzzer mode",
          value: "!buzz.mode",
          inline: false,
        },
        {
          name: "Enable/disable buzzer",
          value: "!buzz.ready",
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
