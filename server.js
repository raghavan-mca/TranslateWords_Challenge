const express = require('express');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const json2csv = require('json2csv').Parser;


const app = express();
app.use(fileUpload());
const csvpath = './french_dictionary.csv';





app.post('/upload', (req, res) => {
  const startTime = process.hrtime();
  const startMemory = process.memoryUsage().heapUsed;

  if (!req.files || !req.files.file) {
    // No file was provided
    res.status(400).json({ message: 'No file was provided.' });
    return;
  }

  const file = req.files.file;

  const uploadPath = path.join(__dirname, 'uploads',file.name);
  console.log(uploadPath)
  file.mv(uploadPath, (err) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'Error occurred while saving the file.' });
      return;
    }

    const fileContent = fs.readFileSync(uploadPath, 'utf8').split(" ");
    fs.unlink(uploadPath, (err) => {
      if (err) {
        console.error('Error deleting file:', err);
      } 
    });

    const dataArray = [];
    fs.createReadStream(csvpath)
      .pipe(csv())
      .on('data', (data) => {
        dataArray.push(data);
      })
      .on('end', () => {
        const replacedArray = fileContent.map((word) => {
          const match = dataArray.find((obj) => obj.abide === word);

          if (match) {
            match.frequency = match.frequency ? match.frequency + 1 : 1;
            return match.respecter;
          } else {
            return word;
          }
        });
        let text = replacedArray.join(' ')
        fs.writeFileSync('./output/t8.shakespeare.translated.txt', text)
        const fields = ['abide', 'respecter', 'frequency'];
        const opts = { fields };
        const parser = new json2csv(opts);
        const csv = parser.parse(dataArray);
        const filename = './output/frequency.csv';
        fs.writeFileSync(filename, csv);
        const endTime = process.hrtime(startTime);
        const responseTime = endTime[0] * 1000 + endTime[1] / 1000000;

        const endMemory = process.memoryUsage().heapUsed;
        const memoryUsed = endMemory - startMemory;

        const totalSeconds = Math.floor(responseTime / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        const megabytes = memoryUsed / (1024 * 1024);
        let performance = `Time to process: ${minutes} Minutes ${seconds < 10 ? '0' : ''}${seconds} Seconds.\nMemory Used: ${megabytes.toFixed(2)} mb.`

        fs.writeFileSync('./output/performance.txt', performance);

        res.status(200).json({ content: "success", filedownloaded: 3, outputfilefolderpath: '/output' });
      })

  });
});

// Start the server
app.listen(3000, () => {
  console.log('Server started on port 3000');
});

