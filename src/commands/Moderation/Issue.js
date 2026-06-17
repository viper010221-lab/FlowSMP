import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { createEmbed } from '../../utils/embeds.js';
import { logger } from '../../utils/logger.js';
import { handleInteractionError } from '../../utils/errorHandler.js';

export default {
    data: new SlashCommandBuilder()
        .setName('issue')
        .setDescription('Log a moderation action issue')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        // Dropdown menu configuration
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

            // Collect all inputs
            const type = interaction.options.getString('type');
            const discordName = interaction.options.getString('discord_name');
            const mcName = interaction.options.getString('minecraft_name');
            const duration = interaction.options.getString('duration');
            const reason = interaction.options.getString('reason');

            const moderator = interaction.user;

            // Base settings for the embed layout configuration
            let embedTitle = 'Moderation Log: Ban';
            let embedColor = '#FF0000'; // Red color sidebar for bans

            // Switch layout values if the moderator chooses Mute
            if (type === 'mute') {
                embedTitle = 'Moderation Log: Mute/Timeout';
                embedColor = '#FFA500'; // Orange color sidebar for mutes
            }

            // Build the clean embed logging layout
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
                .setFooter({ 
                    text: `Moderator ID: ${moderator.id}` 
                })
                .setTimestamp();

            // Clear the "thinking..." response and send the embed log cleanly
            await interaction.deleteReply();
            await interaction.channel.send({ 
                content: `${moderator}`, 
                embeds: [logEmbed]
            });

        } catch (error) {
            await handleInteractionError(error, interaction);
        }
    }
};
