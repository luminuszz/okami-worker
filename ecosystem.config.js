module.exports = [
  {
    script: 'dist/main.js',
    name: 'okami-worker',
    exec_mode: 'cluster',
    instances: 4,
    exp_backoff_restart_delay: 100,
    cron_restart: '*/30 * * * *',
  },
];
