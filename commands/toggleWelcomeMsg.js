const { Command } = require("discord-akairo");

class ToggleWelcomeMsgCommand extends Command {
  constructor() {
    super("welcome", {
      aliases: ["welcome"],
      channel: "guild",
    });
  }

  async userPermissions(message) {
    if (!message.member.permissions.has("MANAGE_ROLES")) {
      return "You don't have permission.";
    }
    return null;
  }

  async exec(message) {
    const welcomeMsgDisabled = await this.client.settings.get(
      message.guild.id,
      "welcomeMsgDisabled",
      false
    );
    await this.client.settings.set(
      message.guild.id,
      "welcomeMsgDisabled",
      !welcomeMsgDisabled
    );
    return message.channel.send(
      `Welcome message ${!welcomeMsgDisabled ? "disabled" : "enabled"}.`
    );
  }
}

module.exports = ToggleWelcomeMsgCommand;
