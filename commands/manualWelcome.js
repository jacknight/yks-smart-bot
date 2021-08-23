const { Command } = require("discord-akairo");

class WelcomeCommand extends Command {
  constructor() {
    super("newmember", {
      aliases: ["newmember"],
      args: [{ id: "id" }],
      ownerOnly: true,
    });
  }

  exec(message, { id }) {
    // Lookup guild by ID
    // const guildObj = this.client.util.resolveGuild(
    //   process.env.YKS_GUILD_ID,
    //   this.client.guilds.cache
    // );
    // if (!guildObj) return;

    // // Lookup member by ID
    // const member = this.client.util.resolveMember(id, guildObj.members.cache);
    // if (!member) return;

    return this.client.emit("guildMemberAdd", message.member);
  }
}

module.exports = WelcomeCommand;
