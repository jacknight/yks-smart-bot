import { Message } from 'discord.js';

const { Command } = require('discord-akairo');

class BongoCommand extends Command {
  constructor() {
    super('bo', {
      aliases: ['bo'],
      cooldown: 1000 * 60 * 60, // once per hour
      ratelimit: 1,
    });
  }

  exec(message: Message) {
    message.reply('<@225822701132972034> can you handle this please.');
  }
}

module.exports = BongoCommand;
