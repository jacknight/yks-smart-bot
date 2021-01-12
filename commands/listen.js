const { Command } = require("discord-akairo");
const Parser = require("rss-parser");
const parser = new Parser();
const MAIN_FEED_RSS = process.env.MAIN_FEED_RSS;

class ListenCommand extends Command {
  constructor() {
    super("listen", {
      aliases: ["listen"],
      args: [
        {
          id: "action",
          type: "string",
          default: "play",
        },
        {
          id: "episode",
          type: "number",
          default: 0,
        },
      ],
    });
  }

  async exec(message, { action, episode }) {
    if (action !== "play" && !this.client.listen) {
      return message.channel.send("I'm not playing anything right now.");
    }

    const parseStreamTime = (streamTime) => {
      let time = streamTime;
      const hours = Math.floor(time / 1000 / 60 / 60);
      time -= hours * 1000 * 60 * 60;
      let minutes = Math.floor(time / 1000 / 60);
      if (minutes < 10) {
        minutes = `0${minutes}`;
      }
      time -= minutes * 1000 * 60;
      let seconds = Math.floor(time / 1000);
      if (seconds < 10) {
        seconds = `0${seconds}`;
      }
      return `${hours}:${minutes}:${seconds}`;
    };
    if (this.client.listen) {
      switch (action) {
        case "play":
          if (this.client.listen.dispatcher.paused && episode === 0) {
            await this.client.listen.dispatcher.resume();
            return message.channel.send(
              `Resuming from ${parseStreamTime(
                this.client.listen.dispatcher.streamTime
              )}`
            );
          } else {
            return message.channel.send("Already playing.");
          }
        case "pause":
          if (!this.client.listen.dispatcher.paused) {
            await this.client.listen.dispatcher.pause(true);
            return message.channel.send(
              `Paused at ${parseStreamTime(
                this.client.listen.dispatcher.streamTime
              )}`
            );
          } else {
            return message.channel.send("Already paused.");
          }
        case "stop":
          await this.client.listen.dispatcher.destroy();
          await this.client.listen.voiceChannel.leave();
          this.client.listen = null;
          return message.channel.send(
            "You shoulda let it finish it was gonna get good."
          );

        default:
          return message.channel.send(
            "Not a valid option for the command `!listen`."
          );
      }
    }

    const mainFeed = await parser.parseURL(MAIN_FEED_RSS);
    // url: "https://<path>.mp3"
    // length: "<milliseconds>"
    // type: "audio/mpeg"
    let ep = mainFeed.items[0];
    if (episode > 0) {
      const mainArray = mainFeed.items[0].title.split(":");
      const latestEpNum = Number(mainArray[0].trim().split(" ")[1]);
      if (episode > latestEpNum) {
        ep = null;
      }
      const item = mainFeed.items.find((ep, idx) => {
        return ep.title.includes(` ${episode}:`);
      });
      if (item) {
        ep = item;
      } else {
        ep = null;
      }
    }
    if (!ep) {
      return message.channel.send("Couldn't find that episode.");
    }
    console.log(ep);
    // Hard coded for now
    const voiceChannel = message.member.voice.channel
      ? message.member.voice.channel
      : null;

    const connection = voiceChannel ? await voiceChannel.join() : null;
    if (!connection)
      return message.channel.send("Please join a voice channel first.");
    this.client.listen = {
      voiceChannel,
      connection,
      dispatcher: connection.play(ep.enclosure.url),
    };

    const epNum = ep.title.match(/Episode [0-9]+/i);
    let epTitle =
      ep.title.substring(0, epNum.index) +
      ep.title
        .substring(epNum.index + epNum[0].length)
        .split(":")
        .join(" ");

    const mainEmbed = {
      color: 0x83c133,
      title: `Now playing in ${voiceChannel.name}`,
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
      ],
    };

    message.channel.send({ embed: mainEmbed });
  }
}

module.exports = ListenCommand;
