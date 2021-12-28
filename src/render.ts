import express from 'express';
import config from '../portal.config';

export default function render(
	req: express.Request,
	res: express.Response,
	page: string,
	params: any
) {
	res.render(page, {
		user: req.user,
		config: config,
		...params,
	});
}

export function error(
	req: express.Request,
	res: express.Response,
	number: number
) {
	render(req, res.status(number), 'errors/' + number, {});
}
