const { Command } = require("discord-akairo");

class BuzzerNickCommand extends Command {
  constructor() {
    super("nick", {
      aliases: ["nick", "nickname", "name"],
      category: "buzzer",
      channel: "guild",
      prefix: "!buzz.",
      args: [{ id: "nick", type: "phrase" }],
      cooldown: 60000,
      ratelimit: 1,
      ignoreCooldown: ["329288617564569602"], // me :)
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

  async exec(message, { nick }) {
    console.log(nick);
    if (
      await message.guild.members.cache
        .get(this.client.user.id)
        .setNickname(nick)
    ) {
      return message.channel.send(
        `Hey, ${message.author}: thanks for the new name!`
      );
    } else {
      return message.channel.send(`No.`);
    }
  }
}

module.exports = BuzzerNickCommand;
