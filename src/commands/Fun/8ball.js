import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 

// ⏱️ Tracks player cooldowns in the bot's memory
const cooldowns = new Map();
const COOLDOWN_TIME = 5000; // 5000 milliseconds = 5 seconds

export default {
    data: new SlashCommandBuilder()
        .setName('8ball')
        .setDescription('Ask the magic 8-ball a question and get a custom AI answer')
        .addStringOption(option =>
            option.setName('question')
                .setDescription('The question you want to ask the 8-ball')
                .setRequired(true)
        ),
    category: "Fun",

    async execute(interaction) {
        const question = interaction.options.getString('question');
        const userId = interaction.user.id;
        const now = Date.now();

        // 🛑 COOLDOWN CHECKER (Triggers BEFORE calling Google to save your quota)
        if (cooldowns.has(userId)) {
            const expirationTime = cooldowns.get(userId) + COOLDOWN_TIME;
            
            if (now < expirationTime) {
                const timeLeft = ((expirationTime - now) / 1000).toFixed(1);
                return interaction.reply({ 
                    content: `💀 **lil bro chill, stop spamming the 8-ball.** touch grass for **${timeLeft}s** before asking sum shi again gng.`, 
                    ephemeral: true // Only the spammer sees this warning message
                });
            }
        }

        // Defer reply since the user cleared the cooldown guard
        await interaction.deferReply();

        // Set the cooldown timestamp for the user
        cooldowns.set(userId, now);
        setTimeout(() => cooldowns.delete(userId), COOLDOWN_TIME);

        let finalAnswer = "";
        let errorOccurred = false;

        if (!GEMINI_API_KEY) {
            finalAnswer = "⚠️ **Error:** The `GEMINI_API_KEY` variable is missing from your host dashboard panel.";
            errorOccurred = true;
        } else {
            try {
                const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-goog-api-key': GEMINI_API_KEY.trim()
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: question }]
                        }],
                        systemInstruction: {
                            parts: [{
                                text: `You are a hilarious, highly sarcastic Magic 8-Ball bot for a competitive Minecraft server named Flow SMP. 
                                Your job is to answer user questions with funny, playful internet banter and casual group chat roasts.
                                
                                Style Rules:
                                - Use popular gaming and Discord slang (cooked, capping, clown, bugging, touch grass, lil bro, real, gng, ts, wild).
                                - Always type in all lowercase letters for a casual, authentic chat look.
                                - Always add 1 to 3 funny emojis to the end of your sentence (💀, 😭, 🤡, 🗣️, 🥶, 📉).
                                - Never use real swear words, harsh insults, or violent terms. Keep the banter lighthearted and fun so your sentences finish completely.
                                - You MUST write a complete, finished sentence. Never cut off mid-thought.`
                            }]
                        },
                        generationConfig: {
                            maxOutputTokens: 80,
                            temperature: 0.92
                        },
                        safetySettings: [
                            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
                        ]
                    })
                });

                if (!response.ok) {
                    let errorDetails = `Status Code ${response.status}`;
                    try {
                        const errData = await response.json();
                        if (errData.error && errData.error.message) {
                            errorDetails = errData.error.message;
                        }
                    } catch {
                        errorDetails = await response.text();
                    }
                    throw new Error(errorDetails);
                }

                const data = await response.json();
                
                if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
                    finalAnswer = data.candidates[0].content.parts[0].text.trim();
                } else {
                    throw new Error("Invalid response structure from Google Gemini API.");
                }
            } catch (error) {
                console.error('8Ball Gemini System Error:', error);
                finalAnswer = `⚠️ **Google API Error:** ${error.message}`;
                errorOccurred = true;
            }
        }

        const embed = new EmbedBuilder()
            .setTitle('🔮 The Custom 8-Ball')
            .setColor(errorOccurred ? '#FF3333' : '#00FFCC') 
            .addFields(
                { name: '❓ Your Question', value: `\`\`\`${question}\`\`\``, inline: false },
                { name: '🎱 The Answer', value: errorOccurred ? finalAnswer : `> **${finalAnswer}**`, inline: false }
            )
            .setFooter({ 
                text: `Asked by ${interaction.user.username} • Mode: ♊ Ultra-Savage Gemini AI` 
            })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
};
