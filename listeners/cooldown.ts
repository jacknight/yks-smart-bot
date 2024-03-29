import { Command } from 'discord-akairo';
import { Message } from 'discord.js';

const { Listener } = require('discord-akairo');
const { CommandHandlerEvents } = require('discord-akairo/src/util/Constants');
const prettyMilliseconds = require('pretty-ms');

class CooldownListener extends Listener {
  constructor() {
    super('cooldown', {
      emitter: 'commandHandler',
      event: CommandHandlerEvents.COOLDOWN,
    });
  }

  exec(message: Message, command: Command, diff: number) {
    if (command.id === 'kickstarter' || command.id === 'realorfake' || command.id === 'episode') {
      message.channel.send(
        `(${command.id}) You're in cooldown for the next ${prettyMilliseconds(diff, {
          verbose: true,
        })}`,
      );
    }
  }
}

module.exports = CooldownListener;
