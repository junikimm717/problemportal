import 'dotenv/config';

import mongoose from 'mongoose';

export const mongouri = process.env.DB_URI!;

mongoose
	.connect(mongouri)
	.then(() => console.log('Connected to db'))
	.catch((e) => console.error('Couldnt connect', e));
