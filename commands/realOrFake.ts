import { Message } from 'discord.js';

const { Command } = require('discord-akairo');
const { getRealKickstarters, sleep, getKickstarterEmbed, getAIResponse } = require('../util');

class RealOrFakeCommand extends Command {
  constructor() {
    super('realorfake', {
      aliases: ['realorfake', 'rof'],
      cooldown: 1000 * 60 * 60 * 24, // once per day
      ratelimit: 4,
    });
  }

  async exec(message: Message) {
    if (!message.guild || !message.member) return;

    // Only allow in the #kickstarter-bot channel
    if (message.channel.id !== '873238126187917363' && message.guild.id !== '789205632762642493') {
      const channel = this.client.util.resolveChannel(
        '873238126187917363',
        message.guild.channels.cache,
      );
      return message.channel.send(`Please use ${channel} for this command`);
    }

    // Grab a response from the AI or from the file of real kickstarters
    const real = Math.random() < 0.5;
    let response: any = '';
    const t0 = Date.now();
    if (real) {
      const responses = await getRealKickstarters();
      response = responses[Math.floor(Math.random() * responses.length)];
    } else {
      // Grab a completion from the AI.
      response = await getAIResponse('', this.client.user.id);
    }

    // Do some sleeping if necessary so all response times take at least 2s.
    // This should hopefully throw anyone off the scent of how long each takes.
    const t1 = Date.now();
    const responseTime = t1 - t0;
    const minResponseTime = 3000; // 3s
    if (responseTime < minResponseTime) {
      await sleep(minResponseTime - responseTime);
    }

    const completion = response.data.choices[0].text;
    const embed = getKickstarterEmbed(completion, true);
    if (embed) {
      let realEmoji = this.client.util.resolveEmoji('real', message.guild.emojis.cache);
      let fakeEmoji = this.client.util.resolveEmoji('fake', message.guild.emojis.cache);

      const msg = await message.channel.send({
        content: `Real or Fake? Mike, this one is ||${real ? realEmoji : fakeEmoji}||!`,
        embeds: [embed],
      });

      await msg.react(realEmoji);
      return msg.react(fakeEmoji);
    } else {
      console.log(completion);
      return message.channel.send('Something went wrong');
    }
  }
}

module.exports = RealOrFakeCommand;
