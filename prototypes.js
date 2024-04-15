import { GuildMember } from 'discord.js';

GuildMember.prototype.getNetworkCID = function () {
  const regex = /\[(\d+)\]/;
  const match = this.displayName.match(regex);

  return match ? match[1] : null;
}

let additionalTime = {}

setInterval(async () => {
  if (Object.keys(additionalTime).length === 0) { return; }

  for (const [networkCID] of Object.entries(additionalTime)) {
    const response = await fetch(`https://api.vatsim.net/v2/members/${networkCID}/history`);
    const data = await response.json();

    if (!data) { return; }

    for (const item of data.items) {
      const memberCID = item.vatsim_id;
      const memberCallsign = item.callsign;

      const startTime = new Date(item.start);
      const endTime = item.end === null ? new Date() : new Date(item.end);

      const today = new Date();
      if (endTime.toDateString() !== today.toDateString()) { continue; }

      const timeDifference = endTime - startTime;
      const hoursDifference = timeDifference / 36000;

      if (additionalTime[memberCID]) {
        if (!additionalTime[memberCID][memberCallsign]) {
          additionalTime[memberCID][memberCallsign] = hoursDifference;
        }

        if (additionalTime[memberCID][memberCallsign] !== hoursDifference) {
          additionalTime[memberCID][memberCallsign] = hoursDifference;
        }
      }
    }
  };
}, 60000);

const getSumOfAdditionalTime = (networkCID) => {
  let sum = 0;

  for (const [callsign, hours] of Object.entries(additionalTime[networkCID])) {
    sum += Number(hours);
  }

  return Math.round(sum * 100) / 100;
}

GuildMember.prototype.getNetworkPilotTime = async function () {
  if (this.getNetworkCID() === null) { return null; }

  const networkCID = this.getNetworkCID();

  const response = await fetch(`https://api.vatsim.net/v2/members/${networkCID}/stats`);
  const data = await response.json();

  if (!data?.pilot) { return null; }

  if (!additionalTime[networkCID]) {
    additionalTime[networkCID] = {};
  }

  console.log(`[ROLES] Fetched ${this.user.username} hours on VATSIM / ${data.pilot} + ${getSumOfAdditionalTime(networkCID)} (${data.pilot + getSumOfAdditionalTime(networkCID)})`);

  return data.pilot + getSumOfAdditionalTime(networkCID);
}

String.prototype.format = function () {
  let args = arguments;

  return this.replace(/{(\d+)}/g, function (match, number) {
    return typeof args[number] != 'undefined' ? args[number] : match;
  });
};