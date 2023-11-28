const { Listener } = require('discord-akairo');

class UnhandledRejectionListener extends Listener {
  constructor() {
    super('unhandledRejection', {
      event: 'unhandledRejection',
      emitter: 'process',
    });
  }

  exec(promiseRejectionEvent: any) {
    console.log("Unhandled rejection. Reason: '", JSON.stringify(promiseRejectionEvent));
  }
}

module.exports = UnhandledRejectionListener;
