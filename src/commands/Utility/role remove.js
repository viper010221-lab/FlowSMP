import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { handleInteractionError } from '../../utils/errorHandler.js';

export default {
    data: new SlashCommandBuilder()
        .setName('roleremove')
        .setDescription('Take away a role from a server member')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addUserOption(option =>
            option.setName('target_user')
                .setDescription('The member you want to take the role from')
                .setRequired(true)
        )
        .addRoleOption(option =>
            option.setName('target_role')
                .setDescription('The role you want to remove')
                .setRequired(true)
        ),
    category: "Utility",

    async execute(interaction, config, client) {
        try {
            // Safely set up the deferred thinking message
            const deferSuccess = await InteractionHelper.safeDefer(interaction);
            if (!deferSuccess) return;

            // Fetch variables directly using fixed unique names
            const member = interaction.options.getMember('target_user');
            const role = interaction.options.getRole('target_role');

            // 1. Fallback check if the member wasn't found in cache
            if (!member) {
                return await interaction.editReply({
                    content: "❌ I couldn't find that user in this server. Make sure they haven't left."
                });
            }

            // 2. Clear out hierarchy conflicts right away
            const botHighestRole = interaction.guild.members.me.roles.highest;
            if (role.position >= botHighestRole.position) {
                return await interaction.editReply({
                    content: `❌ I cannot remove **${role.name}** because that role is higher than (or equal to) my own bot role in the server settings list!`
                });
            }

            // 3. Verify if they actually have it before attempting removal
            if (!member.roles.cache.has(role.id)) {
                return await interaction.editReply({
                    content: `⚠️ **${member.user.username}** doesn't even have the **${role.name}** role.`
                });
            }

            // 4. Directly modify the member's roles
            await member.roles.remove(role.id);

            // 5. Respond clearly
            await interaction.editReply({
                content: `✅ Successfully stripped the **${role.name}** role from **${member.user.username}**!`
            });

        } catch (error) {
            await handleInteractionError(error, interaction);
        }
    }
};
