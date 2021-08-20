const { Command } = require("discord-akairo");
const Parser = require("rss-parser");
const parser = new Parser();
const MAIN_FEED_RSS = process.env.MAIN_FEED_RSS;

class BestCommand extends Command {
  constructor() {
    super("best", {
      aliases: ["best"],
      cooldown: 1000 * 60 * 30, // once every 30 min
      ratelimit: 1,
      args: [{ id: "num", type: "number", default: "list" }],
    });
  }

  async exec(message, { num }) {
    const listOnly = num === "list";
    if (!listOnly) {
      if (num < 1) return;
      if (num === 101) {
        return message.channel.send(
          "We already know Episode 101 is the best. This is for all the other ones."
        );
      }

      // Check if provided argument is bigger than the latest known episode.
      let latestEpNum = await this.client.settings.get(
        this.client.user.id,
        "latestEpNum",
        0
      );

      if (num > latestEpNum) {
        // Maybe a new episode has been released and it's really good...
        const mainFeed = await parser.parseURL(MAIN_FEED_RSS);
        let mainArray = mainFeed.items[0].title.split(":");
        latestEpNum = Number(mainArray[0].trim().split(" ")[1]);
        await this.client.settings.set(
          this.client.user.id,
          "latestEpNum",
          latestEpNum
        );

        // Ok, they just gave an invalid episode. Nice try.
        if (num > latestEpNum) return message.channel.send("Not an episode.");
      }
      let tempBestEpByUser = JSON.parse(
        await this.client.settings.get(message.guild.id, "bestEpByUser", '""')
      );
      var bestEpByUser = !tempBestEpByUser
        ? new Map()
        : new Map(tempBestEpByUser);
    }

    let tempBestEpTotals = JSON.parse(
      await this.client.settings.get(message.guild.id, "bestEpTotals", '""')
    );
    let bestEpTotals = !tempBestEpTotals
      ? new Map()
      : new Map(tempBestEpTotals);

    var messagePrefix = "";
    if (!listOnly) {
      const prevUserVote = bestEpByUser.get(message.author.id);
      if (prevUserVote === num) {
        return;
      } else if (prevUserVote) {
        const newTotal = bestEpTotals.get(prevUserVote) - 1;
        if (newTotal === 0) {
          bestEpTotals.delete(prevUserVote);
        } else {
          bestEpTotals.set(prevUserVote, newTotal);
        }

        messagePrefix = `You thought Episode ${prevUserVote} was the best. Now...`;
      }

      bestEpByUser.set(message.author.id, num);
      bestEpTotals.set(num, (bestEpTotals.get(num) || 0) + 1);
      await this.client.settings.set(
        message.guild.id,
        "bestEpByUser",
        JSON.stringify(Array.from(bestEpByUser.entries()))
      );
      await this.client.settings.set(
        message.guild.id,
        "bestEpTotals",
        JSON.stringify(Array.from(bestEpTotals.entries()))
      );

      message.reply(`${messagePrefix}\nYou think Episode ${num} is the best.`);
    }
    const sortedTotals = new Map(
      [...bestEpTotals.entries()].sort((a, b) => {
        if (b[1] === a[1]) {
          // no bias for ties!
          return Math.floor(Math.random() * 2) === 0 ? -1 : 1;
        }
        return b[1] - a[1];
      })
    );

    let totalString = "";
    let count = 0;
    sortedTotals.forEach((val, key) => {
      if (count === 10) return;
      count++;
      totalString += `**${count}.** Episode ${key} (${val})\n`;
    });
    message.channel.send("Here's the top 10:\n" + totalString);
  }
}

module.exports = BestCommand;
