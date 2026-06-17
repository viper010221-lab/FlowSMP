import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { logger } from '../../utils/logger.js';
import { handleInteractionError } from '../../utils/errorHandler.js';

export default {
    data: new SlashCommandBuilder()
        .setName('roleremove')
        .setDescription('Take away a role from a server member')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles) // Requires Manage Roles permission
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The member you want to take the role from')
                .setRequired(true)
        )
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The role you want to remove')
                .setRequired(true)
        ),
    category: "Utility",

    async execute(interaction, config, client) {
        try {
            const deferSuccess = await InteractionHelper.safeDefer(interaction);
            if (!deferSuccess) {
                logger.warn(`RoleRemove interaction defer failed`, {
                    userId: interaction.user.id,
                    guildId: interaction.guildId,
                    commandName: 'roleremove'
                });
                return;
            }

            const targetMember = interaction.options.getMember('user');
            const role = interaction.options.getRole('role');
            const botMember = interaction.guild.members.me;

            // 1. Safety Check: Is the role higher than the bot's highest role?
            if (role.position >= botMember.roles.highest.position) {
                return await interaction.editReply({
                    content: `❌ I cannot remove the role **${role.name}** because it is ranked higher than, or equal to, my own highest role in the server settings!`
                });
            }

            // 2. Safety Check: Is the role manageable by bots?
            if (!role.editable) {
                return await interaction.editReply({
                    content: `❌ The role **${role.name}** is managed by an external integration or cannot be modified.`
                });
            }

            // 3. Check if the user even has the role in the first place
            if (!targetMember.roles.cache.has(role.id)) {
                return await interaction.editReply({
                    content: `⚠️ **${targetMember.user.username}** does not have the role **${role.name}**.`
                });
            }

            // 4. Strip the role away
            await targetMember.roles.remove(role);

            // 5. Send clean confirmation back
            await interaction.editReply({
                content: `✅ Successfully removed the role **${role.name}** from **${targetMember.user.username}**!`
            });

        } catch (error) {
            await handleInteractionError(error, interaction);
        }
    }
};
