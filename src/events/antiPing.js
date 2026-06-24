import { Events } from "discord.js";
import fs from 'fs';
import path from 'path';

const configPath = path.resolve('./automodConfig.json');

export default {
  name: Events.MessageCreate,
  once: false,

  async execute(message) {
    // Immediate escape hatches for maximum speed
    if (message.author.bot || !message.content) return;

    // --- PROTECTED USERS LIST ---
    const protectedUsers = [
      "864871855604498452",
      "1008719737825534043"
    ];

    // Check if any of the protected IDs were mentioned
    const triggeredPing = protectedUsers.find(id => message.mentions.users.has(id));

    if (triggeredPing) {
      // 1. Fire the delete request immediately to block the notification
      if (message.deletable) {
        await message.delete().catch(() => null);
      }

      // 2. Read the shared log target dynamically
      let logChannelId = "1513984222346612805"; 
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (config.logChannelId) logChannelId = config.logChannelId;
      } catch { /* Fallback */ }

      // 3. Dispatch the incident details to the staff feed (Just a deletion log now)
      const logChannel = message.client.channels.cache.get(logChannelId);
      if (logChannel) {
        await logChannel.send({
          content: `🗑️ **Anti-Ping Log:** Deleted a message from ${message.author.tag} (${message.author.id}) for pinging a protected staff ID.`
        }).catch(() => null);
      }

      // 4. Send the updated self-cleaning warning message without the mute mention
      const warning = await message.channel.send({
        content: `❌ ${message.author}, You cannot ping this person.`
      }).catch(() => null);

      if (warning) {
        setTimeout(() => warning.delete().catch(() => null), 4000);
      }
    }
  },
};
