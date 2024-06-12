const { join } = require("node:path");
const JSONdb = require("simple-json-db");

class DBManager extends JSONdb {
  checkIntegrity() {
    // Check bots
    const bots = this.get("bots");
    if (!bots) {
      throw new Error(`Bots not set!`);
    }
    const { config, profiles } = bots;

    if (!config) {
      throw new Error(`Config not found!`);
    }
    if (!Array.isArray(profiles)) {
      throw new Error(`Profiles not array!`);
    }

    profiles.forEach((bot) => {
      const count = bots.filter((b) => b.username === bot.username).length;
      if (count !== 1) {
        throw new Error(`Username duplicate found: ${bot.username}`);
      }
    });

    // Check credentials
    const credentials = this.get("credentials");
    if (!credentials) {
      throw new Error(`Credentials not set!`);
    }
  }

  metaKey(username) {
    return `meta-${username}`;
  }

  getBotMeta(username) {
    const key = this.metaKey(username);
    const meta = this.get("meta") || {}; // Empty Meta
    const botMeta = meta[key] || {}; // Default data
    return botMeta;
  }

  patchBotMeta(username, payload) {
    const key = this.metaKey(username);
    const botMeta = this.getBotMeta(username);

    let result = {
      ...botMeta,
      ...payload,
    };

    const meta = this.get("meta") || {};
    meta[key] = botMeta;
    this.set("meta", meta);

    return result;
  }
}

module.exports = DBManager;
