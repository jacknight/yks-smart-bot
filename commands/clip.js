const { Command } = require("discord-akairo");

class ClipCommand extends Command {
  constructor() {
    super("clip", {
      aliases: [
        "clip",
        "clips",
        "randomclip",
        "climp",
        "climps",
        "randomclimp",
      ],
      cooldown: 1000 * 60, // once per min
      ratelimit: 1,
    });
  }

  exec(message) {
    const clips = this.client.settings.get(message.guild.id, "clips", []);
    if (clips.length > 0) {
      message.channel.send({
        files: [clips[Math.floor(Math.random() * clips.length)]],
      });
    }
  }
}

module.exports = ClipCommand;
