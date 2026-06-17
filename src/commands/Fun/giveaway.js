import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { createEmbed } from '../../utils/embeds.js';
import { handleInteractionError } from '../../utils/errorHandler.js';

export default {
    data: new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('Manage server giveaways')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages) // Requires Manage Messages permission
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Set up a new giveaway message')
                .addStringOption(option =>
                    option.setName('prize')
                        .setDescription('What is the prize? (e.g., VIP Rank, Nitro)')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('duration')
                        .setDescription('How long will it last? (e.g., 24 Hours, 3 Days)')
                        .setRequired(true)
                )
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel where the giveaway message should be sent')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
        ),
    category: "Fun", // Updated to match your folder

    async execute(interaction, config, client) {
        try {
            const deferSuccess = await InteractionHelper.safeDefer(interaction);
            if (!deferSuccess) return;

            const subcommand = interaction.options.getSubcommand();

            if (subcommand === 'setup') {
                const prize = interaction.options.getString('prize');
                const duration = interaction.options.getString('duration');
                const targetChannel = interaction.options.getChannel('channel');
                const host = interaction.user;

                // Build a clean, styled giveaway embed layout
                const giveawayEmbed = createEmbed()
                    .setColor('#00FF7F') // Light spring green color
                    .setTitle(`🎉 GIVEAWAY STARTED 🎉`)
                    .setDescription(`React with 🎉 to enter the giveaway draw!`)
                    .addFields(
                        { name: '🎁 Prize', value: `**${prize}**`, inline: false },
                        { name: '⏳ Duration', value: duration, inline: true },
                        { name: '👑 Hosted By', value: `${host}`, inline: true }
                    )
                    .setFooter({ text: 'Make sure to react before time runs out!' })
                    .setTimestamp();

                // Send the giveaway announcement straight to the target channel
                const giveawayMessage = await targetChannel.send({ embeds: [giveawayEmbed] });
                
                // Automatically add the entry reaction emoji for members
                await giveawayMessage.react('🎉');

                // Send a confirmation back to the moderator who set it up
                await interaction.editReply({
                    content: `✅ Successfully started the giveaway for **${prize}** in ${targetChannel}! Layout message deployed.`
                });
            }

        } catch (error) {
            await handleInteractionError(error, interaction);
        }
    }
};
