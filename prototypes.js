import { GuildMember } from 'discord.js';

GuildMember.prototype.getNetworkCID = function () {
  const regex = /\[(\d+)\]/;
  const match = this.displayName.match(regex);

  return match ? match[1] : null;
}

let additionalTime = {}

const getSumOfAdditionalTime = (networkCID) => {
  let sum = 0;

  for (const [callsign, hours] of Object.entries(additionalTime[networkCID])) {
    sum += Number(hours);
  }

  return sum;
}

GuildMember.prototype.getNetworkPilotTime = async function () {
  if (this.getNetworkCID() === null) { return null; }

  const networkCID = this.getNetworkCID();

  const response = await fetch(`https://api.vatsim.net/v2/members/${networkCID}/stats`);
  if (!response) { return null; }

  const data = await response.json();
  if (!data?.pilot) { return null; }

  if (!additionalTime[networkCID]) {
    additionalTime[networkCID] = {};
  }

  const responseSecond = await fetch(`https://api.vatsim.net/v2/members/${networkCID}/history`);
  if (!responseSecond) { return null; }

  const dataSecond = await responseSecond.json();
  if (!dataSecond) { return null; }

  for (const item of dataSecond.items) {
    const memberCID = item.vatsim_id;
    const memberCallsign = item.callsign;

    const startTime = new Date(item.start);
    const endTime = item.end === null ? new Date() : new Date(item.end);

    const today = new Date();
    if (endTime.toDateString() !== today.toDateString()) { continue; }

    const timeDifference = endTime - startTime;
    const hoursDifference = ((timeDifference / 1000) / 3600).toFixed(2);

    if (additionalTime[memberCID]) {
      if (!additionalTime[memberCID][memberCallsign]) {
        additionalTime[memberCID][memberCallsign] = hoursDifference;
      }

      if (additionalTime[memberCID][memberCallsign] !== hoursDifference) {
        additionalTime[memberCID][memberCallsign] = hoursDifference;
      }
    }
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
