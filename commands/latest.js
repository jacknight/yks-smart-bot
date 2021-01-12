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
      const epNum = mainFeed.items[0].title.match(/Episode [0-9]+/i);
      let epTitle =
        mainFeed.items[0].title.substring(0, epNum.index) +
        mainFeed.items[0].title
          .substring(epNum.index + epNum[0].length)
          .split(":")
          .join(" ");
      const epLink = mainFeed.items[0].link;
      const overCastLink = "https://overcast.fm/itunes1204911385";
      const appleLink =
        "https://podcasts.apple.com/us/podcast/your-kickstarter-sucks/id1204911385";

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
            name: epNum[0],
            value: epTitle ? epTitle : ".",
            inline: false,
          },
          {
            name: "Links",
            value: `[Acast](${epLink})
[Overcast](${overCastLink})
[Apple](${appleLink})`,
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
      const bonusEpNum = bonusFeed.items[itemNum].title.match(
        /(YKS Premium S[0-9]+E[0-9]+|Episode [0-9]+)/i
      );
      console.log(bonusFeed.items[itemNum].title, bonusEpNum);
      const bonusEpTitle =
        bonusFeed.items[itemNum].title.substring(0, bonusEpNum.index) +
        bonusFeed.items[itemNum].title
          .substring(bonusEpNum.index + bonusEpNum[0].length)
          .split(":")
          .join(" ");
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
            name: bonusEpNum[0],
            value: bonusEpTitle ? bonusEpTitle : ".",
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
