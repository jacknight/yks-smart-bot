const { Command } = require("discord-akairo");

class BuzzerChannelCommand extends Command {
  constructor() {
    super("channel", {
      aliases: ["channel"],
      category: "buzzer",
      channel: "guild",
      prefix: "!buzz.",
      args: [{ id: "channel", type: "channel" }],
      cooldown: 10000,
      ratelimit: 1,
    });
  }

  async userPermissions(message) {
    const buzzerRole = await this.client.settings
      .get(message.guild.id, "buzzerRole", "buzzer")
      .toLowerCase();
    if (
      !message.member.roles.cache.some((role) => {
        return role.name.toLowerCase() === buzzerRole;
      })
    ) {
      return "You don't have permission.";
    }
    return null;
  }

  async exec(message, { channel }) {
    if (!channel) {
      return message.channel.send(`That channel does not exist.`);
    }

    // There must be a better way to do this...
    if (
      JSON.parse(
        await this.client.settings.get(
          message.guild.id,
          "buzzerChannel",
          JSON.stringify(message.channel)
        )
      ).id !== message.channel.id
    ) {
      return;
    }

    if (channel.type !== "text") {
      try {
        return message.reply(`${channel} is not a text channel. No change.`);
      } catch (err) {
        console.log(err);
      }
    }

    await this.client.settings.set(
      message.guild.id,
      "buzzerChannel",
      JSON.stringify(channel)
    );
    try {
      return channel.send(`Buzzer now listening on ${channel}.`);
    } catch (err) {
      console.log(err);
    }
  }
}

module.exports = BuzzerChannelCommand;
