var Discord = require("discord.js");
var auth = require("./auth.json");

// Initialize Discord Bot
var bot = new Discord.Client();

bot.on("ready", function (evt) {
  console.log("Connected");
  console.log("Logged in as: " + bot.user.tag + " - (" + bot.user.id + ")");
});

bot.on("message", (message) => {
  if (message.channel.id !== "789205633202782300") return;
  // Our bot needs to know if it will execute a command
  // It will listen for messages that will start with `!`
  console.log(message);
  if (message.content.substring(0, 1) == "!") {
    var args = message.content.substring(1).split(" ");
    var cmd = args[0];

    args = args.splice(1);
    switch (cmd) {
      case "heep":
        message.channel.send(`${message.author} has buzzed in.`);
        break;
    }
  }
});

bot.login(auth.token);
