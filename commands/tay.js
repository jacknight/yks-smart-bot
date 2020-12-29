const { Command } = require("discord-akairo");

class TayCommand extends Command {
  constructor() {
    super("tay", {
      aliases: ["tay"],
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
      if (message.guild.members.cache.has("251217007045902348")) {
        message.channel.send("Tay is back!");
      } else {
        message.channel.send("Who?");
      }
    }
  }
}

module.exports = TayCommand;
