const { Command } = require("discord-akairo");

class SixPackCommand extends Command {
  constructor() {
    super("sixpack", {
      aliases: ["sixpack", "sixpacks", "6pack", "6packs", "kaggle"],
      cooldown: 1000 * 60, // once per min
      ratelimit: 1,
    });
  }

  exec(message) {
    message.channel.send("https://www.kaggle.com/officerbribe/yks-six-pack");
  }
}

module.exports = SixPackCommand;
