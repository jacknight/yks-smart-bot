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
          type: ["play", "pause", "stop"],
          default: "play",
        },
      ],
    });
  }

  async exec(message, { action }) {
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
          if (this.client.listen.dispatcher.paused) {
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
          return message.channel.send("Not a valid argument.");
      }
    }

    const mainFeed = await parser.parseURL(MAIN_FEED_RSS);
    // url: "https://<path>.mp3"
    // length: "<milliseconds>"
    // type: "audio/mpeg"
    const mediaData = mainFeed.items[0].enclosure;
    // Hard coded for now
    const voiceChannel = message.member.voice.channel
      ? message.member.voice.channel
      : this.client.util.resolveChannel(
          "789205633202782301",
          message.guild.channels.cache
        );

    const connection = voiceChannel ? await voiceChannel.join() : null;
    if (!connection) return;
    this.client.listen = {
      voiceChannel,
      connection,
      dispatcher: connection.play(mediaData.url),
    };

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
