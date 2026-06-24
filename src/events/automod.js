import { Events } from "discord.js";
import fs from 'fs';
import path from 'path';

const configPath = path.resolve('./automodConfig.json');

export default {
  name: Events.MessageCreate,
  once: false,

  async execute(message) {
    if (message.author.bot || !message.content) return;

    // Load active arrays directly from storage file
    let config = { logChannelId: "1513984222346612805", muteDurationMinutes: 60, blockedWords: ["nigger", "kys", "killyourself", "bitch"] };
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch { /* Fallback to default block if config disappears */ }

    const cleanContent = message.content.toLowerCase();

    // Scan users text for dynamically updated storage array entries
    const triggeredWord = config.blockedWords.find(word => cleanContent.includes(word));

    if (triggeredWord) {
      if (message.deletable) {
        await message.delete().catch(() => null);
      }

      // Convert our dashboard duration metrics directly to timeout actions
      const muteDuration = config.muteDurationMinutes * 60 * 1000; 
      let muteSuccess = true;

      if (message.member && message.member.moderatable) {
        await message.member.timeout(muteDuration, `Triggered AutoMod blacklist: "${triggeredWord}"`)
          .catch(() => { muteSuccess = false; });
      } else {
        muteSuccess = false;
      }

      const logChannel = message.client.channels.cache.get(config.logChannelId);
      if (logChannel) {
        const muteStatusText = muteSuccess 
          ? `and has been muted for ${config.muteDurationMinutes}m ⏳` 
          : "(Failed to mute - check hierarchy permissions)";
          
        await logChannel.send({
          content: `⚠️ **AutoMod Log:** ${message.author.tag} (${message.author.id}) sayed \`${triggeredWord}\` message deleted ${muteStatusText}`
        }).catch(() => null);
      }

      const warning = await message.channel.send({
        content: `❌ ${message.author}, That vocabulary or phrase is not permitted. You have been muted.`
      }).catch(() => null);

      if (warning) {
        setTimeout(() => warning.delete().catch(() => null), 5000);
      }
    }
  },
};
