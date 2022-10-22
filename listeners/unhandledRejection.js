const { Listener } = require('discord-akairo');

class UnhandledRejectionListener extends Listener {
  constructor() {
    super('unhandledRejection', {
      event: 'unhandledRejection',
      emitter: 'process',
    });
  }

  exec(reason, promise) {
    console.log("Unhandled rejection. Reason: '", reason, "'\n", promise);
  }
}

module.exports = UnhandledRejectionListener;
