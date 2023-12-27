import { Interaction, InteractionCollector } from 'discord.js';
import commandList from '../commands/slash/_commands';
import YKSSmartBot from '../bot';
const { Listener } = require('discord-akairo');

class InteractionListener extends Listener {
  constructor() {
    super('interactionCreate', {
      emitter: 'client',
      event: 'interactionCreate',
    });
  }

  exec(interaction: Interaction) {
    if (interaction.isAutocomplete()) {
      for (const command of commandList) {
        if (command.data.name === interaction.commandName) {
          if (command.autocomplete) {
            command.autocomplete(this.client, interaction);
          }
          break;
        }
      }
    } else if (interaction.isCommand()) {
      for (const command of commandList) {
        if (command.data.name === interaction.commandName) {
          command.run(this.client, interaction);
          break;
        }
      }
    } else if (interaction.isButton()) {
      for (const command of commandList) {
        if (command.data.name === interaction.customId.split('-')[0]) {
          command.handleButton
            ? command.handleButton(this.client, interaction)
            : console.error('Handle button not defined for button interaction: ', interaction);
          break;
        }
      }
    }
  }
}

module.exports = InteractionListener;
