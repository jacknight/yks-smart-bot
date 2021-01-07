const { Command } = require("discord-akairo");
const Discord = require("discord.js");

class TestCommand extends Command {
  constructor() {
    super("test", {
      aliases: ["test"],
    });
  }

  exec(message) {
    const attachment = new Discord.MessageAttachment("./assets/yks-logo.jpg");
    message.channel.send("Test...", attachment).catch((err) => {
      console.log(err);
    });
  }
}

module.exports = TestCommand;
