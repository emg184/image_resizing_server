/////////////////////////////
//Top Level Module Imports///
/////////////////////////////

const express = require('express');
const bodyParser = require('body-parser');
const multer  = require('multer');
const fs = require("fs");
const sharp = require('sharp');
const compression = require('compression');
const helmet = require('helmet');
//const config = require('./config.js');
//const jwt = require('jsonwebtoken');

//////////////////////////////
//Initilizations//////////////
//////////////////////////////

const app = express();


//////////////////////////////
//Multer//////////////////////
//////////////////////////////
const multerFileFilter = (req, file, cb) => {
	let imageTypes = ['image/jpeg', 'image/tif', 'image/jpg', 'image/png', 'image/gif']
	if (imageTypes.includes(file.mimetype)) {
		cb(null, true);
	}
	else {
		req.fileValidationError = 'goes wrong on the mimetype';
		return cb(null, false, new Error('Mime type Error'));
	}
}

const upload = multer({ 
	dest: '/tmp/',
	limits: { fileSize: 25000000},
	fileFilter: multerFileFilter 

}).single('file');

//////////////////////////////
//Configuration///////////////
//////////////////////////////

app.use(helmet());
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

//////////////////////////////
//Globals/////////////////////
//////////////////////////////

const port = 3000;

//////////////////////////////
//Middlewares/////////////////
//////////////////////////////

//Auth Middleware
/*
const requireAuth = (req, res, next) => {
  if(("authorization" in req.headers)) {
    if(req.headers.authorization[3] === " ") {
      let token = req.headers.authorization.split(" ")[1];
      let decoded;
      jwt.verify(token, config.secret, function(err, result) {
                      if (err) {
                        return res.redirect(301, 'https://www.afito.com/signin');
                      }
                      else {
                        decoded = result
                      }
                    });
      if (decoded.sub.user_id !== undefined) {
        res.locals.user = decoded.sub;
        next();
      }
      else {
        let message = { message: "You\'re not authorized to use this route"};
        res.status(401).json(message);
      }
    }
    else {
      let message = {message: "That is an incorrectly formatted token"};
      res.status(401).json(message);
    }
  }
  else {
    let message = {message: "You need to be authenticated in order to access this route"};
    res.status(401).json(message);
  }
}
*/
//Dimension Middleware
const checkDimensions = (req, res, next) => {
	let width = req.params.width;
	let height = req.params.height;
	if (width !== undefined) {
	    width = parseInt(req.params.width);
	}
	else {
		width = undefined
	}
	if (height !== undefined) {
		height = parseInt(req.params.height);
	}
	else {
		height = undefined
	}
	if (height === undefined && width === undefined) {
		let message = { message: "height or width must be a specified paramter"};
        res.status(401).json(message);
	}
	else if ( height === 0 || width === 0) {
		let message = { message: "height or width cant be set to zero"};
        res.status(401).json(message);
	}
	else {
		let type = req.params.type.toLowerCase();
		let imageTypes = ['jpeg', 'tif', 'jpg', 'png', 'gif']
		if (imageTypes.includes(type)) {
			res.locals.fileParams = {
				'type': type,
				'width': width,
				'height': height
			};
			next();
		}
		else {
			let message = { message: "That image type is unsupported must be of type jpeg, jpg, tif, gif, or png"};
	        res.status(401).json(message);
		}
	}
}

//////////////////////////////
//Routes//////////////////////
//////////////////////////////

app.post('/upload/:width/:height/:type', checkDimensions, (req, res) => {
  upload( req, res, (err) => {
  	if (err) {
  	  res.status(500).json({ 'message': err });
  	}
  	else {
  	  let type = 'jpeg';
	  let receivedFile = __dirname + `/tmp/${req.file.filename}.${res.locals.fileParams.type}`;
	  let outputFile = __dirname + `/output/${req.file.filename}.${res.locals.fileParams.type}`;
	  fs.rename(req.file.path, receivedFile, function(err) {
	    if (err) {
	      res.send(500);
	    } 
	    fs.stat(receivedFile, function (err, stats) {
		  if (err) throw err;
		  let transform = sharp(receivedFile);
		  transform = transform.resize(res.locals.fileParams.width, res.locals.fileParams.height, {
			kernel: sharp.kernel.nearest
		  })
		  .max()
		  .withoutEnlargement()
		  .toFile(outputFile)
		  .then(result => {
			res.type(`image/${res.locals.fileParams.type}`);
			res.sendFile(outputFile)
			return result
		  })
		  .then(resultDelete => {
			fs.unlink(receivedFile, (error) => {
				if(error){
					throw error;
				}
				//console.log('Deleted Original')
			})
			fs.stat(outputFile, function (err, stats) {
		  	  if (err) throw err;
			  fs.unlink(outputFile, (error) => {
				if(error){
				  throw error;
				}
				//console.log('Deleted Output')
			  })
			})
		  })
	    })
	  })
  	}
  })
});

//////////////////////////////
//Invocation//////////////////
//////////////////////////////

app.listen(port, () => console.log(`app listening on port ${port}!`))

