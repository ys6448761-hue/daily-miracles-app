/**
 * jest.config.js
 *
 * NODE_OPTIONS=--experimental-vm-modules is required for Jest to load
 * native ESM modules (dreamtown-frontend src files with "type":"module").
 * Run tests via: npm test  OR  node --experimental-vm-modules node_modules/.bin/jest
 */
module.exports = {
  testEnvironment: 'node',
};
