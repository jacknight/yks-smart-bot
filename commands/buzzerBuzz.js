const { Command } = require("discord-akairo");

class BuzzerBuzzCommand extends Command {
  constructor() {
    super("buzz", {
      aliases: ["heep"],
      category: "buzzer",
      channel: "guild",
      cooldown: 5000,
      ratelimit: 5,
      ignoreCooldown: ["329288617564569602"], // me :)
    });
  }

  exec(message) {
    if (
      message.channel.id !==
        JSON.parse(
          this.client.settings.get(
            message.guild.id,
            "buzzerChannel",
            JSON.stringify(message.channel)
          )
        ).id ||
      !this.client.settings.get(message.guild.id, "buzzerReady", false)
    )
      return;

    const buzzerQueue = this.client.settings.get(
      message.guild.id,
      "buzzerQueue",
      []
    );

    if (
      !buzzerQueue.find((author) => JSON.parse(author).id === message.author.id)
    ) {
      buzzerQueue.push(JSON.stringify(message.author));
      if (
        this.client.settings.get(message.guild.id, "buzzerMode", "normal") ===
        "chaos"
      ) {
        require("../util").shuffle(buzzerQueue);
      }
      this.client.settings.set(message.guild.id, "buzzerQueue", buzzerQueue);
      if (this.client.sockets.has(message.guild.id)) {
        this.client.sockets.get(message.guild.id).forEach((socket) => {
          socket.emit("buzz", buzzerQueue);
        });
      }
      return message.channel.send(`${message.author} buzzed in!`);
    }
  }
}

module.exports = BuzzerBuzzCommand;
