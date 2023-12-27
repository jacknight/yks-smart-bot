import { Message } from 'discord.js';

const { Listener } = require('discord-akairo');
import ClipsModel from '../db/clips';

class ClipListener extends Listener {
  constructor() {
    super('clip', {
      emitter: 'client',
      event: 'messageCreate',
    });
  }

  async exec(message: Message) {
    // Check if it's a clip posted to the clips channel, and if so, store
    // the link in the database.
    if (
      message.author.id !== this.client.user.id &&
      message.channel.id === process.env.YKS_CLIP_CHANNEL_ID &&
      message.attachments.size > 0
    )
      await Promise.all(
        message.attachments.map(async (attachment) => {
          const url = attachment.proxyURL.split('?')[0];
          const filetype = url.split('.').pop();
          if (
            filetype === 'mov' ||
            filetype === 'mp4' ||
            filetype === 'webm' ||
            filetype === 'wav' ||
            filetype === 'mp3' ||
            filetype === 'ogg'
          ) {
            if (!message.guild) return;
            await ClipsModel.updateOne({ id: url }, { $set: { id: url } }, { upsert: true });
            console.info(`Added new clip: ${url}`);
          }
        }),
      );
  }
}

module.exports = ClipListener;
