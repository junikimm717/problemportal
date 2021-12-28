import express from 'express';
import { Response } from '../models/response';
import render, { error } from '../render';
import { notificationEmitter } from '../socket';
import { ProblemSetRequest } from './problem';
import { uuidExists } from './problem';

const router = express.Router();

/*
Preprocessing Middleware
*/

// if we are getting the answer sheet, we should set all response stuff.
const setResponseAndCorrect: express.RequestHandler = async (
	req: ProblemSetRequest,
	res,
	next
) => {
	try {
		const r = await Response.findOne({
			for: req.params.uuid,
			userId: (req.user as any).googleId,
		});
		if (r) {
			req.response = r.response;
			req.correct = r.correct;
		}
	} catch (e) {
		console.error(e);
		error(req, res, 500);
		return;
	}
	next();
};

/*
Set request answers and validate them.
*/
const validateAnswers: express.Handler = (
	req: ProblemSetRequest,
	res,
	next
) => {
	const response = [] as string[];
	for (let i = 0; ; i++) {
		const answer = req.body['answer_' + i];
		if (typeof answer !== 'string') {
			break;
		}
		response.push(answer.replace(/\s+/g, ''));
	}
	if (req.problemset) {
		const answers = req.problemset!.answers;
		if (answers.length !== response.length) {
			error(req, res, 400);
			return;
		}
		const correct = [];
		for (let i = 0; i < answers.length; i++) {
			correct.push(response[i] === answers[i]);
		}
		req.correct = correct;
		req.response = response;
		next();
	} else {
		error(req, res, 500);
		return;
	}
};

/*

Actual Routes

*/
router.get(
	'/:uuid([0-9,a-f]{24})',
	uuidExists,
	setResponseAndCorrect,
	async (req: ProblemSetRequest, res) => {
		render(req, res, 'pages/view', {
			correct: req.correct,
			response: req.response,
			statements: req.problemset?.statements,
			name: req.problemset?.name,
			by: req.problemset?.by,
			csrfToken: req.csrfToken(),
		});
	}
);

router.post(
	'/:uuid([0-9,a-f]{24})',
	uuidExists,
	validateAnswers,
	async (req: ProblemSetRequest, res) => {
		try {
			const u = req.user as any;
			const doc = await Response.findOneAndUpdate(
				{ for: req.params.uuid, userId: u.googleId, username: u.username },
				{ response: req.response, correct: req.correct },
				{ upsert: true, new: true }
			);
			notificationEmitter.emit('response', req.params.uuid, doc);
		} catch (e) {
			console.error(e);
			error(req, res, 500);
			return;
		}
		render(req, res, 'pages/view', {
			correct: req.correct,
			response: req.response,
			statements: req.problemset?.statements,
			name: req.problemset?.name,
			by: req.problemset?.by,
			csrfToken: req.csrfToken(),
		});
	}
);

export default router;
