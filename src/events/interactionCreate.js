} else if (interaction.isButton()) {
          // ==========================================
          // PERMANENT RULES BUTTONS (SELF-CONTAINED)
          // ==========================================
          if (interaction.customId === 'rules_basic') {
            try {
              await interaction.deferReply({ flags: MessageFlags.Ephemeral });
              
              // Built purely with standard EmbedBuilder so it never crashes on missing imports
              const basicRulesEmbed = {
                title: '📋 Flow SMP Server Rules',
                color: 3447003, // Safe Info Blue hex color int
                description: 'Please review our community guidelines below. Use common sense if it feels unfair, or you will get banned for it.',
                fields: [
                  { name: 'R1', value: 'No naked killing', inline: true },
                  { name: 'R2', value: 'No spawn camping', inline: true },
                  { name: 'R3', value: 'Lag machine', inline: true },
                  { name: 'R4', value: 'Wither spawning', inline: true },
                  { name: 'R5', value: 'Chat rules', inline: true },
                  { name: 'R6', value: 'No Stasis Chambers in combat', inline: true },
                  { name: 'R7', value: 'Pushing out of spawn', inline: true },
                  { name: 'R8', value: 'No elytra in combat', inline: true },
                  { name: 'R9', value: 'Noobie protection', inline: true },
                  { name: 'R10', value: 'Instant damage arrows', inline: true },
                  { name: 'R11', value: 'No crystals', inline: true },
                  { name: 'R12', value: 'String drop at spawn', inline: true },
                  { name: 'R13', value: 'No trident in combat', inline: true },
                  { name: 'R14', value: 'Toxicity', inline: true },
                  { name: 'R15', value: 'Excessive swearing—Chat flood', inline: true },
                  { name: 'R16', value: 'Staff decisions must be respected', inline: true },
                  { name: 'R17', value: 'English only—Advertising other servers', inline: true },
                  { name: 'R18', value: 'Ticket spam', inline: true },
                  { name: 'R19', value: 'Incorrect team size', inline: true },
                  { name: 'R20', value: 'Duping/Cheating', inline: true },
                  { name: 'R21', value: 'Arguing about moderation', inline: false },
                ],
                footer: { text: 'Use common sense if it feels unfair, or you will get banned for it.' }
              };

              return await interaction.editReply({ embeds: [basicRulesEmbed] });
            } catch (error) {
              await handleInteractionError(interaction, error, withTraceContext({
                type: 'button',
                customId: interaction.customId,
                handler: 'rules_basic'
              }, interactionTraceContext));
              return;
            }
          }

          if (interaction.customId === 'rules_mods') {
            try {
              await interaction.deferReply({ flags: MessageFlags.Ephemeral });
              
              const bannedModsEmbed = {
                title: '🛡️ Banned Modifications & Client Restrictions',
                color: 15548997, // Safe Error Red hex color int
                description: 'Any modifications that grant an unfair advantage over vanilla players are strictly prohibited.\n\n:scales: **Punishment = 4h-7h** (depends on what you used)',
                fields: [
                  { name: '🚫 Hacked Clients & Movement Modifiers', value: 'Includes any mods that allow flight, speed hacking, freecam, or fast break.\n:scales: **Punishment = 5 days ban**' },
                  { name: '👁️ X-Ray & Vision Enhancers', value: 'Mods that let you see through blocks, caves, or player names behind walls.\n:scales: **Punishment = 4h-7h** (depends on what you used)' },
                  { name: '🤖 Automation & Macros', value: 'Auto-clicking/burst-clicking buttons, auto-sprint, auto-eating, and automated fishing or farming macros.\n:scales: **Punishment = 7 hours ban**' },
                  { name: '⚔️ PvP Assistance', value: 'Kill-aura, aim assist, reach extenders, auto-totem, and triggerbots.\n:scales: **Punishment = 1 day ban**' },
                  { name: '⚠️ Malware & IP Stealers', value: 'Mods containing malicious code or scripts that attempt to access your computer’s IP or system information.\n:scales: **Punishment = PERMANENT**' },
                  { name: '🗺️ Unapproved Aesthetic Features', value: 'Certain minimap mods that indicate the location of nearby players or entities.\n:scales: **Punishment = 6h ban**' }
                ],
                footer: { text: 'Use common sense if it feels unfair, or you will get banned for it.' }
              };

              return await interaction.editReply({ embeds: [bannedModsEmbed] });
            } catch (error) {
              await handleInteractionError(interaction, error, withTraceContext({
                type: 'button',
                customId: interaction.customId,
                handler: 'rules_mods'
              }, interactionTraceContext));
              return;
            }
          }
          // ==========================================

          if (interaction.customId.startsWith('shared_todo_')) {
