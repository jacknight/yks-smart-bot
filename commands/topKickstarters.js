const { Command } = require("discord-akairo");

class TopKickstartersCommand extends Command {
  constructor() {
    super("topkickstarters", {
      aliases: ["topkickstarters", "bestkickstarters", "topks", "bestks"],
      cooldown: 1000 * 60 * 60, // once per hour
      ratelimit: 1,
    });
  }

  async exec(message) {
    let kickstarters = await this.client.settings.get(
      message.guild.id,
      "kickstarters",
      []
    );

    if (kickstarters.length > 0) {
      // Sort, descending
      kickstarters.sort((a, b) => JSON.parse(b).count - JSON.parse(a).count);
      const count = kickstarters.length < 10 ? kickstarters.length : 10;
      // Array should already be sorted descending by count.
      const embed = {
        color: 0x83c133,
        title: `__Top ${count} Kickstarters__\n`,
        fields: [],
      };
      for (let i = 1; i <= count; i++) {
        const msgId = JSON.parse(kickstarters[i - 1]).id;
        const path = `${process.env.YKS_GUILD_ID}/${process.env.YKS_KICKSTARTER_BOT_CHANNEL_ID}/${msgId}`;

        const kickstarterChannel = await this.client.util.resolveChannel(
          process.env.YKS_KICKSTARTER_BOT_CHANNEL_ID,
          message.guild.channels.cache
        );
        if (kickstarterChannel) {
          const msg = await kickstarterChannel.messages.fetch(msgId);
          if (msg) {
            embed.fields.push({
              name: `${i}: ${msg.embeds[0].title}`,
              value: `[Jump to message](https://discord.com/channels/${path})\n${msg.embeds[0].description}`,
            });
          }
        }
      }
      message.channel.send({ embed });
    }
  }
}

module.exports = TopKickstartersCommand;
