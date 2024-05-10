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

async function fetchData(url) {
  let retries = 3;

  while (retries > 0) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      return await response.json();
    } catch (error) {
      retries--;

      if (retries === 0) {
        throw error;
      }

      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
}

GuildMember.prototype.getNetworkPilotTime = async function () {
  try {
    if (this.getNetworkCID() === null) { return null; }

    const networkCID = this.getNetworkCID();

    const data = await fetchData(`https://api.vatsim.net/v2/members/${networkCID}/stats`);
    const dataSecond = await fetchData(`https://api.vatsim.net/v2/members/${networkCID}/history`);

    if (data && dataSecond.count !== 0) {
      if (!additionalTime[networkCID]) {
        additionalTime[networkCID] = {};
      }

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
            additionalTime[memberCID][memberCallsign] = parseFloat(hoursDifference);
          }

          if (additionalTime[memberCID][memberCallsign] !== hoursDifference) {
            additionalTime[memberCID][memberCallsign] += parseFloat(hoursDifference);
          }
        }
      }

      console.log(`[ROLES] Fetched ${this.user.username} hours on VATSIM / ${data.pilot} + ${getSumOfAdditionalTime(networkCID)} (${data.pilot + getSumOfAdditionalTime(networkCID)})`);

      return data.pilot + getSumOfAdditionalTime(networkCID);
    } else {
      return null;
    }
  } catch (error) {
    console.error(`[ROLES] Error fetching data from VATSIM API for ${this.user.username}: ${error}`);

    return null;
  }
}


String.prototype.format = function () {
  let args = arguments;

  return this.replace(/{(\d+)}/g, function (match, number) {
    return typeof args[number] != 'undefined' ? args[number] : match;
  });
};
