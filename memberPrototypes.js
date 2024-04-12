import { GuildMember } from 'discord.js';

GuildMember.prototype.getNetworkCID = function () {
  const regex = /\[(\d+)\]/;
  const match = this.displayName.match(regex);

  return match ? match[1] : null;
}

GuildMember.prototype.getNetworkPilotTime = async function () {
  console.log(1);
  if (this.getNetworkCID() === null) { return null; }
  console.log(2);

  const networkCID = this.getNetworkCID();
  console.log(networkCID);

  fetch(`https://api.vatsim.net/v2/members/${networkCID}/stats`)
    .then(response => response.json())
    .then(data => {
      console.log(data.pilot);
    });
}