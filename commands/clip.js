const { Command } = require('discord-akairo');

class ClipCommand extends Command {
  constructor() {
    super('clip', {
      aliases: ['clip', 'clips', 'randomclip', 'climp', 'climps', 'randomclimp'],
      cooldown: 1000 * 60, // once per min
      ratelimit: 1,
    });
  }

  exec(message) {
    const clips = this.client.settings.get(message.guild.id, 'clips', []);
    if (clips.length > 0) {
      let content = '';
      let index = Math.floor(Math.random() * clips.length);
      if (message.isViaSite && message.clip >= 0 && message.clip < clips.length) {
        index = message.clip;
        if (message.member) {
          content = `${message.member} shared this clip via https://pisscord.site/clips/${
            message.clip + 1
          }`;
        }
      }
      if (content != '') {
        message.channel.send({
          content,
          files: [clips[index]],
        });
      } else {
        message.channel.send({ files: [clips[index]] });
      }
    }
  }
}

module.exports = ClipCommand;
