const { Command } = require("discord-akairo");
const { sendRequest } = require("../util");

class EpisodeCommand extends Command {
  constructor() {
    super("episode", {
      aliases: ["episode"],
      cooldown: 1000 * 60 * 60 * 24, // once per day
      ratelimit: 2,
      args: [{ id: "title", match: "content" }],
    });
  }

  async exec(message, { title }) {
    try {
      const response = await sendRequest(
        "https://api.openai.com/v1/completions",
        "post",
        {
          prompt: title,
          model: "curie:ft-yks-smart-bot-2021-09-08-16-54-36",
          maxTokens: 200,
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
