import { GuildMember, User } from 'discord.js';

// Using function declaration
GuildMember.prototype.getNetworkCID = function () {
  const regex = /\[(\d+)\]/;
  const match = this.displayName.match(regex);

  if (match) {
    console.log(`User ${this.user.username} has CID: ${match[1]}`);
  }

  return match ? match[1] : null;
}

export const initRoleAssignmentsModule = (guild) => {
  guild.members.cache.forEach(member => {
    if (member.user.bot) { return };
    if (member.getNetworkCID() === null) { return };
  });
}
