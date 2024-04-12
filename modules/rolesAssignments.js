import { EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const BOT_MESSAGES_ID = process.env.BOT_MESSAGES_ID;

const requiredRoles = {
  'P: 100+': { 'color': 'Aqua' },
  'P: 200+': { 'color': 'Aqua' },
  'P: 500+': { 'color': 'White' },
  'P: 1000+': { 'color': 'Aqua' },
  'P: 2500+': { 'color': 'Aqua' },
  'P: 5000+': { 'color': 'Aqua' },
}

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

  return true;
}

export const initRoleAssignmentsModule = async (guild) => {
  await verifyRequiredRolesExisting(guild);
  guild.members.cache.forEach(async member => {
    if (member.user.bot) { return; }
    if (member.getNetworkCID() === null) { return; }

    let reachedNewRole = true;

    const networkPilotHours = await member.getNetworkPilotTime();

    let assignedRole = null;
    for (const [roleName] of Object.entries(requiredRoles)) {
      const hours = Number(roleName.match(/\d+/)[0]);

      if (networkPilotHours >= hours) {
        if (assignedRole) {
          const oldRole = guild.roles.cache.find(role => role.name === assignedRole);
          oldRole && member.roles.remove(oldRole);
        }

        assignedRole = roleName;
      }
    }

    for (const [roleName] of Object.entries(requiredRoles)) {
      const hours = Number(roleName.match(/\d+/)[0]);
      if (networkPilotHours < hours && member.roles.cache.some(role => role.name === roleName)) {
        member.roles.remove(guild.roles.cache.find(role => role.name === roleName));
        reachedNewRole = true;
      }
    }

    if (assignedRole && !member.roles.cache.some(role => role.name === assignedRole)) {
      member.roles.add(guild.roles.cache.find(role => role.name === assignedRole));
    }

    if (reachedNewRole) {
      console.log('yes');
      const channel = guild.channels.cache.get(BOT_MESSAGES_ID);

      const embed = new EmbedBuilder()
        .setTitle('Pilot promotion!!!')
        .setDescription(`Pilot <@${member.user.id}> has reached a ceiling of more than ${Number(assignedRole.match(/\d+/)[0])} hours on VATSIM, so has been assigned to a new role. Congratulations!`)
        .setColor(requiredRoles[assignedRole].color)
        .setTimestamp()

      channel.send({ embeds: [embed] });
    }
  });
}
