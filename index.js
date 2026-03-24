const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 3000;

const bootstrap = async () => {
	await connectDB();

	app.listen(PORT, () => {
		console.log(`API running on port ${PORT}`);
	});
};

bootstrap();
