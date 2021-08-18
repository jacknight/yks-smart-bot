const { Command } = require("discord-akairo");

class TopMailbagCommand extends Command {
  constructor() {
    super("topmailbag", {
      aliases: ["topmailbag", "topmail", "bestmailbag", "bestmail"],
      cooldown: 1000 * 60 * 60, // once per hour
      ratelimit: 1,
    });
  }

  async exec(message) {
    let mailbagMessages = await this.client.settings.get(
      message.guild.id,
      "mailbagMessages",
      []
    );

    if (mailbagMessages.length > 0) {
      const count = mailbagMessages.length < 10 ? mailbagMessages.length : 10;
      // Array should already be sorted descending by count.
      mailbagMessages = mailbagMessages.slice(0, count);
      let totalString = `__Top ${count} Mailbag Messages__\n`;
      for (let i = 1; i <= count; i++) {
        const path = `${process.env.YKS_GUILD_ID}/${
          process.env.YKS_MAILBAG_CHANNEL_ID
        }/${JSON.parse(mailbagMessages[i - 1]).id}`;

        totalString += `${i}. https://discord.com/channels/${path}\n`;
      }
      message.channel.send(totalString);
    }
  }
}

module.exports = TopMailbagCommand;
