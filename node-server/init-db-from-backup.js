const https = require('https');
const fs = require('fs');

function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download file. Status Code: ${response.statusCode}`));
        return;
      }

      const fileStream = fs.createWriteStream(outputPath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

// Example usage
const fileUrl = 'https://pub-52d507cf82004bd9b57bd4672a41157c.r2.dev/db.sqlite';
const outputPath = './db.sqlite';

downloadFile(fileUrl, outputPath)
  .then(() => console.log('File downloaded successfully'))
  .catch((error) => console.error('Error downloading file:', error));