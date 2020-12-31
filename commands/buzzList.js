const { Command } = require("discord-akairo");

class BuzzerListCommand extends Command {
  constructor() {
    super("list", {
      aliases: ["list"],
      category: "buzzer",
      channel: "guild",
      prefix: "!buzz.",
      cooldown: 10000,
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

  exec(message) {
    const buzzerQueue = this.client.settings.get(
      message.guild.id,
      "buzzerQueue",
      []
    );

    if (buzzerQueue.length === 0) {
      return message.channel.send("Buzz list is empty.");
    }

    var num = 1;
    return message.channel.send(
      `Dookie list: ${buzzerQueue.reduce((str, buzz) => {
        const member = this.client.util.resolveMember(
          JSON.parse(buzz).id,
          message.guild.members.cache
        );
        return str + `${num++}. ${member.nickname || member.user.username}\n`;
      }, "\n")}`
    );
  }
}

module.exports = BuzzerListCommand;
