const { Command } = require('discord-akairo');
const { unsplash } = require('../util');

class CassieCommand extends Command {
  constructor() {
    super('cassie', {
      aliases: ['cassie', 'frog'],
      cooldown: 1000 * 60,
      rateLimit: 1,
    });
  }

  async exec(message) {
    try {
      const frog = await unsplash.photos.getRandom({ query: 'frog' });
      if (frog?.type === 'success') {
        message.channel.send(frog.response.urls.full);
      }
    } catch (e) {
      console.error('Failed to get a frog photo: ', e);
    }
  }
}

module.exports = CassieCommand;
