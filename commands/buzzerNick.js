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
    const buzzerRoleObj = this.client.util.resolveRole(
      buzzerRole,
      message.guild.roles.cache
    );
    if (
      !message.member.roles.cache.some((role) => {
        return role.name.toLowerCase() === buzzerRole;
      })
    ) {
      return message.channel.send(
        `Only users with the role ${
          buzzerRoleObj ? buzzerRoleObj : buzzerRole
        } can change my nickname.`
      );
    }
    return null;
  }

  async exec(message, { nick }) {
    try {
      if (
        await message.guild.members.cache
          .get(this.client.user.id)
          .setNickname(nick)
      ) {
        return message.channel.send(`Hey, check out my new name!`);
      }
    } catch {
      return message.channel.send(`No.`);
    }
  }
}

module.exports = BuzzerNickCommand;
