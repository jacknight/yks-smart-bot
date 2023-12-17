import { SlashCommandBuilder } from '@discordjs/builders';
import { AutocompleteInteraction, CommandInteraction, Message } from 'discord.js';
import { CommandInterface } from '../../interfaces/command';
import YKSSmartBot from '../../bot';
import ClipsModel from '../../db/clips';

const commandName = 'findtheclimp';
const clipsCommand: CommandInterface = {
  data: new SlashCommandBuilder()
    .setName(commandName)
    .setDescription('Looking for the Climp')
    .addStringOption((option) =>
      option
        .setName('search')
        .setDescription('Phrase to search for')
        .setAutocomplete(true)
        .setRequired(true),
    ),

  autocomplete: async (client: YKSSmartBot, interaction: AutocompleteInteraction) => {
    try {
      const searchPhrase = interaction.options.getString('search');
      if (!searchPhrase || searchPhrase.length < 4) {
        interaction.respond([{ name: 'Too short.', value: 'Too short.' }]);
      }

      const results = await ClipsModel.find({ $text: { $search: searchPhrase } });
      if (!results || results.length == 0) {
        interaction.respond([{ name: 'No results.', value: 'No results.' }]);
      }

      const choices = results.map((result: { transcription: string; id: string }) => {
        const name =
          result.transcription.length > 50
            ? result.transcription.substring(0, 47) + '...'
            : result.transcription;
        return { name, value: result.id };
      });

      await interaction.respond(choices.slice(0, 25));
    } catch (e: any) {
      console.error(e);
    }
  },

  run: async (client: YKSSmartBot, interaction: CommandInteraction) => {
    const msg = await interaction.deferReply({ ephemeral: true, fetchReply: true });
    const url = interaction.options.getString('search');
    if (url) {
      interaction.editReply({ content: 'Posting now in the clips channel.' });
    } else {
      return interaction.editReply({ content: 'Something went wrong.' });
    }
    const guild = client.util.resolveGuild(process.env.YKS_GUILD_ID!, client.guilds.cache);
    if (!guild) return;
    const channel = client.util.resolveChannel(
      process.env.YKS_CLIP_CHANNEL_ID!,
      guild.channels.cache,
    );
    if (!channel || !channel.isText()) return;
    return channel.send({ content: `Requested by ${interaction.member?.user}`, files: [url] });
  },
};

export default clipsCommand;
