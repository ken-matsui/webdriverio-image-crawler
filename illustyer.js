// Inside modules
const fs = require('fs');
const path = require('path');
const request = require('request');
// Outside modules
const webdriverio = require('webdriverio');


// If you add the URL of image here,
//  it will be excluded from the download target.
const ignore_imgs = [
	"http://2.bp.blogspot.com/-L3Qur75wLwI/UhNKk9xgsNI/AAAAAAAAXcA/SDNGteTBSjM/s320/banner_brown.jpg",
	"http://1.bp.blogspot.com/-4lCahp0f_5M/UacVdn6tbRI/AAAAAAAAUaA/p-gklBKNak4/s320/banner_season2.jpg",
	"http://2.bp.blogspot.com/-021xRlCNohc/UacVceiySwI/AAAAAAAAUZQ/IXp4U-fmJR0/s320/banner_event2.jpg",
	"http://1.bp.blogspot.com/-urb1neuCa2M/UacVdQBga4I/AAAAAAAAUZ0/3LS28qlDf9c/s320/banner_person2.jpg",
	"http://3.bp.blogspot.com/-alCo86GjuV0/UNw8AFpoloI/AAAAAAAAJyI/4PUWL6aO6iM/s1600/sidebar_food.jpg",
	"http://1.bp.blogspot.com/-wBx8rDjAROk/UOzlCzgghZI/AAAAAAAAKdo/N-90xWjXUko/s1600/banner_school2.jpg",
	"http://3.bp.blogspot.com/-uP87_YO4DuU/UOzk8ezeKbI/AAAAAAAAKc4/FtN6bHZBsj8/s1600/banner_seikatsu2.jpg",
	"http://1.bp.blogspot.com/-R4VkHNuxEW0/UacVc69RSqI/AAAAAAAAUZk/iwwo_1gqTZM/s320/banner_medical2.jpg",
	"http://2.bp.blogspot.com/-3MJbDtxkQqU/UOk-X8bjpGI/AAAAAAAAKWE/YRWIhBEkXMA/s320/banner_syakai.jpg",
	"http://2.bp.blogspot.com/-w8OacEbwL2w/UOkFbj2ARTI/AAAAAAAAKTE/tGreJIUWojs/s320/banner_sports2.jpg",
	"http://1.bp.blogspot.com/--y76vHIBKfc/UacXOyMoxTI/AAAAAAAAUaw/PTin2jdayB4/s320/banner_nature2.jpg",
	"http://3.bp.blogspot.com/-_2u7Opq6mP0/UOj9Oi7wQTI/AAAAAAAAKRY/49N4apXIGpo/s1600/banner_tatemono2.jpg",
	"http://2.bp.blogspot.com/-o_6Bo0_wYi4/UOpEMKVtSnI/AAAAAAAAKb4/9pN1K-nnWGM/s320/banner_template2.jpg",
	"http://1.bp.blogspot.com/-Squr0MpHmmg/UTcatSzPxYI/AAAAAAAAOnU/5pyZM5fHVok/s320/banner_moji_mark2.jpg",
	"https://2.bp.blogspot.com/-wQOYabz052Y/V4uIqKhX4JI/AAAAAAAA8U4/JfnGnlzfSjMCAzWM9xgmTS8upRi8v7FpwCLcB/s220/sidebanner_others.jpg",
	"http://2.bp.blogspot.com/-ixI94sbEyOA/UR3Klqju7LI/AAAAAAAAM0E/0cPf0R-QqrQ/s320/banner_twitter.jpg",
	"https://4.bp.blogspot.com/-bufxiiMn5N8/V3Pdhc3mymI/AAAAAAAA8Dg/_vNQxLN7Ws4rmC3LAsqeqhbbPL6BXQdLACLcB/s230/banner_sml.jpg",
];

// browser options
const options = {
	desiredCapabilities: {
		browserName: 'chrome'
	}
};
// Start client
const start_url = 'http://www.irasutoya.com/2013/10/blog-post_5076.html';
const client = webdriverio.remote(options).init().url(start_url);

async function catchSrc(values) {
	let ary = [];
	for (const elem of values) {
		const src = await client.elementIdAttribute(elem["ELEMENT"], 'src');
		// 小さい画像は排除
		// http://~~/~/~/s90-c/hoge.pngなどは排除, http://~~/~/~/s400/hoge.pngなどは許容
		let url = src["value"].split('/');
		url.pop();
		let size_data = url.pop();
		const size = parseInt(size_data.replace('s', ''), 10);
		if (src["value"] != null && ignore_imgs.indexOf(src["value"]) == -1 && size > 90)
			ary.push(src["value"]);
	}
	return ary;
}

async function getElement() {
	await client.pause(5000);

	const title = await client.getTitle();
	let name = title.split(' | ')[0];
	console.log('Download "' + name + '".');

	const imgs = await client.elements('img[border="0"]');
	await client.pause(2000);

	const ary = await catchSrc(imgs["value"]);
	await client.pause(2000);

	await client.click('a[href="#random"]');
	await client.pause(2000);

	return ary;
}

function doRequest(url, output_dir) {
	return new Promise((resolve_, reject_) => {
		const headers = { method: 'GET', url: url, encoding: null };
		request(headers, (err_, res_, body_) => {
			if (!err_ && res_.statusCode === 200) {
				const filename = path.join(output_dir, url.split('/').pop());
				fs.writeFileSync(filename, body_, 'binary');
				resolve_();
			} else {
				reject_(err_);
			}
		});
	});
}

// {"message":"stale element reference: element is not attached to the page document\n}
// randomボタンが表示されない．Lastの時
// 画像が表示されない．静的ホスティングエラー．
// これらが，異常終了を引き起こす．

async function downloadImages(image_num, output_dir) {
	if (!fs.existsSync(output_dir))
		fs.mkdirSync(output_dir);

	let kaesu = []
	while (image_num > kaesu.length) {
		const result = await getElement();
		Array.prototype.push.apply(kaesu, result);
		// 重複の排除
		kaesu = Array.from(new Set(kaesu));
		for (const url of result) {
			doRequest(url, output_dir);
		}
	}
	client.end();
	return;
}

if (process.argv.length != 3) {
	console.log("Usage: node " + process.argv[1].split('/').pop() + " image_num");
	process.exit(1);
} else {
	const output_dir = 'illusts';
	downloadImages(parseInt(process.argv[2]), output_dir);
}
