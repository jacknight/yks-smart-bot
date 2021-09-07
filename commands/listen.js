const { Command } = require("discord-akairo");
const Parser = require("rss-parser");
const parser = new Parser();
const MAIN_FEED_RSS = process.env.MAIN_FEED_RSS;
const {
  joinVoiceChannel,
  AudioPlayerStatus,
  createAudioResource,
  VoiceConnectionStatus,
  entersState,
  StreamType,
} = require("@discordjs/voice");
const prettyMilliseconds = require("pretty-ms");

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
          type: "content",
          default: "0",
        },
      ],
    });
  }

  async exec(message, { action, episode }) {
    let respond = async (response) => {
      if (this.client.listen.response) {
        this.client.listen.response.edit(response);
      } else {
        this.client.listen.response = await this.client.listen.message.reply(
          response
        );
      }
    };

    if (
      action !== "play" &&
      action !== "random" &&
      action !== "url" &&
      this.client.listen.player.state.status === AudioPlayerStatus.Idle
    ) {
      return message.channel.send("Nothing playing.");
    }

    if (action !== "url") {
      episode = parseInt(episode);
    }

    if (this.client.listen.player.state.status !== AudioPlayerStatus.Idle) {
      switch (action) {
        case "random":
        case "url":
          return respond("Stop the current episode first.");

        case "play":
          if (
            this.client.listen.player.state.status ===
              AudioPlayerStatus.Paused ||
            this.client.listen.player.state.status ===
              AudioPlayerStatus.AutoPaused
          ) {
            if (episode === 0) {
              // No arg passed
              this.client.listen.player.unpause();
              return;
            }
          }
          return respond("Stop the current episode first.");

        case "pause":
          this.client.listen.player.pause();
          return;

        case "stop":
          this.client.listen.player.stop(true);
          return;

        default:
          return respond("Not a valid option for the command `!listen`.");
      }
    }

    let mainFeed = await parser.parseURL(MAIN_FEED_RSS);
    // Sometimes bonus episodes and other things get released into the main feed
    // We need to filter those out.
    mainFeed = mainFeed.items.filter((ep) => ep.title.match(/ [0-9]+:/));
    // url: "https://<path>.mp3"
    // length: "<milliseconds>"
    // type: "audio/mpeg"
    let ep = mainFeed[0];
    if (action === "random") {
      episode = Math.floor(Math.random() * mainFeed.length);
      // Episode 101 doesn't exist.
      if (episode > 100) episode++;
    } else if (action === "url") {
      ep = {
        enclosure: { url: episode },
        title: `Episode 1: ${episode}`,
        itunes: { duration: "1:00" },
      };
    }

    if (typeof episode === "number" && episode > 0) {
      const mainArray = mainFeed[0].title.split(":");
      const latestEpNum = Number(mainArray[0].trim().split(" ")[1]);
      if (episode > latestEpNum) {
        ep = null;
      }
      const item = mainFeed.find((ep, idx) => {
        return ep.title.includes(` ${episode}:`);
      });
      if (item) {
        ep = item;
      } else {
        ep = null;
      }
    }
    if (!ep) {
      return message.channel.send(`Couldn't find episode ${episode}.`);
    }

    if (!message.member.voice.channel)
      return message.channel.send("Please join a voice channel first.");

    // Join the same channel as the member
    const channel = message.member.voice.channel;
    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
    });

    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 30000);
      this.client.listen.connection = connection;
      this.client.listen.connection.subscribe(this.client.listen.player);

      const resource = createAudioResource(ep.enclosure.url, {
        inputType: StreamType.Arbitrary,
      });
      this.client.listen.player.play(resource);
    } catch (e) {
      message.channel.send("Failed to join the voice channel");
      connection?.destroy();
      this.client.listen.connection = null;
      console.log(e);
    }

    this.client.listen.player.on(
      AudioPlayerStatus.Idle,
      (oldState, newState) => {
        if (oldState.status === newState.status) return;
        clearInterval(this.client.listen.interval);
        respond("Finished playing episode.");
        this.client.listen.connection?.destroy();
        this.client.listen.connection = null;
        this.client.listen.player.removeAllListeners();
        this.client.listen.embed = null;
        this.client.listen.message = null;
        this.client.listen.response = null;
      }
    );

    this.client.listen.player.on(
      AudioPlayerStatus.Paused,
      (oldState, newState) => {
        if (oldState.status === newState.status) return;
        respond(`Paused at ${prettyMilliseconds(newState.playbackDuration)}.`);
      }
    );

    this.client.listen.player.on(AudioPlayerStatus.Buffering, () => {});

    this.client.listen.player.on(
      AudioPlayerStatus.Playing,
      (oldState, newState) => {
        if (oldState.status === newState.status) return;
        if (
          oldState.status === AudioPlayerStatus.Paused ||
          oldState.status === AudioPlayerStatus.AutoPaused
        ) {
          respond("Resuming.");
        }
      }
    );

    this.client.listen.player.on("error", console.log);

    const epNum = ep.title.match(/Episode [0-9]+/i);
    let epTitle =
      ep.title.substring(0, epNum.index) +
      ep.title
        .substring(epNum.index + epNum[0].length)
        .split(":")
        .join(" ");

    const duration =
      1000 *
      ep.itunes.duration.split(":").reduce((totalMs, curr) => {
        return Number(totalMs) * 60 + Number(curr);
      });
    let progressStr = "------------------------";
    let mainEmbed = {
      color: 0x83c133,
      title: `Now playing in ${message.member.voice.channel.name}`,
      author: {
        icon_url:
          "https://res.cloudinary.com/pippa/image/fetch/h_500,w_500,f_auto/https://assets.pippa.io/shows/5d137ece8b774eb816199f63/1562125598000-ef38e8a9cd086f609f806209d1341102.jpeg",
        url: "https://shows.acast.com/yourkickstartersucks",
      },
      thumbnail: {
        url: "https://res.cloudinary.com/pippa/image/fetch/h_500,w_500,f_auto/https://assets.pippa.io/shows/5d137ece8b774eb816199f63/1562125598000-ef38e8a9cd086f609f806209d1341102.jpeg",
      },
      fields: [
        {
          name: epNum[0],
          value: epTitle ? epTitle : ".",
          inline: false,
        },
        {
          name: `Progress (${prettyMilliseconds(0, {
            colonNotation: true,
          })} / ${prettyMilliseconds(duration, { colonNotation: true })})`,
          value: "|" + "🟢" + progressStr + "|",
          inline: false,
        },
      ],
    };

    this.client.listen.embed = mainEmbed;

    this.client.listen.message = await message.channel
      .send({ embeds: [mainEmbed] })
      .catch((err) => console.log(err));

    await this.client.listen.message.react("⏸");
    await this.client.listen.message.react("⏹");
    await this.client.listen.message.react("▶️");
    const listen = this.client.listen;
    this.client.listen.interval = setInterval(
      () => {
        listen.embed.fields[1].name = `Progress (${prettyMilliseconds(
          listen.player.state.playbackDuration
            ? listen.player.state.playbackDuration
            : 0,
          { colonNotation: true }
        )} / ${prettyMilliseconds(duration, { colonNotation: true })})`;

        const progress = Math.ceil(
          (100 * listen.player.state.playbackDuration) / duration / 4
        );

        listen.embed.fields[1].value =
          "\\|" +
          "||" +
          progressStr.substring(0, progress) +
          "||" +
          "🟢" +
          progressStr.substring(progress) +
          "\\|";
        listen.message.edit({ embeds: [listen.embed] });
      },
      10 * 1000, // every 10 sec
      duration,
      progressStr,
      listen
    );
  }
}

module.exports = ListenCommand;
