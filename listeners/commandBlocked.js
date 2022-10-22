const { Listener } = require('discord-akairo');

class CommandBlockedListener extends Listener {
  constructor() {
    super('commandBlocked', {
      emitter: 'commandHandler',
      event: 'commandBlocked',
    });
  }

  exeC(message, command, reason) {
    console.log(
      `${message.author.username} was blocked from using ${command.id} because of ${reason}`,
    );
  }
}

module.exports = CommandBlockedListener;
