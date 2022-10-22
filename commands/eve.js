const { Command } = require('discord-akairo');

class EveCommand extends Command {
  constructor() {
    super('eve', {
      aliases: ['eve'],
      cooldown: 1000 * 60, // once per min
      ratelimit: 1,
    });
  }

  exec(message) {
    if (!this.client.globalRates.get(message.guild.id)) {
      this.client.globalRates.set(message.guild.id, new Set());
    }

    if (!this.client.globalRates.get(message.guild.id).has('eve')) {
      this.client.globalRates.get(message.guild.id).add('eve');
      const self = this;
      setTimeout(function () {
        self.client.globalRates.get(message.guild.id).delete('eve');
      }, 1000 * 60); // once per min

      message.channel.send('Who?');
    }
  }
}

module.exports = EveCommand;
