import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { logger } from '../../utils/logger.js';
import { handleInteractionError } from '../../utils/errorHandler.js';

export default {
    data: new SlashCommandBuilder()
        .setName('nickname')
        .setDescription('Changes the nickname of a server member')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames)
        // This creates the @user mention slot
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The member you want to @ tag')
                .setRequired(true)
        )
        // This creates the text slot for the new nickname
        .addStringOption(option =>
            option.setName('new_nickname')
                .setDescription('The new nickname (e.g., Viper_test)')
                .setRequired(true) // Set to true so you always have to provide the new name
        ),
    category: "Utility",

    async execute(interaction, config, client) {
        try {
            // Defer the interaction response safely
            const deferSuccess = await InteractionHelper.safeDefer(interaction);
            if (!deferSuccess) {
                logger.warn(`Nickname interaction defer failed`, {
                    userId: interaction.user.id,
                    guildId: interaction.guildId,
                    commandName: 'nickname'
                });
                return;
            }

            // 1. Fetch the @mentioned member and the new text string
            const targetUser = interaction.options.getMember('user');
            const newNickname = interaction.options.getString('new_nickname');

            // 2. Safety check: Can the bot actually modify this user?
            if (!targetUser.manageable) {
                return await interaction.editReply({ 
                    content: `❌ I cannot change the nickname of **${targetUser.user.username}**. Their roles are higher than mine or they own the server.` 
                });
            }

            // 3. Change the nickname on Discord
            await targetUser.setNickname(newNickname);

            // 4. Send back a clean confirmation message
            await interaction.editReply({ 
                content: `✅ Successfully changed **${targetUser.user.username}**'s nickname to **${newNickname}**!` 
            });

        } catch (error) {
            await handleInteractionError(error, interaction);
        }
    }
};
