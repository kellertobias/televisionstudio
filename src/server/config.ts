import path from 'path';
import fs from 'fs';

const IS_DEV = process.env.NODE_ENV !== 'production';
const LOAD_CLIENT = process.env.LOAD_CLIENT === '1';

const packageJsonPath = path.join(process.cwd(), 'package.json');
const rawPackageJson = fs.readFileSync(packageJsonPath).toString();
const PackageJson = JSON.parse(rawPackageJson);
const { version: VERSION } = PackageJson;

// server
const SERVER_PORT = process.env.PORT || 3000;
const WEBPACK_PORT = 8085; // For dev environment only

export { LOAD_CLIENT, IS_DEV, VERSION, SERVER_PORT, WEBPACK_PORT };
