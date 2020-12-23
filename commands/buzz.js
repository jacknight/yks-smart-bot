const { Command } = require("discord-akairo");

class BuzzCommand extends Command {
  constructor() {
    super("buzz", {
      aliases: ["heep"],
      category: "buzzer",
      channel: "guild",
    });
  }

  condition(message) {
    return (
      message.channel.id ===
        JSON.parse(this.client.settings.get(message.guild.id, "buzzerChannel"))
          .id &&
      this.client.settings.get(message.guild.id, "buzzerReady", false)
    );
  }

  exec(message) {
    const buzzerQueue = this.client.settings.get(
      message.guild.id,
      "buzzerQueue",
      []
    );

    if (
      !buzzerQueue.find((author) => JSON.parse(author).id === message.author.id)
    ) {
      buzzerQueue.push(JSON.stringify(message.author));
      this.client.settings.set(message.guild.id, "buzzerQueue", buzzerQueue);
      require("../util").shuffle(
        this.client.settings.get(message.guild.id, "buzzerQueue", [])
      );
      if (this.client.sockets.has(message.guild.id)) {
        this.client.sockets.get(message.guild.id).forEach((socket) => {
          socket.emit("buzz", buzzerQueue);
        });
      }
      return message.channel.send(`${message.author} buzzed in!`);
    }
  }
}

module.exports = BuzzCommand;
