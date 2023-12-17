import { MessageReaction } from 'discord.js';

const { Listener } = require('discord-akairo');

class MailbagReactionAddListener extends Listener {
  constructor() {
    super('mailbagReactionAdd', {
      emitter: 'client',
      event: 'messageReactionAdd',
    });
  }

  async exec(reaction: MessageReaction) {
    if (reaction.partial) {
      // try to fetch the message, which may or may not work with a partial
      try {
        await reaction.fetch();
      } catch (error) {
        console.error('Unable to fetch message for partial reaction:', error);
        return;
      }
    }

    // if the reaction was a ":this:" reaction, and to:
    // 1. a bot message; and
    // 2. in the mailbag channel; and
    // 3. the message has an embed
    // then update the tally for the message ID in the database
    if (
      reaction.emoji.name === 'this' &&
      reaction.message.channel.id === process.env.YKS_MAILBAG_CHANNEL_ID
    ) {
      // Get array of existing mailbag messages that have been reacted to
      const mailbagMessages = await this.client.settings.get(
        reaction.message.guild?.id,
        'mailbagMessages',
        [],
      );

      // Check if this message is in the list and if so, grab it and update
      // the tally. Otherwise, create a new object and add it to the list.
      let index = JSON.parse(
        mailbagMessages.findIndex(
          (mailbagMessage: string) => JSON.parse(mailbagMessage).id === reaction.message.id,
        ),
      );

      if (index < 0) {
        // Create a new object, then stringify it and add it to the array.
        const msgObject = {
          id: reaction.message.id,
          count: 1,
          ts: reaction.message.createdTimestamp,
        };
        mailbagMessages.push(JSON.stringify(msgObject));
      } else {
        // Update the existing object by incrementing the count.
        const msgObject = JSON.parse(mailbagMessages[index]);
        msgObject.count++;
        mailbagMessages[index] = JSON.stringify(msgObject);
      }

      // Update database.
      this.client.settings.set(reaction.message.guild?.id, 'mailbagMessages', mailbagMessages);
    }
  }
}

module.exports = MailbagReactionAddListener;
