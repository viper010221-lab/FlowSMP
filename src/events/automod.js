const EXEMPT_IDS = ['YOUR_USER_ID_HERE']; // Put your Discord ID here

export async function processAutoMod(message) {
    // 1. Bypass check: If the author is in the exempt list or is a bot, do nothing
    if (message.author.bot || EXEMPT_IDS.includes(message.author.id)) return;

    // 2. Adjusting the filter: Let's lower it to 5 characters so it catches "mf"
    if (message.content.length < 5) return; 

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
                        content: `You are a cold, bored moderator of Flow SMP. You do not care about the users. Analyze the following message.
                        Return ONLY a JSON object: { "toxic": true/false, "roast": "a 1-sentence cold insult" }.
                        - If it is toxic, mean, or spam, toxic: true. 
                        - Be condescending and cold.`
                    },
                    { role: "user", content: message.content }
                ],
                temperature: 0.5
            })
        });

        const data = await response.json();
        const result = JSON.parse(data.choices[0].message.content);

        if (result.toxic) {
            await message.delete();
            await message.channel.send(`🤡 **${message.author.username} failed the vibe check.** ${result.roast} 📉`);
        }
    } catch (error) {
        console.error('Automod AI Error:', error);
    }
}
