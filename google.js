// Inside modules
const fs = require('fs');
const path = require('path');
const request = require('request');
// Outside modules
const webdriverio = require('webdriverio');
const fileType = require('file-type');


// browser options
const options = {
	desiredCapabilities: {
		browserName: 'chrome'
	}
};
// Start client
const client = webdriverio.remote(options).init();

async function loopScroll(count, dist) {
	for (let i = 0; i < count; i++) {
		await client.scroll(0, dist);
		await client.pause(2000);
	}
	return;
}

async function getElement(search_word) {
	await client.url('https://www.google.co.jp/imghp');
	await client.setValue('[name="q"]', search_word + '\n');

	const title = await client.getTitle();

	await loopScroll(4, 100000);
	await client.click('input[value="結果をもっと表示"]');
	await client.pause(2000);
	await loopScroll(6, 100000);

	const obj = await client.elements('img[class="rg_ic rg_i"]');
	let ary = [];
	for (const elem of obj["value"]) {
		const src = await client.elementIdAttribute(elem["ELEMENT"], 'src');
		if (src["value"] != null)
			ary.push(src["value"]);
	}
	await client.pause(8000);

	return [ary, title];
}

function doRequest(url, output_dir, number) {
	return new Promise((resolve_, reject_) => {
		const headers = { method: 'GET', url: url, encoding: null };
		request(headers, (err_, res_, body_) => {
			if (!err_ && res_.statusCode === 200) {
				const ext = fileType(body_)["ext"];
				const filename = path.join(output_dir, number+"."+ext);
				fs.writeFileSync(filename, body_, 'binary');
				resolve_();
			} else {
				reject_(err_);
			}
		});
	});
}

async function downloadImages(urls, title, output_dir, firstnum) {
	console.log("Downloading from " + '"' + title + '"');
	const data_uri = /data:/g;
	let count = firstnum;
	for (const url of urls) {
		if (!url.match(data_uri)) {
			await doRequest(url, output_dir, String(count));
			count += 1;
		}
	}
	console.log(String(count - firstnum) + " images downloaded.");
	return;
}

const word = [
	'犬 ' + '',
	'犬 ' + 'かわいい',
	'犬 ' + '白い',
	'犬 ' + 'ポメラニアン',
	'犬 ' + 'チワワ',
	'犬 ' + 'シーズー',
	'犬 ' + 'おもしろ',
	'犬 ' + 'マルチーズ',
	'犬 ' + 'ペット',
	'犬 ' + '癒し',
	'犬 ' + '小さい',
	'犬 ' + 'ふわふわ',
	'犬 ' + 'ずっと',
	'犬 ' + '丸い'
];
async function sample(output_dir) {
	if (!fs.existsSync(output_dir))
		fs.mkdirSync(output_dir);

	let now_count = 0;
	for (const w of word) {
		const result = await getElement(w);
		downloadImages(result[0], result[1], output_dir, now_count)
			.catch(err_ => { console.log(err_); });
		now_count += result[0].length;
	}
	client.end();
	return;
}

const output_dir = "images";
sample(output_dir);

// 将来的なインターフェース
// node google.js 犬 探索深度*1000が，だいたい取得可能な画像枚数．
// 探索深度は，google imagesの，かわいい．とか，も付随してどれだけ探索するのか．
