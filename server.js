// Server stuff (socket etc)

// Bot stuff.
// const Discord = require("discord.js");

// const modes = {
//   NORMAL: "normal",
//   CHAOS: "chaos",
// };

// let settings = {
//   mode: modes.NORMAL,
//   channel: null,
//   buzz: "heep",
//   buzzerEnabled: true,
//   me: "",
//   buzzerQueue: [],
// };

// // Initialize Discord Bot
// const bot = new Discord.Client();

// bot.on("ready", function (event) {
//   console.log("Logged in as: " + bot.user.tag + " (" + bot.user.id + ")");
// });

// bot.on("message", (message) => {
//   if (message.content.startsWith("!")) {
//     const args = message.content.slice(1).split(/ +/);
//     const cmd = args.shift().toLowerCase();

//     if (!checkChannel(message.channel)) {
//       if (cmd === "buzz.channel") {
//         changeChannel(args);
//       }
//       return;
//     }

//     switch (cmd) {
//       case "buzz.channel":
//         changeChannel(args);
//         break;
//       case "buzz.nick":
//         changeNickname(message, args);
//         break;
//       case "buzz.buzz":
//         changeBuzz(message.channel, args);
//         break;
//       case "buzz.mode":
//         changeMode(message.channel, args);
//         break;
//       case "buzz.ready":
//         changeReady(message.channel);
//         break;
//       case settings.buzz:
//         registerBuzz(message);
//         break;
//       case "buzz.help":
//       default:
//         displayHelp();
//         break;
//     }
//   }
// });

function changeReady(channel) {
  settings.buzzerEnabled = !settings.buzzerEnabled;
  settings.buzzerQueue = [];
  const ready = settings.buzzerEnabled ? "ready" : "not ready";
  channel
    .send(`Buzzer is ${ready}`)
    .then(() => emitReady())
    .then(() => emitBuzzerQueue())
    .catch((err) => console.log(err));
}

function changeMode(channel, args) {
  if (!args || args.length === 0) {
    channel
      .send(`Currently in \`${settings.mode}\` mode`)
      .catch((err) => console.log(err));
    return;
  }

  if (args.length > 1) {
    displayHelp();
    return;
  }

  const mode = args[0];
  if (mode === modes.NORMAL) {
    settings.mode = mode;
    channel
      .send(`You are now in \`${mode}\` mode.`)
      .then(emitMode())
      .catch((err) => console.log(err));
  } else if (mode === modes.CHAOS) {
    settings.mode = mode;
    channel
      .send(`Buddy...you are now in \`${mode}\` mode!!!!!`)
      .then(emitMode())
      .catch((err) => console.log(err));
  } else {
    channel
      .send(
        `Invalid mode \`${mode}\`. Switching you to \`${modes.CHAOS}\` mode for being so careless.`
      )
      .then(() => {
        settings.mode = modes.CHAOS;
      })
      .then(emitMode())
      .catch((err) => console.log(err));
  }
}

function changeNickname(message, args) {
  if (!args || args.length === 0) {
    displayHelp();
    return;
  }

  let nick = args.reduce((str, arg) => {
    return str + " " + arg;
  }, "");
  nick = nick.slice(1);

  message.guild.me
    .setNickname(nick)
    .then(() => message.channel.send("Hey, check out my new name!"))
    .catch((err) => {
      message.channel.send("No.").catch((err) => console.log(err));
      console.log(err);
    });
}

function registerBuzz(message) {
  if (settings.buzzerEnabled) {
    if (!settings.buzzerQueue.find((e) => e === message.author)) {
      message.channel
        .send(`${message.author} buzzed in.`)
        .catch((err) => console.log(err));
      settings.buzzerQueue.push(message.author);
      if (settings.mode === modes.CHAOS) shuffle(settings.buzzerQueue);
      emitBuzzerQueue();
    }
  }
}

function changeBuzz(channel, args) {
  if (!args || args.length === 0) {
    channel
      .send(`Buzz in with **!${settings.buzz}**`)
      .catch((err) => console.log(err));
    return;
  }

  if (args.length > 1) {
    displayHelp();
    return;
  }

  const buzz = args[0];
  if (buzz.length < 1 || buzz.length > 16) return;

  if (buzz.match(/[0-9A-Za-z]/g).length !== buzz.length) return;

  settings.buzz = buzz;
  channel
    .send(`Buzz in with **!${settings.buzz}**`)
    .catch((err) => console.log(err));
}

function changeChannel(args) {
  if (!args || args.length !== 1) {
    displayHelp();
    return;
  }

  const id = args[0].slice(2, -1);
  settings.channel = bot.channels.resolve(id);
  if (settings.channel) {
    settings.channel
      .send(`Now listening on ${args}`)
      .catch((err) => console.log(err));
  }
  return;
}

function checkChannel(channel) {
  return channel === settings.channel;
}

function displayHelp() {
  if (settings.channel) {
    const ready = settings.buzzerEnabled ? "ready" : "not ready";
    settings.channel
      .send(
        `
__Commands__
\`!${settings.buzz}\` - Buzz in

__Configure__
\`!buzz.channel <#channel>\` - Set the channel ${settings.me} listens to (${settings.channel})
\`!buzz.nick <nickname>\` - Change ${settings.me}'s nickname
\`!buzz.buzz <buzzer name>\` - Change the command to buzz in with (\`!${settings.buzz}\`)
\`!buzz.mode <mode>\` - Change mode to \`normal\` or \`chaos\` (\`${settings.mode}\`)
\`!buzz.ready\` - Toggle the buzzer ready.
\`!buzz.help\` - Get help. Seriously.`
      )
      .catch((err) => console.log(err));
  }
}

function shuffle(array) {
  var currentIndex = array.length,
    temporaryValue,
    randomIndex;

  while (0 !== currentIndex) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

// bot.login(process.env.AUTH_TOKEN);

module.exports = emitBuzzerQueue;
module.exports = emitReady;
module.exports = emitChannels;
module.exports = emitMode;
module.exports = emitResponse;
module.exports = emitServers;
