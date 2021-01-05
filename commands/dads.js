const { Command } = require("discord-akairo");

class DadsCommand extends Command {
  constructor() {
    super("dads", {
      aliases: ["dads", "fathers"],
      cooldown: 3600000,
      ratelimit: 5,
    });
  }

  exec(message) {
    if (!this.client.globalRates.get(message.guild.id)) {
      this.client.globalRates.set(message.guild.id, new Set());
    }

    if (!this.client.globalRates.get(message.guild.id).has("dads")) {
      this.client.globalRates.get(message.guild.id).add("dads");
      const self = this;
      setTimeout(function () {
        self.client.globalRates.get(message.guild.id).delete("dads");
      }, 1000 * 60 * 60); // once per hour

      const responses = [
        "Dads always be having untimely deaths.",
        "Dads always be dying.",
        "Dead.",
        "Where's all the dead dad club members? Flash your cards let's see 'em.",
        "Sometimes your mom is your dad cause your dad is dead.",
      ];
      const response = responses[Math.floor(Math.random() * responses.length)];
      message.channel.send(response);
    }
  }
}

module.exports = DadsCommand;
