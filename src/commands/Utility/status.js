import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Check the live status of the Minecraft server'),
    category: "Information",

    async execute(interaction) {
        // --- CONFIGURATION ---
        const serverIP = '185.206.148.153:25631'; // 👈 Put your server IP or domain here!
        const serverPort = 25565;            // Default Java port is 25565, Bedrock is 19132
        // ---------------------

        // Defer the reply to give the API time to fetch the server data (prevents interaction timeouts)
        await interaction.deferReply();

        try {
            // Fetch live data via mcstatus.io API
            const response = await fetch(`https://api.mcstatus.io/v2/status/java/${serverIP}:${serverPort}`);
            
            if (!response.ok) {
                return await interaction.editReply({ content: '❌ Failed to connect to the status API. Try again later.' });
            }

            const data = await response.json();

            // If the server is offline or unreachable
            if (!data.online) {
                const offlineEmbed = new EmbedBuilder()
                    .setTitle('🔴 Server Status: Offline')
                    .setDescription(`The server at \`${serverIP}\` is currently unreachable.`)
                    .setColor('#FF0000')
                    .setTimestamp();

                return await interaction.editReply({ embeds: [offlineEmbed] });
            }

            // Clean up the MOTD description line text if it contains formatting
            const motdText = data.motd?.clean || 'A Minecraft Server';

            // Build a clean status embed card
            const statusEmbed = new EmbedBuilder()
                .setTitle('🟢 Server Status: Online')
                .setDescription(`\`\`\`\n${motdText}\n\`\`\``)
                .setColor('#00FF00')
                .addFields(
                    { name: '🌐 Server Address', value: `\`${serverIP}\``, inline: true },
                    { name: '👥 Players Online', value: `\`${data.players.online} / ${data.players.max}\``, inline: true },
                    { name: '🛠️ Version', value: `\`${data.version?.name_clean || 'Unknown'}\``, inline: true }
                )
                .setThumbnail(`https://api.mcstatus.io/v2/icon/${serverIP}:${serverPort}`) // Automatically pulls the server favicon icon!
                .setFooter({ text: 'Flow SMP Live Monitor' })
                .setTimestamp();

            await interaction.editReply({ embeds: [statusEmbed] });

        } catch (error) {
            console.error('Error fetching Minecraft server status:', error);
            await interaction.editReply({ content: '❌ An error occurred while retrieving the server data.' });
        }
    }
};
