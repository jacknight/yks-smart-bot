import { SlashCommandBuilder } from '@discordjs/builders';
import { AutocompleteInteraction, CommandInteraction, Message, MessageEmbed } from 'discord.js';
import { CommandInterface } from '../../interfaces/command';
import YKSSmartBot from '../../bot';
import ClipsModel from '../../db/clips';
var ObjectId = require('mongoose').Types.ObjectId;

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
        return interaction.respond([{ name: 'Too short.', value: '' }]);
      }

      const results = await ClipsModel.find({ $text: { $search: searchPhrase } });
      if (!results || results.length == 0) {
        return interaction.respond([{ name: 'No results.', value: '' }]);
      }

      const choices = results.map((result: { transcription: string; id: string; _id: string }) => {
        const name =
          result.transcription.length > 50
            ? result.transcription.substring(0, 47) + '...'
            : result.transcription;
        return { name, value: result._id };
      });

      await interaction.respond(choices.slice(0, 25));
    } catch (e: any) {
      console.error(e);
    }
  },

  run: async (client: YKSSmartBot, interaction: CommandInteraction) => {
    const msg = await interaction.deferReply({ ephemeral: true, fetchReply: true });
    const objectId = interaction.options.getString('search');
    const clip = objectId ? await ClipsModel.findOne({ _id: objectId }) : null;
    const url = clip ? clip.id : null;
    console.log(objectId, clip, url);
    if (objectId && clip && url) {
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
    return channel.send({
      embeds: [
        new MessageEmbed().setDescription(
          `Requested by ${interaction.member?.user} using the \`/findtheclimp\` command.`,
        ),
      ],
      files: [url],
    });
  },
};

export default clipsCommand;
