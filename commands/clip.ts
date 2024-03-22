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
      if (clip.deleted) continue;
      url = clip.id;
    }

    if (url) {
      return message.channel.send({ content: url });
    }
    return null;
  }
}

module.exports = ClipCommand;
