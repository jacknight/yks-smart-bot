import { Message } from 'discord.js';

const { Command } = require('discord-akairo');

class CunkyCommand extends Command {
  constructor() {
    super('cunky', {
      cooldown: 3600000,
      ratelimit: 1,
      regex: /^cunky$/i,
      category: 'eater-egg',
    });
  }

  exec(message: Message) {
    if (!message.guild) return;

    if (!this.client.globalRates.get(message.guild.id)) {
      this.client.globalRates.set(message.guild.id, new Set());
    }

    if (!this.client.globalRates.get(message.guild.id).has('cunky')) {
      this.client.globalRates.get(message.guild.id).add('cunky');
      const self = this;
      setTimeout(function () {
        self.client.globalRates.get(message.guild!.id).delete('cunky');
      }, 1000 * 60 * 60 * 12); // twice a day.
      message.channel.send('cunky');
    }
  }
}

module.exports = CunkyCommand;
