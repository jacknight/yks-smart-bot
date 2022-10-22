const { Command } = require('discord-akairo');

class EmmaCommand extends Command {
  constructor() {
    super('emma', {
      aliases: ['emma'],
      cooldown: 1000 * 60, // once per min
      ratelimit: 1,
    });
  }

  exec(message) {
    if (!this.client.globalRates.get(message.guild.id)) {
      this.client.globalRates.set(message.guild.id, new Set());
    }

    if (!this.client.globalRates.get(message.guild.id).has('emma')) {
      this.client.globalRates.get(message.guild.id).add('emma');
      const self = this;
      setTimeout(function () {
        self.client.globalRates.get(message.guild.id).delete('emma');
      }, 1000 * 60); // once per min

      const responses = [
        this.client.util.resolveEmoji('hornypest', message.guild.emojis.cache),
        this.client.util.resolveEmoji('hornytoo', message.guild.emojis.cache),
        this.client.util.resolveEmoji('emma', message.guild.emojis.cache),
        this.client.util.resolveEmoji('emma2', message.guild.emojis.cache),
        this.client.util.resolveEmoji('emma3', message.guild.emojis.cache),
      ];
      const response = responses[Math.floor(Math.random() * responses.length)];
      if (response) {
        message.channel.send(response.toString());
      }
    }
  }
}

module.exports = EmmaCommand;
