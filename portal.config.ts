interface portalConfig {
	quote?: {
		text: string;
		by: string;
	};
	title?: string;
	owner?: string;
	admins: string[];
}

const config: portalConfig = JSON.parse(process.env.PORTALCONFIG!);

export default config;
