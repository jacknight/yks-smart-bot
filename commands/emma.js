const { Command } = require("discord-akairo");

class EmmaCommand extends Command {
  constructor() {
    super("emma", {
      aliases: ["emma"],
      cooldown: 3600000,
      ratelimit: 1,
    });
  }

  exec(message) {
    if (!this.client.globalRates.get(message.guild.id)) {
      this.client.globalRates.set(message.guild.id, new Set());
    }

    if (!this.client.globalRates.get(message.guild.id).has("emma")) {
      this.client.globalRates.get(message.guild.id).add("emma");
      const self = this;
      setTimeout(function () {
        self.client.globalRates.get(message.guild.id).delete("emma");
      }, 3600000);

      const responses = [
        ":hornypest:",
        ":hornytoo:",
        ":emma:",
        ":emma2:",
        ":emma3:",
      ];
      const response = responses[Math.floor(Math.random() * responses.length)];
      message.channel.send(response);
    }
  }
}

module.exports = EmmaCommand;
