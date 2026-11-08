// Optional PM2 process definition. Configure the environment and build the
// frontend before starting it. No credentials belong in this file.
const path = require('node:path');
module.exports = {
    apps: [
        { name: 'weddingboys-api', cwd: path.join(__dirname, 'Backend'), script: 'app.js',
            instances: 1, autorestart: true, restart_delay: 3000, env: { NODE_ENV: 'production' } },
        { name: 'weddingboys-media-worker', cwd: path.join(__dirname, 'Backend'), script: 'worker.js',
            instances: 1, autorestart: true, restart_delay: 3000, kill_timeout: 600000,
            env: { NODE_ENV: 'production' } },
        { name: 'weddingboys-web', cwd: path.join(__dirname, 'Next-Frontend'),
            script: 'node_modules/next/dist/bin/next', args: 'start --port 3000',
            instances: 1, autorestart: true, restart_delay: 3000, env: { NODE_ENV: 'production' } },
    ],
};
