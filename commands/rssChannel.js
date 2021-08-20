const { Command } = require("discord-akairo");

class RssChannelCommand extends Command {
  constructor() {
    super("rssChannel", {
      aliases: ["rssChannel"],
      channel: "guild",
      args: [{ id: "channel", type: "channel" }],
    });
  }

  async userPermissions(message) {
    if (
      message.member.id !== "329288617564569602" &&
      !message.member.permissions.has("ADMINISTRATOR")
    ) {
      return "You don't have permission!";
    }
    return null;
  }

  async exec(message, { channel }) {
    if (!channel) {
      return message.channel.send(`That channel does not exist.`);
    }

    if (channel.type !== "GUILD_TEXT") {
      try {
        return message.reply({
          content: `${channel} is not a text channel. No change.`,
          allowedMentions: { repliedUser: true },
        });
      } catch (err) {
        console.log(err);
      }
    }

    await this.client.settings.set(
      message.guild.id,
      "rssChannel",
      JSON.stringify(channel)
    );
    try {
      return channel.send(`RSS feed updates will come to ${channel}.`);
    } catch (err) {
      console.log(err);
    }
  }
}

module.exports = RssChannelCommand;
