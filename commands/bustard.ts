import { Message } from 'discord.js';

const { Command } = require('discord-akairo');

class BustardCommand extends Command {
  constructor() {
    super('bustard', {
      cooldown: 3600000,
      ratelimit: 1,
      regex: /^bustard$/i,
      category: 'eater-egg',
    });
  }

  exec(message: Message) {
    if (!message.guild) return;

    if (!this.client.globalRates.get(message.guild.id)) {
      this.client.globalRates.set(message.guild.id, new Set());
    }

    if (!this.client.globalRates.get(message.guild.id).has('bustard')) {
      this.client.globalRates.get(message.guild.id).add('bustard');
      const self = this;
      setTimeout(function () {
        self.client.globalRates.get(message.guild!.id).delete('bustard');
      }, 1000 * 60 * 60 * 12); // twice a day.
      message.channel.send('bustard');
    }
  }
}

module.exports = BustardCommand;
