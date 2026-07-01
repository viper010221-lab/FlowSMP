// ─── VECTOR 4: INTELLIGENT AI CATCH-ALL ─────────────────────────────
// Ignore commands and very short messages to prevent false positives
if (message.content.startsWith('/') || message.content.length < 15) return;

try {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`
        },
        body: JSON.stringify({
            model: "open-mistral-nemo",
            messages: [
                {
                    role: "system",
                    content: `You are a moderator for Flow SMP. You ONLY flag messages that are EXTREMELY toxic, hate speech, or direct threats. 
                    - IGNORE all gaming discussions, banter, and Minecraft mechanics. 
                    - If the message is not explicitly harmful, return toxic: false.
                    - Return ONLY a raw JSON object: { "toxic": true/false, "reason": "short explanation" }.`
                },
                { role: "user", content: message.content }
            ],
            temperature: 0.1
        })
    });

    const data = await response.json();
    
    if (data.choices?.[0]?.message?.content) {
        let cleanText = data.choices[0].message.content.trim().replace(/^```json\s*/, '').replace(/\s*```$/, '');
        const result = JSON.parse(cleanText);

        if (result.toxic) {
            // Only perform a timeout; the message is NOT deleted
            const TIMEOUT_DURATION = 30 * 60 * 1000;
            await message.member.timeout(TIMEOUT_DURATION, `AutoMod AI: ${result.reason}`).catch(() => null);
            await message.channel.send(`⚠️ **${message.author.username}** has been timed out for 30 minutes for violating community standards.`);
            
            // Log the action to the specific channel
            const logChannel = message.guild.channels.cache.get("1513984222346612805");
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle('🚨 AI Timeout Applied (No Delete)')
                    .setColor('#FF4500')
                    .addFields(
                        { name: '👤 User', value: `${message.author}`, inline: true },
                        { name: '⏱️ Action', value: '30 Minute Timeout', inline: true },
                        { name: '📄 Message Content', value: `\`\`\`${message.content}\`\`\`` },
                        { name: '🔍 Reason', value: result.reason }
                    )
                    .setTimestamp();
                await logChannel.send({ embeds: [logEmbed] }).catch(() => null);
            }
        }
    }
} catch (error) {
    console.error('Automod Mistral Runtime Error:', error);
}
