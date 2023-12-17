import { Message } from 'discord.js';

const { Listener } = require('discord-akairo');
const ClipsModel = require('../db/clips');

class ClipListener extends Listener {
  constructor() {
    super('clip', {
      emitter: 'client',
      event: 'messageCreate',
    });
  }

  async exec(message: Message) {
    // Check if it's a clip posted to the clips channel, and if so, store
    // the link in the database.
    if (
      message.author.id !== this.client.user.id &&
      message.channel.id === process.env.YKS_CLIP_CHANNEL_ID &&
      message.attachments.size > 0
    )
      await Promise.all(
        message.attachments.map(async (attachment) => {
          const filetype = attachment.proxyURL.substring(attachment.proxyURL.lastIndexOf('.') + 1);
          if (
            filetype === 'mov' ||
            filetype === 'mp4' ||
            filetype === 'webm' ||
            filetype === 'wav' ||
            filetype === 'mp3' ||
            filetype === 'ogg'
          ) {
            if (!message.guild) return;
            const clips: string[] = await this.client.settings.get(message.guild.id, 'clips', []);
            if (clips.find((clip) => clip === attachment.proxyURL)) return;

            await message.guild.members.fetch();

            if (clips.length === 999) {
              const mike = this.client.util.resolveMember(
                '882331792798003250',
                message.guild.members.cache,
              );
              const jf = this.client.util.resolveMember(
                '883216303236722718',
                message.guild.members.cache,
              );
              const embed = {
                color: 0xffc0cb,
                title: `Congratulations!`,
                thumbnail: {
                  url: 'https://pbs.twimg.com/media/E0-Qc05XsAcTf3T?format=jpg&name=large',
                },
                url: `https://im-at.work`,
                description: `${message.author} just posted the 1000th clip! Please join me in thanking them for helping us reach this milestone and enriching the community in the process!

As a thank you for fully embracing the dirtbag left culture cultivated here in the YKS pisscord, please contact ${mike} or ${jf} for your prize!`,
                image: {
                  url: 'https://media.discordapp.net/attachments/672146620275621918/882070930107551774/Screenshot_2021-08-29_22.50.38.png',
                },
                footer: {
                  text: "Restrictions apply. Must be 18 or older, but not too old (let's say up to 34 just to pick a number). Must reside in the United States or somewhere cool (please provide proof of this).\n\nThis message is fully approved by Jesse Farrar and Michael Hale and I definitely asked them.",
                },
              };
              message.reply({ embeds: [embed] });
            }

            clips.push(attachment.proxyURL);
            ClipsModel.create({ id: attachment.proxyURL, attachment });
            console.info(`Added new clip: ${attachment.proxyURL}`);
          }
        }),
      );
  }
}

module.exports = ClipListener;
