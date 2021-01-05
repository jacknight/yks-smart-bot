const { Command } = require("discord-akairo");

class GorbCommand extends Command {
  constructor() {
    super("gorb", {
      cooldown: 3600000,
      ratelimit: 1,
      regex: /^gorb$/i,
      category: "eater-egg",
    });
  }

  exec(message) {
    if (!this.client.globalRates.get(message.guild.id)) {
      this.client.globalRates.set(message.guild.id, new Set());
    }

    if (!this.client.globalRates.get(message.guild.id).has("gorb")) {
      this.client.globalRates.get(message.guild.id).add("gorb");
      const self = this;
      setTimeout(function () {
        self.client.globalRates.get(message.guild.id).delete("gorb");
      }, 1000 * 60 * 60 * 12); // twice a day.
      message.channel.send("gorb");
    }
  }
}

module.exports = GorbCommand;
