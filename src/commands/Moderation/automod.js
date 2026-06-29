import { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    PermissionFlagsBits, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} from 'discord.js';
import fs from 'fs';
import path from 'path';

const configPath = path.resolve('./automodConfig.json');

function readConfig() {
    try {
        return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch {
        // Default structure supporting the new background features
        return { 
            logChannelId: "1513984222346612805", 
            blockedWords: ["nigger", "kys", "killyourself", "bitch"],
            inviteProtection: true,
            aiVisionModeration: true
        };
    }
}

function writeConfig(data) {
    fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
}

export default {
    data: new SlashCommandBuilder()
        .setName('automod')
        .setDescription('Manage the network AutoMod infrastructure')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.UseApplicationCommands)
        .addSubcommand(subcommand =>
            subcommand
                .setName('dashboard')
                .setDescription('View and update active configurations')
        ),
    category: "Moderation",

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        const allowedRoles = ['', ''];
        const hasRole = interaction.member.roles.cache.some(role => allowedRoles.includes(role.id));

        if (!hasRole) {
            return await interaction.reply({
                content: '❌ **Access Denied:** You do not have the required staff roles to access the AutoMod dashboard.',
                ephemeral: true
            });
        }

        if (subcommand === 'dashboard') {
            const currentConfig = readConfig();

            // Safeguard against missing fields if loading an older JSON file
            if (currentConfig.inviteProtection === undefined) currentConfig.inviteProtection = true;
            if (currentConfig.aiVisionModeration === undefined) currentConfig.aiVisionModeration = true;

            const generateEmbed = (config) => {
                return new EmbedBuilder()
                    .setTitle('🛡️ AutoMod Configuration Dashboard')
                    .setDescription('Below are the live protection vectors running on the network loop engine.')
                    .setColor('#8B0000')
                    .addFields(
                        { name: '🟢 System Status', value: '> Active & Filtering', inline: true },
                        { name: '📺 Log Target Channel', value: `> <#${config.logChannelId}>`, inline: true },
                        { name: '🔗 Link Filter', value: config.inviteProtection ? '> `Enabled (30m Mute)`' : '> `Disabled`', inline: true },
                        { name: '🧠 AI Vision Filtering', value: config.aiVisionModeration ? '> `Active (NSFW Scan)`' : '> `Disabled`', inline: true },
                        { name: '⏱️ Word Match Penalty', value: `> \`2 Hours Timeout\``, inline: true },
                        { name: '📋 Blacklisted Target Strings', value: config.blockedWords.map(word => `• \`${word}\``).join('\n') || 'None', inline: false }
                    )
                    .setFooter({ text: 'Flow SMP Security Panel' })
                    .setTimestamp();
            };

            const buttonsRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('automod_add_word')
                    .setLabel('➕ Add Words')
                    .setStyle(ButtonStyle.Danger)
            );

            const response = await interaction.reply({ 
                embeds: [generateEmbed(currentConfig)], 
                components: [buttonsRow] 
            });

            const collector = response.createMessageComponentCollector({ time: 300000 });

            collector.on('collect', async i => {
                if (!i.member.roles.cache.some(role => allowedRoles.includes(role.id))) {
                    return await i.reply({ content: '❌ You cannot interact with this panel.', ephemeral: true });
                }

                if (i.customId === 'automod_add_word') {
                    const modal = new ModalBuilder()
                        .setCustomId('automod_modal_form')
                        .setTitle('Add Slurs to Filters');

                    const wordInput = new TextInputBuilder()
                        .setCustomId('words_to_add')
                        .setLabel("Enter words (separate multiple with commas)")
                        .setPlaceholder("slur1, slur2, toxicphrase")
                        .setStyle(TextInputStyle.Paragraph)
                        .setRequired(true);

                    modal.addComponents(new ActionRowBuilder().addComponents(wordInput));
                    await i.showModal(modal);

                    const submitted = await i.awaitModalSubmit({ time: 60000 }).catch(() => null);

                    if (submitted) {
                        const rawInput = submitted.fields.getTextInputValue('words_to_add');
                        const newWords = rawInput.split(',').map(w => w.trim().toLowerCase()).filter(w => w.length > 0);

                        const freshConfig = readConfig();
                        freshConfig.blockedWords = [...new Set([...freshConfig.blockedWords, ...newWords])];
                        writeConfig(freshConfig);

                        await submitted.reply({ content: `✅ Successfully added: ${newWords.map(w => `\`${w}\``).join(', ')}`, ephemeral: true });
                        await interaction.editReply({ embeds: [generateEmbed(freshConfig)] });
                    }
                }
            });
        }
    }
};
