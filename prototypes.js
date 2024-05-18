import { GuildMember } from 'discord.js';

GuildMember.prototype.getNetworkCID = function () {
  const regex = /\[(\d+)\]/;
  const match = this.displayName.match(regex);

  return match ? match[1] : null;
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
  let additionalTime = {};

  try {
    if (this.getNetworkCID() === null) { return null; }

    const networkCID = this.getNetworkCID();

    const data = await fetchData(`https://api.vatsim.net/v2/members/${networkCID}/stats`);
    const dataSecond = await fetchData(`https://api.vatsim.net/v2/members/${networkCID}/history`);

    if (data && dataSecond.count !== 0) {
      additionalTime[networkCID] = 0;

      for (const item of dataSecond.items) {
        const startTime = new Date(item.start);
        const endTime = item.end === null ? new Date() : new Date(item.end);
        const today = new Date();

        if (endTime.toDateString() !== today.toDateString()) { continue; }

        const timeDifference = endTime - startTime;
        const hoursDifference = parseFloat(((timeDifference / 1000) / 3600).toFixed(2));

        additionalTime[networkCID] += hoursDifference;
      }

      console.log(`[ROLES] Fetched ${this.user.username} hours on VATSIM / ${data.pilot} + ${additionalTime[networkCID]} (${data.pilot + additionalTime[networkCID]})`);

      return data.pilot + additionalTime[networkCID];
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
