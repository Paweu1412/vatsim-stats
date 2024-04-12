const verifyRequiredRolesExisting = async (guild) => {
  const requiredRoles = {
    '100+': { 'color': 'Aqua' },
    '200+': { 'color': 'Aqua' },
    '500+': { 'color': 'Aqua' },
    '1000+': { 'color': 'Aqua' },
    '2500+': { 'color': 'Aqua' },
    '5000+': { 'color': 'Aqua' },
  }

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

    await member.getNetworkPilotTime();
  });
}
