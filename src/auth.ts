import 'dotenv/config';
import express, { Router } from 'express';

import mongoose from 'mongoose';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import portalConfig from '../portal.config';
import { error } from './render';

interface UserInterface {
	username: string;
	googleId: string;
	email: string;
}
const UserSchema: mongoose.Schema<UserInterface> = new mongoose.Schema({
	username: String,
	googleId: String,
	email: String,
});

export const User = mongoose.model('User', UserSchema);

passport.use(
	new GoogleStrategy(
		{
			clientID: process.env.GOOGLE_CLIENT_ID!,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
			callbackURL: process.env.GOOGLE_CALLBACK!,
		},
		async (accessToken: any, refreshToken: any, profile: any, cb) => {
			User.findOne({ googleId: profile.id! }, async (err: any, user: any) => {
				if (err) {
					console.error('happens', err);
					return cb(err);
				}
				if (!user) {
					const profileemails = profile.emails;
					const email = profileemails ? profileemails[0].value : '';
					const newuser = await User.create({
						username: profile.displayName,
						googleId: profile.id,
						email,
					});
					return cb(null, newuser);
				}
				return cb(null, user);
			});
		}
	)
);

export const loggedIn: express.Handler = (req, res, next) => {
	if (req.user) {
		next();
	} else {
		error(req, res, 403);
	}
};

export const authRouter = Router();

passport.serializeUser((user: any, done) => {
	done(null, user);
});

passport.deserializeUser((user: any, done) => {
	done(null, user);
});

authRouter.get(
	'/google',
	passport.authenticate('google', { scope: ['profile', 'email'] })
);

authRouter.get(
	'/google/callback',
	passport.authenticate('google'),
	(req, res) => {
		res.redirect('/dashboard');
	}
);

authRouter.get('/logout', (req, res) => {
	req.logout();
	req.session.destroy(() => null);
	res.redirect((req.query['redirect'] as string) || '/');
});

export function isAdmin(email: any) {
	return portalConfig.admins.indexOf(email) != -1;
}

export const Admin: express.Handler = (req, res, next) => {
	const u = req.user as any;
	if (!u || !isAdmin(u.email)) {
		error(req, res, 403);
	} else {
		next();
	}
};
