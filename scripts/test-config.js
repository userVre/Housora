const packageManifest = require('../package.json');

const port = Number(packageManifest.config?.testPort);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('package.json config.testPort must be an integer from 1 to 65535.');
}

const defaultOrigin = `http://127.0.0.1:${port}`;

function siteOrigin(environment = process.env) {
  return (environment.SITE_URL || environment.LOCAL_ORIGIN || environment.BUILD_ORIGIN || defaultOrigin)
    .replace(/\/$/, '');
}

module.exports = { defaultOrigin, port, siteOrigin };
