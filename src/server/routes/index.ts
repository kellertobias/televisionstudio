import bodyParser from 'body-parser';
import { Router } from 'express';

export function apiRouter(): Router {
	const router = Router();
	router.use(bodyParser.json());

	router.get('/status', (req, res) => {
		res.json({
			timestamp: new Date(),
		});
	});

	return router;
}
