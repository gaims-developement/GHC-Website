const { spawn } = require("node:child_process");

const isWindows = process.platform === "win32";
const npmCmd = isWindows ? "npm.cmd" : "npm";

const processes = [
  {
    name: "server",
    command: npmCmd,
    args: ["--prefix", "server", "run", "dev"],
  },
  {
    name: "client",
    command: npmCmd,
    args: ["--prefix", "client", "run", "dev"],
  },
];

const children = processes.map(({ name, command, args }) => {
  const child = isWindows
    ? spawn([command, ...args].join(" "), {
        stdio: "inherit",
        shell: true,
      })
    : spawn(command, args, {
        stdio: "inherit",
        shell: false,
      });

  child.on("exit", (code, signal) => {
    if (signal) {
      console.log(`[${name}] stopped with signal ${signal}`);
      return;
    }

    if (code !== 0 && code !== null) {
      console.error(`[${name}] exited with code ${code}`);
      stopAll(code);
    }
  });

  return child;
});

function stopAll(code = 0) {
  for (const child of children) {
    if (!child.killed) {
      child.kill();
    }
  }

  process.exit(code);
}

process.on("SIGINT", () => stopAll());
process.on("SIGTERM", () => stopAll());
