import { Message } from 'discord.js';

const { Command } = require('discord-akairo');

class CunchCommand extends Command {
  constructor() {
    super('cunch', {
      cooldown: 3600000,
      ratelimit: 1,
      regex: /^cunch/i,
      category: 'eater-egg',
    });
  }

  exec(message: Message) {
    if (!message.guild) return;

    if (!this.client.globalRates.get(message.guild.id)) {
      this.client.globalRates.set(message.guild.id, new Set());
    }

    if (!this.client.globalRates.get(message.guild.id).has('cunch')) {
      this.client.globalRates.get(message.guild.id).add('cunch');
      const self = this;
      setTimeout(function () {
        self.client.globalRates.get(message.guild!.id).delete('cunch');
      }, 1000 * 60 * 60 * 12); // twice a day.
      message.channel.send('cunch wrap supreme');
    }
  }
}

module.exports = CunchCommand;