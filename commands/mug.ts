import { Message } from 'discord.js';

const { Command } = require('discord-akairo');
const { random } = require('lodash');

const globalToday = new Date();
class MugCommand extends Command {
  constructor() {
    super('mug', {
      aliases: ['mug', 'burgymug'],
      ...((globalToday.getDate() !== 7 || globalToday.getMonth() !== 3) && {
        cooldown: 1000 * 60,
        rateLimit: 1,
      }),
    });
  }

  exec(message: Message) {
    if (!message.guild) return;
    if (!this.client.globalRates.get(message.guild.id)) {
      this.client.globalRates.set(message.guild.id, new Set());
    }

    if (!this.client.globalRates.get(message.guild.id).has('mug')) {
      this.client.globalRates.get(message.guild.id).add('mug');
      const self = this;
      setTimeout(function () {
        self.client.globalRates.get(message.guild!.id).delete('mug');
      }, 1000 * 60); // once per min

      const mugs = ['${HOME}/assets/mug.png', '${HOME}/assets/mug2.jpg', '${HOME}/assets/mug3.png'];
      const mug = mugs[random(2)];
      const attachment = this.client.util.attachment(mug);
      message.channel.send({ files: [attachment] });
    }
  }
}

module.exports = MugCommand;
