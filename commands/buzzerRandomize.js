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
      try {
        return message.channel.send(
          `Randomized the dookie list: ${buzzerQueue.reduce((str, buzz) => {
            const member = this.client.util.resolveMember(
              JSON.parse(buzz).id,
              message.guild.members.cache
            );
            return (
              str + `${num++}. ${member.nickname || member.user.username}\n`
            );
          }, "\n")}`
        );
      } catch (err) {
        console.log(err);
      }
    }
  }
}

module.exports = BuzzerRandomizeCommand;
