const { Command } = require("discord-akairo");

const Parser = require("rss-parser");
const parser = new Parser();
const MAIN_FEED_RSS = process.env.MAIN_FEED_RSS;
const BONUS_FEED_RSS = process.env.BONUS_FEED_RSS;

class LatestCommand extends Command {
  constructor() {
    super("latest", {
      aliases: ["latest", "eps", "recent"],
      args: [
        {
          id: "feed",
          type: ["main", "premium", "bonus", "patreon", "both"],
          default: "both",
        },
      ],
    });
  }

  async exec(message, { feed }) {
    if (!this.client.globalRates.get(message.guild.id)) {
      this.client.globalRates.set(message.guild.id, new Set());
    }

    if (!this.client.globalRates.get(message.guild.id).has("latest")) {
      this.client.globalRates.get(message.guild.id).add("latest");
      const self = this;
      setTimeout(function () {
        self.client.globalRates.get(message.guild.id).delete("latest");
      }, 3600000);

      // Main feed
      const mainFeed = await parser.parseURL(MAIN_FEED_RSS);
      let mainArray = mainFeed.items[0].title.split(":");
      const epNum = mainArray[0].trim();
      mainArray = mainArray.slice(1);
      const epTitle = mainArray
        .reduce((title, item) => {
          return title + item + ":";
        }, "")
        .trim()
        .slice(0, -1);
      const epLink = mainFeed.items[0].link;
      const mainEmbed = {
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

      // Bonus feed
      const bonusFeed = await parser.parseURL(BONUS_FEED_RSS);
      let itemNum = 0;
      if (
        bonusFeed.items[itemNum].title.normalize().trim() ===
        mainFeed.items[itemNum].title.normalize().trim()
      ) {
        itemNum++;
      }
      let bonusArray = bonusFeed.items[itemNum].title.split(":");
      const bonusEpNum = bonusArray[0].trim();
      bonusArray = bonusArray.slice(1);
      const bonusEpTitle = bonusArray
        .reduce((title, item) => {
          return title + item + ":";
        }, "")
        .trim()
        .slice(0, -1);
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

      if (feed === "main" || feed === "both") {
        message.channel.send({ embed: mainEmbed });
      }

      if (
        feed === "bonus" ||
        feed === "premium" ||
        feed === "patreon" ||
        feed === "both"
      ) {
        message.channel.send({ embed: bonusEmbed });
      }
    }
  }
}

module.exports = LatestCommand;
