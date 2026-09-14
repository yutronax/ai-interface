module.exports = {
  apps: [
    {
      name: "ai-interface",
      script: ".output/server/index.mjs",
      instances: 1,
      exec_mode: "cluster",

      // AC-3: Restart limits and exponential backoff
      max_restarts: 10,
      min_uptime: "30s",
      exponential_backoff_restart_delay: 100,

      // AC-7: Log rotation and file paths
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",

      // Environment variables (optional — can be overridden at runtime)
      env: {
        NODE_ENV: "production",
        PORT: 8081,
      },
    },
  ],
};
