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

  async exec(message: Message & { isViaSite: boolean; clip: number }) {
    if (!message.guild) return;
    let url = '';
    let count = 100;
    while (count) {
      count--;
      const clip = (await clipModel.aggregate([{ $sample: { size: 1 } }])).pop();
      const msg = await message.channel.messages.fetch(clip.id);
      if (msg && msg.attachments.size > 0) {
        const attachment = msg.attachments.at(Math.floor(Math.random() * msg.attachments.size));
        if (attachment) {
          url = attachment?.proxyURL;
          break;
        }
      }
    }

    if (url) {
      return message.channel.send({ files: [url] });
    }
    return null;
  }
}

module.exports = ClipCommand;
