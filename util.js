import fs    from "fs";
import fetch from "node-fetch";
import util  from "util";
import chalk from "chalk";

export function debug(name,obj,verbose=false,depth=1,hidden=false)
{
	const type = typeof obj;

	switch( type )
	{
		case "object":
			console.log(`${color(name,"blue")}\n\t${color("Type","red")}: ${type}`);
			console.log(`\t${color("Constructor Class","red")}: ${obj.constructor.toString().match(/class\s(.+?)\s/i)[1]}`);
			console.log(`\t${color("Prototype","red")}: `,Object.getPrototypeOf(obj));
			try
			{
				console.log(`\t${color("JSON","red")}: ${JSON.stringify(obj)}`);
			}
			catch(err)
			{
				console.log(`\t${color("JSON","red")}: Unavailable`);
			}

			if( verbose )
			{
				console.log(`\t\t${color("----------==========","yellow")} ${color("<","magenta")}${name}${color(">","magenta")} ${color("=========----------","yellow")}`);
				console.log(util.inspect(obj,{depth:depth,colors:true,showHidden:hidden,compact:true}).replaceAll(/^/gm,"\t\t\t"));
				console.log(`\t\t${color("----------==========","yellow")} ${color("</","magenta")}${name}${color(">","magenta")} ${color("=========----------","yellow")}`);
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

export function color(str,...tags)
{
	let out = null;

	for( let tag of tags )
	{
		tag = tag.replaceAll(/\s/ig,"");
		let func = null;
		let bright = false;
		let background = false;
		let color = null;

		if( tag.match(/bright/ig) )
		{
			bright = true;
			tag = tag.replace(/bright/ig,"");
		}

		if( tag.match(/(bg|background)/ig) )
		{
			background = true;
			tag = tag.replace(/(bg|background)/ig,"");
		}

		let funcName = "";

		if( background )
		{
			funcName += "bg";
			funcName += tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase();
		}
		else
		{
			funcName += tag.toLowerCase();
		}

		if( bright )
		{
			funcName += "Bright";
		}

		if( chalk[funcName] )
		{
			func = chalk[funcName];
		}
		else
		{
			throw "Invalid chalk function: " + tag;
		}

		if( !out )
		{
			out = func( str );
		}
		else
		{
			out = func( out );
		}
	}

	return out;
}

/*
	Settings
	cache - filename of cache file to use
	cacheTtl - cache time to live
 */

export async function fetchAsFile(url,file,settings=null)
{
	const html = await fetchAsText(url);
	fs.writeFileSync(file,html);
}

export function getFile(file)
{
	return fs.readFileSync(file).toString();
}

export function getObjFromFile(file)
{
	return JSON.parse(getFile(file));
}

export function writeFile(file,str)
{
	fs.writeFileSync(file,str);
}

export async function fetchAsText(url,settings=null)
{
	let cache = null;

	if( settings )
	{
		if( settings.cache )
		{
			cache = "cache/"+settings.cache;

			if( !fs.existsSync("./cache"))
			{
				fs.mkdirSync("./cache");
			}

			if( fs.existsSync( cache ) )
			{
				if( settings.cacheTtl )
				{
					const ttl = settings.cacheTtl;
					const stats = fs.statSync( cache );
					const modified = stats.mtime;
					let expires = new Date(modified);

					const periods = {
						day: function(amt){expires.setDate(expires.getDate()+amt);},
						minute: function(amt){expires.setMinutes(expires.getMinutes()+amt);},
						second: function(amt){expires.setSeconds(expires.getSeconds()+amt);},
						hour: function(amt){expires.setHours(expires.getHours()+amt);},
						month: function(amt){expires.setMonth(expires.getMonth()+amt);},
						year: function(amt){expires.setFullYear(expires.getFullYear()+amt);},
						ms: function(amt){expires.setMilliseconds(expires.getMilliseconds()+amt);}
					};

					const dayMatches = ttl.match(/(\d+)\s*days?/i);

					for( const period of Object.keys(periods))
					{
						const add = periods[period];
						const regex = new RegExp(`(\\d+)\\s*${period}s?`,"i");
						const matches = ttl.match( regex );

						if( matches && matches.length === 2 )
						{
							add(parseInt(matches[1]));
						}
					}

					if( modified.getTime() === expires.getTime() )
					{
						console.log("Last Modified: ",modified);
						console.log("Expires: ",expires);
						throw "Invalid TTL: " + ttl;
					}

					if( expires.getTime() <= modified.getTime() )
					{
						console.log(color("Cache expiring for " + cache,"magenta"));
						await fetchAsFile(url,cache);
					}
				}

				return getFile( cache );
			}
		}
	}

	const response = await fetch( url );
	const html = await response.text();

	if( cache )
	{
		writeFile(cache,html);
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
