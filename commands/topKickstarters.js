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
      const count = kickstarters.length < 10 ? kickstarters.length : 10;
      // Array should already be sorted descending by count.
      kickstarters = kickstarters.slice(0, count);
      let totalString = `__Top ${count} Kickstarters__\n`;
      for (let i = 1; i <= count; i++) {
        const path = `${process.env.YKS_GUILD_ID}/${
          process.env.YKS_KICKSTARTER_BOT_CHANNEL_ID
        }/${JSON.parse(kickstarters[i - 1]).id}`;

        totalString += `${i}. https://discord.com/channels/${path}\n`;
      }
      message.channel.send(totalString);
    }
  }
}

module.exports = TopKickstartersCommand;
