/**
 * PM2 Ecosystem Configuration for SteppersLife Events
 *
 * Production deployment configuration for dedicated IP/VPS
 *
 * Usage:
 *   pm2 start ecosystem.config.js --env production
 *   pm2 restart events-stepperslife
 *   pm2 logs events-stepperslife
 *   pm2 monit
 *   pm2 save
 *   pm2 startup (run once to enable auto-start on reboot)
 */

module.exports = {
  apps: [
    {
      // Application name
      name: "events-stepperslife",

      // Script to run
      script: "npm",
      args: "start",

      // Application directory (update this path to match your VPS)
      cwd: "/root/websites/events-stepperslife",

      // Execution mode: 'fork' or 'cluster'
      exec_mode: "fork",

      // Number of instances (1 for fork mode, or 'max' for cluster mode)
      instances: 1,

      // Auto-restart configuration
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",

      // Restart limits
      max_restarts: 10,
      min_uptime: "10s",
      restart_delay: 4000,

      // Environment variables
      env: {
        NODE_ENV: "production",
        PORT: 3004,
      },

      // Logging configuration
      error_file: "/root/websites/events-stepperslife/logs/pm2-error.log",
      out_file: "/root/websites/events-stepperslife/logs/pm2-out.log",
      log_file: "/root/websites/events-stepperslife/logs/pm2-combined.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      time: true,
      merge_logs: true,

      // Process management
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],

  /**
   * Deployment configuration (optional - for PM2 deploy commands)
   * Update 'YOUR_DEDICATED_IP' with your actual server IP
   */
  deploy: {
    production: {
      user: "root",
      host: "YOUR_DEDICATED_IP",
      ref: "origin/main",
      repo: "https://github.com/iradwatkins/event.stepperslife.com.git",
      path: "/root/websites/events-stepperslife",
      "post-deploy":
        "npm install && npm run build && pm2 reload ecosystem.config.js --env production",
    },
  },
};
