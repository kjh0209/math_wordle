const https = require('https');
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'apps', 'mobile', 'assets', 'fonts');
const target = path.join(dir, 'DungGeunMo.ttf');

if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

console.log('Downloading NeoDunggeunmo font directly to:', target);

https.get('https://cdn.jsdelivr.net/gh/neodgm/neodgm/neodgm.ttf', (res) => {
    if (res.statusCode !== 200) {
        console.error('Failed to download, status code:', res.statusCode);
        return;
    }
    
    const fileStream = fs.createWriteStream(target);
    res.pipe(fileStream);
    
    fileStream.on('finish', () => {
        fileStream.close();
        console.log('✅ Font downloaded successfully! You can now run Expo again.');
    });
}).on('error', (err) => {
    console.error('Error downloading the font:', err.message);
});
