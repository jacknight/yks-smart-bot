const OpenAI = require("openai-api");
const fs = require("fs");
const { Command } = require("discord-akairo");
const { MessageEmbed } = require("discord.js");

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
    const openai = new OpenAI(process.env.OPENAI_KEY);
    const prompt = `This a generator for product campaigns run on Kickstarter.com.
A product campaign is considered successful only if the pledged amount is equal to or greater than the goal.
The description should be around 2 sentences long.

**Name**: Smart Clothing - Upgrade Your Clothing
**Category**: technology/wearables
**Status**: failed
**Backers**: 10
**Pledged**: 505
**Goal**: 15000
**Creator**: Canyon Tober
**Description**: Smart Clothing is the platform that connects fashion with technology. The reason you will want to buy all of your clothes online.
###

**Name**: FlipbooKit - Mechanical Marvels & Flip-Hat
**Category**: design/product design
**Status**: successful
**Backers**: 133
**Pledged**: 23000
**Goal**: 17500
**Creator**: shinymind
**Description**: Mr. and Mrs. FlipBooKit bring you rare and unique creations -- that you can personalize!
###

**Name**: Flying to Seth MacFarlane
**Category**: film & video/documentary
**Status**: failed
**Backers**: 27
**Pledged**: 3268
**Goal**: 40000
**Creator**: Michael Patrick Christopher Ireland
**Description**: I need flying lessons to fly and make a unique documentary cross country trek in search of Seth MacFarlane and to conquer Hollywood
###

**Name**: ${name}`;

    const response = await openai.complete({
      engine: "davinci",
      prompt: prompt,
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
    });

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
        color: 0x83c133,
        title,
        author: author[1],
        description: description[1],
        fields: [
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
