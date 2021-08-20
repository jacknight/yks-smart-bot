const { Listener } = require("discord-akairo");

class ClipListener extends Listener {
  constructor() {
    super("clip", {
      emitter: "client",
      event: "messageCreate",
    });
  }

  exec(message) {
    // Check if it's a clip posted to the clips channel, and if so, store
    // the link in the database.
    if (
      message.author.id !== this.client.user.id &&
      message.channel.id === process.env.YKS_CLIP_CHANNEL_ID &&
      message.attachments.size > 0
    ) {
      message.attachments.forEach(async (attachment) => {
        const filetype = attachment.url.substring(
          attachment.url.lastIndexOf(".") + 1
        );
        if (
          filetype === "mov" ||
          filetype === "mp4" ||
          filetype === "webm" ||
          filetype === "wav" ||
          filetype === "mp3" ||
          filetype === "ogg"
        ) {
          const clips = await this.client.settings.get(
            message.guild.id,
            "clips",
            []
          );
          if (!clips.find((clip) => clip === attachment.url)) {
            clips.push(attachment.url);
            this.client.settings.set(message.guild.id, "clips", clips);
          }
        }
      });
    }
  }
}

module.exports = ClipListener;
