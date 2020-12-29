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
    const self = this;
    if (!this.client.tay) {
      this.client.tay = true;
      setTimeout(function () {
        self.client.tay = false;
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
