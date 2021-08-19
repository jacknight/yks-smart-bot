const { Listener } = require("discord-akairo");

class MailbagReactionRemoveListener extends Listener {
  constructor() {
    super("mailbagReactionRemove", {
      emitter: "client",
      event: "messageReactionRemove",
    });
  }

  async exec(reaction, user) {
    if (reaction.partial) {
      // try to fetch the message, which may or may not work with a partial
      try {
        await reaction.fetch();
      } catch (error) {
        console.log("Unable to fetch message for partial reaction:", error);
        return;
      }
    }

    // if the reaction was a ":this:" reaction, and to:
    // 1. a bot message; and
    // 2. in the kickstarter-bot channel; and
    // 3. the message has an embed
    // then update the tally for the message ID in the database
    if (
      reaction._emoji.name === "this" &&
      reaction.message.channel.id === process.env.YKS_MAILBAG_CHANNEL_ID
    ) {
      // Get array of existing mailbagMessages that have been reacted to
      const mailbagMessages = await this.client.settings.get(
        reaction.message.guild.id,
        "mailbagMessages",
        []
      );

      // Check if this message is in the list and if so, grab it and update
      // the tally. Otherwise, create a new object and add it to the list.
      let index = JSON.parse(
        mailbagMessages.findIndex(
          (mailbagMessage) =>
            JSON.parse(mailbagMessage).id === reaction.message.id
        )
      );

      if (index >= 0) {
        // Update the existing object by decrementing the count (or removing
        // it entirely)
        const msgObject = JSON.parse(mailbagMessages[index]);
        msgObject.count--;
        if (msgObject.count === 0) {
          mailbagMessages.splice(index, 1);
        } else {
          mailbagMessages[index] = JSON.stringify(msgObject);
        }
      }

      // Update database.
      this.client.settings.set(
        reaction.message.guild.id,
        "mailbagMessages",
        mailbagMessages
      );
    }
  }
}

module.exports = MailbagReactionRemoveListener;
