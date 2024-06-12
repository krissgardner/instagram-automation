const DBManager = require("./DBManager");
const {join} = require("node:path");

const storagePath = join(__dirname, "./storage.json");
const dbManager = new DBManager(storagePath);

dbManager.checkIntegrity()

module.exports = dbManager;
