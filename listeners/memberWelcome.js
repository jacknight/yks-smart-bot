const { Listener } = require("discord-akairo");
class MemberWelcomeListener extends Listener {
  constructor() {
    super("memberwelcome", {
      emitter: "client",
      event: "guildMemberAdd",
    });
  }

  async exec(member) {
    if (this.client.settings.get(member.guild.id, "welcomeMsgDisabled", false))
      return;

    // Check if they've already been welcomed
    const welcomedMembers = await this.client.settings.get(
      member.guild.id,
      "welcomedMembers",
      []
    );
    // if (welcomedMembers.some((id) => id === member.id)) return;

    // Add to welcomed members for guild so we don't do this again.
    welcomedMembers.push(member.id);
    this.client.settings.set(
      member.guild.id,
      "welcomedMembers",
      welcomedMembers
    );

    // Build a dynamic composite image that welcomes the user with
    // their own display name and avatar.

    const responses = [
      "You don't have to be insane to post here, but it's a \"good to have.\"",
      "I give it a month.",
      "Make yourself at home.\nOh ok, you're going straight for the nasty channel. Ah! Well. Nevertheless,",
      "It's not too late to just turn around and walk away. No one would blame you.",
      "Grab an empty chair in the circle. We're just about to start sharing how YKS ruined our lives.",
      "If you need to know what episode something happened in, ask vinny.",
      "If you see JF or DB in here, avert your eyes from their posts as a sign of respect.",
      "Vote for your favorite episode # using the command\n`!best <episode number>`",
      'JF has blessed your timeline. say "thank you mr. jf" for good fortune in the new year',
    ];
    member.guild.systemChannel.send({
      content: `Welcome, ${member}! ${
        responses[Math.floor(Math.random() * responses.length)]
      }`,
      files: ["./assets/jf-blessing.png"],
    });
  }
}

module.exports = MemberWelcomeListener;
