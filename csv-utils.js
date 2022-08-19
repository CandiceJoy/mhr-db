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

export function insert(arr, header, value)
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

	const old = arr[index];
	arr[index] = value;
	return old;
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

export function processCsvMulti(main, others, header, arr)
{
	for(const song of arr)
	{
		if(!getValue(headers, main, header))
		{
			insert(headers, main, header, song);
		}
		else
		{
			const line = getBlankLine();
			insert(headers, line, header, song);
			others.push(line);
		}
	}
}

export function setHeaders( headersIn )
{
	headers = headersIn;
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
