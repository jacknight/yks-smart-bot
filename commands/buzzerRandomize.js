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

  userPermissions(message) {
    const buzzerRole = this.client.settings
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
    if (
      message.channel.id !==
        JSON.parse(
          await this.client.settings.get(
            message.guild.id,
            "buzzerChannel",
            JSON.stringify(message.channel)
          )
        ).id ||
      !(await this.client.settings.get(message.guild.id, "buzzerReady", false))
    )
      return;

    const buzzerQueue = await this.client.settings.get(
      message.guild.id,
      "buzzerQueue",
      []
    );

    require("../util").shuffle(buzzerQueue);
    await this.client.settings.set(
      message.guild.id,
      "buzzerQueue",
      buzzerQueue
    );
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
