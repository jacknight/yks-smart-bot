const { Command } = require('discord-akairo');
const ellipsis = require('text-ellipsis');

class TopMailbagCommand extends Command {
  constructor() {
    super('topmailbag', {
      aliases: ['topmailbag', 'topmail', 'bestmailbag', 'bestmail'],
      cooldown: 1000 * 60 * 60, // once per hour
      ratelimit: 1,
    });
  }

  async exec(message) {
    let mailbagMessages = await this.client.settings.get(message.guild.id, 'mailbagMessages', []);

    if (mailbagMessages.length > 0) {
      // Sort descending
      mailbagMessages.sort((a, b) => JSON.parse(b).count - JSON.parse(a).count);
      const count = mailbagMessages.length < 10 ? mailbagMessages.length : 10;
      const embed = {
        color: 0x83c133,
        title: '__Top Mailbag Messages (Last 30 Days)__\n',
        fields: [],
      };
      let skip = 0;
      for (let i = 1; i <= count + skip && i <= mailbagMessages.length; i++) {
        const msgId = JSON.parse(mailbagMessages[i - 1]).id;
        const path = `${process.env.YKS_GUILD_ID}/${process.env.YKS_MAILBAG_CHANNEL_ID}/${msgId}`;

        const mailbagChannel = await this.client.util.resolveChannel(
          process.env.YKS_MAILBAG_CHANNEL_ID,
          message.guild.channels.cache,
        );
        if (mailbagChannel) {
          const msg = await mailbagChannel.messages.fetch(msgId);
          const url = `https://discord.com/channels/${path}`;
          if (msg) {
            if (msg.author.id === this.client.user.id) {
              skip++;
              continue;
            }

            embed.fields.push({
              name: `${i - skip}. From ${msg.author.username}`,
              value: ellipsis(`[Jump to message](${url})\n${msg.content}`, 1024),
            });
          }
        }
      }
      message.channel.send({ embeds: [embed] });
    }
  }
}

module.exports = TopMailbagCommand;
