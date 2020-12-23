const { Command } = require("discord-akairo");

class PingCommand extends Command {
  constructor() {
    super("ping", {
      aliases: ["ping"],
      channel: "guild",
      cooldown: 1000,
      ratelimit: 1,
    });
  }

  userPermissions(message) {
    if (!message.member.roles.cache.some((role) => role.name === "Jack")) {
      return "Only for Jack";
    }
    return null;
  }

  exec(message, args) {
    return message.reply("Pong!");
  }
}

module.exports = PingCommand;
