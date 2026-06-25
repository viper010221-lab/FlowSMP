import { 
  SlashCommandBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} from 'discord.js';
import { createEmbed } from '../../utils/embeds.js';
import { handleInteractionError } from '../../utils/errorHandler.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
export default {
  data: new SlashCommandBuilder()
    .setName('media')
    .setDescription('View requirements and submit your credentials for the Media Rank'),
  category: 'Moderation',
  async execute(interaction, config, client) {
    try {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('check_media_reqs')
          .setLabel('Check Requirements & Apply')
          .setStyle(ButtonStyle.Success)
      );
      const reqsEmbed = createEmbed()
        .setTitle('🎥 Infuse-SMP | Media Team Application')
        .setColor('#2ECC71')
        .setDescription(
          'Are you an active creator publishing TikTok videos on our network?\n\n' +
          '📊 **Core Verification Metrics Required:**\n' +
          '• Your channel must have at least **10 videos** published.\n' +
          '• Your videos must consistently achieve **200+ views** each.\n\n' +
          '👉 **Click the green validation button below** to fill out your creator profile and request status review!'
        )
        .setFooter({ text: 'Infuse-SMP Media Administration' })
        .setTimestamp();
      await interaction.reply({
        embeds: [reqsEmbed],
        components: [row]
      });
    } catch (error) {
      await handleInteractionError(interaction, error);
    }
  }
};
// ─── STAGE TWO: INTERACTION SUBMIT CONTROLLER ────────────────────────────────
export async function handleMediaModalSubmit(interaction, client) {
  try {
    const deferSuccess = await InteractionHelper.safeDefer(interaction, { ephemeral: true });
    if (!deferSuccess) return;
    
    // Add validation for form fields
    let tiktokProfile, tiktokVideo, mcName, discordName;
    try {
      tiktokProfile = interaction.fields.getTextInputValue('modal_tiktok_profile');
      tiktokVideo = interaction.fields.getTextInputValue('modal_tiktok_video');
      mcName = interaction.fields.getTextInputValue('modal_mc_name');
      discordName = interaction.fields.getTextInputValue('modal_discord_name');
    } catch (fieldError) {
      return await interaction.editReply({
        content: '❌ **Form Error:** Could not read form fields. Please try submitting the form again.'
      });
    }
    
    // Link structural check validations
    if (!tiktokProfile.includes('tiktok.com') || !tiktokVideo.includes('tiktok.com')) {
      return await interaction.editReply({
        content: '❌ **Submission Error:** Please supply valid, complete TikTok profile and video hyperlinks.'
      });
    }
    // Direct staff routing log channel destination
    const staffReviewChannelId = '1513984222346612806'; 
    const reviewChannel = client.channels.cache.get(staffReviewChannelId);
    if (reviewChannel) {
      const { EmbedBuilder } = await import('discord.js');
      const reviewEmbed = new EmbedBuilder()
        .setTitle('🎥 Media Rank Evaluation Profile')
        .setColor('#3498DB')
        .addFields(
          { name: '👤 Member account', value: `${interaction.user} (\`${interaction.user.id}\`)`, inline: true },
          { name: '🎮 In-game IGN', value: `\`${mcName}\``, inline: true },
          { name: '💬 Discord Provided', value: `\`${discordName}\``, inline: true },
          { name: '🔗 Channel Destination', value: `[Open Profile Link](${tiktokProfile})`, inline: false },
          { name: '🎬 Submitted Video', value: `[Open Video Link](${tiktokVideo})`, inline: false }
        )
        .setDescription('⚠️ **Staff Notice:** Run manually directed account audits to confirm they possess **10+ videos with 200+ views each** before processing rank flags.')
        .setTimestamp();
      await reviewChannel.send({ embeds: [reviewEmbed] }).catch(() => null);
    }
    await interaction.editReply({
      content: '✅ **Verification Pending!** Your channels have been routed to staff files for active data view metrics confirmation.'
    });
  } catch (error) {
    await handleInteractionError(interaction, error);
  }
}
