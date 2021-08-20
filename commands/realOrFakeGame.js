const { Command } = require("discord-akairo");
const {
  getRealKickstarters,
  sleep,
  getKickstarterEmbed,
  getAIResponse,
} = require("../util");

var msPerKickstarter = 30000;
var numRounds = 10;
class RealOrFakeGameCommand extends Command {
  constructor() {
    super("realorfakegame", {
      aliases: ["realorfakegame", "rofg"],
      ownerOnly: true,
    });
  }

  async exec(message) {
    // Only allow in the #kickstarter-bot channel
    if (
      message.channel.id !== "873238126187917363" &&
      message.guild.id !== "789205632762642493"
    ) {
      const channel = this.client.util.resolveChannel(
        "873238126187917363",
        message.guild.channels.cache
      );
      return message.channel.send(`Please use ${channel} for this command`);
    }

    let scoreBoard = new Map();
    // Disable kickstarter and real or fake commands temporarily.
    this.client.commandHandler.remove("kickstarter");
    this.client.commandHandler.remove("realorfake");
    roundOfRealOrFake(this.client, message, 0, scoreBoard, 0, false);
  }
}

const roundOfRealOrFake = async (
  client,
  prevMsg,
  roundNumber,
  scoreBoard,
  apiCalls,
  isRetry
) => {
  const commandHandler = client.commandHandler;
  const botID = client.user.id;
  const realEmoji = client.util.resolveEmoji(
    "real",
    prevMsg.guild.emojis.cache
  );
  const fakeEmoji = client.util.resolveEmoji(
    "fake",
    prevMsg.guild.emojis.cache
  );

  if (!isRetry && roundNumber > 0) {
    // Update scores.
    prevMsg.channel.send(
      `That one was ${prevMsg.real ? realEmoji : fakeEmoji}`
    );

    const realReactUsers = prevMsg.reactions.cache.get(realEmoji.id)?.users
      .cache;
    const fakeReactUsers = prevMsg.reactions.cache.get(fakeEmoji.id)?.users
      .cache;
    const correctUsers = prevMsg.real
      ? realReactUsers?.filter(
          (user) => !fakeReactUsers?.has(user.id) && user.id != botID
        )
      : fakeReactUsers?.filter(
          (user) => !realReactUsers?.has(user.id) && user.id != botID
        );
    if (correctUsers) {
      correctUsers.forEach((user) => {
        if (scoreBoard.has(user.username)) {
          scoreBoard.set(user.username, scoreBoard.get(user.username) + 1);
        } else {
          scoreBoard.set(user.username, 1);
        }
      });
    }
  }

  if (roundNumber >= numRounds) {
    // Time to:
    // 1. Tally the final scores.
    // 2. Let everyone know who won.
    // 3. Re-enable the disabled commands.
    const topScore = Math.max(...scoreBoard.values());
    let winnersString = "";
    scoreBoard.forEach((val, key) => {
      if (val === topScore) {
        winnersString += (winnersString.length > 0 ? ", " : "") + `**${key}**`;
      }
    });
    winnersString += ` win(s) with **${topScore}** point(s)!`;
    prevMsg.channel.send(winnersString);

    // Re-enable disabled commands
    commandHandler.load(`${process.env.PWD}/commands/kickstarter.js`);
    commandHandler.load(`${process.env.PWD}/commands/realOrFake.js`);

    return prevMsg.channel.send("**Alright, now buzz off**");
  }

  roundNumber++;
  // Grab a response from the AI or from the file of real kickstarters
  const real = true; //Math.random() < 0.5;
  let response = "";
  const t0 = Date.now();
  if (real) {
    const responses = await getRealKickstarters();
    response = responses[Math.floor(Math.random() * responses.length)];
  } else {
    apiCalls++;
    // Grab a completion from the AI.
    response = await getAIResponse("", botID);
  }

  // Do some sleeping if necessary so all response times take at least 2s. This
  // should hopefully throw anyone off the scent of how long each takes.
  const t1 = Date.now();
  const responseTime = t1 - t0;
  const minResponseTime = 3000; // 3s
  if (responseTime < minResponseTime) {
    await sleep(minResponseTime - responseTime);
  }

  const completion = response.data.choices[0].text;
  const embed = getKickstarterEmbed(completion, true);
  if (embed) {
    await prevMsg.channel.send(`**__ROUND ${roundNumber}__**`);
    await prevMsg.channel.send({ embed });
    const msg = await prevMsg.channel.send(
      `Real or Fake? You have ${
        msPerKickstarter / 1000
      } seconds to use _one_ of the reacts below...`
    );
    msg.real = real;

    await msg.react(realEmoji);
    await msg.react(fakeEmoji);
    setTimeout(
      roundOfRealOrFake,
      msPerKickstarter,
      client,
      msg,
      roundNumber,
      scoreBoard,
      apiCalls,
      false
    );
  } else {
    // Try again
    console.log(completion, "\nSomething went wrong, trying again...");
    roundNumber--;
    roundOfRealOrFake(client, prevMsg, roundNumber, scoreBoard, apiCalls, true);
  }
};

module.exports = RealOrFakeGameCommand;
