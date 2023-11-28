const { Command } = require('discord-akairo');

class BuzzerNickCommand extends Command {
  constructor() {
    super('nick', {
      aliases: ['nick', 'nickname', 'name'],
      category: 'buzzer',
      channel: 'guild',
      prefix: '!buzz.',
      args: [{ id: 'nick', match: 'content' }],
      cooldown: 60000,
      ratelimit: 1,
    });
  }

  async userPermissions(message) {
    const buzzerRole = await this.client.settings
      .get(message.guild.id, 'buzzerRole', 'buzzer')
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
    try {
      if (await message.guild.members.cache.get(this.client.clientID).setNickname(nick)) {
        return message.channel.send(`Hey, check out my new name!`);
      }
    } catch {
      return message.channel.send(`No.`);
    }
  }
}

module.exports = BuzzerNickCommand;
