const { Command } = require("discord-akairo");

class BarnesCommand extends Command {
  constructor() {
    super("barnes", {
      aliases: ["barnes"],
      cooldown: 1000 * 60, // once per min
      ratelimit: 1,
    });
  }

  exec(message) {
    if (!this.client.globalRates.get(message.guild.id)) {
      this.client.globalRates.set(message.guild.id, new Set());
    }

    if (!this.client.globalRates.get(message.guild.id).has("barnes")) {
      this.client.globalRates.get(message.guild.id).add("barnes");
      const self = this;
      setTimeout(function () {
        self.client.globalRates.get(message.guild.id).delete("barnes");
      }, 1000 * 60); // once per min

      const responses = [":-1:"];
      const response = responses[Math.floor(Math.random() * responses.length)];
      if (response) {
        message.channel.send(response.toString());
      }
    }
  }
}

module.exports = BarnesCommand;
