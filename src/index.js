const wget = require('node-wget');
const fs = require('fs');
const puppeteer = require('puppeteer');

(async () => {

    let igUrl = 'https://www.instagram.com/';
    let data = fs.readFileSync('src/usernames.json');
    let usernamesObj = JSON.parse(data);
    let usernames = Object.keys(usernamesObj);

    const checkIfExists = (username, mediaUrl) => {
        if (usernamesObj[username].indexOf(mediaUrl) == -1) {
            usernamesObj[username].push(mediaUrl);
            let newData = JSON.stringify(usernamesObj, null, 4);
            fs.writeFile('src/usernames.json', newData, function(err) {
                if (err) console.log('ERROR: '+err);
            });
            return false;
        }
        console.log('=> No updates for ' + username);
        return true;
    };
    
    const saveMedia = (username, mediaUrl) => {
        console.log('=> Downloading media for ' + username);
        wget(mediaUrl, function(err, response) {
            if (err) console.log('ERROR: '+err);
            let filename = response.filepath.split(/[\\/]/).pop();
            fs.rename(response.filepath, 'img/'+username+'_'+filename, function(err) {
                if (err) console.log('ERROR: '+err);
            });
        });
    };

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({width: 1920, height: 1080});

    for (let i = 0; i < usernames.length; i++) {
        let username = usernames[i];
        let url = igUrl + username;

        await page.goto(url);

        await page.waitFor(2000);

        // Click on thumbnail
        await page.evaluate(() => {
            document.querySelectorAll('.v1Nh3')[0].children[0].click();
        });

        // Wait for modal
        await page.waitFor(2000);

        // Get images
        let images = await page.evaluate(() => {
            let array = [];
            let elements = document.querySelectorAll('.PdwC2')[0].querySelectorAll('.FFVAD');
            if(elements.length) {
                for (let i = 0; i < elements.length; i++) {
                    array.push(elements[i].src);
                }
            }
            return array;
        });

        // Get videos
        let videos = await page.evaluate(() => {
            let array = [];
            let elements = document.querySelectorAll('.PdwC2')[0].querySelectorAll('.tWeCl');
            if(elements.length) {
                for (let i = 0; i < elements.length; i++) {
                    array.push(elements[i].src);
                }
            }
            return array;
        });

        // Take Screenshot
        // await page.screenshot({path: usernames[i]+'_ss.png'});

        if (images.length) {
            for (let i = 0; i < images.length; i++) {
                let imageUrl = images[i];
                let imageExists = checkIfExists(username, imageUrl);
                if (!imageExists) {
                    saveMedia(username, imageUrl);
                }
            }
        }

        if (videos.length) {
            for (let i = 0; i < videos.length; i++) {
                let videoUrl = videos[i];
                let videoExists = checkIfExists(username, videoUrl);
                if (!videoExists) {
                    saveMedia(username, videoUrl);
                }
            }
        }
    }

    await browser.close();

})();

