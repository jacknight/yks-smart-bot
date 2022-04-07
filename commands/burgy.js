const { Command } = require("discord-akairo");

const globalToday = new Date();
class BurgyCommand extends Command {
  constructor() {
    super("burgy", {
      aliases: ["burgy"],
      ...((globalToday.getDate() !== 7 || globalToday.getMonth() !== 3) && {
        cooldown: 1000 * 60,
        rateLimit: 1,
      }),
    });
  }

  exec(message) {
    if (!this.client.globalRates.get(message.guild.id)) {
      this.client.globalRates.set(message.guild.id, new Set());
    }

    if (!this.client.globalRates.get(message.guild.id).has("burgy")) {
      this.client.globalRates.get(message.guild.id).add("burgy");
      const self = this;
      setTimeout(function () {
        self.client.globalRates.get(message.guild.id).delete("burgy");
      }, 1000 * 60); // once per min

      const burgyDate = new Date("2021/04/07");
      const today = new Date();
      const days = Math.floor((today - burgyDate) / (1000 * 60 * 60 * 24));
      message.channel.send(`Burgy left ${days} days ago.`);
    }
  }
}

module.exports = BurgyCommand;
