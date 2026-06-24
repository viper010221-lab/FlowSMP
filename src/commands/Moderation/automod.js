import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('automod')
        .setDescription('Manage the network AutoMod infrastructure')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('dashboard')
                .setDescription('View the active configurations and targeted rules')
        ),
    category: "Moderation",

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'dashboard') {
            // Hardcoded metrics matching your autoMod.js file settings
            const activeSlurs = ['nigger', 'kys', 'killyourself', 'bitch'];
            const targetLogChannel = '1513984222346612805';
            
            const dashboardEmbed = new EmbedBuilder()
                .setTitle('🛡️ AutoMod Configuration Dashboard')
                .setDescription('Below are the live protection vectors running on the network loop engine.')
                .setColor('#8B0000') // Matching your dark red styling preference
                .addFields(
                    { name: '🟢 System Status', value: '> Active & Filtering', inline: true },
                    { name: '📺 Log Target Channel', value: `> <#${targetLogChannel}>`, inline: true },
                    { name: '⏱️ Action Penalty', value: '> `1 Hour Timeout (Mute)`', inline: false },
                    { name: '📋 Blacklisted Target Strings', value: activeSlurs.map(word => `• \`${word}\``).join('\n'), inline: false }
                )
                .setFooter({ text: 'Flow SMP Security Panel' })
                .setTimestamp();

            await interaction.reply({ embeds: [dashboardEmbed] });
        }
    }
};
