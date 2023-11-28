import { Message } from 'discord.js';

const { Command } = require('discord-akairo');

class GrogCommand extends Command {
  constructor() {
    super('grog', {
      cooldown: 3600000,
      ratelimit: 1,
      regex: /^grog$/i,
      category: 'eater-egg',
    });
  }

  exec(message: Message) {
    if (!message.guild) return;

    if (!this.client.globalRates.get(message.guild.id)) {
      this.client.globalRates.set(message.guild.id, new Set());
    }

    if (!this.client.globalRates.get(message.guild.id).has('grog')) {
      this.client.globalRates.get(message.guild.id).add('grog');
      const self = this;
      setTimeout(function () {
        self.client.globalRates.get(message.guild!.id).delete('grog');
      }, 1000 * 60 * 60 * 12); // twice a day.
      message.channel.send('grog');
    }
  }
}

module.exports = GrogCommand;
