import 'dotenv/config';
import { mongouri } from './db';
import express from 'express';

import { authRouter } from './auth';
import problemRouter from './routes/problem';
import answerRouter from './routes/answersheet';
import dashboardRouter from './routes/dashboard';
import apiRouter from './routes/api';

import bodyParser from 'body-parser';
import session from 'express-session';
import passport from 'passport';
import MongoStore from 'connect-mongo';
import csrf from 'csurf';
import cookieParser from 'cookie-parser';

import http from 'http';
import { Server } from 'socket.io';
import setSocketIO from './socket';
import render from './render';

async function main() {
	const app = express();

	const server = http.createServer(app);
	const io = new Server(server);
	setSocketIO(io);

	const port = process.env.PORT || 3000;
	app.set('view engine', 'ejs');

	app.use(cookieParser());
	app.use(
		session({
			secret: process.env.SESSION_SECRET!,
			resave: false,
			saveUninitialized: false,
			cookie: {
				secure: process.env.NODE_ENV === 'production',
			},
			store: MongoStore.create({ mongoUrl: mongouri, ttl: 24 * 60 * 60 }),
		})
	);

	app.disable('X-Powered-By');
	if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);

	app.use(express.json());

	app.use(passport.initialize());
	app.use(passport.session());
	app.use(bodyParser.urlencoded({ extended: false }));

	const csrfProtection = csrf({ cookie: true });
	app.use(csrfProtection);

	app.use(function (err, req, res, next) {
		if (err.code !== 'EBADCSRFTOKEN') return next(err);
		// handle CSRF token errors here
		res.status(403).render('errors/403', { user: req.user, tampered: true });
	} as express.ErrorRequestHandler);

	app.use('/auth', authRouter);
	app.use('/problem', problemRouter);
	app.use('/problem', answerRouter);
	app.use('/dashboard', dashboardRouter);
	app.use('/api', apiRouter);

	app.use('/static', express.static('static'));

	app.get('/', (req, res) => {
		render(req, res, 'pages/index', {});
	});

	server.listen(port, () => {
		console.log(`Running Server at port ${port}`);
	});
}

main();
