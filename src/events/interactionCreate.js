const { Events, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (interaction.isButton()) {
            if (interaction.customId === 'media_apply_button') {
                const modal = new ModalBuilder()
                    .setCustomId('media_application_modal')
                    .setTitle('Media Team Application');

                const tiktokInput = new TextInputBuilder()
                    .setCustomId('tiktok_profile')
                    .setLabel('TikTok Profile Link')
                    .setPlaceholder('https://www.tiktok.com/@yourusername')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const videosInput = new TextInputBuilder()
                    .setCustomId('video_links')
                    .setLabel('Video Links (one per line)')
                    .setPlaceholder('Paste your TikTok video links here')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true);

                const firstActionRow = new ActionRowBuilder().addComponents(tiktokInput);
                const secondActionRow = new ActionRowBuilder().addComponents(videosInput);

                modal.addComponents(firstActionRow, secondActionRow);

                await interaction.showModal(modal);
            }
        }

        if (interaction.isModalSubmit()) {
            if (interaction.customId === 'media_application_modal') {
                await interaction.deferReply({ ephemeral: true });

                const tiktokLink = interaction.fields.getTextInputValue('tiktok_profile');
                const videoLinks = interaction.fields.getTextInputValue('video_links');

                // Basic validation
                if (!tiktokLink.includes('tiktok.com')) {
                    return interaction.editReply('❌ Please provide a valid TikTok profile link.');
                }

                // Send to staff channel
                const staffChannel = interaction.guild.channels.cache.get('1519704772717056010');
                
                if (!staffChannel) {
                    return interaction.editReply('❌ Staff channel not found.');
                }

                const embed = new EmbedBuilder()
                    .setTitle('📋 New Media Team Application')
                    .setColor('Green')
                    .addFields(
                        { name: 'Applicant', value: interaction.user.toString() },
                        { name: 'TikTok Profile', value: tiktokLink },
                        { name: 'Video Links', value: videoLinks.length > 1000 ? videoLinks.substring(0, 997) + '...' : videoLinks }
                    )
                    .setTimestamp();

                const approve = new ButtonBuilder()
                    .setCustomId(`approve_${interaction.user.id}`)
                    .setLabel('Approve')
                    .setStyle(ButtonStyle.Success);

                const deny = new ButtonBuilder()
                    .setCustomId(`deny_${interaction.user.id}`)
                    .setLabel('Deny')
                    .setStyle(ButtonStyle.Danger);

                const row = new ActionRowBuilder().addComponents(approve, deny);

                await staffChannel.send({ embeds: [embed], components: [row] });

                await interaction.editReply('✅ Your application has been submitted for review!');
            }
        }

        // Handle approve / deny buttons
        if (interaction.isButton() && (interaction.customId.startsWith('approve_') || interaction.customId.startsWith('deny_'))) {
            const userId = interaction.customId.split('_')[1];
            const member = await interaction.guild.members.fetch(userId).catch(() => null);

            if (interaction.customId.startsWith('approve_')) {
                if (member) {
                    const role = interaction.guild.roles.cache.get('1513984221574856722');
                    if (role) await member.roles.add(role);
                    await member.send('✅ Your Media Team application has been **approved**!').catch(() => {});
                }
                await interaction.reply({ content: '✅ Application Approved!', ephemeral: true });
            } else {
                if (member) {
                    await member.send('❌ Your Media Team application was **denied**.').catch(() => {});
                }
                await interaction.reply({ content: '❌ Application Denied.', ephemeral: true });
            }
        }
    }
};
