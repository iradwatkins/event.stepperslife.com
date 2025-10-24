module.exports = {
  apps: [{
    name: 'events-stepperslife',
    script: 'npm',
    args: 'start',
    cwd: '/root/websites/events-stepperslife',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3004
    },
    error_file: '/root/websites/events-stepperslife/logs/pm2-error.log',
    out_file: '/root/websites/events-stepperslife/logs/pm2-out.log',
    log_file: '/root/websites/events-stepperslife/logs/pm2-combined.log',
    time: true,
    merge_logs: true
  }]
};
