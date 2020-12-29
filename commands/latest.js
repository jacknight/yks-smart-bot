const { Command } = require("discord-akairo");

const Parser = require("rss-parser");
const parser = new Parser();
const MAIN_FEED_RSS = process.env.MAIN_FEED_RSS;
const BONUS_FEED_RSS = process.env.BONUS_FEED_RSS;

class LatestCommand extends Command {
  constructor() {
    super("latest", {
      aliases: ["latest", "eps", "recent"],
      cooldown: 3600000,
      ratelimit: 5,
    });
  }

  async exec(message) {
    const self = this;
    if (!this.client.latest) {
      this.client.latest = true;
      setTimeout(function () {
        self.client.latest = false;
      }, 60000);

      // Main feed
      const mainFeed = await parser.parseURL(MAIN_FEED_RSS);
      const epNum = mainFeed.items[0].title.split(":")[0].trim();
      const epTitle = mainFeed.items[0].title.split(":")[1].trim();
      const epLink = mainFeed.items[0].link;
      const embed = {
        color: 0x83c133,
        title: mainFeed.title,
        author: {
          icon_url:
            "https://res.cloudinary.com/pippa/image/fetch/h_500,w_500,f_auto/https://assets.pippa.io/shows/5d137ece8b774eb816199f63/1562125598000-ef38e8a9cd086f609f806209d1341102.jpeg",
          url: "https://shows.acast.com/yourkickstartersucks",
        },
        thumbnail: {
          url:
            "https://res.cloudinary.com/pippa/image/fetch/h_500,w_500,f_auto/https://assets.pippa.io/shows/5d137ece8b774eb816199f63/1562125598000-ef38e8a9cd086f609f806209d1341102.jpeg",
        },
        fields: [
          {
            name: epNum,
            value: epTitle,
            inline: false,
          },
          {
            name: "Link",
            value: `[Acast](${epLink})`,
            inline: false,
          },
        ],
      };
      message.channel.send({ embed });

      // Bonus feed
      const bonusFeed = await parser.parseURL(BONUS_FEED_RSS);
      let itemNum = 0;
      if (
        bonusFeed.items[itemNum].title.normalize().trim() ===
        mainFeed.items[itemNum].title.normalize().trim()
      ) {
        itemNum++;
      }
      const bonusEpNum = bonusFeed.items[itemNum].title.split(":")[0].trim();
      const bonusEpTitle = bonusFeed.items[itemNum].title.split(":")[1].trim();
      const bonusEpLink = bonusFeed.items[itemNum].link;
      const bonusEmbed = {
        color: 0xddaf74,
        title: bonusFeed.title,
        author: {
          icon_url: "https://i.imgur.com/5sHYjAX.jpeg",
          url: "https://www.patreon.com/yourkickstartersucks",
        },
        thumbnail: {
          url: "https://i.imgur.com/5sHYjAX.jpeg",
        },
        fields: [
          {
            name: bonusEpNum,
            value: bonusEpTitle,
            inline: false,
          },
          {
            name: "Link",
            value: `[Patreon](${bonusEpLink})`,
            inline: false,
          },
        ],
      };
      message.channel.send({ embed: bonusEmbed });
    }
  }
}

module.exports = LatestCommand;
