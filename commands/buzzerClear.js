const { Command } = require("discord-akairo");

class BuzzerClearCommand extends Command {
  constructor() {
    super("clear", {
      aliases: ["clear"],
      category: "buzzer",
      channel: "guild",
      prefix: "!buzz.",
      cooldown: 1000,
      ratelimit: 1,
    });
  }

  async userPermissions(message) {
    const buzzerRole = await this.client.settings
      .get(message.guild.id, "buzzerRole", "buzzer")
      .toLowerCase();
    if (
      !message.member.roles.cache.some((role) => {
        return role.name.toLowerCase() === buzzerRole;
      })
    ) {
      return "You don't have permission.";
    }
    return null;
  }

  async exec(message) {
    // There must be a better way to do this...
    if (
      JSON.parse(
        await this.client.settings.get(
          message.guild.id,
          "buzzerChannel",
          JSON.stringify(message.channel)
        )
      ).id !== message.channel.id
    ) {
      return;
    }

    await this.client.settings.set(message.guild.id, "buzzerQueue", []);
    if (this.client.sockets.has(message.guild.id)) {
      this.client.sockets.get(message.guild.id).forEach((socket) => {
        socket.emit("buzz", []);
      });
    }
    try {
      return message.channel.send("Cleared the dookie list.");
    } catch (err) {
      console.log(err);
    }
  }
}

module.exports = BuzzerClearCommand;
