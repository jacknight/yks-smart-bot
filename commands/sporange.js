const { Command } = require("discord-akairo");

class SporangeCommand extends Command {
  constructor() {
    super("sporange", {
      regex: /sporange/i,
      category: "easter-egg",
    });
  }

  exec(message) {
    return message.channel.send("it's a new kind of orange");
  }
}

module.exports = SporangeCommand;
