// tslint:disable-next-line:import-name-case-insensitive
const musterPackage = require('@dws/muster/package.json');
// tslint:disable-next-line:import-name-case-insensitive
const musterReplPackage = require('../../package.json');

export default function showReplInformation() {
  console.log(`Muster version: ${(musterPackage as any).version}`);
  console.log(`Muster REPL version: ${(musterReplPackage as any).version}\n`);
}
