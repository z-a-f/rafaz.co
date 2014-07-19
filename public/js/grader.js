#!/usr/bin/env node
/*
  Automatically grade files for the presence of specified HTML tags/attributes.
  Uses commander.js and cheerio. Teaches command line application development
  and basic DOM parsing.

  References:

  + cheerio
  - https://github.com/MatthewMueller/cheerio
  - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
  - http://maxogden.com/scraping-with-node.html

  + commander.js
  - https://github.com/visionmedia/commander.js
  - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

  + JSON
  - http://en.wikipedia.org/wiki/JSON
  - https://developer.mozilla.org/en-US/docs/JSON
  - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var rest = require('restler'); // Restler for URL fetching
var fs = require('fs'); // Filesystem for file opening
var program = require('commander'); // Node Commander for command line framework
var cheerio = require('cheerio'); // Node Cheerio for jQuerry
var HTMLFILE_DEFAULT = "index.html"; // This is the page we look for by default
var CHECKSFILE_DEFAULT = "checks.json"; // This is the default checking dictionary

var assertFileExists = function(infile) { // Assert the file exists :)
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

/**
 * Load the check dictionary
 **/
var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

/**
 * Load the HTML file using Cheerio
 * Note: It looks like Cheerio cannot process buffers, need top convert to string
 **/
var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile).toString());
};

/**
 * File checker
 **/
var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

/**
 * URL checker
 * loads the HTML from an URL and checks it using the loadChecks function
 **/
var checkURL = function(url, checksfile){
    $ = cheerio.load(url);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

/**
 * Workaround for commander.js issue.
 * http://stackoverflow.com/a/6772648
 **/
var clone = function(fn) {
    return fn.bind({});
};

/**
 * Main part
 **/
if(require.main == module) {
    program // See Commander documentation for details
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
	.option('-u, --url <url>', 'Check URL')
        .parse(process.argv);

    if(program.url != null){ // Is it a URL?
	console.log("URL: ", program.url);
        rest.get(program.url).on('complete', function(result) {
	    if(result instanceof Error){
		console.error('Error: ' + result.message);
		this.retry(1000);
	    }else { // If no error process using the above functions:
		var checkJson = checkURL(result, program.checks);
		var outJson = JSON.stringify(checkJson, null, 4);
                console.log("url check output: ", outJson);
	    }
	});
    }
    else{ // Is it a FILE?
        console.log("FILE: ", program.file);
	var checkJson = checkHtmlFile(program.file, program.checks);
	var outJson = JSON.stringify(checkJson, null, 4);
	// console.log("file: ", program.file, "\n");
	console.log(outJson);
    }
}else {
    exports.checkHtmlFile = checkHtmlFile;
}
