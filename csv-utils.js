import fs from "fs";

let headers;

export function getBlankLine()
{
	const out = [];

	for(const header of headers)
	{
		out.push("");
	}

	return out;
}

function checkHeaders()
{
	if( !headers )
	{
		throw "Headers not set; please call initCsv first";
	}
}

export function insert(arr, header, value)
{
	checkHeaders();

	let index = null;

	for(let x = 0; x < headers.length; x++)
	{
		if(headers[x] === header)
		{
			index = x;
			break;
		}
	}

	if(index === null)
	{
		throw "Cannot find header: " + header;
	}

	const old = arr[index];
	arr[index] = value;
	return old;
}

export function insertMultiple(arr,startCol, endCol, data)
{
	checkHeaders();

	for( let x = startCol-1; x < endCol; x++ )
	{
		const header = headers[x];
		arr[x] = data[header];
	}
}

export function getValue(arr, header)
{
	let index = null;

	for(let x = 0; x < headers.length; x++)
	{
		if(headers[x] === header)
		{
			index = x;
			break;
		}
	}

	if(index === null)
	{
		throw "Cannot find header: " + header;
	}

	return arr[index];
}

export function initCsv(headersIn)
{
	headers = headersIn;
	let csv = [headers];
	return csv;
}

export function qualify( arr, qualifier="\"" )
{
	for( let x = 0; x < arr.length; x++ )
	{
		for( let y = 0; y < arr[x].length; y++ )
		{
			arr[x][y] = `${qualifier}${arr[x][y]}${qualifier}`;
		}
	}
}

export function writeCsv( file, csv, doQualify=true )
{
	if( doQualify )
	{
		qualify(csv);
	}

	fs.writeFileSync( file, csv.join("\n") );
}
