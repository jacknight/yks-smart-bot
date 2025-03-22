import { Message } from 'discord.js';

const { Command } = require('discord-akairo');

class FtpCommand extends Command {
  constructor() {
    super('ftp', {
      aliases: ['ftp'],
      cooldown: 1000 * 60, // once per min
      ratelimit: 1,
    });
  }

  exec(message: Message) {
    message.channel.send('https://discord.com/channels/641743927799447553/682325261978697732/1249099267927183391');
  }
}

module.exports = FtpCommand