const { Command } = require("discord-akairo");

class BuzzerRoleCommand extends Command {
  constructor() {
    super("role", {
      aliases: ["role"],
      category: "buzzer",
      channel: "guild",
      prefix: "!buzz.",
      args: [{ id: "role", type: "string" }],
    });
  }

  userPermissions(message) {
    if (!message.member.hasPermission("KICK_MEMBERS")) {
      return "Only for Jack";
    }
    return null;
  }

  exec(message, { role }) {
    this.client.settings.set(message.guild.id, "buzzerRole", role);
    return message.channel.send(
      `Only users with the role \`${role}\` can configure the buzzer.`
    );
  }
}

module.exports = BuzzerRoleCommand;
