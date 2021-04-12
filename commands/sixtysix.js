const { Command } = require("discord-akairo");

class GorbCommand extends Command {
  constructor() {
    super("65", {
      regex: /^65$/i,
      category: "eater-egg",
      cooldown: 1000 * 60 * 60 * 24,
    });
  }

  exec(message) {
    if (message.channel.name === "yks-shit") {
      message.channel.send("66");
    }
  }
}

module.exports = GorbCommand;
