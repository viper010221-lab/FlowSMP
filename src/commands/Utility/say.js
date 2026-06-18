import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { handleInteractionError } from '../../utils/errorHandler.js';

export default {
    data: new SlashCommandBuilder()
        .setName('say')
        .setDescription('Make the bot send a message')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The message you want the bot to send')
                .setRequired(true)
        )
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to send the message to (Leave empty for current channel)')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(false)
        ),
    category: "Utility",

    async execute(interaction, config, client) {
        try {
            // We use a hidden ephemeral defer so the moderator can see if it worked,
            // but regular members won't see any bot thinking process.
            await interaction.deferReply({ ephemeral: true });

            const messageText = interaction.options.getString('message');
            // If no channel is selected, targetChannel defaults to the current interaction channel
            const targetChannel = interaction.options.getChannel('channel') || interaction.channel;

            // Send the message to the target channel
            await targetChannel.send({ content: messageText });

            // Confirm back to the staff member privately
            await interaction.editReply({
                content: `✅ Successfully sent message to ${targetChannel}.`
            });

        } catch (error) {
            await handleInteractionError(error, interaction);
        }
    }
};
