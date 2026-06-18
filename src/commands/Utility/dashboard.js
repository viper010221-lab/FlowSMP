import { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from 'discord.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { createEmbed } from '../../utils/embeds.js';
import { handleInteractionError } from '../../utils/errorHandler.js';

export default {
    data: new SlashCommandBuilder()
        .setName('dashboard')
        .setDescription('View system access lists and manage the bot configuration')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // Restricted to Admins only
    category: "Utility",

    async execute(interaction, config, client) {
        try {
            const deferSuccess = await InteractionHelper.safeDefer(interaction);
            if (!deferSuccess) return;

            const guild = interaction.guild;

            // 1. Fetch active command permissions for /issue
            const guildCommands = await guild.commands.fetch();
            const issueCommand = guildCommands.find(cmd => cmd.name === 'issue');

            let permittedRolesList = [];

            if (issueCommand) {
                try {
                    const permissions = await guild.commands.permissions.fetch({ command: issueCommand.id });
                    const allowedRoles = permissions.filter(perm => perm.type === 1 && perm.permission === true);
                    
                    for (const perm of allowedRoles) {
                        permittedRolesList.push(`<@&${perm.id}>`);
                    }
                } catch (e) {
                    permittedRolesList = [];
                }
            }

            if (permittedRolesList.length === 0) {
                permittedRolesList.push(
                    `*No custom overrides configured yet.*\n` +
                    `Currently, anyone holding a role with the **Ban Members** permission can run \`/issue\`.`
                );
            } else {
                permittedRolesList = permittedRolesList.map(role => `> ${role}`);
            }

            // Current prefix lookup fallback
            const currentPrefix = config?.prefix || '!';

            // 2. Build the Dashboard Embed Card
            const dashboardEmbed = createEmbed()
                .setColor('#2ECC71')
                .setTitle('⚙️ Flow SMP | Management Dashboard')
                .setDescription(
                    `### 🛡️ Active Moderation Access\n` +
                    `${permittedRolesList.join('\n')}\n\n` +
                    `### ⚙️ Current Settings\n` +
                    `> **Bot Name:** ${client.user.username}\n` +
                    `> **Text Prefix:** \`${currentPrefix}\` (For legacy text commands)\n\n` +
                    `### 🚀 System Control\n` +
                    `Use the menu below to update settings, or click the button to trigger a software restart.`
                )
                .setFooter({ text: `Requested by ${interaction.user.username}` })
                .setTimestamp();

            // 3. Create the Settings Drop-down Select Menu
            const selectMenuRow = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('admin_dashboard_settings')
                    .setPlaceholder('⚙️ Select a setting to update...')
                    .addOptions([
                        {
                            label: 'Change Bot Name',
                            description: 'Update the global username of this bot application.',
                            value: 'edit_bot_name',
                            emoji: '🤖'
                        },
                        {
                            label: 'Change Text Prefix',
                            description: 'Update the symbol used before message commands.',
                            value: 'edit_prefix',
                            emoji: '🔣'
                        }
                    ])
            );

            // 4. Create the Restart Button
            const buttonRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('admin_restart_bot')
                    .setLabel('Restart Bot Processes')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🔄')
            );

            await interaction.editReply({ 
                embeds: [dashboardEmbed], 
                components: [selectMenuRow, buttonRow] 
            });

        } catch (error) {
            await handleInteractionError(error, interaction);
        }
    }
};
