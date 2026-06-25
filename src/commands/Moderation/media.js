import { 
  SlashCommandBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  EmbedBuilder,
  PermissionFlagsBits
} from 'discord.js';
import { createEmbed } from '../../utils/embeds.js';
import { handleInteractionError } from '../../utils/errorHandler.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { logger } from '../../utils/logger.js';

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
    const staffReviewChannelId = '1519704772717056010'; 
    const reviewChannel = client.channels.cache.get(staffReviewChannelId);
    if (reviewChannel) {
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

      // Create approve/deny buttons for staff
      const staffActionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`media_approve:${interaction.user.id}`)
          .setLabel('✅ Approve')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`media_deny:${interaction.user.id}`)
          .setLabel('❌ Deny')
          .setStyle(ButtonStyle.Danger)
      );

      await reviewChannel.send({ 
        embeds: [reviewEmbed],
        components: [staffActionRow]
      }).catch(err => {
        logger.error('Failed to send media review embed to staff channel:', err);
      });
    }

    await interaction.editReply({
      content: '✅ **Verification Pending!** Your channels have been routed to staff files for active data view metrics confirmation.'
    });
  } catch (error) {
    await handleInteractionError(interaction, error);
  }
}

// ─── STAGE THREE: STAFF APPROVAL HANDLER ────────────────────────────────────
export async function handleMediaApproval(interaction, client, userId) {
  try {
    // Check if user has staff permissions
    const member = interaction.member;
    if (!member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return await interaction.reply({
        content: '❌ **Permission Denied:** Only staff members can approve applications.',
        flags: 64 // Ephemeral
      });
    }

    await interaction.deferReply({ ephemeral: true });

    const mediaRoleId = '1513984221574856722';
    const guild = interaction.guild;
    
    // Get the target user
    let targetUser;
    try {
      targetUser = await client.users.fetch(userId);
    } catch (err) {
      return await interaction.editReply({
        content: '❌ **Error:** Could not find the user. They may have left the server.'
      });
    }

    // Get the target member from the guild
    let targetMember;
    try {
      targetMember = await guild.members.fetch(userId);
    } catch (err) {
      return await interaction.editReply({
        content: '❌ **Error:** User is not a member of this server anymore.'
      });
    }

    // Give the role
    try {
      await targetMember.roles.add(mediaRoleId, 'Media application approved by ' + interaction.user.tag);
      logger.info(`Media role granted to ${targetUser.tag} (${userId})`, {
        event: 'media.approval',
        userId,
        approvedBy: interaction.user.id,
        roleId: mediaRoleId
      });
    } catch (err) {
      logger.error('Failed to add media role:', err);
      return await interaction.editReply({
        content: '❌ **Error:** Could not assign the role. Please check bot permissions.'
      });
    }

    // Send DM to user
    try {
      const approvalEmbed = new EmbedBuilder()
        .setTitle('✅ Media Application Approved')
        .setColor('#2ECC71')
        .setDescription('Congratulations! Your media application has been **approved**. You now have access to the Media Rank.')
        .setTimestamp();
      
      await targetUser.send({ embeds: [approvalEmbed] });
    } catch (err) {
      logger.warn('Could not send approval DM to user:', err.message);
    }

    // Update the message
    await interaction.editReply({
      content: `✅ **Approved:** ${targetUser.tag} has been granted the Media Rank role.`
    });

    // Edit the original embed to show approval status
    if (interaction.message) {
      const approvedEmbed = interaction.message.embeds[0]
        .setColor('#27AE60')
        .addFields({ name: '✅ Status', value: `Approved by ${interaction.user.tag}`, inline: false });
      
      await interaction.message.edit({
        embeds: [approvedEmbed],
        components: [] // Remove buttons
      }).catch(() => {});
    }
  } catch (error) {
    logger.error('Error in media approval handler:', error);
    await handleInteractionError(interaction, error);
  }
}

// ─── STAGE FOUR: STAFF DENIAL HANDLER ────────────────────────────────────────
export async function handleMediaDenial(interaction, client, userId) {
  try {
    // Check if user has staff permissions
    const member = interaction.member;
    if (!member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return await interaction.reply({
        content: '❌ **Permission Denied:** Only staff members can deny applications.',
        flags: 64 // Ephemeral
      });
    }

    await interaction.deferReply({ ephemeral: true });

    // Get the target user
    let targetUser;
    try {
      targetUser = await client.users.fetch(userId);
    } catch (err) {
      return await interaction.editReply({
        content: '❌ **Error:** Could not find the user.'
      });
    }

    // Send DM to user
    try {
      const denialEmbed = new EmbedBuilder()
        .setTitle('❌ Media Application Denied')
        .setColor('#E74C3C')
        .setDescription('Unfortunately, your media application has been **denied**. You may reapply after improving your metrics.')
        .setTimestamp();
      
      await targetUser.send({ embeds: [denialEmbed] });
      logger.info(`Media application denied for ${targetUser.tag} (${userId})`, {
        event: 'media.denial',
        userId,
        deniedBy: interaction.user.id
      });
    } catch (err) {
      logger.warn('Could not send denial DM to user:', err.message);
    }

    // Update the message
    await interaction.editReply({
      content: `❌ **Denied:** ${targetUser.tag}'s application has been denied.`
    });

    // Edit the original embed to show denial status
    if (interaction.message) {
      const deniedEmbed = interaction.message.embeds[0]
        .setColor('#C0392B')
        .addFields({ name: '❌ Status', value: `Denied by ${interaction.user.tag}`, inline: false });
      
      await interaction.message.edit({
        embeds: [deniedEmbed],
        components: [] // Remove buttons
      }).catch(() => {});
    }
  } catch (error) {
    logger.error('Error in media denial handler:', error);
    await handleInteractionError(interaction, error);
  }
}
