import { Events, EmbedBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';

const configPath = path.resolve('./automodConfig.json');

const DEFAULT_WORDS = [
    "nigger", "nigga", "niga", "niger", 
    "fuckass", "mf", "motherfucker", 
    "bitch", "bitches", "dumbfuck", 
    "kys", "killyourself", "fuck"
];

function readConfig() {
    try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (!config.blockedWords) config.blockedWords = DEFAULT_WORDS;
        return config;
    } catch {
        return { 
            logChannelId: "1513984222346612805", 
            blockedWords: DEFAULT_WORDS,
            inviteProtection: true,
            aiVisionModeration: true
        };
    }
}

function normalizeText(text) {
    return text
        .toLowerCase()
        .replace(/[0oO]/g, 'o')
        .replace(/[1iIlL!|]/g, 'i')
        .replace(/[3eE]/g, 'e')
        .replace(/[4aA@]/g, 'a')
        .replace(/[5sS$]/g, 's')
        .replace(/[7tT+]/g, 't')
        .replace(/[8bB]/g, 'b')
        .replace(/[^a-z]/g, '')
        .replace(/(.)\1+/g, '$1');
}

async function scanImageForNSFW(imageUrl) {
    const SIGHTENGINE_USER = 'YOUR_SIGHTENGINE_USER_ID'; 
    const SIGHTENGINE_SECRET = 'YOUR_SIGHTENGINE_API_SECRET';

    if (SIGHTENGINE_USER === 'YOUR_SIGHTENGINE_USER_ID') return false;

    try {
        const response = await fetch(
            `https://api.sightengine.com/1.0/check.json?url=${encodeURIComponent(imageUrl)}&models=nudity-2.0&api_user=${SIGHTENGINE_USER}&api_secret=${SIGHTENGINE_SECRET}`
        );
        const data = await response.json();

        if (data.status === 'success') {
            const nudity = data.nudity;
            if (nudity.sexual_activity > 0.50 || nudity.sexual_display > 0.50 || nudity.erotica > 0.60) {
                return true; 
            }
        }
        return false;
    } catch (error) {
        console.error('AI Moderation Connection Error:', error);
        return false;
    }
}

export default {
    name: Events.MessageCreate,
    async execute(message, client) {
        if (message.author.bot || !message.guild) return;

        // 👑 GLOBAL USER WHITELIST (Bypasses all checks)
        const whitelistedUsers = ['', ''];
        if (whitelistedUsers.includes(message.author.id)) return;

        const config = readConfig();
        const allowedRoles = ['', ''];
        
        const isStaff = message.member?.roles.cache.some(role => allowedRoles.includes(role.id));
        if (isStaff) return;

        const logChannel = message.guild.channels.cache.get(config.logChannelId);
        const TIMEOUT_DURATION = 30 * 60 * 1000; // 30 Minutes

        // ─── VECTOR 1: DISCORD INVITE LINKS ─────────────────────────────────
        if (config.inviteProtection) {
            const inviteRegex = /(discord\.(gg|io|me|li)\/.+|discord\.com\/invite\/.+)/i;
            if (inviteRegex.test(message.content)) {
                await message.delete().catch(() => null);
                await message.member.timeout(TIMEOUT_DURATION, 'AutoMod: Sent server invite link.').catch(() => null);

                const warnMsg = await message.channel.send(`⚠️ ${message.author}, advertising other servers is not allowed. You have been muted for 30 minutes.`);
                setTimeout(() => warnMsg.delete().catch(() => null), 6000);

                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setTitle('🛡️ AutoMod Link Protection')
                        .setColor('#FF0000')
                        .addFields(
                            { name: '👤 Offender', value: `${message.author} (\`${message.author.id}\`)`, inline: true },
                            { name: '⏱️ Action', value: 'Deleted & 30 Min Mute', inline: true },
                            { name: '📄 Link Posted', value: `\`\`\`${message.content}\`\`\`` }
                        )
                        .setTimestamp();
                    await logChannel.send({ embeds: [logEmbed] }).catch(() => null);
                }
                return;
            }
        }

        // ─── VECTOR 2: AI NSFW ATTACHMENT SCANNER ────────────────────────────
        if (config.aiVisionModeration && message.attachments.size > 0) {
            for (const attachment of message.attachments.values()) {
                const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(attachment.name);
                if (!isImage) continue;

                const isExplicit = await scanImageForNSFW(attachment.url);
                if (isExplicit) {
                    await message.delete().catch(() => null);
                    await message.member.timeout(TIMEOUT_DURATION, 'AutoMod AI: Uploaded Explicit Content.').catch(() => null);

                    const warnMsg = await message.channel.send(`❌ ${message.author}, NSFW/Explicit files are strictly prohibited. You have been muted for 30 minutes.`);
                    setTimeout(() => warnMsg.delete().catch(() => null), 6000);

                    if (logChannel) {
                        const logEmbed = new EmbedBuilder()
                            .setTitle('🚨 AutoMod AI Vision Violation')
                            .setDescription('AI intercepted explicit visual media.')
                            .setColor('#8B0000')
                            .addFields(
                                { name: '👤 Offender', value: `${message.author} (\`${message.author.id}\`)`, inline: true },
                                { name: '⏱️ Action Applied', value: 'Wiped Data & 30 Min Mute', inline: true },
                                { name: '🖼️ File Name', value: `\`${attachment.name}\``, inline: false }
                            )
                            .setTimestamp();
                        await logChannel.send({ embeds: [logEmbed] }).catch(() => null);
                    }
                    return;
                }
            }
        }

        // ─── VECTOR 3: HARD WORD BLACKLIST (Instant Check - Cost: 0 Coins) ───
        const normalizedMessage = normalizeText(message.content);
        
        const hasBlockedWord = config.blockedWords.some(word => {
            const normalizedWord = normalizeText(word);
            return normalizedMessage.includes(normalizedWord);
        });
        
        if (hasBlockedWord) {
            await message.delete().catch(() => null);
            await message.member.timeout(2 * 60 * 60 * 1000, 'AutoMod: Blacklisted phrase.').catch(() => null);

            const warnMsg = await message.channel.send(`❌ ${message.author}, that phrase (or a variation of it) is banned in this server.`);
            setTimeout(() => warnMsg.delete().catch(() => null), 5000);

            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle('🛡️ AutoMod Phrase Matched')
                    .setColor('#FF0000')
                    .addFields(
                        { name: '👤 User', value: `${message.author}`, inline: true },
                        { name: '⏱️ Action Taken', value: '2 Hours Mute', inline: true },
                        { name: '📄 Original Message', value: `\`\`\`${message.content}\`\`\`` },
                        { name: '⚙️ Normalized Clean Text', value: `\`${normalizedMessage}\`` }
                    )
                    .setTimestamp();
                await logChannel.send({ embeds: [logEmbed] }).catch(() => null);
            }
            return; // 🛑 Stops here. No AI is used since it matched an obvious bad word!
        }

        // ─── VECTOR 4: INTELLIGENT AI CATCH-ALL (Cost: Highly Optimized) ─────
        // Only trigger AI evaluation if the text is at least 12 characters. 
        // This avoids wasting money on short chat updates like "Recently", "hello", or "ok".
        if (message.content.length >= 12) {
            try {
                const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}` // Pulled straight from host panel
                    },
                    body: JSON.stringify({
                        model: "open-mistral-nemo",
                        messages: [
                            {
                                role: "system",
                                content: `You are the cold, cynical AI moderator of Flow SMP. You despise rule breakers. Analyze this text for toxic intent, severe bypass behaviors, context harassment, or malicious threats.
                                Return ONLY a raw JSON object: { "toxic": true/false, "roast": "a 1-sentence sharp insult" }.
                                - Regular conversations, venting, or words like "recently" are completely safe (toxic: false).
                                - Hidden toxicity, bypass slurs, or real malicious toxicity (toxic: true).
                                - Keep the roast condescending.`
                            },
                            { role: "user", content: message.content }
                        ],
                        temperature: 0.4
                    })
                });

                const data = await response.json();
                
                if (data.choices && data.choices[0]?.message?.content) {
                    let cleanText = data.choices[0].message.content.trim();
                    
                    // Clean up markdown block wrapping if the AI outputs it
                    if (cleanText.startsWith('```json')) cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
                    else if (cleanText.startsWith('```')) cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');

                    const result = JSON.parse(cleanText);

                    if (result.toxic) {
                        await message.delete().catch(() => null);
                        await message.channel.send(`🤡 **${message.author.username} failed the vibe check.** ${result.roast} 📉`);
                        
                        if (logChannel) {
                            const logEmbed = new EmbedBuilder()
                                .setTitle('🧠 AI AutoMod Flag')
                                .setColor('#FF4500')
                                .addFields(
                                    { name: '👤 User', value: `${message.author}`, inline: true },
                                    { name: '⏱️ Action Taken', value: 'Deleted by Mistral AI Judgment', inline: true },
                                    { name: '📄 Flagged Message', value: `\`\`\`${message.content}\`\`\`` }
                                )
                                .setTimestamp();
                            await logChannel.send({ embeds: [logEmbed] }).catch(() => null);
                        }
                    }
                }
            } catch (error) {
                console.error('Automod Mistral Runtime Error:', error);
            }
        }
    }
};
