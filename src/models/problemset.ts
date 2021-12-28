import mongoose from 'mongoose';

interface ProblemSetInterface {
	name: string;
	by: string;
	authorId: string;
	statements: [string];
	answers: [string];
	pdfkey: string;
}

const ProblemSetSchema = new mongoose.Schema<ProblemSetInterface>(
	{
		name: { type: String, required: true },
		by: { type: String, required: true },
		pdfkey: { type: String, required: false },
		authorId: { type: String, required: true },
		statements: { type: [String], required: true },
		answers: { type: [String], required: true },
	},
	{ timestamps: true }
);

export const ProblemSet = mongoose.model('ProblemSet', ProblemSetSchema);
