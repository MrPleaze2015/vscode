/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

const { app, BrowserWindow, ipcMain } = require('electron');
const { tmpdir } = require('os');
const { join } = require('path');

const optimist = require('optimist')
	.describe('grep', 'only run tests matching <pattern>').string('grep').alias('grep', 'g').string('g')
	.describe('debug', 'open dev tools, keep window open').string('debug');

const { debug, grep } = optimist.argv;

app.setPath('userData', join(tmpdir(), `vscode-tests-${Date.now()}`));

app.on('ready', () => {

	const win = new BrowserWindow({
		height: 600,
		width: 800,
		webPreferences: { webSecurity: false }
	});

	win.webContents.on('did-finish-load', () => {
		win.show();
		if (debug) {
			win.webContents.openDevTools('right');
		}
	});

	const query = grep
		? `?grep=${grep}`
		: '';

	win.loadURL(`file://${__dirname}/renderer.html${query}`);

	const _failures = [];
	ipcMain.on('fail', (e, test) => {
		_failures.push(test);
		process.stdout.write('X');
	});
	ipcMain.on('pass', () => {
		process.stdout.write('.');
	});

	ipcMain.on('done', () => {

		console.log(`\nDone with ${_failures.length} failures.\n`);

		for (const fail of _failures) {
			console.error(fail.title);
			console.error(fail.stack);
			console.error('\n');
		}

		if (!debug) {
			app.exit(_failures.length > 0 ? 1 : 0);
		}
	});
});