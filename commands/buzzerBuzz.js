const { Command } = require("discord-akairo");

class BuzzerBuzzCommand extends Command {
  constructor() {
    super("buzz", {
      aliases: ["heep"],
      category: "buzzer",
      channel: "guild",
      cooldown: 5000,
      ratelimit: 5,
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
      try {
        message.channel.send(`${message.author} buzzed in!`);
        if (buzzerQueue.length % 3 === 0) {
          var num = 1;
          return message.channel.send(
            `Dookie list: ${buzzerQueue.reduce((str, buzz) => {
              return (
                str +
                `${num++}. ${this.client.util.resolveUser(
                  JSON.parse(buzz).id,
                  message.guild.members.cache
                )}\n`
              );
            }, "\n")}`
          );
        }
      } catch (err) {
        console.log(err);
      }
    }
  }
}

module.exports = BuzzerBuzzCommand;
