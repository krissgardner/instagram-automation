function shuffle(array) {
  const result = [...array];
  let index = result.length;
  let randIndex;

  while (index !== 0) {
    randIndex = Math.floor(Math.random() * index);
    index--;

    // And swap it with the current element.
    [result[index], result[randIndex]] = [result[randIndex], result[index]];
  }

  return result;
}

async function waitUntil(condition) {
  return await new Promise((resolve) => {
    const interval = setInterval(() => {
      if (condition()) {
        resolve();
        clearInterval(interval);
      }
    }, 1000);
  });
}

function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const setupProcess = () => {
  process.stdin.resume();

  function exitHandler(options, exitCode) {
    if (exitCode || exitCode === 0) {
      console.log(`Exited with code ${exitCode}`);
    }
    if (options?.exit) {
      process.exit();
    }
  }

  process.on("uncaughtException", (error) => {
    console.error("Unhandled exception:", error);
  });

  process.on("exit", exitHandler.bind(null));
  process.on("SIGINT", exitHandler.bind(null, { exit: true }));
  process.on("SIGUSR1", exitHandler.bind(null, { exit: true }));
  process.on("SIGUSR2", exitHandler.bind(null, { exit: true }));
};

module.exports = { shuffle, waitUntil, delay, setupProcess, getRandomNumber };
