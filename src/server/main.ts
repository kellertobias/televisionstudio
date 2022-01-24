import path from 'path';

import express from 'express';

import { Engine } from '@/server/engine';

import { apiRouter } from './routes';
import * as config from './config';
import { pagesRouter, staticsRouter } from './framework/essentials';

console.log(`*******************************************`);
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`config: ${JSON.stringify(config, null, 2)}`);
console.log(`*******************************************`);

const app = express();
const engine = new Engine();

engine.start();

app.set('view engine', 'ejs');

app.use('/assets', express.static(path.join(process.cwd(), 'assets')));
app.use('/api', apiRouter());
app.use(staticsRouter());
app.use(pagesRouter());

app.listen(config.SERVER_PORT, () => {
	console.log(`App listening on port ${config.SERVER_PORT}!`);
});

process.on('SIGTERM', () => {
	engine.stop();
	console.log('STOPPED =====================');
});
