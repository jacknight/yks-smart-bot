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
      mailbagMessages = mailbagMessages.slice(0, count);
      const embed = {
        color: 0x83c133,
        title: `__Top ${count} Mailbag Messages__\n`,
        fields: [],
      };
      for (let i = 1; i <= count; i++) {
        const msgId = JSON.parse(mailbagMessages[i - 1]).id;
        const path = `${process.env.YKS_GUILD_ID}/${process.env.YKS_MAILBAG_CHANNEL_ID}/${msgId}`;

        const mailbagChannel = await this.client.util.resolveChannel(
          process.env.YKS_MAILBAG_CHANNEL_ID,
          message.guild.channels.cache
        );
        if (mailbagChannel) {
          const msg = await mailbagChannel.messages.fetch(msgId);
          if (msg) {
            embed.fields.push({
              name: `${i}. From ${msg.author.username}`,
              value: `[${msg.content}](https://discord.com/channels/${path})`,
            });
          }
        }
      }
      message.channel.send({ embed });
    }
  }
}

module.exports = TopMailbagCommand;
