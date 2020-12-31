const { Command } = require("discord-akairo");

class BuzzerToggleCommand extends Command {
  constructor() {
    super("ready", {
      aliases: ["ready", "toggle"],
      category: "buzzer",
      channel: "guild",
      prefix: "!buzz.",
      cooldown: 10000,
      ratelimit: 5,
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

  exec(message) {
    const oldReady = this.client.settings.get(
      message.guild.id,
      "buzzerReady",
      false
    );
    const newReady = oldReady ? false : true;
    this.client.settings.set(message.guild.id, "buzzerReady", newReady);
    if (newReady) {
      // clear the queue when the buzzer is re-enabled
      this.client.settings.set(message.guild.id, "buzzerQueue", []);
    }
    if (this.client.sockets.has(message.guild.id)) {
      this.client.sockets.get(message.guild.id).forEach((socket) => {
        socket.emit(
          "buzz",
          this.client.settings.get(message.guild.id, "buzzerQueue", [])
        );
        socket.emit("responseReady", { ready: newReady });
      });
    }
    return message.channel.send(
      `Buzzer is **${newReady ? "ready" : "not ready"}**`
    );
  }
}

module.exports = BuzzerToggleCommand;
