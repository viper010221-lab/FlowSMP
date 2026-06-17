import { SlashCommandBuilder, PermissionFlagsBits, AttachmentBuilder } from 'discord.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { createEmbed } from '../../utils/embeds.js';
import { logger } from '../../utils/logger.js';
import { handleInteractionError } from '../../utils/errorHandler.js';
import path from 'path';

export default {
    data: new SlashCommandBuilder()
        .setName('issue')
        .setDescription('Log a moderation action issue')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        // 1. Dropdown option to choose Ban or Mute
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Select the moderation type')
                .setRequired(true)
                .addChoices(
                    { name: 'Ban', value: 'ban' },
                    { name: 'Mute/Timeout', value: 'mute' }
                )
        )
        .addStringOption(option =>
            option.setName('discord_name')
                .setDescription('The text name of the Discord user (No ping)')
                .setRequired(true) 
        )
        .addStringOption(option =>
            option.setName('minecraft_name')
                .setDescription('The Minecraft username of the player')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('The duration of the action (e.g., 560 Years, 1 Hour)')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for the punishment')
                .setRequired(true)
        ),
    category: "Moderation",

    async execute(interaction, config, client) {
        try {
            const deferSuccess = await InteractionHelper.safeDefer(interaction);
            if (!deferSuccess) {
                logger.warn(`Issue interaction defer failed`, {
                    userId: interaction.user.id,
                    guildId: interaction.guildId,
                    commandName: 'issue'
                });
                return;
            }

            // Collect all options from the interaction
            const type = interaction.options.getString('type');
            const discordName = interaction.options.getString('discord_name');
            const mcName = interaction.options.getString('minecraft_name');
            const duration = interaction.options.getString('duration');
            const reason = interaction.options.getString('reason');

            const moderator = interaction.user;

            // Prepare the local banner asset image
            const imagePath = path.resolve('./assets/landscape-minecraft-shaders-wallpaper-preview_2.jpg'); 
            const bannerFile = new AttachmentBuilder(imagePath, { name: 'issue-banner.jpg' });

            // Dynamically adjust embed layout properties based on type selected
            let embedTitle = 'Moderation Log: Ban';
            let embedColor = '#FF0000'; // Red for bans

            if (type === 'mute') {
                embedTitle = 'Moderation Log: Mute/Timeout';
                embedColor = '#FFA500'; // Orange for mutes
            }

            // 2. Build the unified embed
            const logEmbed = createEmbed()
                .setColor(embedColor) 
                .setAuthor({ 
                    name: `Issued by ${moderator.username}`, 
                    iconURL: moderator.displayAvatarURL({ dynamic: true }) 
                })
                .setTitle(embedTitle)
                .addFields(
                    { name: 'Discord User', value: discordName, inline: false },
                    { name: 'Minecraft Username', value: mcName, inline: true },
                    { name: 'Duration', value: duration, inline: true },
                    { name: 'Reason', value: reason, inline: true }
                )
                .setImage('attachment://issue-banner.jpg') // Inserts your shader preview photo at the bottom
                .setFooter({ 
                    text: `Moderator ID: ${moderator.id}` 
                })
                .setTimestamp();

            // 3. Clear the defer state and output the log
            await interaction.deleteReply();
            await interaction.channel.send({ 
                content: `${moderator}`, 
                embeds: [logEmbed],
                files: [bannerFile]
            });

        } catch (error) {
            await handleInteractionError(error, interaction);
        }
    }
};
