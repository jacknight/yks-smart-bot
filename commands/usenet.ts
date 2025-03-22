import { Message } from 'discord.js';

const { Command } = require('discord-akairo');

class UsenetCommand extends Command {
  constructor() {
    super('usenet', {
      aliases: ['usenet', 'stealing'],
      cooldown: 1000 * 60, // once per min
      ratelimit: 1,
    });
  }

  exec(message: Message) {
    message.channel.send('https://discord.com/channels/641743927799447553/682325261978697732/1140406217836081222');
  }
}

module.exports = UsenetCommand