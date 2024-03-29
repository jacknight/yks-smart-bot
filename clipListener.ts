import { Message } from 'discord.js';
const { Listener } = require('discord-akairo');
import ClipsModel from './db/clips';
import { transcribeClip } from './transcribe';

class ClipListener extends Listener {
  constructor() {
    super('clip', {
      emitter: 'client',
      event: 'messageCreate',
    });
  }

  async exec(message: Message) {
    if (!message.guild) return;
    // Check if it's a clip posted to the clips channel, and if so, store
    // the link in the database.
    if (
      message.author.id !== this.client.user.id &&
      message.channel.id === process.env.YKS_CLIP_CHANNEL_ID &&
      message.attachments.size > 0
    )
      await Promise.all(
        message.attachments.map(async (attachment) => {
          const contentType = attachment.contentType?.split('/')[0];
          const url = attachment.proxyURL;
          if (contentType === 'video' || contentType === 'audio') {
            const truncatedUrl = url.split('?')[0];
            await ClipsModel.updateOne(
              { id: message.id },
              { $set: { id: message.id, url, truncatedUrl } },
              { upsert: true },
            );
            console.info(`Added new clip: ${url}`);
            const transcription = await transcribeClip(url);
            if (transcription) {
              console.log(transcription);
              await ClipsModel.updateOne({ id: message.id }, { $set: { transcription } });
            }
          }
        }),
      );
  }
}

module.exports = ClipListener;
