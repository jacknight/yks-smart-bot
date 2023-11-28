import { Message } from 'discord.js';

const { Command } = require('discord-akairo');

class MusicCommand extends Command {
  constructor() {
    super('music', {
      aliases: ['music', 'soundtrack', 'songs', 'soundcloud'],
      cooldown: 1000 * 60, // once per min
      ratelimit: 1,
    });
  }

  exec(message: Message) {
    if (!message.guild) return;
    message.channel.send('https://soundcloud.com/ykspod');
  }
}

module.exports = MusicCommand;
