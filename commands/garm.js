const { Command } = require("discord-akairo");

class GarmCommand extends Command {
  constructor() {
    super("garm", {
      cooldown: 3600000,
      ratelimit: 1,
      regex: /^garm$/i,
      category: "eater-egg",
    });
  }

  exec(message) {
    if (!this.client.globalRates.get(message.guild.id)) {
      this.client.globalRates.set(message.guild.id, new Set());
    }

    if (!this.client.globalRates.get(message.guild.id).has("garm")) {
      this.client.globalRates.get(message.guild.id).add("garm");
      const self = this;
      setTimeout(function () {
        self.client.globalRates.get(message.guild.id).delete("garm");
      }, 1000 * 60 * 60 * 12); // twice a day.
      message.channel.send("garm");
    }
  }
}

module.exports = GarmCommand;
