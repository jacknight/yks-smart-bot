import { NecordModule } from 'necord';
import { Module } from '@nestjs/common';
import { IntentsBitField, Partials } from 'discord.js';

@Module({
  imports: [
    NecordModule.forRoot({
      token: process.env.AUTH_TOKEN!,
      intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildMessageReactions,
        IntentsBitField.Flags.GuildVoiceStates,
      ],
      partials: [
        Partials.Reaction,
        Partials.User,
        Partials.Message,
        Partials.Channel,
      ],
      prefix: '!',
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
