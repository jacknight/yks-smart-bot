import { Message } from 'discord.js';

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

  async exec(message: Message, { feed, newEp }: { feed: string; newEp: string }) {
    if (!message.guild) return;

    // Main feed
    const mainFeed = await parser
      .parseURL(MAIN_FEED_RSS)
      .catch((e: any) => console.error('Failed to parse main feed RSS: ', e.message));

    const mainEpisode = mainFeed.items[0];
    const overCastLink = 'https://overcast.fm/itunes1204911385';
    const appleLink = 'https://podcasts.apple.com/us/podcast/your-kickstarter-sucks/id1204911385';
    const mainEmbed = {
      color: 0x83c133,
      title: mainFeed.title,
      author: {
        icon_url:
          'https://content.production.cdn.art19.com/images/c8/38/41/df/c83841df-2683-4baf-8959-28a8e7d66774/3e98f6d3fffcf5ebd7e02df5609cfe5fe9997e62f24382a26649e59061a6d029a0e16417689b0ccd00f7fc7638344abe1f61bc8d9e3c7235e4e60f43efec8c38.jpeg',
        url: 'https://art19.com/shows/your-kickstarter-sucks',
      },
      thumbnail: {
        url: 'https://content.production.cdn.art19.com/images/c8/38/41/df/c83841df-2683-4baf-8959-28a8e7d66774/3e98f6d3fffcf5ebd7e02df5609cfe5fe9997e62f24382a26649e59061a6d029a0e16417689b0ccd00f7fc7638344abe1f61bc8d9e3c7235e4e60f43efec8c38.jpeg',
      },
      fields: [
        {
          name: mainEpisode.title,
          value: `[ART19](${mainEpisode.enclosure.url})
[Overcast](${overCastLink})
[Apple](${appleLink})`,
          inline: false,
        },
      ],
    };

    // Bonus feed
    const bonusFeed = await parser
      .parseURL(BONUS_FEED_RSS)
      .catch((e: any) => console.error('Failed to parse bonus feed RSS: ', e.message));

    const bonusEpisode = bonusFeed.items.find(
      (bonusItem: any) =>
        !mainFeed.items.some(
          (mainItem: any) =>
            bonusItem.title.normalize().trim() === mainItem.title.normalize().trim(),
        ),
    );
    const bonusEmbed = {
      color: 0xddaf74,
      title: bonusFeed.title,
      author: {
        icon_url: 'https://i.imgur.com/Cmb1RTP.jpg',
        url: 'https://www.patreon.com/yourkickstartersucks',
      },
      thumbnail: {
        url: 'https://i.imgur.com/Cmb1RTP.jpg',
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
            await message.react(
              this.client.util.resolveEmoji('1ohno', message.guild!.emojis.cache),
            );
            await message.react(
              this.client.util.resolveEmoji('2they', message.guild!.emojis.cache),
            );
            await message.react(this.client.util.resolveEmoji('3did', message.guild!.emojis.cache));
            await message.react(
              this.client.util.resolveEmoji('40another', message.guild!.emojis.cache),
            );
            await message.react(this.client.util.resolveEmoji('yks', message.guild!.emojis.cache));
          } catch {
            console.error;
          }
        }
      });
    }

    if (feed === 'bonus' || feed === 'premium' || feed === 'patreon' || feed === 'both') {
      message.channel.send({ embeds: [bonusEmbed] }).then(async (message) => {
        if (newEp === 'yes') {
          try {
            await message.react(
              this.client.util.resolveEmoji('1ohno', message.guild!.emojis.cache),
            );
            await message.react(
              this.client.util.resolveEmoji('2they', message.guild!.emojis.cache),
            );
            await message.react(this.client.util.resolveEmoji('3did', message.guild!.emojis.cache));
            await message.react(
              this.client.util.resolveEmoji('40another', message.guild!.emojis.cache),
            );
            await message.react(this.client.util.resolveEmoji('yks', message.guild!.emojis.cache));
          } catch {
            console.error;
          }
        }
      });
    }
  }
}

module.exports = LatestCommand;
