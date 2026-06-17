import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { handleInteractionError } from '../../utils/errorHandler.js';

export default {
    data: new SlashCommandBuilder()
        .setName('role') // The main command
        .setDescription('Manage server member roles')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        // This creates: /role add
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Give a role to a server member')
                .addUserOption(option =>
                    option.setName('target_user')
                        .setDescription('The member you want to give the role to')
                        .setRequired(true)
                )
                .addRoleOption(option =>
                    option.setName('target_role')
                        .setDescription('The role you want to add')
                        .setRequired(true)
                )
        )
        // This creates exactly what you want: /role remove
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Take away a role from a server member')
                .addUserOption(option =>
                    option.setName('target_user')
                        .setDescription('The member you want to take the role from')
                        .setRequired(true)
                )
                .addRoleOption(option =>
                    option.setName('target_role')
                        .setDescription('The role you want to remove')
                        .setRequired(true)
                )
        ),
    category: "Utility",

    async execute(interaction, config, client) {
        try {
            const deferSuccess = await InteractionHelper.safeDefer(interaction);
            if (!deferSuccess) return;

            const subcommand = interaction.options.getSubcommand();
            const member = interaction.options.getMember('target_user');
            const role = interaction.options.getRole('target_role');

            if (!member) {
                return await interaction.editReply({
                    content: "❌ I couldn't find that user in this server."
                });
            }

            // Global Hierarchy Check
            const botHighestRole = interaction.guild.members.me.roles.highest;
            if (role.position >= botHighestRole.position) {
                return await interaction.editReply({
                    content: `❌ I cannot modify **${role.name}** because that role is higher than (or equal to) my own bot role in the server settings list!`
                });
            }

            // --- ADD SUBCOMMAND LOGIC ---
            if (subcommand === 'add') {
                if (member.roles.cache.has(role.id)) {
                    return await interaction.editReply({
                        content: `⚠️ **${member.user.username}** already has the **${role.name}** role.`
                    });
                }

                await member.roles.add(role.id);
                await interaction.editReply({
                    content: `✅ Successfully added the **${role.name}** role to **${member.user.username}**!`
                });
            }

            // --- REMOVE SUBCOMMAND LOGIC ---
            else if (subcommand === 'remove') {
                if (!member.roles.cache.has(role.id)) {
                    return await interaction.editReply({
                        content: `⚠️ **${member.user.username}** doesn't have the **${role.name}** role.`
                    });
                }

                await member.roles.remove(role.id);
                await interaction.editReply({
                    content: `✅ Successfully stripped the **${role.name}** role from **${member.user.username}**!`
                });
            }

        } catch (error) {
            await handleInteractionError(error, interaction);
        }
    }
};
