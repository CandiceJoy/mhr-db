import chalk   from "chalk";
import {load}  from "cheerio";
import fs      from "fs";
import fetch   from "node-fetch";
import util    from "util";
import winston from "winston";

export function debug(name, obj, verbose = false, depth = 1, hidden = false)
{
	logStart(name, obj, verbose, depth, hidden);
	const type = typeof obj;

	switch(type)
	{
		case "object":
			console.log(`${color(name, "blue")}\n\t${color("Type", "red")}: ${type}`);

			if(!obj)
			{
				console.log(`\t${color("Value", "red")}: ${obj}`);
				return;
			}

			if(obj.constructor)
			{
				const classMatches = obj.constructor.toString().match(/class\s(.+?)\s/i);

				if(classMatches && classMatches.length >= 2)
				{
					console.log(`\t${color("Constructor Class", "red")}: ${classMatches[1]}`);
				}
			}

			console.log(`\t${color("Prototype", "red")}: `, Object.getPrototypeOf(obj));
			try
			{
				console.log(`\t${color("JSON", "red")}: ${JSON.stringify(obj)}`);
			}
			catch(err)
			{
				console.log(`\t${color("JSON", "red")}: Unavailable`);
			}

			if(verbose)
			{
				console.log(`\t\t${color("----------==========", "yellow")} ${color("<", "magenta")}${name}${color(">",
				                                                                                                   "magenta")} ${color(
					"=========----------", "yellow")}`);
				console.log(util.inspect(obj, {
					depth     : depth,
					colors    : true,
					showHidden: hidden,
					compact   : true
				}).replaceAll(/^/gm, "\t\t\t"));
				console.log(`\t\t${color("----------==========", "yellow")} ${color("</", "magenta")}${name}${color(">",
				                                                                                                    "magenta")} ${color(
					"=========----------", "yellow")}`);
			}

			break;
		case "function":
			console.log(`${name} [${type}]`);
			break;
		case "string":
		case "number":
		case "bigint":
		case "boolean":
		case "symbol":
			console.log(`${name} (${type}) - "${obj}"`);
			break;
		case "undefined":
			console.log(`${name} [Undefined]`);
			break;
		default:
			console.log(`${name} [Unknown]`);
	}

	logEnd();
}

/*
 reset - Reset the current style.
 bold - Make the text bold.
 dim - Make the text have lower opacity.
 italic - Make the text italic. (Not widely supported)
 underline - Put a horizontal line below the text. (Not widely supported)
 overline - Put a horizontal line above the text. (Not widely supported)
 inverse- Invert background and foreground colors.
 hidden - Print the text but make it invisible.
 strikethrough - Puts a horizontal line through the center of the text. (Not widely supported)
 visible- Print the text only when Chalk has a color level above zero. Can be useful for things that are purely cosmetic.
 -------------------------
 black
 red
 green
 yellow
 blue
 magenta
 cyan
 white
 blackBright (alias: gray, grey)
 redBright
 greenBright
 yellowBright
 blueBright
 magentaBright
 cyanBright
 whiteBright
 ------------------------
 bgBlack
 bgRed
 bgGreen
 bgYellow
 bgBlue
 bgMagenta
 bgCyan
 bgWhite
 bgBlackBright (alias: bgGray, bgGrey)
 bgRedBright
 bgGreenBright
 bgYellowBright
 bgBlueBright
 bgMagentaBright
 bgCyanBright
 bgWhiteBright
 */

export function color(str, ...tags)
{
	logStart(str, tags);
	let out = null;

	for(let tag of tags)
	{
		tag = tag.replaceAll(/\s/ig, "");
		let func = null;
		let bright = false;
		let background = false;
		let color = null;

		if(tag.match(/bright/ig))
		{
			bright = true;
			tag = tag.replace(/bright/ig, "");
		}

		if(tag.match(/(bg|background)/ig))
		{
			background = true;
			tag = tag.replace(/(bg|background)/ig, "");
		}

		let funcName = "";

		if(background)
		{
			funcName += "bg";
			funcName += tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase();
		}
		else
		{
			funcName += tag.toLowerCase();
		}

		if(bright)
		{
			funcName += "Bright";
		}

		if(chalk[funcName])
		{
			func = chalk[funcName];
		}
		else
		{
			throw "Invalid chalk function: " + tag;
		}

		if(!out)
		{
			out = func(str);
		}
		else
		{
			out = func(out);
		}
	}

	logEnd(out);
	return out;
}

export async function fetchAsFile(url, file)
{
	logStart(url, file);
	const html = await fetchAsText(url);
	fs.writeFileSync(file, html);
	logEnd(html);
}

export function getFile(file)
{
	logStart(file);
	const out = fs.readFileSync(file).toString();
	logEnd(out);
	return out;
}

export function getObjFromFile(file)
{
	logStart(file);
	const obj = JSON.parse(getFile(file));
	logEnd(obj);
	return obj;
}

export function writeFile(file, str)
{
	logStart(file);
	fs.writeFileSync(file, str);
	logEnd();
}

const cacheDir = "./cache";
const ttl = 1000 * 60 * 60 * 24 * 7; //1 week

export function mkDir(dir)
{
	logStart(dir);
	if(!fs.existsSync(dir))
	{
		fs.mkdirSync(dir);
	}
	logEnd();
}

function isExpired(file)
{
	logStart(file);
	const stats = fs.statSync(file);
	const modified = new Date(stats.mtime).getTime();
	const expires = modified + ttl;

	if(expires <= modified)
	{
		logEnd(true);
		return true;
	}
	else
	{
		logEnd(false);
		return false;
	}
}

export function exists(file)
{
	logStart(file);
	const exists = fs.existsSync(file);
	logEnd(exists);
	return exists;
}

export async function fetchAsText(url, doCache = true)
{
	logStart(url, doCache);
	const matches = url.match(/\/[^\/]+/ig);
	const fileCandidate = matches[matches.length - 1].slice(1);
	let file = fileCandidate;

	if(!fileCandidate.match(/\.\w+/))
	{
		file = fileCandidate + ".html";
	}

	mkDir(cacheDir);
	const cache = cacheDir + "/" + file;

	if(doCache && exists(cache))
	{
		//Cache Exists
		log.trace("Cache Exists");
		if(isExpired(cache))
		{
			//Cache Exists & Expired
			log.info("Cache expiring for " + url);
			fs.unlinkSync(cache);
		}
		else
		{
			log.trace("Cache not expired");
			//Cache Exists & Not Expired
			const out = getFile(cache);
			logEnd(out);
			return out;
		}
	}

	log.trace("Fetching URL");
	const response = await fetch(url);
	const html = await response.text();

	if(doCache)
	{
		writeFile(cache, html);
	}

	logEnd(html);
	return html;
}

function repeat(str, times)
{
	logStart(str, times);
	let ret = "";

	for(let x = 0; x < times; x++)
	{
		ret += str;
	}

	logEnd(ret);
	return ret;
}

function sanitiseString(str)
{
	logStart(str);
	const out = str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, "").trim();
	logEnd(out);
	return out;
}

const ulCorner = "╔";
const urCorner = "╗";
const llCorner = "╚";
const lrCorner = "╝";
const horiz = "═";
const vert = "║";
const lVert = "╠";
const rVert = "╣";
const all = "╬";

function box(strArr)
{
	logStart(strArr);
	if(!Array.isArray(strArr) && strArr.includes("\n"))
	{
		strArr = strArr.split("\n");
	}

	let longestString = "";

	for(let x = 0; x < strArr.length; x++)
	{
		const str = sanitiseString(strArr[x]);

		if(str.length > longestString.length)
		{
			longestString = str;
		}
	}

	const normalLine = repeat(horiz, longestString.length);

	console.log(ulCorner + normalLine + urCorner);

	for(let x = 0; x < strArr.length; x++)
	{
		const dirtyStr = strArr[x].trim();
		const cleanStr = sanitiseString(dirtyStr);
		//console.log(`Dirty: ${dirtyStr.length}'${dirtyStr}'`);
		//console.log(`Clean: ${cleanStr.length}'${cleanStr}'`);

		console.log(vert + dirtyStr + repeat(" ", longestString.length - cleanStr.length) + vert);
	}

	console.log(llCorner + normalLine + lrCorner);
	logEnd();
}

const disallowed = ["▣"];

export function sanitise(str)
{
	logStart(str);
	for(const remove of disallowed)
	{
		str = str.replaceAll(remove, "");
	}

	let out = str.replaceAll(/(^\s+|\s+$)/g, "");
	out = out.replaceAll(/(\s\s+)/g, " ");

	logEnd(out);
	return out;
}

/*
 NOTE: Using this system, make sure the string itself contains the specified characters and that the string itself contains \d, \w, \s, etc.  You will likely have to double-escape everything in the regex.  You do not need to escape the specifiers listed here.

 Multi Data - a,,b,,c[[regex w/ capture groups for each header]] - a,,b,,c part is variable number of headers; based on order, each capture group is mapped to its respective header
 Split - {{regex w/o capture groups}} - data becomes split into array using regex as delimeter
 Map - <<regex w/ 2 capture groups>> - data becomes object with capture group 1 as key, capture group 2 as value
 Transform - //regex w/ 1 capture group\\ - data becomes capture group 1

 Split and map can be used together.  Note that doing this overrides split's return type of array to become object
 {{regex w/o capture groups}}<<regex w/2 capture groups>> - data becomes object with data split into chunks by the first regex and key/value pairs pulled from the second regex's capture groups
 */

const multiDataRegex = /(.+?)\[\[(.+?)\]\]/;
const splitDataRegex = /(.+?)\{\{(.+?)\}\}/;
const mapDataRegex = /(.+?)<<(.+?)>>/;
const transformDataRegex = /(.+?)\/\/(.+?)\\\\/;

/*
 Header Object
 type: norm
 header: raw string
 type: multi
 dataRegex: regex for data
 headers: array of headers for data
 type: split
 header: string without delim
 delim: delimeter regex for splitting
 */

function processHeaders(headers)
{
	logStart(headers);
	const headersOut = [];

	for(const header of headers)
	{
		if(header === null)
		{
			headersOut.push(null);
			continue;
		}

		const obj = {};

		const multiDataMatches = header.match(multiDataRegex);
		const splitDataMatches = header.match(splitDataRegex);
		const mapDataMatches = header.match(mapDataRegex);
		const transformDataMatches = header.match(transformDataRegex);

		if(mapDataMatches && mapDataMatches.length === 3)
		{
			const mapDataStr = mapDataMatches[2];
			const mapDataRegex = new RegExp(mapDataStr);
			obj.map = mapDataRegex;
		}

		if(transformDataMatches && transformDataMatches.length === 3)
		{
			obj.type = "transform";
			const transfomDataStr = transformDataMatches[2];
			const transformRegex = new RegExp(transfomDataStr);
			obj.transform = transformRegex;
			obj.header = transformDataMatches[1];
		}
		else if(multiDataMatches && multiDataMatches.length === 3)
		{
			obj.type = "multi";
			const headerString = multiDataMatches[1];
			const colRegex = new RegExp(multiDataMatches[2]);
			obj.dataRegex = colRegex;
			obj.headers = headerString.replace(multiDataRegex, "").split(",,");
		}
		else if(splitDataMatches && splitDataMatches.length === 3)
		{
			obj.type = "split";
			const headerString = splitDataMatches[1];
			const delim = splitDataMatches[2];
			const delimRegex = new RegExp(delim);
			obj.header = headerString;
			obj.delim = delimRegex;
		}
		else
		{
			obj.type = "norm";
			obj.header = header;
		}

		headersOut.push(obj);
	}

	logEnd(headersOut);
	return headersOut;
}

function putDataInObject(dataArr, headerObjArr, destObj)
{
	logStart(dataArr, headerObjArr, destObj);
	if(dataArr.length !== headerObjArr.length)
	{
		//throw `Data and headers do not match: ${dataArr.length} for data vs ${headerObjArr.length} for headers`;
	}

	for(let x = 0; x < dataArr.length; x++)
	{
		const data = dataArr[x];
		const headerObj = headerObjArr[x];

		if(!headerObj)
		{
			continue;
		}

		switch(headerObj.type)
		{
			case "transform":
				if(!data.match(headerObj.transform))
				{
					console.log();
					console.log(chalk.red("Error") + ": Data does not match transform regex");
					console.log("Data: ",data);
					console.log("Header: ", headerObj);
					process.exit(0);
				}
				destObj[headerObj.header] = data.match(headerObj.transform)[1];
				break;
			case "multi":
				const dataRegex = headerObj.dataRegex;
				const headers = headerObj.headers;
				const matches = data.match(dataRegex);

				for(let x = 0; x < headers.length; x++)
				{
					const data = matches[x + 1];
					const header = headers[x];
					destObj[header] = data;
				}
				break;
			case "split":
				const header2 = headerObj.header;
				const delim = headerObj.delim;
				const dataArr = data.split(delim);

				if(headerObj.map)
				{
					if(!destObj[header2])
					{
						destObj[header2] = {};
					}

					for(const data2 of dataArr)
					{
						const matches = data2.match(headerObj.map);

						if(matches)
						{
							destObj[header2][matches[1]] = matches[2];
						}
						else
						{
							destObj[header2] = dataArr;
							break;
						}
					}
				}
				else
				{
					destObj[header2] = dataArr;
				}

				break;
			case "norm":
				const header3 = headerObj.header;
				destObj[header3] = data;
				break;
			default:
				throw "Invalid header type: " + header.type;
		}
	}

	logEnd(destObj);
}

export function rowToArray(row, unknownDataProcessor = null)
{
	logStart(row, unknownDataProcessor);
	const $ = load(row);
	const cols = [];
	row = $(row).children();

	for(let x = 0; x < row.length; x++)
	{
		const col = row[x];
		let data = sanitise($(col).text());
		let html = $(col).html();

		if(unknownDataProcessor)
		{
			const processed = unknownDataProcessor(x + 1, html, data);

			if(processed !== html)
			{
				data = processed;
			}
		}

		cols.push(data);
	}

	logEnd(cols);
	return cols;
}

export function rowToObj(row, headers, unknownDataProcessor = null)
{
	logStart(row, headers, unknownDataProcessor);
	const obj = {};
	const cols = rowToArray(row, unknownDataProcessor);
	putDataInObject(cols, headers, obj);
	logEnd(obj);
	return obj;
}

export function rowsToArrayOfObj(rows, headers, unknownDataProcessor = null)
{
	logStart(rows, headers, unknownDataProcessor);
	const out = [];

	for(const row of rows)
	{
		out.push(rowToObj(row, headers, unknownDataProcessor));
	}

	logEnd(out);
	return out;
}

export function tableToArrayOfObj(table, rawHeaders, unknownDataProcessor = null, rowSelector = "tbody tr")
{
	logStart(table, rawHeaders, unknownDataProcessor, rowSelector);
	const headers = processHeaders(rawHeaders);
	const $ = load(table);
	const rows = $(table).find(rowSelector);
	const objs = rowsToArrayOfObj(rows, headers, unknownDataProcessor);
	logEnd(objs);
	return objs;
}

export function generateCsv(objArr, objProcessor = null, qualifier = "\"")
{
	logStart(objArr, objProcessor, qualifier);
	let out = "";
	const size = Object.keys(objArr[0]).length;
	const headers = [];

	for(const header of Object.keys(objArr[0]))
	{
		headers.push(header);
	}

	out += qualifier + headers.join(qualifier + "," + qualifier) + qualifier + "\n";

	for(const obj of objArr)
	{
		const row = [];

		for(const header of headers)
		{
			const data = obj[header];

			if(typeof data === "object")
			{
				row.push(
					qualifier + objProcessor(header, data).replaceAll(new RegExp(qualifier, "ig"), "") + qualifier);
			}
			else
			{
				row.push(qualifier + obj[header].replaceAll(new RegExp(qualifier, "ig"), "") + qualifier);
			}
		}

		if(row.length !== size)
		{
			throw "Row length " + row.length + " does not match csv size " + size;
		}

		out += row.join(",") + "\n";
	}

	logEnd(out);
	return out;
}

export function rearrangeObjs(objs, arrangement)
{
	logStart(objs, arrangement);
	for(let x = 0; x < objs.length; x++)
	{
		objs[x] = rearrangeObj(objs[x], arrangement);
	}
	logEnd(objs);
	return objs;
}

export function rearrangeObj(obj, arrangement)
{
	logStart(obj, arrangement);
	let objOut = {};

	for(const key of arrangement)
	{
		objOut[key] = obj[key];
	}

	logEnd(objOut);
	return objOut;
}

const EMPTY_REGEX = /^\s*$/;

export function isEmptyString(str)
{
	logStart(str);
	const empty = !str || str === null || str === undefined || str.match(EMPTY_REGEX);
	logEnd(empty);
	return empty;
}

export function arrayToString(arr, separator = ", ")
{
	logStart(arr, separator);

	if(!arr)
	{
		log.trace("End arrayToString: No arr");
		return arr;
	}

	if(!Array.isArray(arr))
	{
		log.trace("End arrayToString: Not an array");
		return arr;
	}

	const out = arr.join(separator);
	logEnd(out);
	return out;
}

export function addFieldToObjects(arr, name, value)
{
	logStart(arr, name, value);
	if(typeof value === "function")
	{
		for(const obj of arr)
		{
			obj[name] = value(obj);
		}
	}
	else
	{
		for(const obj of arr)
		{
			obj[name] = value;
		}
	}
	logEnd(arr);
}

export function removeNonwordCharacters(str)
{
	logStart(str);
	str = str.replaceAll(/[^w]/ig, "");
	logEnd(str);
	return str;
}

const myCustomLevels = {
	levels: {
		fatal: 0,
		error: 1,
		warn : 2,
		info : 3,
		debug: 4,
		trace: 5,
		data : 6
	},
	colors: {
		fatal: "magenta",
		error: "red",
		warn : "yellow",
		info : "blue",
		debug: "cyan",
		trace: "green",
		data : "orange"
	}
};

let padLength = 0;

for(const level in myCustomLevels.levels)
{
	if(level.length > padLength)
	{
		padLength = level.length;
	}
}

function padLevel(level)
{
	const matches = level.match(new RegExp("(?:\\x1B\\[\\d\\dm)?(\\w+)\\s*(?:\\x1B\\[\\d\\dm)?", ""));
	const match = matches[1];
	let levelCopy = match;

	while(levelCopy.length < padLength)
	{
		levelCopy = " " + levelCopy;
	}

	return level.replace(match, levelCopy);
}

const myformat = winston.format.combine(winston.format.timestamp({format: "YYYY-MM-DD hh:mm:ss.SSS A"}),
                                        winston.format.align(), winston.format.splat(), winston.format.prettyPrint(),
                                        winston.format.printf(
	                                        info => `[${info.timestamp}] ${padLevel(info.level)}: ${info.message}`));

const myformatWithColors = winston.format.combine(winston.format.colorize(), myformat);

winston.addColors(myCustomLevels.colors);

const transports = [new winston.transports.Console({
	                                                   format: myformatWithColors,
	                                                   level : "info"
                                                   }), new winston.transports.File({
	                                                                                   options : {flags: "w"},
	                                                                                   format  : myformat,
	                                                                                   filename: "trace.log",
	                                                                                   level   : "trace"
                                                                                   }), new winston.transports.File({
	                                                                                                                   options : {flags: "w"},
	                                                                                                                   format  : myformat,
	                                                                                                                   filename: "data.log",
	                                                                                                                   level   : "data"
                                                                                                                   })];

export const log = winston.createLogger({
	                                        levels          : myCustomLevels.levels,
	                                        transports      : transports,
	                                        handleExceptions: false,
	                                        handleRejections: false,
	                                        exitOnError     : true
                                        });

function getStackTrace()
{
	const error = new Error();
	const stack = error.stack
	                   .split("\n")
	                   .slice(2)
	                   .map((line) => line.replace(/\s+at\s+/, ""));
	return stack;
}

function getStackAt(num)
{
	return getStackTrace()[num];
}

function getCaller()
{
	return getStackAt(2);
}

export function sleep(amt)
{
	return new Promise(function(resolve)
	                   {
		                   setTimeout(resolve, amt);
	                   });
}

const argLengthDataThreshold = 50;
const argLengthIgnoreThreshold = 1000;
const logInspect = {
	depth     : 2,
	colors    : false,
	showHidden: false,
	compact   : true
};

function logArgs(...args)
{
	const use = [];
	for(const arg of args)
	{
		if(arg && typeof arg === "object")
		{
			const inspection = util.inspect(arg, logInspect);

			if(inspection.length <= argLengthIgnoreThreshold)
			{
				log.data(inspection);
			}

			continue;
		}
		else if(arg && arg.toString().length > argLengthIgnoreThreshold)
		{
			continue;
		}
		else if(arg && arg.toString().length > argLengthDataThreshold)
		{
			log.data(arg);
			continue;
		}
		else
		{
			use.push(`"${(arg ? arg.toString() : arg)}"`);
			continue;
		}
	}

	return use.join(", ");
}

export function logStart(...args)
{
	const name = getStackAt(2);
	const argsOut = logArgs(args);
	const out = `Begin ${name}(${argsOut})`;
	log.trace(out);
}

export function logEnd(returnValue = null)
{
	const name = getStackAt(2);
	let out = `End ${name}`;
	const argOut = logArgs(returnValue);

	if(argOut)
	{
		out += `: ${argOut}`;
	}

	log.trace(out);
}

export function writeJson(file, obj, pretty = true)
{
	let json;

	if(pretty)
	{
		json = JSON.stringify(obj, null, "\t");
	}
	else
	{
		json = JSON.stringify(obj);
	}

	fs.writeFileSync(file, json);
}

export function getPrettyArray(arr, separator = " ", elementColor, separatorColor)
{
	const colored = arr.map((ele) => color(ele, elementColor));
	const str = colored.join(color(separator, separatorColor));
	return str;
}

function splitSelectors(str, splitBy = ">")
{
	const split = str.split(" > ").map(ele => ele.trim());
	return split;
}

export function analyzeSelector($, selector, separator = ">")
{
	const split = splitSelectors(selector, separator);
	let previousCount;

	for(let x = 0; x < split.length; x++)
	{
		const selected = split.filter((ele, index) => index <= x);
		const count = $(selected.join(separator)).length;

		if(count === 0 && previousCount >= 1)
		{
			console.log("-----------------------------------------------------");
		}

		let colored = getPrettyArray(selected, " > ", (count >= 1 ? "green" : "red"), "blue");
		;

		console.log(colored + (count >= 1 ? ": " + chalk.yellow(count) : ""));
		previousCount = count;
	}
}
