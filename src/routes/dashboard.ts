import express from 'express';
import { isAdmin, loggedIn } from '../auth';
import { Response } from '../models/response';
import { Owner, ProblemSetRequest, uuidExists } from './problem';
import render, { error } from '../render';

const router = express.Router();

router.get('/', loggedIn, async (req, res) => {
	try {
		render(req, res, 'pages/dashboard', {
			admin: isAdmin((req.user as any).email),
		});
	} catch (e) {
		console.error(e);
		error(req, res, 500);
	}
});

router.get(
	'/responses/:uuid([0-9,a-f]{24})',
	uuidExists,
	Owner,
	async (req: ProblemSetRequest, res) => {
		try {
			const init = await Response.find({ for: req.params.uuid })
				.sort({ createdAt: -1 })
				.limit(10);
			render(req, res, 'pages/feed', {
				init,
				uuid: req.params.uuid,
				name: req.problemset?.name,
			});
		} catch (e) {
			console.error(e);
			error(req, res, 500);
		}
	}
);

export default router;
