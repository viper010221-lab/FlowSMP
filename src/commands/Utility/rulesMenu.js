import { 
    SlashCommandBuilder, 
    PermissionFlagsBits, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    MessageFlags 
} from 'discord.js';
import { createEmbed, errorEmbed } from '../../utils/embeds.js';
import { logger } from '../../utils/logger.js';

const TARGET_CHANNEL_ID = '1514214180973051925';

export default {
    slashOnly: true,
    data: new SlashCommandBuilder()
        .setName('sendrules')
        .setDescription('Sends the interactive Rules and Banned Mods selection panel to the rules channel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false),
    category: 'Utility',

    async execute(interaction) {
        try {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const targetChannel = interaction.guild.channels.cache.get(TARGET_CHANNEL_ID) 
                ?? await interaction.guild.channels.fetch(TARGET_CHANNEL_ID).catch(() => null);

            if (!targetChannel || !targetChannel.isTextBased()) {
                return await interaction.editReply({
                    embeds: [errorEmbed('Channel Not Found', `Could not find a valid text channel with ID \`${TARGET_CHANNEL_ID}\`.`)]
                });
            }

            // Hub View panel
            const hubEmbed = createEmbed({
                title: '📜 Server Information & Guidelines',
                description: 'Welcome to Flow SMP! Please select one of the buttons below to review our server rules, ban durations, and client restrictions.',
                color: 'primary',
                footer: 'Make sure to follow all guidelines to keep our community safe and fair.'
            });

            const buttonRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('rules_basic')
                    .setLabel('Basic Rules & Punishments')
                    .setEmoji('📋')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('rules_mods')
                    .setLabel('Banned Mods')
                    .setEmoji('🛡️')
                    .setStyle(ButtonStyle.Danger)
            );

            const panelMessage = await targetChannel.send({
                embeds: [hubEmbed],
                components: [buttonRow]
            });

            const collector = panelMessage.createMessageComponentCollector({
                filter: (i) => i.customId === 'rules_basic' || i.customId === 'rules_mods',
            });

            collector.on('collect', async (btnInteraction) => {
                try {
                    await btnInteraction.deferReply({ flags: MessageFlags.Ephemeral });

                    if (btnInteraction.customId === 'rules_basic') {
                        // Dynamically look up the :Punished: emoji inside this server's cache
                        const punishedEmoji = btnInteraction.guild.emojis.cache.find(e => e.name === 'Punished');
                        // Fallback to a warning emoji if the bot somehow can't find it
                        const emojiPrefix = punishedEmoji ? `${punishedEmoji}` : '⚠️';

                        const basicRulesEmbed = createEmbed({
                            title: '📋 Flow SMP Server Rules',
                            color: 'info',
                            description: 'Please review our community guidelines and official ban times below. Use common sense if it feels unfair, or you will get banned for it.',
                            fields: [
                                { name: `${emojiPrefix} R1 No naked killing`, value: '⏱️ **3h ban**', inline: true },
                                { name: `${emojiPrefix} R2 No spawn camping`, value: '⏱️ **5h ban**', inline: true },
                                { name: `${emojiPrefix} R3 Lag machine`, value: '⏱️ **3 days ban**', inline: true },
                                { name: `${emojiPrefix} R4 Wither spawning`, value: '⏱️ **1 day ban** (At Spawn)', inline: true },
                                { name: `${emojiPrefix} R5 Chat rules`, value: '⏱️ **2h ban**', inline: true },
                                { name: `${emojiPrefix} R6 No Stasis Chambers`, value: '⏱️ **3h ban** (In Combat)', inline: true },
                                { name: `${emojiPrefix} R7 Pushing out of spawn`, value: '⏱️ **5h ban**', inline: true },
                                { name: `${emojiPrefix} R8 No elytra in combat`, value: '⏱️ **4h ban**', inline: true },
                                { name: `${emojiPrefix} R9 Noobie protection`, value: '⏱️ **2h ban** (Abuse)', inline: true },
                                { name: `${emojiPrefix} R10 Instant damage arrows`, value: '⏱️ **3h ban**', inline: true },
                                { name: `${emojiPrefix} R11 No crystals', value: '⏱️ **5h ban**`, inline: true },
                                { name: `${emojiPrefix} R12 String drop at spawn`, value: '⏱️ **1h ban**', inline: true },
                                { name: `${emojiPrefix} R13 No trident in combat`, value: '⏱️ **4h ban**', inline: true },
                                { name: `${emojiPrefix} R14 Toxicity`, value: '⏱️ **3h ban**', inline: true },
                                { name: `${emojiPrefix} R15 Excessive swearing`, value: '⏱️ **1 day ban** (Chat Flood)', inline: true },
                                { name: `${emojiPrefix} R16 English only`, value: '⏱️ **2h ban**', inline: true },
                                { name: `${emojiPrefix} R17 Advertising servers`, value: '⏱️ **4h ban**', inline: true },
                                { name: `${emojiPrefix} R18 Ticket spam`, value: '⏱️ **7h ban**', inline: true },
                                { name: `${emojiPrefix} R19 Incorrect team size`, value: '⏱️ *Staff review*', inline: true },
                                { name: `${emojiPrefix} R20 Duping/Cheating`, value: '⏱️ **7 days ban**', inline: true },
                                { name: `${emojiPrefix} R21 Staff Respect / Moderation`, value: '⏱️ **6h ban** (Arguing with staff or about mod decisions)', inline: false },
                            ],
                            footer: "Reporting players requires evidence; please make sure to have evidence before making tickets. Please don't ask staff to check your tickets or ping them."
                        });

                        await btnInteraction.editReply({ embeds: [basicRulesEmbed] });
                    } 
                    
                    else if (btnInteraction.customId === 'rules_mods') {
                        const bannedModsEmbed = createEmbed({
                            title: '🛡️ Banned Modifications & Client Restrictions',
                            color: 'error',
                            description: 'Any modifications that grant an unfair advantage over vanilla players are strictly prohibited.',
                            fields: [
                                { name: '🚫 Hacked Clients & Movement Modifiers', value: 'Includes any mods that allow flight, speed hacking, freecam, or fast break.' },
                                { name: '👁️ X-Ray & Vision Enhancers', value: 'Mods that let you see through blocks, caves, or player names behind walls.' },
                                { name: '🤖 Automation & Macros', value: 'Auto-clicking/burst-clicking buttons, auto-sprint, auto-eating, and automated fishing or farming macros.' },
                                { name: '⚔️ PvP Assistance', value: 'Kill-aura, aim assist, reach extenders, auto-totem, and triggerbots.' },
                                { name: '⚠️ Malware & IP Stealers', value: 'Mods containing malicious code or scripts that attempt to access your computer’s IP or system information.' },
                                { name: '🗺️ Unapproved Aesthetic Features', value: 'Certain minimap mods that indicate the location of nearby players or entities.' }
                            ],
                            footer: 'Use common sense if it feels unfair, or you will get banned for it.'
                        });

                        await btnInteraction.editReply({ embeds: [bannedModsEmbed] });
                    }
                } catch (err) {
                    logger.error('Error processing rules panel button click:', err);
                }
            });

            await interaction.editReply({ content: `✅ Panel successfully posted to <#${TARGET_CHANNEL_ID}>!` });

        } catch (error) {
            logger.error('Error executing sendrules command:', error);
            await interaction.editReply({
                embeds: [errorEmbed('Command Failed', 'An internal error occurred while deploying the rules window.')]
            }).catch(() => {});
        }
    },
};
