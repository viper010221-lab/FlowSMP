if (interaction.isModalSubmit()) {
    if (interaction.customId === 'suggestion_modal') {
        try {
            // 1. Acknowledge the submission instantly so the user doesn't get a "Something went wrong" popup
            await interaction.deferReply({ ephemeral: true });

            // 2. Extract the text input from the modal fields
            const suggestionText = interaction.fields.getTextInputValue('suggestion_text');
            const user = interaction.user;

            // 3. Target Channel ID: 1515069315836153946
            const targetChannelId = '1515069315836153946';
            const suggestionChannel = interaction.client.channels.cache.get(targetChannelId) 
                || await interaction.client.channels.fetch(targetChannelId).catch(() => null);

            if (suggestionChannel) {
                // 4. Send a clean raw embed object directly to the channel
                await suggestionChannel.send({
                    embeds: [{
                        color: 0x2ECC71, // Vibrant green
                        title: '📩 New Server Suggestion',
                        description: `\`\`\`\n${suggestionText}\n\`\`\``,
                        fields: [
                            { name: 'Submitted By', value: `${user} (${user.username})`, inline: true }
                        ],
                        timestamp: new Date()
                    }]
                });

                // 5. Tell the user it went through successfully
                await interaction.editReply({
                    content: '✅ Thank you! Your suggestion has been posted to the administration channel.'
                });
            } else {
                // Fallback error if the bot cannot access or find the channel ID
                await interaction.editReply({
                    content: '❌ Error: Could not find or access the target suggestion channel. Please verify the bot permissions.'
                });
            }

        } catch (error) {
            console.error('Error handling modal submission:', error);
            try {
                if (interaction.deferred) {
                    await interaction.editReply({ content: '❌ An error occurred while processing your suggestion.' });
                } else {
                    await interaction.reply({ content: '❌ An error occurred.', ephemeral: true });
                }
            } catch (replyError) {
                // Ignore silent duplicate response errors
            }
        }
    }
}
