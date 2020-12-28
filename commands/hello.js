const { Command } = require("discord-akairo");

class HelloCommand extends Command {
  constructor() {
    super("hello", {
      regex: /hello|hey|hi|howdy|sup|good morning|good afternoon|good evening/i,
    });
  }

  exec(message) {
    console.log("HEY", message.mentions.users);
    if (message.mentions.users.has(this.client.user.id)) {
      message.channel.send("Can't talk, I'm at work. Let's meet face-to-face.");
    }
  }
}

module.exports = HelloCommand;
