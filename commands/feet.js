const { Command } = require("discord-akairo");

class FeetCommand extends Command {
  constructor() {
    super("feet", {
      aliases: ["feet"],
      cooldown: 3600000,
      ratelimit: 1,
    });
  }

  exec(message) {
    if (!this.client.globalRates.get(message.guild.id)) {
      this.client.globalRates.set(message.guild.id, new Set());
    }

    if (!this.client.globalRates.get(message.guild.id).has("feet")) {
      this.client.globalRates.get(message.guild.id).add("feet");
      const self = this;
      setTimeout(function () {
        self.client.globalRates.get(message.guild.id).delete("feet");
      }, 1000 * 60 * 60 * 24); // once per day

      message.channel.send("Is that you, Quentin?");
    }
  }
}

module.exports = FeetCommand;
