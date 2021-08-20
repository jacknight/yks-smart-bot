const { Command } = require("discord-akairo");

class SporangeCommand extends Command {
  constructor() {
    super("sporange", {
      regex: /sporange/i,
      category: "easter-egg",
      cooldown: 28800000, // 3 times a day
      ratelimit: 1,
    });
  }

  exec(message) {
    if (!this.client.globalRates.get(message.guild.id)) {
      this.client.globalRates.set(message.guild.id, new Set());
    }

    if (!this.client.globalRates.get(message.guild.id).has("sporange")) {
      this.client.globalRates.get(message.guild.id).add("sporange");
      const self = this;
      setTimeout(function () {
        self.client.globalRates.get(message.guild.id).delete("sporange");
      }, 1000 * 60 * 60 * 24 * 7); // once a week.
      return message.reply("it's a new kind of orange");
    }
  }
}

module.exports = SporangeCommand;
