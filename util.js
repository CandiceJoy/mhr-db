import chalk  from "chalk";
import {load} from "cheerio";
import fs     from "fs";
import fetch  from "node-fetch";
import util   from "util";

export function debug(name, obj, verbose = false, depth = 1, hidden = false)
{
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

	return out;
}

/*
 Settings
 cache - filename of cache file to use
 cacheTtl - cache time to live
 */

export async function fetchAsFile(url, file, settings = null)
{
	const html = await fetchAsText(url);
	fs.writeFileSync(file, html);
}

export function getFile(file)
{
	return fs.readFileSync(file).toString();
}

export function getObjFromFile(file)
{
	return JSON.parse(getFile(file));
}

export function writeFile(file, str)
{
	fs.writeFileSync(file, str);
}

export async function fetchAsText(url, settings = null)
{
	let cache = null;

	if(settings)
	{
		if(settings.cache)
		{
			cache = "cache/" + settings.cache;

			if(!fs.existsSync("./cache"))
			{
				fs.mkdirSync("./cache");
			}

			if(fs.existsSync(cache))
			{
				if(settings.cacheTtl)
				{
					const ttl = settings.cacheTtl;
					const stats = fs.statSync(cache);
					const modified = stats.mtime;
					let expires = new Date(modified);

					const periods = {
						day   : function(amt)
						{
							expires.setDate(expires.getDate() + amt);
						},
						minute: function(amt)
						{
							expires.setMinutes(expires.getMinutes() + amt);
						},
						second: function(amt)
						{
							expires.setSeconds(expires.getSeconds() + amt);
						},
						hour  : function(amt)
						{
							expires.setHours(expires.getHours() + amt);
						},
						month : function(amt)
						{
							expires.setMonth(expires.getMonth() + amt);
						},
						year  : function(amt)
						{
							expires.setFullYear(expires.getFullYear() + amt);
						},
						ms    : function(amt)
						{
							expires.setMilliseconds(expires.getMilliseconds() + amt);
						}
					};

					const dayMatches = ttl.match(/(\d+)\s*days?/i);

					for(const period of Object.keys(periods))
					{
						const add = periods[period];
						const regex = new RegExp(`(\\d+)\\s*${period}s?`, "i");
						const matches = ttl.match(regex);

						if(matches && matches.length === 2)
						{
							add(parseInt(matches[1]));
						}
					}

					if(modified.getTime() === expires.getTime())
					{
						console.log("Last Modified: ", modified);
						console.log("Expires: ", expires);
						throw "Invalid TTL: " + ttl;
					}

					if(expires.getTime() <= modified.getTime())
					{
						console.log(color("Cache expiring for " + cache, "magenta"));
						await fetchAsFile(url, cache);
					}
				}

				return getFile(cache);
			}
		}
	}

	const response = await fetch(url);
	const html = await response.text();

	if(cache)
	{
		writeFile(cache, html);
	}

	return html;
}

function repeat(str, times)
{
	let ret = "";

	for(let x = 0; x < times; x++)
	{
		ret += str;
	}

	return ret;
}

function sanitiseString(str)
{
	return str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, "").trim();
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
}

const disallowed = ["▣"];

export function sanitise(str)
{
	for(const remove of disallowed)
	{
		str = str.replaceAll(remove, "");
	}

	return str.replaceAll(/(^\s+|\s+$)/g, "").replaceAll(/(\s\s+)/g, " ");
}

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

		if( transformDataMatches && transformDataMatches.length === 3 )
		{
			obj.type="transform";
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

	return headersOut;
}

function putDataInObject(dataArr, headerObjArr, destObj)
{
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
				if( !data.match(headerObj.transform ) )
				{
					console.log( data );
					console.log(headerObj);
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
}

export function rowToArray(row, unknownDataProcessor = null)
{
	const $ = load(row);
	const cols = [];
	row = $(row).children();

	for(let x = 0; x < row.length; x++)
	{
		const col = row[x];
		let data = sanitise($(col).text());
		let html = $(col).html();

		if( unknownDataProcessor )
		{
			const processed = unknownDataProcessor(x+1,html,data);

			if( processed !== html )
			{
				data = processed;
			}
		}

		cols.push(data);
	}

	return cols;
}

export function rowToObj(row, headers, unknownDataProcessor = null)
{
	const obj = {};
	const cols = rowToArray(row, unknownDataProcessor);
	putDataInObject(cols, headers, obj);
	return obj;
}

export function rowsToArrayOfObj(rows, headers, unknownDataProcessor = null)
{
	const out = [];

	for(const row of rows)
	{
		out.push(rowToObj(row, headers, unknownDataProcessor));
	}

	return out;
}

export function tableToArrayOfObj(table, rawHeaders, unknownDataProcessor = null, rowSelector = "tbody tr")
{
	const headers = processHeaders(rawHeaders);
	const $ = load(table);
	const rows = $(table).find(rowSelector);
	return rowsToArrayOfObj(rows, headers, unknownDataProcessor);
}

export function generateCsv(objArr,objProcessor=null,qualifier="\"")
{
	let out = "";
	const size = Object.keys( objArr[0] ).length;
	const headers = [];

	for( const header of Object.keys( objArr[0] ) )
	{
		headers.push( header );
	}

	out += qualifier + headers.join(qualifier+","+qualifier)+qualifier+"\n";

	for( const obj of objArr )
	{
		const row = [];

		for( const header of headers )
		{
			const data = obj[header];

			if( typeof data === "object" )
			{
				row.push(qualifier + objProcessor(header,data).replaceAll(new RegExp(qualifier,"ig"),"") + qualifier);
			}
			else
			{
				row.push( qualifier + obj[header].replaceAll(new RegExp(qualifier,"ig"),"") + qualifier );
			}
		}

		if( row.length !== size )
		{
			throw "Row length " + row.length + " does not match csv size " + size;
		}

		out += row.join(",")+"\n";
	}

	return out;
}

export function rearrangeObjs(objs, arrangement)
{
	for( let x = 0; x < objs.length; x++ )
	{
		objs[x] = rearrangeObj(objs[x],arrangement);
	}

	return objs;
}

export function rearrangeObj(obj,arrangement)
{
	let objOut = {};

	for( const key of arrangement )
	{
		objOut[key] = obj[key];
	}

	return objOut;
}

const EMPTY_REGEX = /^\s*$/;

export function isEmptyString( str )
{
	return str.match( EMPTY_REGEX );
}

export function arrayToString( arr, separator=", " )
{
	if( !arr )
	{
		return arr;
	}

	if( !Array.isArray( arr ) )
	{
		return arr;
	}

	return arr.join(separator);
}
