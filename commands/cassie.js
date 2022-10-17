const { Command } = require("discord-akairo");
const { unsplash } = require("../util");

class CassieCommand extends Command {
  constructor() {
    super("cassie", {
      aliases: ["cassie", "frog"],
      cooldown: 1000 * 60,
      rateLimit: 1,
    });
  }

  async exec(message) {
    if (!this.client.globalRates.get(message.guild.id)) {
      this.client.globalRates.set(message.guild.id, new Set());
    }

    if (!this.client.globalRates.get(message.guild.id).has("cassie")) {
      this.client.globalRates.get(message.guild.id).add("cassie");
      const self = this;
      setTimeout(function () {
        self.client.globalRates.get(message.guild.id).delete("cassie");
      }, 1000 * 60); // once per min

      try {
        const frog = await unsplash.photos.getRandom({ query: "frog" });
        if (frog?.type === "success") {
          message.channel.send(frog.response.urls.full);
        }
      } catch (e) {
        console.error("Failed to get a frog photo: ", e);
      }
    }
  }
}

module.exports = CassieCommand;
