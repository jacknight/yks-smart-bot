const { Command } = require("discord-akairo");

class HelloCommand extends Command {
  constructor() {
    super("hello", {
      cooldown: 3600000,
      ratelimit: 1,
      category: "converse",
      regex: /(hello|hey|hi|howdy|sup|good morning|good afternoon|good evening)/i,
    });
  }

  exec(message) {
    if (message.mentions.users.has(this.client.user.id)) {
      if (!this.client.globalRates.get(message.guild.id).has("gorb")) {
        this.client.globalRates.get(message.guild.id).add("gorb");
        const self = this;
        setTimeout(function () {
          self.client.globalRates.get(message.guild.id).delete("gorb");
        }, 1000 * 60 * 60 * 24); // once a day.
        message.channel.send(
          "Can't talk, I'm at work. Let's meet face-to-face."
        );
      }
    }
  }
}

module.exports = HelloCommand;
