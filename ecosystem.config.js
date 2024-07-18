module.exports = [
  {
    script: 'dist/main.js',
    name: 'okami-worker',
    exec_mode: 'cluster',
    instances: 4,
    cron_restart: '*/30 * * * *',
  },
];
