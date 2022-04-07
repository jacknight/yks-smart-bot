const { Command } = require("discord-akairo");

const globalToday = new Date();
class MugCommand extends Command {
  constructor() {
    super("mug", {
      aliases: ["mug", "burgymug"],
      cooldown: 1000 * 60, // once per min
      ratelimit:
        (globalToday.getDate() !== 7 || globalToday.getMonth() !== 3) ?? 1,
    });
  }

  exec(message) {
    if (!this.client.globalRates.get(message.guild.id)) {
      this.client.globalRates.set(message.guild.id, new Set());
    }

    if (!this.client.globalRates.get(message.guild.id).has("mug")) {
      this.client.globalRates.get(message.guild.id).add("mug");
      const self = this;
      setTimeout(function () {
        self.client.globalRates.get(message.guild.id).delete("mug");
      }, 1000 * 60); // once per min

      const attachment = this.client.util.attachment("./assets/mug.png");
      message.channel.send({ files: [attachment] });
    }
  }
}

module.exports = MugCommand;
