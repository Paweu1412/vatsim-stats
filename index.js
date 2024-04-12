import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();
import './memberPrototypes.js';

import { initRoleAssignmentsModule } from './modules/rolesAssignments.js';

const BOT_TOKEN = process.env.BOT_TOKEN;
const BOT_GUILD_ID = process.env.BOT_GUILD_ID;

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers]
});

client.once("ready", async () => {
  const guild = client.guilds.cache.get(BOT_GUILD_ID);

  if (!guild) {
    console.error("Guild not found");
    return;
  }

  await guild.members.fetch();

  await initRoleAssignmentsModule(client, guild);
});


client.login(BOT_TOKEN);