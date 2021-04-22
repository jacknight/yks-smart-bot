const { Command } = require("discord-akairo");

class CrashCommand extends Command {
  constructor() {
    super("crash", {
      aliases: ["crash", "carcrash", "rearend", "rearended", "dashcam"],
      cooldown: 1000 * 60, // once per min
      ratelimit: 1,
    });
  }

  exec(message) {
    message.channel.send(
      "https://www.youtube.com/watch?v=aTBHQXzt_C0&feature=youtu.be"
    );
  }
}

module.exports = CrashCommand;
