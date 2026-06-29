// ─── VECTOR 4: INTELLIGENT AI CATCH-ALL ─────────────────────────────
if (message.content.length >= 12) {
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
                        content: `You are a moderator for Flow SMP. You ONLY flag messages that contain severe toxicity, genuine harassment, hate speech, or malicious threats.
                        - If a message is about Minecraft (enchantments, cooldowns, gear, raids, gameplay tips), it is 100% SAFE (toxic: false).
                        - Do not flag banter or gaming discussions.
                        - Be extremely lenient. Only flag if it is clearly intended to cause harm to another human.
                        - Return ONLY a raw JSON object: { "toxic": true/false, "roast": "a 1-sentence sharp insult" }.`
                    },
                    { role: "user", content: message.content }
                ],
                temperature: 0.2 // Lowered temperature for more predictable, less "creative" results
            })
        });

        const data = await response.json();
        
        if (data.choices && data.choices[0]?.message?.content) {
            let cleanText = data.choices[0].message.content.trim();
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
