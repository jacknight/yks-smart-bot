const { Command } = require("discord-akairo");
const Parser = require("rss-parser");
const parser = new Parser();
const MAIN_FEED_RSS = process.env.MAIN_FEED_RSS;

class BestCommand extends Command {
  constructor() {
    super("best", {
      aliases: ["best"],
      cooldown: 3600000,
      ratelimit: 1,
      args: [{ id: "num", type: "number" }],
    });
  }

  async exec(message, { num }) {
    if (num < 1) return;
    if (num === 101) {
      return message.channel.send(
        "We already know Episode 100 is the best. This is for all the other ones."
      );
    }

    const mainFeed = await parser.parseURL(MAIN_FEED_RSS);
    let mainArray = mainFeed.items[0].title.split(":");
    const epNum = Number(mainArray[0].trim().split(" ")[1]);

    if (num > epNum) return;

    let temp = JSON.parse(
      await this.client.settings.get(message.guild.id, "bestEpByUser", '""')
    );
    let bestEpByUser = !temp ? new Map() : new Map(temp);

    temp = JSON.parse(
      await this.client.settings.get(message.guild.id, "bestEpTotals", '""')
    );
    let bestEpTotals = !temp ? new Map() : new Map(temp);

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
      message.channel.send(
        `${message.author} thought Episode ${prevUserVote} was the best. Now...`
      );
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

    console.log([...bestEpTotals.entries()]);
    const sortedTotals = new Map(
      [...bestEpTotals.entries()].sort((a, b) => {
        return b[1] - a[1];
      })
    );
    let totalString = "";
    let count = 0;
    sortedTotals.forEach((val, key) => {
      if (count === 11) return;
      count++;
      totalString += `**${count}.** Episode ${key} (${val})\n`;
    });

    message.channel.send(
      `${message.author} thinks Episode ${num} is the best.\nHere's the top 10:`
    );
    message.channel.send(totalString);
  }
}

module.exports = BestCommand;
