import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

// 🧠 Safely grabs the key from your host dashboard without putting it on GitHub
const AI_API_KEY = process.env.OPENAI_API_KEY; 

export default {
    data: new SlashCommandBuilder()
        .setName('8ball')
        .setDescription('Ask the magic 8-ball a question and get a funny, custom AI answer')
        .addStringOption(option =>
            option.setName('question')
                .setDescription('The question you want to ask the 8-ball')
                .setRequired(true)
        ),
    category: "Fun",

    async execute(interaction) {
        const question = interaction.options.getString('question');

        // Funny local fallback responses used if the AI key is missing or out of credits
        const fallbackResponses = [
            "buddy im not fucking gpt 🤫",
            "ts guy thinks i have 100 ram inside my ahh 😭",
            "Idk gng why u asking me 💀",
            "It is certain 🟢",
            "Without a doubt ✅",
            "Don't count on it, it's over for u 📉",
            "Bro, absolutely not 🚫"
        ];

        let finalAnswer = "";
        let isAiGenerated = false;

        // If your host successfully passes the environment variable
        if (AI_API_KEY) {
            await interaction.deferReply();

            try {
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${AI_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: 'gpt-4o-mini', 
                        messages: [
                            { 
                                role: 'system', 
                                content: `You are a hilarious, witty Magic 8-Ball inside a competitive Minecraft SMP Discord server. 
                                A user is going to ask you a question. You must read their question and give a genuinely good, accurate, or smart answer to it, BUT deliver the answer using funny, modern gaming community brainrot or casual slang. 
                                Feel free to occasionally use phrases like 'buddy im not gpt', 'ts guy thinks I have 100 ram inside my ahh', 'gng', 'cooked', 'we up', 'it is over for u', or '💀' if it fits their question perfectly. Keep the response short (1 to 2 sentences max).`
                            },
                            { role: 'user', content: question }
                        ],
                        max_tokens: 80,
                        temperature: 0.85
                    })
                });

                if (!response.ok) {
                    throw new Error(`OpenAI responded with status ${response.status}`);
                }

                const data = await response.json();
                if (data.choices && data.choices[0]?.message?.content) {
                    finalAnswer = data.choices[0].message.content.trim();
                    isAiGenerated = true;
                }
            } catch (error) {
                console.error('8Ball AI System Error (Using Fallback System):', error);
            }
        }

        // Emergency backup: If the AI failed or skipped, pick a random answer
        if (!finalAnswer) {
            finalAnswer = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
        }

        // Build the display embed response
        const embed = new EmbedBuilder()
            .setTitle('🔮 The Custom 8-Ball')
            .setColor(isAiGenerated ? '#00FFCC' : '#4B0082') 
            .addFields(
                { name: '❓ Your Question', value: `\`\`\`${question}\`\`\``, inline: false },
                { name: '🎱 The Answer', value: `> **${finalAnswer}**`, inline: false }
            )
            .setFooter({ 
                text: `Asked by ${interaction.user.username} • Mode: ${isAiGenerated ? '🧠 AI Engine' : '🎲 Fail-Safe Shaker'}` 
            })
            .setTimestamp();

        if (interaction.deferred) {
            await interaction.editReply({ embeds: [embed] });
        } else {
            await interaction.reply({ embeds: [embed] });
        }
    }
};
