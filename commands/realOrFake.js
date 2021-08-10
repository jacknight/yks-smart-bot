const { Command } = require("discord-akairo");
const axios = require("axios");
const fs = require("fs");
const readline = require("readline");
const { once } = require("events");

const getRealKickstarters = async () => {
  const responses = [];
  // Grab from file of real kickstarters
  const rl = readline.createInterface({
    input: fs.createReadStream("assets/PromptCompletion_prepared.jsonl"),
    crlfDelay: Infinity,
  });

  rl.on("error", (err) => console.error(err));

  rl.on("line", (line) => {
    if (!line) return;

    // Add completion to responses array.
    let temp = { data: { choices: [{ text: JSON.parse(line).completion }] } };
    responses.push(temp);
  });

  await once(rl, "close");

  return responses;
};

class RealOrFakeCommand extends Command {
  allowRetry = new Set();

  constructor() {
    super("realorfake", {
      aliases: ["realorfake", "rof"],
      cooldown: 1000 * 60 * 60 * 24, // once per day
      ratelimit: 2,
      ignoreCooldown: (message, command) => {
        return (
          message.member.id === "329288617564569602" ||
          this.allowRetry.has(message.member.id)
        );
      },
    });
  }

  async exec(message) {
    // Only allow in the #kickstarter-bot channel
    if (message.channel.id !== "873238126187917363") {
      const channel = this.client.util.resolveChannel(
        "873238126187917363",
        message.guild.channels.cache
      );
      return message.channel.send(`Please use ${channel} for this command`);
    }

    // Grab a response from the AI or from the file of real kickstarters
    const real = Math.random() < 0.5;
    let response = "";
    if (real) {
      const responses = await getRealKickstarters();
      response = responses[Math.floor(Math.random() * responses.length)];
    } else {
      // Grab a completion from the AI.
      response = await sendRequest(
        "https://api.openai.com/v1/completions",
        "post",
        {
          prompt: `**Name**:`,
          model: "curie:ft-yks-smart-bot-2021-08-07-18-00-06",
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
          user: message.member.id,
        }
      );
    }

    const completion = response.data.choices[0].text;
    const title = completion.match(/\*\*Name\*\*: (.*)/);
    const category = completion.match(/\*\*Category\*\*: (.*)/);
    const status = completion.match(/\*\*Status\*\*: (.*)/);
    const backers = completion.match(/\*\*Backers\*\*: (.*)/);
    const pledged = completion.match(/\*\*Pledged\*\*: (.*)/);
    const goal = completion.match(/\*\*Goal\*\*: (.*)/);
    const author = completion.match(/\*\*Creator\*\*: (.*)/);
    const description = completion.match(/\*\*Description\*\*: (.*)/);
    if (
      title &&
      category &&
      status &&
      backers &&
      pledged &&
      goal &&
      author &&
      description
    ) {
      const embed = {
        color:
          status[1] === "successful"
            ? 0x83c133
            : status[1] === "failed" || status[1] === "canceled"
            ? 0xff0000
            : 0x0000ff,
        title: title[1],
        description: description[1],
        fields: [
          {
            name: "Creator",
            value: author[1],
            inline: false,
          },
          {
            name: "Category",
            value: category[1],
            inline: false,
          },
          {
            name: "Backers",
            value: backers[1],
            inline: true,
          },
          {
            name: "Pledged",
            value: pledged[1],
            inline: true,
          },
          {
            name: "Goal",
            value: goal[1],
            inline: true,
          },
          {
            name: "Status",
            value: status[1],
          },
        ],
        footer: {
          text: "Output generated by GPT-3",
        },
      };
      const msg = await message.channel.send(
        `Real or Fake? || ${real ? "Real" : "Fake"} ||`,
        { embed }
      );
      await msg.react("🇷");
      return msg.react("🇫");
    } else {
      console.log(
        completion,
        title,
        category,
        status,
        backers,
        pledged,
        goal,
        author,
        description
      );
      return message.channel.send("Something went wrong");
    }
  }
}

const sendRequest = (url, method, opts = {}) => {
  let camelToUnderscore = (key) => {
    let result = key.replace(/([A-Z])/g, " $1");
    return result.split(" ").join("_").toLowerCase();
  };

  const data = {};
  for (const key in opts) {
    data[camelToUnderscore(key)] = opts[key];
  }

  return axios({
    url,
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_KEY}`,
      "Content-Type": "application/json",
    },
    data: Object.keys(data).length ? data : "",
    method,
  });
};

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
module.exports = RealOrFakeCommand;
