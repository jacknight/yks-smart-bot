const { Command } = require("discord-akairo");

class BuzzerRoleCommand extends Command {
  constructor() {
    super("role", {
      aliases: ["role"],
      category: "buzzer",
      channel: "guild",
      prefix: "!buzz.",
      args: [{ id: "role", type: "role" }],
      cooldown: 120000,
      ratelimit: 1,
    });
  }

  userPermissions(message) {
    if (
      !message.member.hasPermission("KICK_MEMBERS") &&
      !message.member.roles.cache.some(
        (role) =>
          role.name ===
          this.client.settings.set(message.guild.id, "buzzerRole", "Buzzer")
      )
    ) {
      return "You don't have permission.";
    }
    return null;
  }

  exec(message, { role }) {
    if (!role) {
      return message.channel.send(`That role does not exist.`);
    }
    this.client.settings.set(message.guild.id, "buzzerRole", role.name);
    return message.channel.send(
      `Only users with the role \`${role.name}\` can configure the buzzer.`
    );
  }
}

module.exports = BuzzerRoleCommand;
