const { Command } = require("discord-akairo");

class TheStoreCommand extends Command {
  constructor() {
    super("thestore", {
      regex: /(a|an|the) [A-Za-z ]*store/i,
      category: "easter-egg",
      cooldown: 28800000, // 3 times a day
      ratelimit: 1,
    });
  }

  exec(message) {
    return message.channel.send("The store, you say?");
  }
}

module.exports = TheStoreCommand;
