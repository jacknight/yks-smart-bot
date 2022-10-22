const { Listener } = require('discord-akairo');

class ClipListener extends Listener {
  constructor() {
    super('clip', {
      emitter: 'client',
      event: 'messageCreate',
    });
  }

  exec(message) {
    // Check if it's a clip posted to the clips channel, and if so, store
    // the link in the database.
    if (
      message.author.id !== this.client.user.id &&
      message.channel.id === process.env.YKS_CLIP_CHANNEL_ID &&
      message.attachments.size > 0
    ) {
      message.attachments.forEach(async (attachment) => {
        const filetype = attachment.url.substring(attachment.url.lastIndexOf('.') + 1);
        if (
          filetype === 'mov' ||
          filetype === 'mp4' ||
          filetype === 'webm' ||
          filetype === 'wav' ||
          filetype === 'mp3' ||
          filetype === 'ogg'
        ) {
          const clips = await this.client.settings.get(message.guild.id, 'clips', []);
          if (clips.find((clip) => clip === attachment.url)) return;

          if (clips.length === 499) {
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
              url: `https://pisscord.site`,
              description: `${message.author} just posted the 500th clip! Please join me in thanking them for helping us reach this milestone and enriching the community in the process!

As a thank you for fully embracing the dirtbag left culture cultivated here in the YKS pisscord, please contact ${mike} or ${jf} for your prize!`,
              image: {
                url: 'https://cdn.discordapp.com/attachments/672146620275621918/882070930107551774/Screenshot_2021-08-29_22.50.38.png',
              },
              footer: {
                text: "Restrictions apply. Must be 18 or older, but not too old (let's say up to 33 just to pick a number). Must reside in the United States or somewhere cool (please provide proof of this).\n\nThis message is fully approved by Jesse Farrar and Michael Hale and I definitely asked them.",
              },
            };
            message.reply({ embeds: [embed] });
          }

          clips.push(attachment.url);
          this.client.settings.set(message.guild.id, 'clips', clips);
        }
      });
    }
  }
}

module.exports = ClipListener;
