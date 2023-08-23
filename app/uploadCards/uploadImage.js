var multer  = require('multer')
const path = require("path");
var storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, 'app/uploadedImages')
	},
	filename: function (req, file, cb) {
		cb(null, file.originalname + '-' + Date.now()+ path.extname(file.originalname))
	}
})
var upload = multer({ 
    storage: storage,
    limits: { fileSize: 2 *1024 * 1024 },
	fileFilter: function (req, file, callback) {
		var ext = path.extname(file.originalname).toLowerCase();
		if(ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg') {
			req.fileValidationError = true 
			return callback(null,false)
		}
		req.fileValidationError = false
		callback(null, true)
	},
})
module.exports.uploadImage = upload