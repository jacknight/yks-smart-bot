const { Command } = require("discord-akairo");

class BuzzerRandomizeCommand extends Command {
  constructor() {
    super("randomize", {
      aliases: ["randomize", "random", "shuffle"],
      category: "buzzer",
      channel: "guild",
      prefix: "!buzz.",
      cooldown: 1000,
      ratelimit: 1,
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

    require("../util").shuffle(buzzerQueue);
    this.client.settings.set(message.guild.id, "buzzerQueue", buzzerQueue);
    if (this.client.sockets.has(message.guild.id)) {
      this.client.sockets.get(message.guild.id).forEach((socket) => {
        socket.emit("buzz", buzzerQueue);
      });
    }
    if (buzzerQueue.length > 0) {
      var num = 1;
      return message.channel.send(
        `Randomized the dookie list: ${buzzerQueue.reduce((str, buzz) => {
          return (
            str +
            `${num}. ${this.client.util.resolveUser(
              JSON.parse(buzz).id,
              message.guild.members.cache
            )}\n`
          );
        }, "\n")}`
      );
    }
  }
}

module.exports = BuzzerRandomizeCommand;
