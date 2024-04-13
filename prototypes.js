import { GuildMember } from 'discord.js';

GuildMember.prototype.getNetworkCID = function () {
  const regex = /\[(\d+)\]/;
  const match = this.displayName.match(regex);

  return match ? match[1] : null;
}

GuildMember.prototype.getNetworkPilotTime = async function () {
  if (this.getNetworkCID() === null) { return null; }

  const networkCID = this.getNetworkCID();

  const response = await fetch(`https://api.vatsim.net/v2/members/${networkCID}/stats`);
  const data = await response.json();

  return data.pilot;
}

String.prototype.format = function () {
  let args = arguments;

  return this.replace(/{(\d+)}/g, function (match, number) {
    return typeof args[number] != 'undefined' ? args[number] : match;
  });
};