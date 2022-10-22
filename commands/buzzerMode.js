const { Command } = require('discord-akairo');

class BuzzerModeCommand extends Command {
  constructor() {
    super('mode', {
      aliases: ['mode'],
      category: 'buzzer',
      channel: 'guild',
      prefix: '!buzz.',
      cooldown: 1000,
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

  async exec(message) {
    if (await this.client.settings.get(message.guild.id, 'buzzerReady', false)) {
      return message.channel.send("You can't change the mode while the buzzer is enabled.");
    }
    // There must be a better way to do this...
    if (
      JSON.parse(
        await this.client.settings.get(
          message.guild.id,
          'buzzerChannel',
          JSON.stringify(message.channel),
        ),
      ).id !== message.channel.id
    ) {
      return;
    }

    const oldMode = await this.client.settings.get(message.guild.id, 'buzzerMode', 'normal');
    const newMode = oldMode === 'normal' ? 'chaos' : 'normal';
    await this.client.settings.set(message.guild.id, 'buzzerMode', newMode);

    if (this.client.sockets.has(message.guild.id)) {
      this.client.sockets.get(message.guild.id).forEach((socket) => {
        socket.emit('responseMode', { mode: newMode });
      });
    }

    try {
      if (newMode === 'chaos') {
        return message.channel.send(`Buddy...you are now in **${newMode} mode!!!**`);
      } else {
        return message.channel.send(`You are now in **${newMode} mode**`);
      }
    } catch (err) {
      console.log(err);
    }
  }
}

module.exports = BuzzerModeCommand;
