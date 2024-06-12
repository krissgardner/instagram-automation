const dbManager = require("../db");
const RedditBot = require("./Bot");
const { IDLE, ERROR } = require("../constants");
const { shuffle, waitUntil, getRandomNumber } = require("../utils");

class BotManager {
  constructor() {
    this.bots = {};
  }

  async startBots() {
    const profileList = dbManager.profiles.filter((profile) => {
      return !!profile.ads_power_profile_id;
    });

    // Init bots async
    await Promise.allSettled(
      profileList.map(async (data) => {
        const bot = new RedditBot(data);
        this.bots[bot.username] = bot;
        return bot.startTaskWatcher();
      }),
    );
  }

  getRunningBots() {
    return Object.values(this.bots).filter((bot) => {
      return ![IDLE, ERROR].includes(bot.status);
    });
  }

  getIdleBots() {
    return Object.values(this.bots).filter((bot) => {
      return bot.status === IDLE;
    });
  }

  *getBotGenerator() {
    const bots = shuffle(
      Object.values(this.bots).filter((b) => b.status !== ERROR),
    );
    for (let i in bots) {
      yield bots[i];
    }
  }

  async assignDirectMessages() {
    const accounts = []; // TODO: GET accounts from DB
    if (!accounts.length) {
      return;
    }

    const { config } = dbManager.bots;

    const generator = this.getBotGenerator();

    while (true) {
      const bot = generator.next().value;
      if (bot === undefined) {
        break;
      }

      await waitUntil(() => {
        return this.getRunningBots().length < dbManager.maxRunningBots;
      });

      do {
        // TODO: bot.addAction("doRandomActions");

        const noAccounts = getRandomNumber(config.minDM, config.maxDM);
        const selectedAccounts = accounts.splice(0, noAccounts);

        selectedAccounts.forEach((account) => {
          bot.addAction("sendMessage", {
            params: [account],
            retries: 1,
            ignoreErrors: true,
          });
        });
      } while (accounts.length > 0);
    }

    // TODO: Delete accounts from DB
  }
}

module.exports = BotManager;
