const { adsPowerManager } = require("../adsPower");
const dbManager = require("../db");
const {
  IDLE,
  STARTING,
  WAITING,
  WORKING,
  ERROR,
  CLOSING,
} = require("../constants");

class Action {
  constructor({
    key,
    params = [],
    retries = 0,
    priority = 0,
    ignoreErrors = false,
  }) {
    this.key = key;
    this.params = params;
    this.retries = retries;
    this.priority = priority;
    this.ignoreErrors = ignoreErrors;
  }
}

class Bot {
  constructor({ username, password, ads_power_profile_id }) {
    if (!ads_power_profile_id) {
      throw new Error(`"ads_power_profile_id" is required!`);
    }

    // DB data
    this.username = username;
    this.password = password;
    this.ads_power_profile_id = ads_power_profile_id;

    // Worker data
    this.status = IDLE;
    this.browser = undefined;
    this.page = undefined;
    this.actions = [];
    this.interval = undefined;
    this.autoClose = undefined;
  }

  addAction(key, options) {
    if (this[key] === undefined) {
      throw new Error(`${key} does not exist!`);
    }

    const action = new Action({ key, ...options });
    this.actions.push(action);
  }

  async initBrowser() {
    const browser = await adsPowerManager.getBrowser(this.ads_power_profile_id);
    if (!browser) {
      return;
    }

    const context = browser.defaultBrowserContext();
    await context.overridePermissions("https://www.instagram.com/", [
      "geolocation",
      "notifications",
    ]);

    this.browser = browser;

    return browser;
  }

  async closeBrowser() {
    console.log("CLOSING", this.username);
    return await this.browser?.close();
  }

  async startTaskWatcher() {
    this.interval = setInterval(async () => {
      switch (this.status) {
        case IDLE: {
          // Start bot when it has actions
          if (this.actions.length !== 0) {
            this.status = STARTING;

            try {
              const botRunning = await this.init();
              if (botRunning) {
                this.status = WAITING;
              } else {
                this.status = ERROR;
              }
            } catch (e) {
              this.status = ERROR;
            }
          }

          return;
        }
        case STARTING: {
          return;
        }
        case WORKING: {
          return;
        }
        case CLOSING: {
          return;
        }
        case ERROR: {
          clearInterval(this.interval);
          this.interval = undefined;
          await this.closeBrowser();
          return;
        }
      }

      // WAITING
      if (this.actions.length === 0) {
        if (this.autoClose === undefined) {
          this.autoClose = setTimeout(async () => {
            this.status = CLOSING;
            await this.closeBrowser();
            this.status = IDLE;
          }, 5 * 1000);
          console.log(`CLOSING ${this.username} in 5 seconds...`);
        }
        return;
      }

      if (this.autoClose) {
        clearTimeout(this.autoClose);
        this.autoClose = undefined;

        console.log(`ABORT CLOSE ${this.username}`, this.username);
      }

      const priorities = this.actions.map((a) => a.priority);
      const highestPriority = Math.min(...priorities);
      const actionIndex = this.actions.findIndex(
        (a) => a.priority === highestPriority,
      );
      const [action] = this.actions.splice(actionIndex, 1);

      try {
        this.status = WORKING;
        console.log(
          `${this.username}: (${action.retries}) ${action.key} started!`,
        );

        // Call action
        await this[action.key](...action.params);

        console.log(
          `${this.username}: (${action.retries}) ${action.key} done!`,
        );
      } catch (e) {
        console.log(`${this.username}: ${String(e)}`);

        if (action.retries) {
          this.addAction(action.key, {
            retries: action.retries - 1,
            priority: action.priority - 1,
            params: action.params,
            ignoreErrors: action.ignoreErrors,
          });
        } else if (!action.ignoreErrors) {
          this.status = ERROR;
        }
      }

      if (this.status === WORKING) {
        this.status = WAITING;
      }
    }, 1000);

    console.log(`LISTENING ${this.username}`);
  }

  async init() {
    console.log(`INIT ${this.username}`);

    // Open browser
    const browser = await this.initBrowser();
    if (!browser) {
      return false;
    }

    // Run bot checks
    // this.addAction("checkIfLoggedIn", { retries: 3, priority: -50 });

    return true;
  }

  get meta() {
    return dbManager.getBotMeta(this.username);
  }

  patchMeta(payload) {
    return dbManager.patchBotMeta(this.username, payload);
  }

  // ACTION DEFINITIONS

  async checkIfLoggedIn() {
    if (this.page === undefined) {
      this.page = await this.browser.newPage();
    }

    // TBD

    this.addAction("logIn", { retries: 3, priority: -100 });
  }

  async logIn() {
    if (this.page === undefined) {
      this.page = await this.browser.newPage();
    }

    // TBD

    // Wait for redirect or fail
    await this.page.waitForNavigation({ timeout: 10000 });
  }

  async sendMessage(profileUrl, message) {
    if (this.page === undefined) {
      this.page = await this.browser.newPage();
    }

    await this.page.goto(profileUrl);

    const messageButtonSelector =
      "#mount_0_0_3y > div > div > div.x9f619.x1n2onr6.x1ja2u2z > div > div > div.x78zum5.xdt5ytf.x1t2pt76.x1n2onr6.x1ja2u2z.x10cihs4 > div:nth-child(2) > div > div.x1gryazu.xh8yej3.x10o80wk.x14k21rp.x17snn68.x6osk4m.x1porb0y > section > main > div > header > section.x1xdureb.x1agbcgv.x1wo17tc.xieb3on.x6ikm8r.x10wlt62.xlrpkbc > div > div > div.x9f619.xjbqb8w.x78zum5.x168nmei.x13lgxp2.x5pf9jr.xo71vjh.x1n2onr6.x1plvlek.xryxfnj.x1c4vz4f.x2lah0s.x1q0g3np.xqjyukv.x1qjc9v5.x1oa3qoh.x1nhvcw1 > div > div.x9f619.xjbqb8w.x78zum5.x168nmei.x13lgxp2.x5pf9jr.xo71vjh.x1n2onr6.x6ikm8r.x10wlt62.x1iyjqo2.x2lwn1j.xeuugli.xdt5ytf.xqjyukv.x1qjc9v5.x1oa3qoh.x1nhvcw1 > div";

    await this.page.waitForSelector(messageButtonSelector, { timeout: 5000 });
    await this.page.click(messageButtonSelector, { timeout: 5000 });
  }
}

module.exports = Bot;
