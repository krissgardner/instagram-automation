const { BotManager, Bot } = require("./bots");
const { waitUntil, setupProcess } = require("./utils");

setupProcess();

(async function () {
  const botManager = new BotManager();
  // Start watchers for all bots
  await botManager.startBots();

  await botManager.assignDirectMessages();

  await waitUntil(() => {
    return botManager.getRunningBots().length === 0;
  });

  console.log("EXITING");
  process.exit();
})();
