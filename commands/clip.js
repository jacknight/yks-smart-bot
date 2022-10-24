const { Command } = require('discord-akairo');

class ClipCommand extends Command {
  constructor() {
    super('clip', {
      aliases: ['clip', 'clips', 'randomclip', 'climp', 'climps', 'randomclimp'],
      cooldown: 1000 * 60, // once per min
      ratelimit: 1,
    });
  }

  async checkLink(url) {
    const result = { valid: false, remove: false };
    try {
      await axios.get(url.replace('cdn.discordapp.com', 'media.discordapp.net'));
      result.valid = true;
      result.remove = false;
    } catch (e) {
      if (e?.response?.status === 404) {
        result.remove = true;
        result.valid = false;
      }
    }
    return result;
  }

  async exec(message) {
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

      let foundValidLink = false;
      while (!foundValidLink && clips.length > 0) {
        const url = clips[index];
        const result = await this.checkLink(url);
        foundValidLink = result.valid;

        // Remove from clips if it through a 404 (someone deleted the post)
        if (result.remove) {
          const loc = clips.indexOf(url);
          if (loc >= 0) {
            clips.splice(loc);
            this.client.settings.set(message.guild.id, 'clips', clips);
          }
        }

        // If invalid, find a new random index to poke.
        if (!foundValidLink) {
          index = Math.floor(Math.random() * clips.length);
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
