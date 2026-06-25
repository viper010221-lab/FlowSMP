import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
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
                .addAttachmentOption(option =>
                    option.setName('proof')
                        .setDescription('Upload mandatory proof (Photo or Video file)')
                        .setRequired(true) // 🔒 Strictly Required
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
                        .setDescription('How many minutes should the timeout last?')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for issuing this timeout')
                        .setRequired(true)
                )
                .addAttachmentOption(option =>
                    option.setName('proof')
                        .setDescription('Upload mandatory proof (Photo or Video file)')
                        .setRequired(true) // 🔒 Strictly Required
                )
                .addUserOption(option =>
                    option.setName('discord_user')
                        .setDescription('The linked Discord user account (optional)')
                        .setRequired(false)
                )
        )
        
        // --- WARN SUBCOMMAND ---
        .addSubcommand(subcommand =>
            subcommand
                .setName('warn')
                .setDescription('Warn a Discord user and manage warning roles')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The Discord user to warn')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for issuing this warning')
                        .setRequired(true)
                )
                .addAttachmentOption(option =>
                    option.setName('proof')
                        .setDescription('Upload mandatory proof (Photo or Video file)')
                        .setRequired(true) // 🔒 Strictly Required
                )
        ),
    category: "Moderation",

    async execute(interaction, config, client) {
        try {
            const deferSuccess = await InteractionHelper.safeDefer(interaction);
            if (!deferSuccess) return;

            const subcommand = interaction.options.getSubcommand();
            const moderator = interaction.user;
            const guild = interaction.guild;
            const channelId = interaction.channelId;

            const logFeedChannelId = '1513984222346612805';
            const staffAlertChannelId = '1513984222346612806';

            // Fetch the mandatory proof attachment from options input slot
            const proofAttachment = interaction.options.getAttachment('proof');
            const contentType = proofAttachment.contentType || "";
            const isImage = contentType.startsWith("image/");
            const isVideo = contentType.startsWith("video/");

            if (!isImage && !isVideo) {
                return await interaction.editReply({
                    content: "❌ **Invalid Proof Format:** Please upload a valid image file (PNG/JPG) or video asset file (MP4/MOV/WebM)."
                });
            }

            // --- PROCESS BAN SUBCOMMAND ---
            if (subcommand === 'ban') {
                const mcUsername = interaction.options.getString('minecraft_username');
                const reason = interaction.options.getString('reason');
                const discordUser = interaction.options.getUser('discord_user');
                const durationInput = interaction.options.getString('duration').trim();

                const targetMentionOrUsername = discordUser ? `${discordUser}` : `@${mcUsername}`;
                const discordUserValue = discordUser ? `${discordUser}` : 'Not Provided';

                let displayDuration = durationInput;
                const minutes = parseInt(durationInput, 10);

                if (!isNaN(minutes)) {
                    const expiryTimestamp = Math.floor((Date.now() + minutes * 60 * 1000) / 1000);
                    displayDuration = `<t:${expiryTimestamp}:R>`;

                    setTimeout(async () => {
                        const targetChannel = client.channels.cache.get(channelId);
                        if (targetChannel) {
                            await targetChannel.send({
                                content: `🔔 ${moderator}, the **${minutes} minute ban** duration for **${mcUsername}** is now over!`
                            }).catch(() => null);
                        }
                    }, minutes * 60 * 1000);
                }

                const logEmbed = createEmbed()
                    .setColor('#8B0000') // Dark Red
                    .setAuthor({ name: `Issued by ${moderator.username}`, iconURL: moderator.displayAvatarURL({ dynamic: true }) })
                    .setTitle('Moderation Log: Ban')
                    .setFooter({ text: `Moderator ID: ${moderator.id}` })
                    .setTimestamp()
                    .addFields(
                        { name: 'Discord User', value: `> ${discordUserValue}`, inline: false },
                        { name: 'Minecraft Username', value: `> ${mcUsername}`, inline: true },
                        { name: 'Duration', value: `> ${displayDuration}`, inline: true },
                        { name: 'Reason', value: `> ${reason}`, inline: true }
                    );

                // Setup Media Routing Layouts
                if (isImage) {
                    logEmbed.setImage(proofAttachment.url);
                } else if (isVideo) {
                    logEmbed.addFields({ name: '🎬 Video Evidence', value: `[Click to view video](${proofAttachment.url})` });
                }

                await interaction.editReply({ embeds: [logEmbed] });

                const logFeedChannel = client.channels.cache.get(logFeedChannelId);
                if (logFeedChannel) {
                    await logFeedChannel.send({
                        content: `🔨 ${targetMentionOrUsername} has been banned by ${moderator} **Reason:** ${reason} **Duration:** ${durationInput}` + 
                                 (isVideo ? `\n🎬 **Evidence Player:** ${proofAttachment.url}` : ''),
                        embeds: isImage ? [] : [logEmbed] // Send inline player alongside metadata logs if it is a video asset file
                    }).catch(() => null);
                }
            }

            // --- PROCESS TIMEOUT SUBCOMMAND ---
            else if (subcommand === 'timeout') {
                const mcUsername = interaction.options.getString('minecraft_username');
                const reason = interaction.options.getString('reason');
                const discordUser = interaction.options.getUser('discord_user');
                const durationMinutes = interaction.options.getInteger('duration_minutes');

                const targetMentionOrUsername = discordUser ? `${discordUser}` : `@${mcUsername}`;
                const discordUserValue = discordUser ? `${discordUser}` : 'Not Provided';
                const expiryTimestamp = Math.floor((Date.now() + durationMinutes * 60 * 1000) / 1000);
                const liveCountdownString = `<t:${expiryTimestamp}:R>`;

                const logEmbed = createEmbed()
                    .setColor('#E74C3C') // Red
                    .setAuthor({ name: `Issued by ${moderator.username}`, iconURL: moderator.displayAvatarURL({ dynamic: true }) })
                    .setTitle('Moderation Log: Timeout')
                    .setFooter({ text: `Moderator ID: ${moderator.id}` })
                    .setTimestamp()
                    .addFields(
                        { name: 'Discord User', value: `> ${discordUserValue}`, inline: false },
                        { name: 'Minecraft Username', value: `> ${mcUsername}`, inline: true },
                        { name: 'Duration', value: `> ${liveCountdownString}`, inline: true },
                        { name: 'Reason', value: `> ${reason}`, inline: true }
                    );

                if (isImage) {
                    logEmbed.setImage(proofAttachment.url);
                } else if (isVideo) {
                    logEmbed.addFields({ name: '🎬 Video Evidence', value: `[Click to view video](${proofAttachment.url})` });
                }

                await interaction.editReply({ embeds: [logEmbed] });

                const logFeedChannel = client.channels.cache.get(logFeedChannelId);
                if (logFeedChannel) {
                    await logFeedChannel.send({
                        content: `⏳ ${targetMentionOrUsername} has been muted by ${moderator} **Reason:** ${reason} **Duration:** ${durationMinutes}m` + 
                                 (isVideo ? `\n🎬 **Evidence Player:** ${proofAttachment.url}` : ''),
                        embeds: isImage ? [] : [logEmbed]
                    }).catch(() => null);
                }

                setTimeout(async () => {
                    const targetChannel = client.channels.cache.get(channelId);
                    if (targetChannel) {
                        await targetChannel.send({
                            content: `🔔 ${moderator}, the **${durationMinutes} minute timeout** duration for **${mcUsername}** is now over!`
                        }).catch(() => null);
                    }
                }, durationMinutes * 60 * 1000);
            }

            // --- PROCESS WARN SUBCOMMAND ---
            else if (subcommand === 'warn') {
                const discordUser = interaction.options.getUser('user');
                const reason = interaction.options.getString('reason');

                const allRoles = await guild.roles.fetch();
                const warn1 = allRoles.find(r => r.name === '1 warnings');
                const warn2 = allRoles.find(r => r.name === '2 warnings');
                const warn3 = allRoles.find(r => r.name === '3 warnings');
                const staffRole = allRoles.find(r => r.name === 'Staff');

                if (!warn1 || !warn2 || !warn3) {
                    return await interaction.editReply({
                        content: `❌ **Setup Error:** Missing warning roles. Ensure you have '1 warnings', '2 warnings', and '3 warnings'.`
                    });
                }

                const member = await guild.members.fetch(discordUser.id).catch(() => null);
                let nextWarnLevel = 1;

                if (member) {
                    let currentWarnLevel = 0;
                    if (member.roles.cache.has(warn3.id)) currentWarnLevel = 3;
                    else if (member.roles.cache.has(warn2.id)) currentWarnLevel = 2;
                    else if (member.roles.cache.has(warn1.id)) currentWarnLevel = 1;

                    nextWarnLevel = currentWarnLevel + 1;

                    if (nextWarnLevel === 1) {
                        await member.roles.add(warn1).catch(() => null);
                    } else if (nextWarnLevel === 2) {
                        await member.roles.remove(warn1).catch(() => null);
                        await member.roles.add(warn2).catch(() => null);
                    } else if (nextWarnLevel >= 3) {
                        nextWarnLevel = 3;
                        await member.roles.remove(warn2).catch(() => null);
                        await member.roles.add(warn3).catch(() => null);

                        const staffChatChannel = client.channels.cache.get(staffAlertChannelId);
                        if (staffChatChannel) {
                            const staffMention = staffRole ? `${staffRole}` : '@Staff';
                            await staffChatChannel.send({
                                content: `⚠️ **Attention** ${staffMention}, ${discordUser} has 3 warnings now take action!`
                            }).catch(() => null);
                        }
                    }
                }

                const logEmbed = createEmbed()
                    .setColor('#2ECC71') // Green
                    .setTitle('Moderation Log: Warning')
                    .setDescription(
                        `**Warned** ${discordUser}\n\n` +
                        `**Reason:** ${reason}\n` +
                        `**Total Warns:** ${nextWarnLevel}`
                    )
                    .setTimestamp();

                if (isImage) {
                    logEmbed.setImage(proofAttachment.url);
                } else if (isVideo) {
                    logEmbed.addFields({ name: '🎬 Video Evidence', value: `[Click to view video](${proofAttachment.url})` });
                }

                await interaction.editReply({ embeds: [logEmbed] });

                const logFeedChannel = client.channels.cache.get(logFeedChannelId);
                if (logFeedChannel) {
                    await logFeedChannel.send({
                        content: `⚠️ ${discordUser} has been warned by ${moderator} **Reason:** ${reason}` + 
                                 (isVideo ? `\n🎬 **Evidence Player:** ${proofAttachment.url}` : ''),
                        embeds: isImage ? [] : [logEmbed]
                    }).catch(() => null);
                }
            }

        } catch (error) {
            await handleInteractionError(error, interaction);
        }
    }
};
