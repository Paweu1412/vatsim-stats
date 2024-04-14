import { GuildMember } from 'discord.js';

GuildMember.prototype.getNetworkCID = function () {
  const regex = /\[(\d+)\]/;
  const match = this.displayName.match(regex);

  return match ? match[1] : null;
}

let lastHours = [];

GuildMember.prototype.getNetworkPilotTime = async function () {
  if (this.getNetworkCID() === null) { return null; }

  const networkCID = this.getNetworkCID();

  const response = await fetch(`https://api.vatsim.net/v2/members/${networkCID}/stats`);
  const data = await response.json();

  if (!data?.pilot) { return null; }

  lastHours[this.user.username] = data.pilot;
  console.log(`[ROLES] Fetched ${this.user.username} hours on VATSIM - ${data.pilot} / ${data.pilot - lastHours[this.user.username] || 0}h difference since last check`);

  return data.pilot;
}

String.prototype.format = function () {
  let args = arguments;

  return this.replace(/{(\d+)}/g, function (match, number) {
    return typeof args[number] != 'undefined' ? args[number] : match;
  });
};