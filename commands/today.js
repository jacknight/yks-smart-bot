const { Command } = require('discord-akairo');

const Parser = require('rss-parser');
const parser = new Parser();
const MAIN_FEED_RSS = process.env.MAIN_FEED_RSS;
const BONUS_FEED_RSS = process.env.BONUS_FEED_RSS;

const epEmbed = (feedTitle, iconURL, epURL, epTitle, desc) => {
  const isBonus = epURL.includes('patreon.com');
  return {
    color: isBonus ? 0xddaf74 : 0x83c133,
    title: feedTitle,
    author: {
      icon_url: isBonus ? 'https://i.imgur.com/Cmb1RTP.jpg' : iconURL,
      url: 'https://www.patreon.com/yourkickstartersucks',
    },
    thumbnail: {
      url: isBonus ? 'https://i.imgur.com/Cmb1RTP.jpg' : iconURL,
    },
    fields: [
      {
        name: epTitle,
        value: desc.length >= 1024 ? `${desc.slice(0, 1020).trim()}...` : desc,
        inline: false,
      },
      {
        name: 'Link',
        value: `[Patreon](${epURL})`,
        inline: false,
      },
    ],
  };
};

class TodayCommand extends Command {
  constructor() {
    super('today', {
      aliases: ['today'],
      cooldown: 1000 * 60, // one per min
      rateLimit: 1,
    });
  }

  async exec(message) {
    const today = new Date().toLocaleString('en-us', {
      month: 'numeric',
      day: 'numeric',
    });

    const mainFeed = await parser
      .parseURL(MAIN_FEED_RSS)
      .catch((e) => console.error('Failed to parse main feed RSS: ', e.message));

    const bonusFeed = await parser
      .parseURL(BONUS_FEED_RSS)
      .catch((e) => console.error('Failed to parse bonus feed RSS: ', e.message));

    mainFeed.items = mainFeed.items.map((item) => {
      return { ...item, feedTitle: mainFeed.title };
    });
    bonusFeed.items = bonusFeed.items.map((item) => {
      return { ...item, feedTitle: bonusFeed.title };
    });
    bonusFeed.items = bonusFeed.items.filter(
      (episode) => !mainFeed.items.some((mainEp) => mainEp.title !== episode.title),
    );
    const combinedFeed = mainFeed.items.concat(bonusFeed.items);
    const filteredFeed = combinedFeed.filter(
      (episode) =>
        new Date(episode.isoDate).toLocaleString('en-us', {
          month: 'numeric',
          day: 'numeric',
        }) === today,
    );

    if (filteredFeed.length > 0) {
      let embeds = [];
      filteredFeed.forEach((episode) => {
        const dateStr = new Date(episode.isoDate).toLocaleString('en-us', {
          dateStyle: 'medium',
        });
        embeds.push(
          epEmbed(
            dateStr,
            episode.itunes.image,
            episode.link,
            episode.title,
            episode.contentSnippet,
          ),
        );
      });

      message.channel.send({ embeds });
    } else {
      message.channel.send('Nothing happened on this date.');
    }
  }
}

module.exports = TodayCommand;
