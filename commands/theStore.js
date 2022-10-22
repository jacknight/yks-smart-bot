const { Command } = require('discord-akairo');

class TheStoreCommand extends Command {
  constructor() {
    super('thestore', {
      regex: /\b(a|an|the)\b [A-Za-z ]*\bstore\b/i,
      category: 'easter-egg',
    });
  }

  exec(message) {
    try {
      message.react(this.client.util.resolveEmoji('thestore', message.guild.emojis.cache));
    } catch {
      console.log;
    }
    return;
  }
}

module.exports = TheStoreCommand;
