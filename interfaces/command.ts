import { AutocompleteInteraction, ButtonInteraction, CommandInteraction } from 'discord.js';
import YKSSmartBot from '../bot';

export interface CommandInterface {
  data: any;
  run: (client: YKSSmartBot, interaction: CommandInteraction) => Promise<any>;
  autocomplete?: (client: YKSSmartBot, interaction: AutocompleteInteraction) => Promise<any>;
  handleButton?: (client: YKSSmartBot, interaction: ButtonInteraction) => Promise<any>;
}
