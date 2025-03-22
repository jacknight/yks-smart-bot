import { Message } from 'discord.js';

const { Command } = require('discord-akairo');

class AmogusCommand extends Command {
  constructor() {
    super('amogus', {
      aliases: ['amogus', 'frustrating'],
      cooldown: 1000 * 60, // once per min
      ratelimit: 1,
    });
  }

  exec(message: Message) {
    if (!message.guild || !message.member) return;

    if (!this.client.globalRates.get(message.guild.id)) {
      this.client.globalRates.set(message.guild.id, new Set());
    }

    if (!this.client.globalRates.get(message.guild.id).has('amogus')) {
      this.client.globalRates.get(message.guild.id).add('amogus');
      const self = this;
      setTimeout(function () {
        self.client.globalRates.get(message.guild!.id).delete('amogus');
      }, 1000 * 60 * 60 * 24); // once per day

      message.channel
        .send(`Hey everybody, for real, playing to frustrate each other is not a fun way to play because we're all on the same team and that team is to have fun together and to make it fun for all our audiences. And so when people make plays just to frustrate each other and just to troll each other, there's enough of that in the world today, of people trolling each other just to be mean and to be hurtful, and if we're gonna play in this space together we need to do it because we want each other to have fun and not because we're trying to frustrate each other, cause there's enough frustrating things in the world right now and there's enough we can't control, and one of the things we can control is that everyone is here to have fun and not waste each others' time and so when we make decisions that are meant to troll each other, that's something that bad people do.`);
    }
  }
}

module.exports = AmogusCommand;