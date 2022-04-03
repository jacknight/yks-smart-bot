const { Command } = require("discord-akairo");

class MailbagCommand extends Command {
  constructor() {
    super("mailbag", {
      aliases: ["mailbag", "address", "pubox"],
      cooldown: 1000 * 60, // once per min
      ratelimit: 1,
    });
  }

  exec(message) {
    message.channel.send({
      embeds: [
        {
          color: 0x83c133,
          title: "P.U. Box",
          description: "544 W Main St #209\nGallatin, TN\n37066\nUSA",
          footer: {
            text: "Remember to put an embarrassing name on the package",
          },
        },
      ],
    });
  }
}

module.exports = MailbagCommand;
