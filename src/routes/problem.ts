import express from 'express';
import { Admin, loggedIn } from '../auth';
import { ProblemSet } from '../models/problemset';
import { Response } from '../models/response';
import mongoose from 'mongoose';
import render, { error } from '../render';

const router = express.Router();
const ObjectId = mongoose.Types.ObjectId;

export interface ProblemSetRequest extends express.Request {
	problemset?: {
		name: string;
		by: string;
		authorId: string;
		statements: string[];
		answers: string[];
	};
	// whether the response was correct or not
	correct?: boolean[];
	// what the student actually put
	response?: string[];
}

export const isEmpty = (s: any) =>
	typeof s !== 'string' || s.replace(/\s+/, '').length == 0;

/*
Preprocessing middleware
*/

// validating if a uuid exists.
export const uuidExists: express.RequestHandler = async (
	req: ProblemSetRequest,
	res,
	next
) => {
	try {
		const set = await ProblemSet.findById(req.params.uuid).exec();
		if (!set) {
			error(req, res, 404);
			return;
		}
		req.problemset = set;
		next();
	} catch (e) {
		error(req, res, 500);
	}
};

// takes in post data from the form and turns req.body into the shape that
// the mongodb schema expects.
const validateProblemSet: express.Handler = (
	req: ProblemSetRequest,
	res,
	next
) => {
	if (isEmpty(req.body.name) || isNaN(parseInt(req.body.number))) {
		error(req, res, 400);
		return;
	}
	const number = parseInt(req.body.number);
	const data = {
		name: req.body.name,
		by: (req.user as any).username,
		authorId: (req.user as any).googleId,
		statements: [] as string[],
		answers: [] as string[],
	};
	for (let i = 0; i < number; i++) {
		const statement = req.body['statement_' + i];
		const answer = req.body['answer_' + i];
		if (isEmpty(answer) || typeof statement !== 'string') {
			error(req, res, 400);
			return;
		}
		data.statements.push(statement);
		data.answers.push(answer.replace(/\s+/g, ''));
	}
	req.problemset = data;
	next();
};

// Owner permissions required.
export const Owner: express.Handler = (req: ProblemSetRequest, res, next) => {
	if (!req.problemset) {
		throw new Error('Problemset should be initialized before this middleware!');
	}
	if (req.user && req.problemset?.authorId === (req.user as any).googleId) {
		next();
	} else {
		error(req, res, 403);
	}
};

router.use('/create', Admin);

const limit: express.RequestHandler = (req, res, next) => {
	const num = parseInt(req.params.num);
	if (isNaN(num)) {
		error(req, res, 400);
		return;
	}
	if (num <= 0 || num > 100) {
		render(req, res.status(403), 'errors/403', {
			message:
				'The number of problems must be between 1 and 100 (security measure)',
		});
	}
	next();
};
router.get('/create/:num(\\d+)', loggedIn, limit, (req, res) => {
	render(req, res, 'pages/create', {
		number: req.params.num,
		csrfToken: req.csrfToken(),
	});
});

router.post(
	'/create/:num(\\d+)',
	loggedIn,
	limit,
	validateProblemSet,
	async (req: ProblemSetRequest, res) => {
		let uuid = undefined;
		try {
			const problemset = new ProblemSet(req.problemset);
			await problemset.save();
			uuid = problemset._id;
		} catch (e) {
			console.error(e);
			error(req, res, 500);
			return;
		}
		render(req, res, 'pages/create', {
			success: true,
			uuid,
			number: req.params.num,
			csrfToken: req.csrfToken(),
		});
	}
);

router.get('/create', loggedIn, async (req: ProblemSetRequest, res) => {
	render(req, res, 'pages/generate', {});
});

router.get(
	'/edit/:uuid([0-9,a-f]{24})',
	loggedIn,
	uuidExists,
	(req: ProblemSetRequest, res) => {
		render(req, res, 'pages/create', {
			statements: req.problemset?.statements,
			answers: req.problemset?.answers,
			number: req.problemset?.answers.length,
			name: req.problemset?.name,
			user: req.user,
			csrfToken: req.csrfToken(),
		});
	}
);

router.post(
	'/edit/:uuid([0-9,a-f]{24})',
	loggedIn,
	uuidExists,
	validateProblemSet,
	async (req: ProblemSetRequest, res) => {
		try {
			await ProblemSet.findByIdAndUpdate(
				new ObjectId(req.params.uuid),
				req.problemset
			);
		} catch (e) {
			console.error(e);
			error(req, res, 500);
			return;
		}
		render(req, res, 'pages/create', {
			success: true,
			uuid: req.params.uuid,
			statements: req.problemset?.statements,
			answers: req.problemset?.answers,
			number: req.problemset?.answers.length,
			name: req.problemset?.name,
			csrfToken: req.csrfToken(),
		});
	}
);

router.get(
	'/delete/:uuid([0-9,a-f]{24})',
	uuidExists,
	Owner,
	(req: ProblemSetRequest, res) => {
		render(req, res, 'pages/delete', {
			name: req.problemset?.name,
			uuid: req.params.uuid,
			csrfToken: req.csrfToken(),
		});
	}
);

router.post(
	'/delete/:uuid([0-9,a-f]{24})',
	uuidExists,
	Owner,
	async (req: ProblemSetRequest, res) => {
		try {
			await ProblemSet.findByIdAndDelete(req.params.uuid);
			await Response.deleteMany({ for: req.params.uuid });
		} catch (e) {
			console.error(e);
			error(req, res, 500);
			return;
		}
		res.redirect('/dashboard');
	}
);

export default router;
