const { Command } = require("discord-akairo");

class GabeCommand extends Command {
  constructor() {
    super("gabe", {
      aliases: ["gabe", "terrorists", "thesouth", "cancel", "virtuesignal"],
      cooldown: 1000 * 60, // once per min
      ratelimit: 1,
    });
  }

  exec(message) {
    // Sorry, Ashen. Vinny made me do it.
    if (message.member.id === "917428535474417736") return;

    if (!this.client.globalRates.get(message.guild.id)) {
      this.client.globalRates.set(message.guild.id, new Set());
    }

    if (!this.client.globalRates.get(message.guild.id).has("gabe")) {
      this.client.globalRates.get(message.guild.id).add("gabe");
      const self = this;
      setTimeout(function () {
        self.client.globalRates.get(message.guild.id).delete("gabe");
      }, 1000 * 60 * 60 * 24); // once per day

      message.channel
        .send(`Really wanted to like this podcast, the hosts are pretty funny and I'm a big fan of the South. \
But at this point I'm gonna cancel my Patreon; the constant one-sided trashing of conservatives is just too much. \
It would be one thing if the jabs were funny, but it's usually they're more along the lines of "some guy was \
talking to me about Alex Jones and I was like, I don't want to have this conversation". Just blatant unfunny \
virtue signaling to the presumably overwhelmingly liberal audience.

Heading back to Hollywood Handbook-- even though everyone knows they're liberal California elites, they're able \
to restrain themselves from flinging shit long enough to record an hour-long podcast every week. Hope you guys \
know that by demonizing your political opponents, you're deepening the divide in America, and when Americans \
commit acts of terror, it's because of this environment that you're helping to perpetuate.`);
    }
  }
}

module.exports = GabeCommand;
