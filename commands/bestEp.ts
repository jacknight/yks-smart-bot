import { Message, MessageEmbed, MessagePayload, ReplyMessageOptions } from 'discord.js';

const { Command } = require('discord-akairo');
const Parser = require('rss-parser');
const parser = new Parser();
const MAIN_FEED_RSS = process.env.MAIN_FEED_RSS;

class BestCommand extends Command {
  constructor() {
    super('best', {
      aliases: ['best'],
      cooldown: 1000 * 60 * 30, // once every 30 min
      ratelimit: 1,
      args: [{ id: 'num', type: 'number', default: 'list' }],
    });
  }

  async exec(message: Message, { num }: { num: 'list' | number }) {
    const listOnly = num === 'list';
    const mainFeed = await parser
      .parseURL(MAIN_FEED_RSS)
      .catch((e: any) => console.error('Failed to parse main feed RSS (bestEp): ', e.message));
    if (!listOnly) {
      if (num < 1) return;
      if (num === 101) {
        return message.channel.send(
          'We already know Episode 101 is the best. This is for all the other ones.',
        );
      }

      // Check if provided argument is bigger than the latest known episode.
      let latestEpNum = await this.client.settings.get(this.client.user.id, 'latestEpNum', 0);

      if (num > latestEpNum) {
        // Maybe a new episode has been released and it's really good...
        let latestEpNum = mainFeed.items[0].title.match(/Ep ([0-9]+)|Episode ([0-9]+)/i);
        latestEpNum = latestEpNum
          ? Number(latestEpNum[1])
            ? Number(latestEpNum[1])
            : Number(latestEpNum[2])
          : null;

        if (latestEpNum) {
          await this.client.settings.set(this.client.user.id, 'latestEpNum', latestEpNum);
        }

        // Ok, they just gave an invalid episode. Nice try.
        if (num > latestEpNum) return message.channel.send('Not an episode.');
      }
    }

    let tempBestEpByUser = JSON.parse(
      await this.client.settings.get(message.guild!.id, 'bestEpByUser', '""'),
    );
    var bestEpByUser = !tempBestEpByUser ? new Map() : new Map(tempBestEpByUser);

    let bestEpTotals = new Map();
    bestEpByUser.forEach((ep, user) => {
      const total = bestEpTotals.get(ep);
      if (total) {
        bestEpTotals.set(ep, total + 1);
      } else {
        bestEpTotals.set(ep, 1);
      }
    });

    var messagePrefix = '';
    if (!listOnly) {
      const prevUserVote = bestEpByUser.get(message.author.id);
      if (prevUserVote) {
        if (prevUserVote !== num) {
          const newTotal = bestEpTotals.get(prevUserVote) - 1;
          if (newTotal === 0) {
            bestEpTotals.delete(prevUserVote);
          } else {
            bestEpTotals.set(prevUserVote, newTotal);
          }

          messagePrefix = `You thought **Episode ${prevUserVote}** was the best. Now...\n`;
        } else {
          return message.reply('No change.');
        }
      }

      messagePrefix += `You think **Episode ${num}** is the best.`;
      bestEpByUser.set(message.author.id, num);
      bestEpTotals.set(num, (bestEpTotals.get(num) || 0) + 1);
      await this.client.settings.set(
        message.guild!.id,
        'bestEpByUser',
        JSON.stringify(Array.from(bestEpByUser.entries())),
      );
      await this.client.settings.set(
        message.guild!.id,
        'bestEpTotals',
        JSON.stringify(Array.from(bestEpTotals.entries())),
      );
    }

    const sortedTotals = new Map(
      [...bestEpTotals.entries()].sort((a, b) => {
        if (b[1] === a[1]) {
          // no bias for ties!
          return Math.floor(Math.random() * 2) === 0 ? -1 : 1;
        }
        return b[1] - a[1];
      }),
    );

    let count = 0;
    let embed: MessageEmbed = new MessageEmbed({
      color: 0x83c133,
      title: '',
      fields: [],
    });

    sortedTotals.forEach((val, key) => {
      if (count === 10) return;
      count++;
      let title = mainFeed.items.find(
        (item: any) => item.title.includes(`Ep ${key}:`) || item.title.includes(`Episode ${key}:`),
      )?.title;

      if (!title) title = 'title not found';

      embed.addField(`**${count}.** ${title}`, `${val} votes`);
    });

    embed.title = `Top ${count} Episodes`;
    const reply: ReplyMessageOptions = { embeds: [embed] };
    if (messagePrefix) {
      reply.content = messagePrefix;
    }
    message.reply(reply);
  }
}

module.exports = BestCommand;
