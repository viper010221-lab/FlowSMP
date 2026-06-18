import { SlashCommandBuilder } from 'discord.js';
import { handleInteractionError } from '../../utils/errorHandler.js';

export default {
    data: new SlashCommandBuilder()
        .setName('suggest')
        .setDescription('Submit a suggestion for the server')
        .setDMPermission(false), // Members must use it inside the server
    category: "Utility",

    async execute(interaction, config, client) {
        try {
            // We cannot import or build structural layout components inside the global header 
            // if your setup relies strictly on raw discord.js sub-packages. 
            // Let's build the modal safely right here inside the execution loop:
            
            const modal = {
                title: 'Submit a Suggestion',
                custom_id: 'suggestion_modal',
                components: [
                    {
                        type: 1, // Action Row
                        components: [
                            {
                                type: 4, // Text Input
                                custom_id: 'suggestion_text',
                                label: 'What is your suggestion?',
                                style: 2, // Paragraph / Large text box
                                placeholder: 'Type your suggestion for Flow SMP here...',
                                min_length: 10,
                                max_length: 1000,
                                required: true
                            }
                        ]
                    }
                ]
            };

            // Show the pop-up form directly to the member instantly
            await interaction.showModal(modal);

        } catch (error) {
            await handleInteractionError(error, interaction);
        }
    }
};
