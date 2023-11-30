import { Message, MessageAttachment } from 'discord.js';
import slugify from 'slugify';

const { Command } = require('discord-akairo');
import { getKickstarterEmbed, getAIResponse, undoRateLimit } from '../util';

class KickstarterCommand extends Command {
  constructor() {
    super('kickstarter', {
      aliases: ['kickstarter', 'ks'],
      cooldown: 1000 * 60 * 60 * 24, // once per day
      ratelimit: 4,
      args: [{ id: 'name', match: 'content' }],
    });
  }

  async exec(message: Message, { name }: { name: string }) {
    if (!message.guild || !message.member) return;

    if (!name) name = '';

    // Only allow in the #kickstarter-bot channel on the YKS server
    if (
      message.channel.id !== process.env.YKS_KICKSTARTER_BOT_CHANNEL_ID ||
      message.guild.id !== process.env.YKS_GUILD_ID
    ) {
      const channel = this.client.util.resolveChannel(
        process.env.YKS_KICKSTARTER_BOT_CHANNEL_ID,
        message.guild.channels.cache,
      );
      return message.channel.send(`Please use ${channel} for this command`);
    }

    if (name.length > 80) {
      undoRateLimit(this.client, message.member.id, this.id);
      return message.channel.send('Shorten it up, please.');
    }

    // Prompt passed muster, go ahead with our fine tuned model.
    const response = await getAIResponse(name, message.member.id);

    const completion = response.data.choices[0].text;
    const { embed, rawImage } = await getKickstarterEmbed(completion, false);
    if (embed) {
      let attachment = null;
      if (rawImage) {
        const buffer = Buffer.from(rawImage, 'base64');
        attachment = new MessageAttachment(buffer, `temp-${slugify(name)}.jpg`);
        embed.setImage(`attachment://temp-${slugify(name)}.jpg`);
      }
      return message.channel.send({
        embeds: [embed],
        ...(attachment && { files: [attachment] }),
      });
    } else {
      undoRateLimit(this.client, message.member.id, this.id);
      console.log(completion);
      return message.channel.send('Something went wrong');
    }
  }
}

module.exports = KickstarterCommand;
