import express from 'express';
import { ProblemSet } from '../../models/problemset';
import { loggedIn } from '../../auth';
import mongoose from 'mongoose';

const router = express.Router();

router.get('/recent', loggedIn, async (req, res) => {
	try {
		ProblemSet.find({})
			.sort({ createdAt: -1, _id: 1 })
			.limit(20)
			.exec(async (err, data) => {
				res.json(data);
			});
	} catch (e) {
		console.error(e);
		res.status(500).json({ error: e });
	}
});

router.get('/recent/:uuid([0-9,a-f]{24})', loggedIn, async (req, res) => {
	try {
		const doc = (await ProblemSet.findById(req.params.uuid)) as any;
		if (!doc) {
			res
				.status(404)
				.json({ error: 'No doc with uuid ' + req.params.uuid + 'found' });
			return;
		}
		ProblemSet.find()
			.or([
				{
					_id: { $gt: new mongoose.Types.ObjectId(doc._id) },
					createdAt: doc.createdAt,
				},
				{ createdAt: { $lt: doc.createdAt } },
			])
			.sort({ createdAt: -1, _id: 1 })
			.limit(20)
			.exec(async (err, data) => {
				res.json(data);
			});
	} catch (e) {
		console.error(e);
		res.status(500).json({ error: e });
	}
});

export default router;
