const { Command } = require('discord-akairo');

const Parser = require('rss-parser');
const parser = new Parser();
const MAIN_FEED_RSS = process.env.MAIN_FEED_RSS;
const BONUS_FEED_RSS = process.env.BONUS_FEED_RSS;

class LatestCommand extends Command {
  constructor() {
    super('latest', {
      aliases: ['latest', 'eps', 'recent'],
      args: [
        {
          id: 'feed',
          type: ['main', 'premium', 'bonus', 'patreon', 'both'],
          default: 'both',
        },
        {
          id: 'newEp',
          type: 'string',
          default: '',
        },
      ],
    });
  }

  async exec(message, { feed, newEp }) {
    // Main feed
    const mainFeed = await parser.parseURL(MAIN_FEED_RSS);
    const mainEpisode = mainFeed.items[0];
    const overCastLink = 'https://overcast.fm/itunes1204911385';
    const appleLink = 'https://podcasts.apple.com/us/podcast/your-kickstarter-sucks/id1204911385';
    const mainEmbed = {
      color: 0x83c133,
      title: mainFeed.title,
      author: {
        icon_url:
          'https://res.cloudinary.com/pippa/image/fetch/h_500,w_500,f_auto/https://assets.pippa.io/shows/5d137ece8b774eb816199f63/1562125598000-ef38e8a9cd086f609f806209d1341102.jpeg',
        url: 'https://shows.acast.com/yourkickstartersucks',
      },
      thumbnail: {
        url: 'https://res.cloudinary.com/pippa/image/fetch/h_500,w_500,f_auto/https://assets.pippa.io/shows/5d137ece8b774eb816199f63/1562125598000-ef38e8a9cd086f609f806209d1341102.jpeg',
      },
      fields: [
        {
          name: mainEpisode.title,
          value: `[Acast](${mainEpisode.link})
[Overcast](${overCastLink})
[Apple](${appleLink})`,
          inline: false,
        },
      ],
    };

    // Bonus feed
    const bonusFeed = await parser.parseURL(BONUS_FEED_RSS);
    const bonusEpisode = bonusFeed.items.find(
      (bonusItem) =>
        !mainFeed.items.some(
          (mainItem) => bonusItem.title.normalize().trim() === mainItem.title.normalize().trim(),
        ),
    );
    const bonusEmbed = {
      color: 0xddaf74,
      title: bonusFeed.title,
      author: {
        icon_url: 'https://i.imgur.com/5sHYjAX.jpeg',
        url: 'https://www.patreon.com/yourkickstartersucks',
      },
      thumbnail: {
        url: 'https://i.imgur.com/5sHYjAX.jpeg',
      },
      fields: [
        {
          name: bonusEpisode.title,
          value: `[Patreon](${bonusEpisode.link})`,
          inline: false,
        },
      ],
    };

    if (feed === 'main' || feed === 'both') {
      message.channel.send({ embeds: [mainEmbed] }).then(async (message) => {
        if (newEp === 'yes') {
          try {
            await message.react(this.client.util.resolveEmoji('1ohno', message.guild.emojis.cache));
            await message.react(this.client.util.resolveEmoji('2they', message.guild.emojis.cache));
            await message.react(this.client.util.resolveEmoji('3did', message.guild.emojis.cache));
            await message.react(
              this.client.util.resolveEmoji('4another', message.guild.emojis.cache),
            );
            await message.react(this.client.util.resolveEmoji('yks', message.guild.emojis.cache));
          } catch {
            console.log;
          }
        }
      });
    }

    if (feed === 'bonus' || feed === 'premium' || feed === 'patreon' || feed === 'both') {
      message.channel.send({ embeds: [bonusEmbed] }).then(async (message) => {
        if (newEp === 'yes') {
          try {
            await message.react(this.client.util.resolveEmoji('1ohno', message.guild.emojis.cache));
            await message.react(this.client.util.resolveEmoji('2they', message.guild.emojis.cache));
            await message.react(this.client.util.resolveEmoji('3did', message.guild.emojis.cache));
            await message.react(
              this.client.util.resolveEmoji('4another', message.guild.emojis.cache),
            );
            await message.react(this.client.util.resolveEmoji('yks', message.guild.emojis.cache));
          } catch {
            console.log;
          }
        }
      });
    }
  }
}

module.exports = LatestCommand;
