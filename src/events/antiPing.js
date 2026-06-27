import { Events } from "discord.js";
import fs from 'fs';
import path from 'path';

const configPath = path.resolve('./automodConfig.json');

export default {
  name: Events.MessageCreate,
  once: false,

  async execute(message) {
    if (message.author.bot || !message.content || !message.guild) return;

    // --- PROTECTED USERS LIST ---
    const protectedUsers = [
      "864871855604498452",
      "1008719737825534043"
    ];

    // 👑 BYPASS CHECK: Whitelisted users can ping anyone unrestricted
    if (protectedUsers.includes(message.author.id)) return;

    // Strict Regex Check: Only triggers if the text layer contains an explicit <@ID> tag
    const triggeredPing = protectedUsers.find(id => {
      const explicitPingRegex = new RegExp(`<@!?${id}>`);
      return explicitPingRegex.test(message.content);
    });

    if (triggeredPing) {
      // 1. Immediately delete the message to clear the ping
      await message.delete().catch(() => null);

      // 2. Fetch log channel
      let logChannelId = "1513984222346612805"; 
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (config.logChannelId) logChannelId = config.logChannelId;
      } catch { /* Fallback */ }

      const logChannel = message.guild.channels.cache.get(logChannelId);
      if (logChannel) {
        await logChannel.send({
          content: `🗑️ **Anti-Ping Log:** Deleted a message from ${message.author.tag} (${message.author.id}) for explicitly typing a ping to a protected staff member.`
        }).catch(() => null);
      }

      // 3. Issue self-cleaning alert
      const warning = await message.channel.send({
        content: `❌ ${message.author}, You cannot ping this person.`
      }).catch(() => null);

      if (warning) {
        setTimeout(() => warning.delete().catch(() => null), 4000);
      }
    }
  },
};
