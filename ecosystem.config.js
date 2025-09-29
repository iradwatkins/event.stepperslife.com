module.exports = {
  apps: [{
    name: 'events-stepperslife',
    script: 'npm',
    args: 'run start',
    cwd: '/root/websites/events-stepperslife',
    env: {
      NODE_ENV: 'production',
      PORT: 3004
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
  }]
};