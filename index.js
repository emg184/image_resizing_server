const express = require('express');
const bodyParser = require('body-parser');
var multer  = require('multer');
var fs = require("fs");
const sharp = require('sharp');
const app = express();

var upload = multer({ dest: '/tmp/'});
 //app.use(bodyParser.json());
 app.use(bodyParser.urlencoded({extended: true}));

const port = 3000;

app.get('/', (req,res) => {
	res.send('Hello World!')
})

app.post('/resize/image', (req,res) => {
	console.log(Object.keys(req.body))
	res.send(req.body)
})
/*
app.post('/file_upload', upload.single('file'), function(req, res) {
  console.log(req.file)
  var file = '/home/ethan/Desktop/afito_image_api/tmp'
 + '/' + req.file.filename + '.jpeg';
  fs.rename(req.file.path, file, function(err) {
    if (err) {
      console.log(err);
      res.send(500);
    } else {
      res.json({
        message: 'File uploaded successfully',
        filename: req.file.filename + '.jpeg'
      });
    }
  });
});
*/
app.get('/fileuploaded/:file', function (req, res) {
   res.sendFile( '/home/ethan/Desktop/afito_image_api/tmp' + "/" + req.params.file);
})

app.get('/image/:width/:height', (req, res) => {
	const width = parseInt(req.params.width);
	const height = parseInt(req.params.height);
	//const readStream = fs.createReadStream(__dirname + '/tmp/' + '6a1a81d0bbc6256ca9b4fc9110f8098b.jpeg');
	let transform = sharp(__dirname + '/tmp/' + '6a1a81d0bbc6256ca9b4fc9110f8098b.jpeg');
	transform = transform.resize(width, undefined, {
kernel: sharp.kernel.nearest
}).toFile(__dirname + '/tmp/output.jpeg').then(result => {
	console.log(result)
	res.type(`image/jpeg`);
	res.sendFile(__dirname + '/tmp/' + 'output.jpeg')
})
})

app.post('/file_upload', upload.single('file'), function(req, res) {
  //var file = '/home/ethan/Desktop/afito_image_api/tmp' + '/' + req.file.filename + '.jpeg';
  let type = 'jpeg';
  let receivedFile = __dirname + `/tmp/${req.file.filename}.${type}`
  let outputFile = __dirname + `/output/${req.file.filename}.${type}`
  fs.rename(req.file.path, receivedFile, function(err) {
    if (err) {
      res.send(500);
    } 
    fs.stat(receivedFile, function (err, stats) {
	  if (err) throw err;
	  let transform = sharp(receivedFile);
	transform = transform.resize(1280, undefined, {
		kernel: sharp.kernel.nearest
	}).toFile(outputFile).then(result => {
		res.type(`image/${type}`);
		res.sendFile(outputFile)
		return result
	})
	.then(resultDelete => {
		fs.unlink(receivedFile, (error) => {
			if(error){
				throw error;
			}
			console.log('Deleted Original')
		})
		fs.stat(outputFile, function (err, stats) {
	  		if (err) throw err;
			fs.unlink(outputFile, (error) => {
				if(error){
					throw error;
				}
				console.log('Deleted Output')
			})
			console.log(resultDelete)
		})
	});
  })
  })
});

app.listen(port, () => console.log(`app listening on port ${port}!`))