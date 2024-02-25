import { Message } from 'discord.js';
import clipModel from '../db/clips';

const axios = require('axios');
const { Command } = require('discord-akairo');

class ClipCommand extends Command {
  constructor() {
    super('clip', {
      aliases: ['clip', 'clips', 'randomclip', 'climp', 'climps', 'randomclimp'],
      cooldown: 1000 * 60, // once per min
      ratelimit: 1,
    });
  }

  async checkLink(url: string) {
    const result = { valid: false, remove: false };
    try {
      console.debug('1. Checking URL:', url);
      await axios.get(url.replace('cdn.discordapp.com', 'media.discordapp.net'));
      console.debug("2. Successfully GET'ed URL.");
      result.valid = true;
      result.remove = false;
    } catch (e: any) {
      console.error('Failed to GET URL: ', e);
      if (e?.response?.status === 404) {
        console.error('Soft removing url from clips: ', url);
        result.remove = true;
        result.valid = false;
      }
    }
    return result;
  }

  async exec(message: Message & { isViaSite: boolean; clip: number }) {
    if (!message.guild) return;
    let foundValidLink = false;
    let url = '';
    while (!foundValidLink) {
      const clip = (await clipModel.aggregate([{ $sample: { size: 1 } }])).pop();

      if (clip.deleted) continue;

      url = clip.id;
      const result = await this.checkLink(url);
      foundValidLink = result.valid;

      // Remove from clips if it threw a 404 (someone deleted the post)
      if (result.remove) {
        const loc = await clipModel.updateOne({ id: clip.id, deleted: true });
      }
    }

    if (url) {
      return message.channel.send({ files: [url] });
    }
    return null;
  }
}

module.exports = ClipCommand;
