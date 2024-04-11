export const initRoleAssignmentsModule = (guild) => {
  guild.members.cache.forEach(member => {
    if (member.user.bot) { return };
    if (member.getNetworkCID() === null) { return };

    console.log(`Assigning roles to ${member.displayName}`)
  });
}
