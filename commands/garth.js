const { Command } = require('discord-akairo');

class GarthCommand extends Command {
  constructor() {
    super('garth', {
      aliases: ['garth', 'slickstuff', 'coolstuff', 'rawstuff', 'neatstuff'],
      cooldown: 1000 * 60 * 60, // once per hour
      ratelimit: 1,
    });
  }

  exec(message) {
    message.channel.send(
      'https://cdn.discordapp.com/attachments/1108848589196775526/1118513877685116958/videoplayback_2.mp4',
    );
  }
}

module.exports = GarthCommand;
