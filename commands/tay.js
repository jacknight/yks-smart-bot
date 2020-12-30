const { Command } = require("discord-akairo");

class TayCommand extends Command {
  constructor() {
    super("tay", {
      aliases: ["tay"],
    });
  }

  exec(message) {
    if (!this.client.globalRates.get(message.guild.id)) {
      this.client.globalRates.set(message.guild.id, new Set());
    }

    if (!this.client.globalRates.get(message.guild.id).has("tay")) {
      this.client.globalRates.get(message.guild.id).add("tay");
      const self = this;
      setTimeout(function () {
        self.client.globalRates.get(message.guild.id).delete("tay");
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
