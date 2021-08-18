const { Command } = require("discord-akairo");
const {
  sendRequest,
  getKickstarterEmbed,
  getAIResponse,
  undoRateLimit,
} = require("../util");

class KickstarterCommand extends Command {
  constructor() {
    super("kickstarter", {
      aliases: ["kickstarter", "ks"],
      cooldown: 1000 * 60 * 60 * 24, // once per day
      ratelimit: 10,
      args: [{ id: "name", match: "content" }],
    });
  }

  async exec(message, { name }) {
    if (!name) return;

    // Only allow in the #kickstarter-bot channel
    if (
      message.channel.id !== process.env.YKS_KICKSTARTER_BOT_CHANNEL_ID &&
      message.guild.id !== process.env.YKS_GUILD_ID
    ) {
      const channel = this.client.util.resolveChannel(
        process.env.YKS_KICKSTARTER_BOT_CHANNEL_ID,
        message.guild.channels.cache
      );
      return message.channel.send(`Please use ${channel} for this command`);
    }

    if (name.length > 80) {
      undoRateLimit(this.client, message.member.id, this.id);
      return message.channel.send("Shorten it up, please.");
    }
    // First, we run it through the content filter to be responsible users of AI
    const contentFilterResult = await contentFilter(name);
    if (contentFilterResult === "2") {
      undoRateLimit(this.client, message.member.id, this.id);
      return message.channel.send("Sorry, the response was too offensive.");
    }

    // Prompt passed muster, go ahead with our fine tuned model.
    const response = await getAIResponse(name, message.member.id);

    const completion = response.data.choices[0].text;
    const embed = getKickstarterEmbed(completion, false);
    if (embed) {
      return message.channel.send({ embed });
    } else {
      undoRateLimit(this.client, message.member.id, this.id);
      console.log(completion);
      return message.channel.send("Something went wrong");
    }
  }
}

const contentFilter = async (name) => {
  // This is the probability at which we evaluate that a "2" is likely real
  // vs. should be discarded as a false positive
  toxicThreshold = -0.355;

  let prompt = "<|endoftext|>";

  prompt += ` **Name**: Beautiful Things
**Creator**: Paige Polk
**Description**: A queer love story touched by motherhood and self-doubt with a Brooklyn backdrop.
**Category**: film & video/romance
**Status**: failed
**Backers**: 80
**Pledged**: 4215
**Goal**: 24953

###

**Name**: ${name}`;

  prompt += "\n--\nLabel:";

  const response = await sendRequest(
    "https://api.openai.com/v1/engines/content-filter-alpha-c4/completions",
    "post",
    {
      prompt,
      maxTokens: 1,
      temperature: 0,
      topP: 1,
      presencePenalty: 0,
      frequencyPenalty: 0,
      logprobs: 10,
    }
  );

  let flag = response.data.choices[0].text;
  // A response of "2" means potentially inappropriate content. Double check it
  if (flag == "2") {
    logprobs = response.data.choices[0].logprobs.top_logprobs[0];
    let flag0 = logprobs["0"];
    let flag1 = logprobs["1"];
    let flag2 = logprobs["2"];
    if (flag2 < toxicThreshold) {
      if (flag1 && flag0) {
        if (flag0 > flag1) {
          flag = flag0;
        } else {
          flag = flag1;
        }
      } else if (flag0) {
        flag = flag0;
      } else if (flag1) {
        flag = flag1;
      }
    }
  } else if ((flag !== "0") & (flag !== "1")) {
    flag = 2;
  }

  return flag;
};
module.exports = KickstarterCommand;
