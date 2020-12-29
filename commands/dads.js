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
    const self = this;
    if (!this.client.dads) {
      this.client.dads = true;
      setTimeout(function () {
        self.client.dads = false;
      }, 30000);

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
