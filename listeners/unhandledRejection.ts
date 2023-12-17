const { Listener } = require('discord-akairo');

class UnhandledRejectionListener extends Listener {
  constructor() {
    super('unhandledRejection', {
      event: 'unhandledRejection',
      emitter: 'process',
    });
  }

  exec(reason: string, promise: Promise<any>) {
    console.error("Unhandled rejection. Reason: '", reason, "'\nPromise=======\n", promise);
  }
}

module.exports = UnhandledRejectionListener;
