const { Command } = require("discord-akairo");

class ToggleBuzzerCommand extends Command {
  constructor() {
    super("ready", {
      aliases: ["ready", "toggle"],
      category: "buzzer",
      channel: "guild",
      prefix: "!buzz.",
    });
  }
  userPermissions(message) {
    if (
      !message.member.roles.cache.some(
        (role) =>
          role.name.toLowerCase() ===
          this.client.settings
            .get(message.guild.id, "buzzerRole", "Buzzer")
            .toLowerCase()
      )
    ) {
      return "Only for the one who controls the buzzer.";
    }
    return null;
  }

  async exec(message) {
    const oldReady = this.client.settings.get(
      message.guild.id,
      "buzzerReady",
      false
    );
    const newReady = !oldReady;
    await this.client.settings.set(message.guild.id, "buzzerReady", newReady);
    if (this.client.sockets.has(message.guild.id)) {
      this.client.sockets.get(message.guild.id).forEach((socket) => {
        socket.emit("responseReady", { ready: newReady });
      });
    }
    return message.channel.send(
      `Buzzer is **${newReady ? "ready" : "not ready"}**`
    );
  }
}

module.exports = ToggleBuzzerCommand;
