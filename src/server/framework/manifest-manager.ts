import fs from 'fs';
import path from 'path';

import { IS_DEV, LOAD_CLIENT, WEBPACK_PORT } from '../config';

function getManifestFromWebpack(): Promise<string> {
	return new Promise((resolve, reject) => {
		console.log('MANIFEST');
		// eslint-disable-next-line @typescript-eslint/no-var-requires, import/no-extraneous-dependencies, global-require
		const request = require('request');
		request.get(
			`http://localhost:${WEBPACK_PORT}/statics/manifest.json`,
			{},
			(err, data) => (err ? reject(err) : resolve(data.body)),
		);
	});
}

let manifestStrCache: string;

export async function getManifest(): Promise<unknown> {
	let manifestStr: string;
	if (IS_DEV && LOAD_CLIENT) {
		// load from webpack dev server
		manifestStr = await getManifestFromWebpack();
	} else if (manifestStrCache) {
		manifestStr = manifestStrCache;
	} else {
		// read from file system
		manifestStr = fs
			.readFileSync(
				path.join(process.cwd(), 'dist', 'statics', 'manifest.json'),
				'utf-8',
			)
			.toString();
		manifestStrCache = manifestStr;
	}

	const manifest = JSON.parse(manifestStr);
	return manifest;
}
