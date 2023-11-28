import { Message } from 'discord.js';

const { Command } = require('discord-akairo');

class BongoCommand extends Command {
  constructor() {
    super('bongo', {
      aliases: ['bongo'],
      cooldown: 1000 * 60, // once per min
      ratelimit: 1,
    });
  }

  exec(message: Message) {
    message.channel.send('https://ghostbongo.bigcartel.com');
  }
}

module.exports = BongoCommand;
