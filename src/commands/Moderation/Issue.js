import { SlashCommandBuilder, PermissionFlagsBits, AttachmentBuilder } from 'discord.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { createEmbed } from '../../utils/embeds.js';
import { handleInteractionError } from '../../utils/errorHandler.js';

export default {
    data: new SlashCommandBuilder()
        .setName('issue')
        .setDescription('Issue a network or server moderation action')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        // --- BAN SUBCOMMAND ---
        .addSubcommand(subcommand =>
            subcommand
                .setName('ban')
                .setDescription('Log a player ban')
                .addStringOption(option =>
                    option.setName('minecraft_username')
                        .setDescription('The Minecraft IGN of the player')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('duration')
                        .setDescription('Type "permanent" or enter minutes (e.g., 30 for 30 minutes)')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for issuing this ban')
                        .setRequired(true)
                )
                .addUserOption(option =>
                    option.setName('discord_user')
                        .setDescription('The linked Discord user account (optional)')
                        .setRequired(false)
                )
        )
        // --- TIMEOUT SUBCOMMAND ---
        .addSubcommand(subcommand =>
            subcommand
                .setName('timeout')
                .setDescription('Log a player mute/timeout')
                .addStringOption(option =>
                    option.setName('minecraft_username')
                        .setDescription('The Minecraft IGN of the player')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName('duration_minutes')
                        .setDescription('How many minutes should the timeout last? (Will count down live)')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for issuing this timeout')
                        .setRequired(true)
                )
                .addUserOption(option =>
                    option.setName('discord_user')
                        .setDescription('The linked Discord user account (optional)')
                        .setRequired(false)
                )
        ),
    category: "Moderation",

    async execute(interaction, config, client) {
        try {
            const deferSuccess = await InteractionHelper.safeDefer(interaction);
            if (!deferSuccess) return;

            const subcommand = interaction.options.getSubcommand();
            const mcUsername = interaction.options.getString('minecraft_username');
            const reason = interaction.options.getString('reason');
            const discordUser = interaction.options.getUser('discord_user');
            const moderator = interaction.user;
            const targetChannel = interaction.channel;

            const discordUserValue = discordUser ? `${discordUser}` : 'Not Provided';

            const imageUrl = 'https://media.discordapp.net/attachments/1513984222346612804/1517159270158700705/landscape-minecraft-shaders-wallpaper-preview.jpg?ex=6a35442d&is=6a33f2ad&hm=eb90db56c0e456d322a944e7814a787c9af373bfa4786d1c6e8b9d09312c10e4&=&format=webp&width=1092&height=615';
            const bannerAttachment = new AttachmentBuilder(imageUrl, { name: 'landscape_banner.png' });

            const logEmbed = createEmbed()
                .setColor('#2F3136')
                .setAuthor({ 
                    name: `Issued by ♡`, 
                    iconURL: moderator.displayAvatarURL({ dynamic: true }) 
                })
                .setImage('attachment://landscape_banner.png')
                .setFooter({ text: `Moderator ID: ${moderator.id}` })
                .setTimestamp();

            // --- PROCESS BAN LAYOUT ---
            if (subcommand === 'ban') {
                const durationInput = interaction.options.getString('duration').trim();
                let displayDuration = durationInput;
                const minutes = parseInt(durationInput, 10);

                // If input is a valid number of minutes instead of "permanent"
                if (!isNaN(minutes)) {
                    const expiryTimestamp = Math.floor((Date.now() + minutes * 60 * 1000) / 1000);
                    displayDuration = `<t:${expiryTimestamp}:R>`;

                    // Schedule alert for when the temporary ban ends
                    setTimeout(async () => {
                        await targetChannel.send({
                            content: `🔔 ${moderator}, the **${minutes} minute ban** duration for **${mcUsername}** is now over!`
                        }).catch(() => null);
                    }, minutes * 60 * 1000);
                }

                logEmbed.setTitle('Moderation Log: Ban')
                    .addFields(
                        { name: 'Discord User', value: `> ${discordUserValue}`, inline: false },
                        { name: 'Minecraft Username', value: `> ${mcUsername}`, inline: true },
                        { name: 'Duration', value: `> ${displayDuration}`, inline: true },
                        { name: 'Reason', value: `> ${reason}`, inline: true }
                    );
            }

            // --- PROCESS TIMEOUT LAYOUT ---
            else if (subcommand === 'timeout') {
                const durationMinutes = interaction.options.getInteger('duration_minutes');
                const expiryTimestamp = Math.floor((Date.now() + durationMinutes * 60 * 1000) / 1000);
                const liveCountdownString = `<t:${expiryTimestamp}:R>`;

                logEmbed.setTitle('Moderation Log: Timeout')
                    .addFields(
                        { name: 'Discord User', value: `> ${discordUserValue}`, inline: false },
                        { name: 'Minecraft Username', value: `> ${mcUsername}`, inline: true },
                        { name: 'Duration', value: `> ${liveCountdownString}`, inline: true },
                        { name: 'Reason', value: `> ${reason}`, inline: true }
                    );

                // Schedule alert for when the timeout ends
                setTimeout(async () => {
                    await targetChannel.send({
                        content: `🔔 ${moderator}, the **${durationMinutes} minute timeout** duration for **${mcUsername}** is now over!`
                    }).catch(() => null);
                }, durationMinutes * 60 * 1000);
            }

            await interaction.editReply({ 
                embeds: [logEmbed], 
                files: [bannerAttachment] 
            });

        } catch (error) {
            await handleInteractionError(error, interaction);
        }
    }
};
