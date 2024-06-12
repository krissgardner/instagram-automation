const AdsPowerManager = require("./AdsPowerManager");
const credentials = require("../storage/credentials.json");

const { adsPowerEndpoint, adsPowerApiKey } = credentials;
const adsPowerManager = new AdsPowerManager(adsPowerEndpoint, adsPowerApiKey);

module.exports = { adsPowerManager };
