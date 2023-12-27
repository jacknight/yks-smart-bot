import { SlashCommandBuilder } from '@discordjs/builders';
import {
  AutocompleteInteraction,
  ButtonInteraction,
  CommandInteraction,
  Message,
  MessageActionRow,
  MessageAttachment,
  MessageButton,
  MessageEmbed,
  MessageInteraction,
} from 'discord.js';
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
      if (!searchPhrase || searchPhrase.length < 3) {
        return interaction.respond([{ name: 'Enter a search term.', value: '' }]);
      }

      const results = await ClipsModel.find(
        { $text: { $search: searchPhrase } },
        { score: { $meta: 'textScore' } },
      ).sort({ score: { $meta: 'textScore' } });
      if (!results || results.length == 0) {
        return interaction.respond([{ name: 'No results.', value: '' }]);
      }

      const choices = results.map((result: any) => {
        const name =
          result.transcription.length > 100
            ? result.transcription.substring(0, 97) + '...'
            : result.transcription;
        return { name, value: result._id };
      });

      await interaction.respond(choices.slice(0, 25));
    } catch (e: any) {
      console.error(e);
    }
  },

  run: async (client: YKSSmartBot, interaction: CommandInteraction) => {
    await interaction.deferReply({ ephemeral: true, fetchReply: true });
    client.commandInteractions.push(interaction);
    const objectId = interaction.options.getString('search');
    if (typeof objectId !== 'string' || objectId.length !== 24) {
      return interaction.editReply({ content: 'Please wait for the autocomplete options!' });
    }

    const clip = objectId ? await ClipsModel.findOne({ _id: objectId }) : null;
    const url = clip ? clip.id : null;
    if (objectId && clip && url) {
      return interaction.editReply({
        files: [url],
        components: [
          new MessageActionRow().addComponents(
            new MessageButton()
              .setCustomId(`${commandName}-confirm-${objectId}`)
              .setLabel('Post it')
              .setStyle('SUCCESS'),
            new MessageButton()
              .setCustomId(`${commandName}-reject`)
              .setLabel(`Don't post it`)
              .setStyle('DANGER'),
          ),
        ],
      });
    }

    return interaction.editReply({ content: 'Something went wrong.' });
  },

  handleButton: async (client: YKSSmartBot, interaction: ButtonInteraction) => {
    try {
      await interaction.deferUpdate();
      const confirm = interaction.customId.split('-')[1] === 'confirm';

      const original = client.commandInteractions.findIndex(
        (i) => i.id === interaction.message.interaction?.id,
      );

      const guild = client.util.resolveGuild(process.env.YKS_GUILD_ID!, client.guilds.cache);
      if (!guild) return;
      const channel = client.util.resolveChannel(
        process.env.YKS_CLIP_CHANNEL_ID!,
        guild.channels.cache,
      );
      if (!channel || !channel.isText()) return;

      if (confirm) {
        if (original >= 0) {
          await client.commandInteractions[original].editReply({
            content: 'Posted.',
            files: [],
            attachments: [],
            components: [],
          });
          client.commandInteractions.splice(original, 1);
        }
        const objectId = interaction.customId.split('-')[2];
        if (typeof objectId !== 'string' || objectId.length !== 24) {
          return;
        }

        const url = (await ClipsModel.findOne({ _id: objectId }))?.id;
        if (!url) return;

        return channel.send({
          embeds: [
            new MessageEmbed().setDescription(
              `Requested by ${interaction.member?.user} using the \`/findtheclimp\` command.`,
            ),
          ],
          files: [url],
        });
      } else {
        if (original >= 0) {
          await client.commandInteractions[original].editReply({
            content: `Didn't post. Is that a first for you?`,
            files: [],
            attachments: [],
            components: [],
          });
          client.commandInteractions.splice(original, 1);
        }
        return;
      }
    } catch {}
  },
};

export default clipsCommand;
