import { EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

import locales from '../locales.json' assert { type: 'json' };

const BOT_MESSAGES_ID = process.env.BOT_MESSAGES_ID;
const LANGUAGE = process.env.LANGUAGE;

const requiredRoles = {
  'P: 100h+': { 'color': '#ffffff', 'banner': 'https://i.imgur.com/2CifDr3.gif' },
  'P: 150h+': { 'color': '#ffffff', 'banner': 'https://i.imgur.com/2CifDr3.gif' },
  'P: 200h+': { 'color': '#f4ebe6', 'banner': 'https://i.imgur.com/a3nJDE3.gif' },
  'P: 250h+': { 'color': '#f4ebe6', 'banner': 'https://i.imgur.com/a3nJDE3.gif' },
  'P: 350h+': { 'color': '#917070', 'banner': 'https://i.imgur.com/bKz6Y0L.gif' },
  'P: 500h+': { 'color': '#917070', 'banner': 'https://i.imgur.com/bKz6Y0L.gif' },
  'P: 1000h+': { 'color': '#d6d69c', 'banner': 'https://i.imgur.com/AGPSJMs.gif' },
  'P: 1250h+': { 'color': '#d6d69c', 'banner': 'https://i.imgur.com/AGPSJMs.gif' },
  'P: 1500h+': { 'color': 'Aqua', 'banner': 'https://i.imgur.com/TZumq8b.gif' },
  'P: 2000h+': { 'color': 'Orange', 'banner': 'https://i.imgur.com/TZumq8b.gif' },
  'P: 2500h+': { 'color': 'DarkOrange', 'banner': 'https://i.imgur.com/TZumq8b.gif' },
}

const verifyRequiredRolesExisting = async (guild) => {
  const roles = guild.roles.cache;
  const rolesNames = roles.map(role => role.name);

  for (const [roleName, roleData] of Object.entries(requiredRoles)) {
    if (!rolesNames.includes(roleName)) {
      const role = await guild.roles.create({
        name: roleName,
        color: roleData.color,
        mentionable: false,
      });

      await role.setIcon('./assets/vatsim.png');
    }
  }

  return true;
}

export const initRoleAssignmentsModule = async (client, guild) => {
  let runningTimeouts = [];

  await verifyRequiredRolesExisting(guild);

  const setMemberRole = async (member) => {
    console.log(`[ROLES] Checking pilot ${member.user.username} hours on VATSIM`);

    let networkPilotHours = await member.getNetworkPilotTime();
    if (networkPilotHours === null) {
      console.log(`[ROLES] Failed to fetch ${member.user.username} hours on VATSIM`);
      return;
    }

    let reachedNewRecord = false;
    let assignedRole = null;
    let lastHighestRole = null;

    let currentlyAssignedVatsimRole = member.roles.cache.filter(role => role.name.startsWith('P:'))
    currentlyAssignedVatsimRole = currentlyAssignedVatsimRole.map(role => Number(role.name.match(/\d+/)[0]))[0];

    for (const [roleName] of Object.entries(requiredRoles)) {
      const hoursFromRoleName = Number(roleName.match(/\d+/)[0]);

      if (networkPilotHours >= hoursFromRoleName) {
        lastHighestRole = hoursFromRoleName;
        assignedRole = roleName;
      }
    }

    if (currentlyAssignedVatsimRole !== lastHighestRole) {
      const rolesToRemove = member.roles.cache.filter(role => role.name.startsWith('P:'));
      if (rolesToRemove) {
        await member.roles.remove(rolesToRemove);
      }

      const roleToAdd = guild.roles.cache.find(role => role.name === assignedRole);

      if (roleToAdd) {
        await member.roles.add(roleToAdd);
      }

      if (currentlyAssignedVatsimRole < lastHighestRole) {
        reachedNewRecord = true;
      }
    }

    if (reachedNewRecord) {
      const channel = guild.channels.cache.get(BOT_MESSAGES_ID);

      `Pilot <@${member.user.id}> has reached a ceiling of more than ${Number(assignedRole.match(/\d+/)[0])} hours on VATSIM, so has been assigned to a new role. Congratulations! 🥳`

      const embed = new EmbedBuilder()
        .setTitle(locales[LANGUAGE].title)
        .setDescription(locales[LANGUAGE].message.format(`<@${member.user.id}>`, Number(assignedRole.match(/\d+/)[0])))
        .setColor(requiredRoles[assignedRole].color)
        .setImage(requiredRoles[assignedRole].banner);

      channel.send({ embeds: [embed] });
    }

    runningTimeouts[member] = setTimeout(() => setMemberRole(member), Math.floor(Math.random() * 1800000) + 1800000);
  }

  client.on('guildMemberUpdate', async (oldMember, newMember) => {
    if (oldMember.getNetworkCID() !== null && newMember.getNetworkCID() === null) {
      console.log(`[ROLES] Pilot ${newMember.user.username} has removed VATSIM CID`);

      const rolesToRemove = newMember.roles.cache.filter(role => role.name.startsWith('P:'));
      await newMember.roles.remove(rolesToRemove);

      clearTimeout(runningTimeouts[oldMember]);
      delete runningTimeouts[oldMember];

      return;
    }

    if (oldMember.getNetworkCID() === null && newMember.getNetworkCID() !== null) {
      console.log(`[ROLES] Pilot ${newMember.user.username} has added VATSIM CID`);

      setMemberRole(newMember);

      return;
    }

    if (oldMember.getNetworkCID() !== newMember.getNetworkCID()) {
      console.log(`[ROLES] Pilot ${newMember.user.username} has changed VATSIM CID`);

      const rolesToRemove = newMember.roles.cache.filter(role => role.name.startsWith('P:'));
      await newMember.roles.remove(rolesToRemove);

      clearTimeout(runningTimeouts[oldMember]);
      delete runningTimeouts[oldMember];

      setMemberRole(newMember);

      return;
    }
  });

  guild.members.cache.map(async member => {
    if (member.user.bot) { return; }
    if (member.getNetworkCID() === null) {
      const rolesToRemove = member.roles.cache.filter(role => role.name.startsWith('P:')).map(role => role);
      await member.roles.remove(rolesToRemove);

      return;
    }

    setMemberRole(member);
  });

  console.log('[INFO] Role assignments module initialized');
}