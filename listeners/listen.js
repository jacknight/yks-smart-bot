const { AudioPlayerStatus } = require('@discordjs/voice');
const { Listener } = require('discord-akairo');

class ListenListener extends Listener {
  constructor() {
    super('listen', {
      emitter: 'client',
      event: 'messageReactionAdd',
    });
  }

  async exec(reaction, user) {
    if (reaction.partial) {
      // Don't deal with partials for this. If the bot restarted, the player
      // died with it!
      return;
    }

    if (user.id === this.client.user.id) return;

    if (this.client.listen.message?.id === reaction.message.id) {
      let action = null;
      if (reaction._emoji.name === '▶️') {
        if (
          this.client.listen.player.state.status === AudioPlayerStatus.Paused ||
          this.client.listen.player.state.status === AudioPlayerStatus.AutoPaused
        ) {
          action = 'play';
        }
      } else if (reaction._emoji.name === '⏸') {
        if (this.client.listen.player.state.status === AudioPlayerStatus.Playing) {
          action = 'pause';
        }
      } else if (reaction._emoji.name === '⏹') {
        if (this.client.listen.player.state.status !== AudioPlayerStatus.Idle) {
          const msg = await reaction.message.channel.send('Are you sure you want to stop?');
          await msg.react('✅');
          await msg.react('❌');

          const filter = (r, u) => {
            return ['✅', '❌'].includes(r._emoji.name) && u.id === user.id;
          };

          await msg
            .awaitReactions({ filter, max: 1, time: 10000, errors: ['time'] })
            .then((collected) => {
              const r = collected.first();

              if (r._emoji.name === '✅') {
                action = 'stop';
              }
            })
            .catch((collected) => {});
          msg.delete();
        }
      }

      if (action) {
        if (action === 'stop') {
          reaction.message.reply(`Stopped by ${user}`);
        }
        const command = await this.client.commandHandler.findCommand('listen');
        this.client.commandHandler.runCommand(this.client.listen.message, command, {
          action,
          episode: 0,
        });
      }
    }
  }
}

module.exports = ListenListener;
