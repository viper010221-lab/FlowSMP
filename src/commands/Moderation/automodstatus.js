import { SlashCommandBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';

const configPath = path.resolve('./automodConfig.json');

export default {
    data: new SlashCommandBuilder()
        .setName('automod') // This keeps the slash command as /automod like you wanted
        .setDescription('Toggle the entire AutoMod system on or off')
        .addStringOption(option =>
            option.setName('status')
                .setDescription('Turn AutoMod ON or OFF')
                .setRequired(true)
                .addChoices(
                    { name: 'on', value: 'on' },
                    { name: 'off', value: 'off' }
                )),
    async execute(interaction) {
        // 🔒 STRICT USER ID CHECK
        if (interaction.user.id !== '1008719737825534043') {
            return interaction.reply({ 
                content: '❌ Access Denied: Only the server administrator can toggle this system.', 
                ephemeral: true 
            });
        }

        const status = interaction.options.getString('status');
        
        let config = {};
        try {
            config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        } catch {
            config = { 
                logChannelId: "1513984222346612805", 
                blockedWords: [
                    "nigger", "nigga", "niga", "niger", 
                    "fuckass", "mf", "motherfucker", 
                    "bitch", "bitches", "dumbfuck", 
                    "kys", "killyourself"
                ],
                inviteProtection: true,
                aiVisionModeration: true
            };
        }

        config.enabled = (status === 'on');
        fs.writeFileSync(configPath, JSON.stringify(config, null, 4));

        await interaction.reply({ 
            content: `⚙️ **AutoMod has been successfully switched ${status.toUpperCase()}.**`, 
            ephemeral: true 
        });
    },
};
