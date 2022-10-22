const { Command } = require('discord-akairo');

class BuzzerBuzzCommand extends Command {
  constructor() {
    super('buzz', {
      aliases: ['heep', 'meep'],
      category: 'buzzer',
      channel: 'guild',
      cooldown: 5000,
      ratelimit: 5,
    });
  }

  async exec(message) {
    if (
      message.channel.id !==
        JSON.parse(
          await this.client.settings.get(
            message.guild.id,
            'buzzerChannel',
            JSON.stringify(message.channel),
          ),
        ).id ||
      !(await this.client.settings.get(message.guild.id, 'buzzerReady', false))
    )
      return;

    const buzzerQueue = await this.client.settings.get(message.guild.id, 'buzzerQueue', []);

    if (!buzzerQueue.find((author) => JSON.parse(author).id === message.author.id)) {
      buzzerQueue.push(JSON.stringify(message.author));
      if ((await this.client.settings.get(message.guild.id, 'buzzerMode', 'normal')) === 'chaos') {
        require('../util').shuffle(buzzerQueue);
      }
      await this.client.settings.set(message.guild.id, 'buzzerQueue', buzzerQueue);
      if (this.client.sockets.has(message.guild.id)) {
        this.client.sockets.get(message.guild.id).forEach((socket) => {
          socket.emit('buzz', buzzerQueue);
        });
      }
      try {
        message.channel.send(`${message.author} buzzed in!`);
        if (buzzerQueue.length % 3 === 0) {
          var num = 1;
          return message.channel.send(
            `Dookie list: ${buzzerQueue.reduce((str, buzz) => {
              const member = this.client.util.resolveMember(
                JSON.parse(buzz).id,
                message.guild.members.cache,
              );
              return str + `${num++}. ${member.nickname || member.user.username}\n`;
            }, '\n')}`,
          );
        }
      } catch (err) {
        console.log(err);
      }
    }
  }
}

module.exports = BuzzerBuzzCommand;
