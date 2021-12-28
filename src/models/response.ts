import mongoose from 'mongoose';

interface ResponseInterface {
	for: string;
	username: string;
	userId: string;
	response: string[];
	correct: boolean[];
}

const ResponseSchema = new mongoose.Schema<ResponseInterface>(
	{
		for: { type: String, required: true },
		username: { type: String, required: true },
		userId: { type: String, required: true },
		response: { type: [String], required: true },
		correct: { type: [Boolean], required: true },
	},
	{ timestamps: true }
);

export const Response = mongoose.model('Response', ResponseSchema);
