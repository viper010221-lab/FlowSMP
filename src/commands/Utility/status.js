import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Check the live status of the Minecraft server'),
    category: "Information",

    async execute(interaction) {
        // --- CONFIGURATION ---
        const serverAddress = '185.206.148.153:25631'; 
        // ---------------------

        await interaction.deferReply();

        try {
            const response = await fetch(`https://api.mcsrvstat.us/3/${serverAddress}`);
            
            if (!response.ok) {
                return await interaction.editReply({ 
                    content: '❌ Failed to connect to the status API. Try again later.' 
                });
            }

            const data = await response.json();

            if (data.online === false) {
                const offlineEmbed = new EmbedBuilder()
                    .setTitle('🔴 Server Status: Offline')
                    .setDescription(`The server at \`${serverAddress}\` is currently unreachable.`)
                    .setColor('#FF0000')
                    .setTimestamp();

                return await interaction.editReply({ embeds: [offlineEmbed] });
            }

            // Fix & clean up the MOTD by replacing raw HTML entities safely
            let cleanMotd = 'Flow SMP Server Instance';
            if (data.motd?.clean) {
                cleanMotd = data.motd.clean.join('\n')
                    .replace(/&gt;/g, '>')
                    .replace(/&lt;/g, '<')
                    .replace(/&amp;/g, '&')
                    .trim();
            }

            // Extract the player metrics and format the name list array
            const onlineCount = data.players?.online ?? 0;
            const maxCount = data.players?.max ?? 20;
            const playerArray = data.players?.list || [];

            // Build the list string. If no names are returned or player count is 0, show a placeholder.
            let playerListDisplay = "*No players online*";
            if (onlineCount > 0 && playerArray.length > 0) {
                playerListDisplay = playerArray.map(name => `• ${name}`).join('\n');
            } else if (onlineCount > 0 && playerArray.length === 0) {
                playerListDisplay = "*Player names hidden or Query port disabled in server.properties*";
            }

            const statusEmbed = new EmbedBuilder()
                .setTitle('🟢 Server Status: Online')
                .setDescription(`\`\`\`\n${cleanMotd}\n\`\`\``)
                .setColor('#00FF00')
                .addFields(
                    { name: '🌐 Server Address', value: `\`${serverAddress}\``, inline: true },
                    { name: '👥 Players Online', value: `\`${onlineCount} / ${maxCount}\``, inline: true },
                    { name: '🛠️ Version', value: `\`${data.version || 'Java 1.21.11'}\``, inline: true },
                    { name: '📋 Current Player List', value: playerListDisplay, inline: false }
                )
                .setThumbnail(`https://api.mcsrvstat.us/icon/${serverAddress}`)
                .setFooter({ text: 'Flow SMP Live Monitor' })
                .setTimestamp();

            await interaction.editReply({ embeds: [statusEmbed] });

        } catch (error) {
            console.error('Error fetching Minecraft server status:', error);
            await interaction.editReply({ content: '❌ An error occurred while retrieving the server data.' });
        }
    }
};
