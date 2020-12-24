const { Command } = require("discord-akairo");

class SporangeCommand extends Command {
  constructor() {
    super("sporange", {
      regex: /sporange/i,
      category: "easter-egg",
      cooldown: 120000,
      ratelimit: 1,
    });
  }

  exec(message) {
    return message.channel.send("it's a new kind of orange");
  }
}

module.exports = SporangeCommand;
