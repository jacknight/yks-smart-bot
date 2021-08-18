const { Listener } = require("discord-akairo");

class KickstarterReactionRemoveListener extends Listener {
  constructor() {
    super("kickstarterReactionRemove", {
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
      reaction.message.author.id === this.client.user.id &&
      reaction.message.channel.id ===
        process.env.YKS_KICKSTARTER_BOT_CHANNEL_ID &&
      reaction.message.embeds
    ) {
      // Get array of existing kickstarters that have been reacted to
      const kickstarters = await this.client.settings.get(
        reaction.message.guild.id,
        "kickstarters",
        []
      );

      // Check if this kickstarter is in the list and if so, grab it and update
      // the tally. Otherwise, create a new object and add it to the list.
      let index = JSON.parse(
        kickstarters.findIndex(
          (kickstarter) => JSON.parse(kickstarter).id === reaction.message.id
        )
      );

      if (index >= 0) {
        // Update the existing object by decrementing the count (or removing
        // it entirely)
        const ksObject = JSON.parse(kickstarters[index]);
        ksObject.count--;
        if (ksObject.count === 0) {
          kickstarters.splice(index, 1);
        } else {
          kickstarters[index] = JSON.stringify(ksObject);
        }
      }

      // Sort, descending.
      kickstarters.sort((a, b) => a.count - b.count);

      // Update database.
      this.client.settings.set(
        reaction.message.guild.id,
        "kickstarters",
        kickstarters
      );
    }
  }
}

module.exports = KickstarterReactionRemoveListener;
