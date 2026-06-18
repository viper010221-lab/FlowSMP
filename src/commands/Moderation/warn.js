import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { createEmbed } from '../../utils/embeds.js';
import { handleInteractionError } from '../../utils/errorHandler.js';

export default {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warn a user and manage their warning roles')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The Discord user to warn')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for issuing this warning')
                .setRequired(true)
        ),
    category: "Moderation",

    async execute(interaction, config, client) {
        try {
            const deferSuccess = await InteractionHelper.safeDefer(interaction);
            if (!deferSuccess) return;

            const discordUser = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason');
            const guild = interaction.guild;

            // Fetch the member in the server to manage their roles
            const member = await guild.members.fetch(discordUser.id).catch(() => null);
            let nextWarnLevel = 1;

            if (member) {
                // Find the server's tracking roles by their exact names
                const warn1 = guild.roles.cache.find(r => r.name === '1 warnings');
                const warn2 = guild.roles.cache.find(r => r.name === '2 warnings');
                const warn3 = guild.roles.cache.find(r => r.name === '3 warnings');

                let currentWarnLevel = 0;
                if (warn3 && member.roles.cache.has(warn3.id)) currentWarnLevel = 3;
                else if (warn2 && member.roles.cache.has(warn2.id)) currentWarnLevel = 2;
                else if (warn1 && member.roles.cache.has(warn1.id)) currentWarnLevel = 1;

                nextWarnLevel = currentWarnLevel + 1;

                // Move them cleanly up the warning levels
                if (nextWarnLevel === 1 && warn1) {
                    await member.roles.add(warn1).catch(() => null);
                } 
                else if (nextWarnLevel === 2 && warn2) {
                    if (warn1) await member.roles.remove(warn1).catch(() => null);
                    await member.roles.add(warn2).catch(() => null);
                } 
                else if (nextWarnLevel >= 3 && warn3) {
                    if (warn2) await member.roles.remove(warn2).catch(() => null);
                    await member.roles.add(warn3).catch(() => null);

                    // Securely look up the staff channel using your exact channel ID
                    const staffChatChannel = client.channels.cache.get('1513984222346612806');
                    if (staffChatChannel) {
                        await staffChatChannel.send({
                            content: `⚠️ **Attention** @Staff, ${discordUser} has 3 warnings now take action!`
                        }).catch(() => null);
                    }
                }
            }

            // Create the streamlined layout with the green accent color
            const logEmbed = createEmbed()
                .setColor('#2ECC71') // Light green color edge matching image_d585d6.png
                .setDescription(
                    `**Warned** ${discordUser}\n\n` +
                    `**Reason:** ${reason}\n` +
                    `**Total Warns:** ${nextWarnLevel}`
                );

            await interaction.editReply({ embeds: [logEmbed] });

        } catch (error) {
            await handleInteractionError(error, interaction);
        }
    }
};
