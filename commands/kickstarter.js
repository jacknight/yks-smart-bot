const { Command } = require("discord-akairo");
const axios = require("axios");

const _send_request = function (url, method, opts = {}) {
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

class KickstarterCommand extends Command {
  constructor() {
    super("kickstarter", {
      aliases: ["kickstarter"],
      cooldown: 1000 * 60 * 60 * 24, // once per day
      ratelimit: 1,
      args: [{ id: "name", match: "content" }],
    });
  }

  async exec(message, { name }) {
    if (name.length > 80) return message.channel.send("Shorten it up, please.");
    const response = await _send_request(
      "https://api.openai.com/v1/completions",
      "post",
      {
        prompt: name,
        model: "curie:ft-yks-smart-bot-2021-08-04-13-59-00",
        maxTokens: 200,
        temperature: 0.7,
        topP: 1,
        presencePenalty: 0,
        frequencyPenalty: 0,
        bestOf: 1,
        n: 1,
        stream: false,
        stop: ["###"],
        echo: false,
      }
    );

    const completion = response.data.choices[0].text;
    const split = completion.split("\n");
    const title = name + split[0];
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
        title,
        description: description[1],
        fields: [
          {
            name: "Creator",
            value: author[1],
          },
          {
            name: "Category",
            value: category[1],
          },
          {
            name: "Status",
            value: status[1],
          },
          {
            name: "Backers",
            value: backers[1],
          },
          {
            name: "Pledged",
            value: pledged[1],
          },
          {
            name: "Goal",
            value: goal[1],
          },
        ],
      };
      return message.channel.send({ embed });
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

module.exports = KickstarterCommand;
