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
    const self = this;
    if (!this.client.gorb) {
      this.client.gorb = true;
      setTimeout(function () {
        self.client.gorb = false;
      }, 3600000);
      message.channel.send("gorb");
    }
  }
}

module.exports = GorbCommand;
