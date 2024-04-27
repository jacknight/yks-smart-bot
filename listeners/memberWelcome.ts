import { GuildMember } from 'discord.js';

const { Listener } = require('discord-akairo');
const Canvas = require('canvas');

class MemberWelcomeListener extends Listener {
  constructor() {
    super('memberwelcome', {
      emitter: 'client',
      event: 'guildMemberAdd',
    });
  }

  async exec(member: GuildMember) {
    if (this.client.settings.get(member.guild.id, 'welcomeMsgDisabled', false)) return;

    // Check if they've already been welcomed
    const welcomedMembers = await this.client.settings.get(member.guild.id, 'welcomedMembers', []);
    if (welcomedMembers.some((id: string) => id === member.id)) return;

    // Add to welcomed members for guild so we don't do this again.
    welcomedMembers.push(member.id);
    this.client.settings.set(member.guild.id, 'welcomedMembers', welcomedMembers);

    // Build a dynamic composite image that welcomes the user with
    // their own display name and avatar.
    const canvas = Canvas.createCanvas(1000, 1000);
    const ctx = canvas.getContext('2d');
    const background = await Canvas.loadImage(`${__dirname}/../assets/jf-blessing.png`);
    ctx.drawImage(background, 0, 0, 423, canvas.height);

    ctx.font = applyText(
      canvas,
      `${member.displayName},\nJF has blessed\nyour timeline.\nsay "thank you\nmr. jf" for\ngood fortune\nin the new year`,
    );
    ctx.fillStyle = '#83c133';
    ctx.fillText(
      `${member.displayName},\nJF has blessed\nyour timeline.\nsay "thank you\nmr. jf" for\ngood fortune\nin the new year`,
      450,
      300,
      550,
    );

    ctx.beginPath();
    // X-Coordinate (550) - center of the circle is to the right of the bg image
    // Y-Coordinate (120) - 20px padding from the top for the 100px radius circle.
    // Radius (100) - circle has 200px diameter.
    // Start Angle, End Angle - Go from 0º to 360º
    // Counterclockwise - true
    ctx.arc(550, 120, 100, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();

    // Load avatar into that clipped off circle
    const avatar = await Canvas.loadImage(member.user.displayAvatarURL({ format: 'jpg' }));
    ctx.drawImage(avatar, 450, 20, 200, 200);

    const attachment = this.client.util.attachment(canvas.toBuffer(), 'welcome-image.png');

    const responses = [
      'You don\'t have to be insane to post here, but it\'s a "good to have."',
      'I give it a month.',
      "Make yourself at home.\nOh ok, you're going straight for the nasty channel. Ah! Well. Nevertheless,",
      "It's not too late to just turn around and walk away. No one would blame you.",
      "Grab an empty chair in the circle. We're just about to start sharing how YKS ruined our lives.",
      'If you need to know what episode something happened in, ask vinny.',
      'If you see JF or DB in here, avert your eyes from their posts as a sign of respect.',
      'Vote for your favorite episode # using the command `!best <episode number>`',
    ];
    return member.guild.systemChannel?.send({
      content: `Welcome, ${member}! ${responses[Math.floor(Math.random() * responses.length)]}`,
      files: [attachment],
    });
  }
}

// New member greeting helper to reduce size of text as necessary.
function applyText(canvas: any, text: string) {
  const ctx = canvas.getContext('2d');

  // Declare a base size of the font
  let fontSize = 70;

  do {
    // Assign the font to the context and decrement it so it can be measured again
    ctx.font = `${(fontSize -= 10)}px sans-serif`;
    // Compare pixel width of the text to the canvas minus the approximate avatar size
  } while (ctx.measureText(text).width > canvas.width - 400);

  // Return the result to use in the actual canvas
  return ctx.font;
}

module.exports = MemberWelcomeListener;
