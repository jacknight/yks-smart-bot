const OpenAI = require("openai-api");
const fs = require("fs");
const { Command } = require("discord-akairo");

class KickstarterCommand extends Command {
  constructor() {
    super("kickstarter", {
      aliases: ["kickstarter"],
      cooldown: 1000 * 60 * 60, // once per hour
      ratelimit: 1,
      args: [{ id: "name", match: "content" }],
    });
  }

  async exec(message, { name }) {
    if (name.length > 80) return message.channel.send("Shorten it up, please.");
    const openai = new OpenAI(process.env.OPENAI_KEY);
    const prompt = `Smart Clothing - Upgrade Your Clothing
Status: failed
Category: technology/wearables
Backers: 10
Pledged: 505
Goal: 15000
Creator: Canyon Tober
Description: Smart Clothing is the platform that connects fashion with technology. The reason you will want to buy all of your clothes online.
###

MyPlug | The First THEFT-PROOF Charging Cable Ever Made!
Status: failed
Category: technology/gadgets
Backers: 41
Pledged: 1655
Goal: 35000
Creator: MyPlug
Description: The revolutionary charging cable designed specifically to prevent THEFT and UNAUTHORISED use.
###

Smart Pickup; API Ready For Uber, Lyft & Other Ridesharing
Status: failed
Category: technology/gadgets
Backers: 2
Pledged: 40
Goal: 50000
Creator: DUTF
Description: Patent pending technology lighting up your your pickup with your name displayed and facial recognition detecting you in the crowd
###

Pie Turtle | The non-slide pie carrier for your car
Status: failed
Category: design/product design
Backers: 97
Pledged: 6257
Goal: 35000
Creator: Michelle Kresser
Description: Made for bakers!  Protect your pie or cake with the only non-slide pie carrier designed for your car or SUV. The perfect gift for moms!
###

Spartan - The underwear that protects your manhood
Status: successful
Category: technology
Backers: 183
Pledged: 22358
Goal: 5000
Creator: SPARTAN
Description: SPARTAN is a stylish high-tech boxer that protects your manhood by blocking cellphone and Wi-Fi radiation. Got some? Protect them!
###

The Sitting On My Ass Diet Book and Mobile Menu App
Status: failed
Category: food/cookbooks
Backers: 0
Pledged: 0
Goal: 50710
Creator: Austin Rose
Description: I lost over 65 pounds sitting on my ass at my kitchen table and wanted to share this information with you.
###

Gravity: The Weighted Blanket for Sleep, Stress and Anxiety
Status: successful
Category: design/product design
Backers: 23805
Pledged: 4729263
Goal: 21500
Creator: John Fiorentino
Description: A weighted blanket engineered to be 10% of your body weight to naturally reduce stress and increase relaxation.
###

The Light Phone
Status: successful
Category: design/product design
Backers: 3187
Pledged: 415128
Goal: 200000
Creator: Light
Description: A credit card-sized cell phone designed to be used as little as possible. The Light Phone is your phone away from phone.
###


Baller ass photos of random shit
Status: failed
Category: photography
Backers: 0
Pledged: 0
Goal: 2500
Creator: Johnny wads
Description: I take baller ass photos of cool stuff I find. With your generous contribution I will take more and better baller ass photos.
###
${name}`;

    const response = await openai.complete({
      engine: "davinci",
      prompt: prompt,
      maxTokens: 200,
      temperature: 0.5,
      topP: 1,
      presencePenalty: 0,
      frequencyPenalty: 0,
      bestOf: 1,
      n: 1,
      stream: false,
      stop: ["###"],
    });

    console.log(response, response.data.choices);
    return message.channel.send(`${name}${response.data.choices[0].text}`);
  }
}

module.exports = KickstarterCommand;
