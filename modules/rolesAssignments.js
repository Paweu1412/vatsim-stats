import { EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
dotenv.config();

const locales = JSON.parse(readFileSync(new URL('../locales.json', import.meta.url)));

const BOT_MESSAGES_ID = process.env.BOT_MESSAGES_ID;
const LANGUAGE = process.env.LANGUAGE;

const requiredRoles = {
  '👨‍✈️ 0h+': { color: '#FFFFFF', banner: 'https://i.imgur.com/HlyxLRY.gif' },
  '👨‍✈️ 5h+': { color: '#FFFFFF', banner: 'https://i.imgur.com/HlyxLRY.gif' },
  '👨‍✈️ 10h+': { color: '#FFFFFF', banner: 'https://i.imgur.com/2CifDr3.gif' },
  '👨‍✈️ 50h+': { color: '#FFFFFF', banner: 'https://i.imgur.com/2CifDr3.gif' },
  '👨‍✈️ 100h+': { color: '#FFFFFF', banner: 'https://i.imgur.com/mIc53wx.gif' },
  '👨‍✈️ 150h+': { color: '#FFF5CC', banner: 'https://i.imgur.com/mIc53wx.gif' },
  '👨‍✈️ 200h+': { color: '#FFEB99', banner: 'https://i.imgur.com/a3nJDE3.gif' },
  '👨‍✈️ 250h+': { color: '#FFE066', banner: 'https://i.imgur.com/a3nJDE3.gif' },
  '👨‍✈️ 300h+': { color: '#FFD633', banner: 'https://i.imgur.com/Tlctnqw.gif' },
  '👨‍✈️ 350h+': { color: '#FFCC00', banner: 'https://i.imgur.com/Tlctnqw.gif' },
  '👨‍✈️ 500h+': { color: '#FFB200', banner: 'https://i.imgur.com/bKz6Y0L.gif' },
  '👨‍✈️ 750h+': { color: '#FF9900', banner: 'https://i.imgur.com/bKz6Y0L.gif' },
  '👨‍✈️ 1000h+': { color: '#FF7F00', banner: 'https://i.imgur.com/AGPSJMs.gif' },
  '👨‍✈️ 1250h+': { color: '#FF6600', banner: 'https://i.imgur.com/AGPSJMs.gif' },
  '👨‍✈️ 1500h+': { color: '#FF4C00', banner: 'https://i.imgur.com/TZumq8b.gif' },
  '👨‍✈️ 2000h+': { color: '#FF3300', banner: 'https://i.imgur.com/TZumq8b.gif' },
  '👨‍✈️ 2500h+': { color: '#FF1900', banner: 'https://i.imgur.com/xO0CBr2.gif' },
  '👨‍✈️ 3000h+': { color: '#FF0000', banner: 'https://i.imgur.com/xO0CBr2.gif' },
  '👨‍✈️ 4000h+': { color: '#E60000', banner: 'https://i.imgur.com/vAxzTME.gif' },
  '👨‍✈️ 5000h+': { color: '#CC0000', banner: 'https://i.imgur.com/vAxzTME.gif' },
};

const verifyRequiredRolesExisting = async (guild) => {
  const roles = guild.roles.cache;
  const rolesNames = roles.map(role => role.name);

  for (const [roleName, roleData] of Object.entries(requiredRoles)) {
    if (!rolesNames.includes(roleName)) {
      await guild.roles.create({
        name: roleName,
        color: roleData.color,
        mentionable: false,
      });
    }
  }
};

const setMemberRole = async (member, skipEmbed) => {
  let networkPilotHours = await member.getNetworkPilotTime();
  if (networkPilotHours === null) {
    console.log(`[ROLES] Failed to fetch ${member.user.username} hours on VATSIM`);
    return;
  }

  let currentlyAssignedRole = member.roles.cache.find(role => role.name.startsWith('👨‍✈️'));
  let highestRole = null;

  for (const roleName of Object.keys(requiredRoles)) {
    const hours = Number(roleName.match(/\d+/)[0]);
    if (networkPilotHours >= hours) highestRole = roleName;
  }

  if (currentlyAssignedRole?.name === highestRole) return;

  if (currentlyAssignedRole) {
    await member.roles.remove(currentlyAssignedRole);
  }

  const newRole = member.guild.roles.cache.find(role => role.name === highestRole);
  if (newRole) {
    await member.roles.add(newRole);

    if (!skipEmbed) {
      const channel = member.guild.channels.cache.get(BOT_MESSAGES_ID);

      if (channel) {
        const embed = new EmbedBuilder()
          .setTitle(locales[LANGUAGE].title)
          .setDescription(locales[LANGUAGE].message.format(`<@${member.user.id}>`, highestRole.match(/\d+/)[0]))
          .setColor(requiredRoles[highestRole].color)
          .setImage(requiredRoles[highestRole].banner);

        await channel.send({ embeds: [embed] });
      }
    }
  }
};

export const initRoleAssignmentsModule = async (client, guild) => {
  await verifyRequiredRolesExisting(guild);

  client.on('guildMemberUpdate', async (oldMember, newMember) => {
    if (oldMember.getNetworkCID() !== newMember.getNetworkCID()) {
      console.log(`[ROLES] Pilot ${newMember.user.username} changed VATSIM CID`);
      await setMemberRole(newMember, true);
    }
  });

  console.log(`[INFO] Role assignments module initialized`);

  const updateRoles = async () => {
    console.log(`[ROLES] Starting role check for all pilots`);

    let users = 0;

    for (const member of guild.members.cache.values()) {
      if (member.user.bot || member.getNetworkCID() === null) continue;

      setTimeout(async () => {
        console.log(`[ROLES] Checking pilot ${member.user.username} hours on VATSIM`);

        await setMemberRole(member);
      }, users * 20000);

      users++;
    }

    console.log(`[ROLES] Finished role check`);

    updateRoles();
  };
};