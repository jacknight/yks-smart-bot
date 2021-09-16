const { Command } = require("discord-akairo");
const { sendRequest } = require("../util");

class EpisodeCommand extends Command {
  constructor() {
    super("episode", {
      aliases: ["episode", "ep"],
      cooldown: 1000 * 60 * 60 * 24, // once per day
      ratelimit: 2,
      args: [{ id: "title", match: "content" }],
    });
  }

  async exec(message, { title }) {
    // Only allow in the #kickstarter-bot channel on the YKS server
    if (
      message.channel.id !== process.env.YKS_KICKSTARTER_BOT_CHANNEL_ID ||
      message.guild.id !== process.env.YKS_GUILD_ID
    ) {
      const channel = this.client.util.resolveChannel(
        process.env.YKS_KICKSTARTER_BOT_CHANNEL_ID,
        message.guild.channels.cache
      );
      return message.channel.send(`Please use ${channel} for this command`);
    }

    try {
      const response = await sendRequest(
        "https://api.openai.com/v1/completions",
        "post",
        {
          prompt: title,
          model: "curie:ft-yks-smart-bot-2021-09-08-16-54-36",
          maxTokens: 100,
          temperature: 0.8,
          topP: 1,
          presencePenalty: 0,
          frequencyPenalty: 0,
          bestOf: 1,
          n: 1,
          stream: false,
          stop: ["###"],
          echo: true,
          user: this.client.user.id,
        }
      );

      const completion = response?.data?.choices[0].text.split("->");
      if (completion.length > 1) {
        const title = completion[0];
        const description = completion[1];
        message.reply({ embeds: [{ color: 0x83c133, title, description }] });
      } else {
        const description = completion[0];
        message.reply({ embeds: [{ color: 0x83c133, description }] });
      }
    } catch (e) {
      if (e.response) {
        return `(OpenAI Error) ${e.response.statusText}`;
      }
      console.log(e);
    }
  }
}

module.exports = EpisodeCommand;
