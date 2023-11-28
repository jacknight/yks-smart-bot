import { Message } from 'discord.js';

const { Inhibitor } = require('discord-akairo');

class BlacklistInhibitor extends Inhibitor {
  constructor() {
    super('blacklist', {
      reason: 'blacklist',
    });
  }

  exec(message: Message) {
    const blacklist: string[] = [];
    return blacklist.includes(message.author.id);
  }
}

module.exports = BlacklistInhibitor;
