const path = require('path');
// load dependencies
var cors = require('cors');
const env = require('dotenv');
// const csrf = require('csurf');
const express = require('express');
const flash = require('express-flash');
const bodyParser = require('body-parser');
const session = require('express-session');
const expressHbs = require('express-handlebars');



const app = express();
// const csrfProtection = csrf();
const router = express.Router();

//Loading Routes
const webRoutes = require('./routes/web');
const db = require('./app/models/index');
const adminRoutes = require('./routes/admin')

env.config();
app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/files', express.static(path.join(__dirname, 'app/uploadedImages')));



app.use(flash());


app.engine(
	'hbs',
	expressHbs({
		layoutsDir: 'views/layouts/',
		defaultLayout: 'web_layout',
		extname: 'hbs',
	})
);
app.set('view engine', 'hbs');
app.set('views', 'views');
app.use('/api',webRoutes);
app.use('/admin',adminRoutes)
app.get('/api/test', (req, res) => {
	res.send('Server is Up!');
});
db.sequelize
	.sync({ alter: true  })
	.then(() => {
		app.listen(process.env.PORT || 3000);
		//pending set timezone
		console.log('App listening on port ' + process.env.PORT || 3000);
	})
	.catch((err) => {
		console.log("err",  err);
	});
