import path from 'path';

import express from 'express';

import { Engine } from '@/server/engine';

import { apiRouter } from './routes';
import * as config from './config';
import { pagesRouter, staticsRouter } from './framework/essentials';

console.log(`*******************************************`);
console.log('PID:', process.pid);
console.log(`VERSION: ${config.VERSION}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`LOAD_CLIENT: ${config.LOAD_CLIENT}`);
console.log(`PORT: ${config.SERVER_PORT}`);
console.log(`*******************************************`);

const app = express();

app.set('view engine', 'ejs');

const engine = new Engine(app);
engine
	.start()
	.then((data) => {
		app.use('/assets', express.static(path.join(process.cwd(), 'assets')));
		app.use('/api', apiRouter());
		app.use(staticsRouter());
		app.use(pagesRouter());

		app.listen(config.SERVER_PORT, () => {
			console.log(
				`App listening on http://localhost:${config.SERVER_PORT}\n\n\n`,
			);
		});
		return data;
	})
	.catch((error) => {
		console.error(error);
	});

process.on('SIGTERM', () => {
	console.log('STOPPING... =================');
	engine.stop();
	console.log('STOPPED. EXITING... =========\n\n\n');
	process.exit();
});
