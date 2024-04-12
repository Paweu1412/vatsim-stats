import { EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const BOT_MESSAGES_ID = process.env.BOT_MESSAGES_ID;

const requiredRoles = {
  'P: 100+': { 'color': '#ffffff' },
  'P: 250+': { 'color': '#f4ebe6' },
  'P: 500+': { 'color': '#917070' },
  'P: 1000+': { 'color': '#d6d69c' },
  'P: 1500+': { 'color': 'Orange' },
  'P: 2500+': { 'color': 'Aqua' },
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
  await verifyRequiredRolesExisting(guild);

  const setMemberRole = async (member) => {
    console.log(`[ROLES] Checking pilot ${member.user.username} hours on VATSIM`);

    let networkPilotHours = await member.getNetworkPilotTime();
    let reachedNewRecord = false;
    let assignedRole = null;

    let currentlyAssignedVatsimRole = member.roles.cache.filter(role => role.name.startsWith('P:'))
    currentlyAssignedVatsimRole = currentlyAssignedVatsimRole.map(role => Number(role.name.match(/\d+/)[0]))[0];

    let lastHighestRole = null;

    for (const [roleName] of Object.entries(requiredRoles)) {
      const hoursFromRoleName = Number(roleName.match(/\d+/)[0]);

      if (networkPilotHours >= hoursFromRoleName) {
        lastHighestRole = hoursFromRoleName;
        assignedRole = roleName;
      }
    }

    if (currentlyAssignedVatsimRole !== lastHighestRole) {
      const rolesToRemove = member.roles.cache.filter(role => role.name.startsWith('P:'));
      await member.roles.remove(rolesToRemove);

      const roleToAdd = guild.roles.cache.find(role => role.name === assignedRole);
      await member.roles.add(roleToAdd);

      if (currentlyAssignedVatsimRole < lastHighestRole) {
        reachedNewRecord = true;
      }
    }

    if (reachedNewRecord) {
      const channel = guild.channels.cache.get(BOT_MESSAGES_ID);

      const embed = new EmbedBuilder()
        .setTitle(`Pilot's promotion!`)
        .setDescription(`Pilot <@${member.user.id}> has reached a ceiling of more than ${Number(assignedRole.match(/\d+/)[0])} hours on VATSIM, so has been assigned to a new role. Congratulations! 🥳`)
        .setColor(requiredRoles[assignedRole].color)
        .setImage('https://i.imgur.com/2CifDr3.gif')

      channel.send({ embeds: [embed] });
    }

    setInterval(() => setMemberRole(member), 3600000);
  }

  client.on('guildMemberUpdate', async (oldMember, newMember) => {
    if (oldMember.getNetworkCID() === null && newMember.getNetworkCID() !== null) {
      console.log(`[ROLES] Pilot ${newMember.user.username} has added VATSIM CID`);

      setMemberRole(newMember);
    }

    if (oldMember.getNetworkCID() !== null && newMember.getNetworkCID() === null) {
      console.log(`[ROLES] Pilot ${newMember.user.username} has removed VATSIM CID`);

      const rolesToRemove = newMember.roles.cache.filter(role => role.name.startsWith('P:'));
      await newMember.roles.remove(rolesToRemove);
    }
  });

  guild.members.cache.map(async member => {
    if (member.user.bot) { return; }
    if (member.getNetworkCID() === null) {
      // get roles
      if (member.user.username !== 'pavvciu') return;
      const rolesToRemove = member.roles.cache.filter(role => role.name.startsWith('P:')).map(role => role);
      await member.roles.remove(rolesToRemove);

      return;
    }

    setMemberRole(member);
  });

  console.log('[INFO] Role assignments module initialized');