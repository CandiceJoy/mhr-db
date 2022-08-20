import chalk                                                                                       from "chalk";
import {load}                                                                                      from "cheerio";
import cliProgress                                                                                 from "cli-progress";
import fs                                                                                          from "fs";
import {
	getBlankLine, insert, insertMultiple, initCsv, writeCsv
} from "./csv-utils.js";
import {
	addFieldToObjects, fetchAsText, isEmptyString, rearrangeObjs, sanitise, tableToArrayOfObj, writeJson
} from "./util.js";

const baseUrl = "https://mhrise.kiranico.com/data/quests?view=";
const questTypes = ["event", "mystery", "follower", "hub_master", "hub_high", "hub_low", "village", "arena",
                    "training"];
const urls = [];

console.log(chalk.yellow("Gathering list of quests"));

let bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
bar.start(questTypes.length, 0);

for(const questType of questTypes)
{
	const url = baseUrl + questType;
	const html = await fetchAsText(url);
	const $ = load(html);
	const links = $("td > a");

	for(const link of links)
	{
		const href = $(link).attr("href");
		urls.push(href);
	}

	bar.increment();
}

bar.stop();

console.log(chalk.yellow("Gathering drops"));

bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
bar.start(urls.length, 0);

function prettify(objs)
{
	for(const obj of objs)
	{
		if(!obj.Amount)
		{
			console.log(obj);
		}

		const amountMatches = obj.Amount.match(/x(\d+)/);
		obj.Amount = parseInt(amountMatches[1]);

		const chanceMatches = obj.Chance.match(/(\d+)%/);
		obj.Chance = parseInt(chanceMatches[1]) / 100;
	}

	return objs;
}

let data = [];

for(const url of urls)
{
	const html = await fetchAsText(url);

	fs.writeFileSync("current.html", html);

	try
	{
		const $ = load(html);
		const title = sanitise($("article > div > header > h1").text());
		//console.log("Title: '"+ title+"'");
		const table = $("div.basis-1\\/2 > div > div > div > table")[0];
		//console.log( $(table).html() );
		const drops = prettify(tableToArrayOfObj(table, ["Drop", "Type", "Amount", "Chance"]));

		const titleMatches = title.match(/(.+)\s(\d+).\s(.+)/);
		let questType = titleMatches[1].replace(/\s?quests?\s?/i,"");

		const questLevel = titleMatches[2];
		let questName = titleMatches[3];

		let questRank = "LR";

		const rankRegex = /\s?([HM]R)\s?/;

		const rankMatches1 = questType.match( rankRegex );
		const rankMatches2 = questName.match(rankRegex);

		if( rankMatches1 )
		{
			questRank = rankMatches1[1];
			questType = questType.replace(rankRegex,"Normal");
		}

		if( rankMatches2 )
		{
			questRank = rankMatches2[1];
			questName = questName.replace(rankRegex,"");
		}

		if( questRank === "LR" && questType !== "Village" && questLevel >= 4 )
		{
			questRank = "HR";
		}

		if( questType === "Follower" )
		{
			questRank = "MR";
		}

		const obj = {
			"Quest": questName,
			"Quest Type": questType,
			"Quest Level": questLevel,
			"Quest Rank": questRank,
			"Drops": drops
		};

		data.push(obj);
		bar.increment();
		//await sleep( 200 );
	}
	catch( err )
	{
		console.log( chalk.red( "Error") + ": " + chalk.blue( url) + " - " + chalk.magenta(err.message) );
		process.exit( 1 );
	}
}

bar.stop();
writeJson("quests.json",data);

const headers = ["Quest", "Quest Type", "Quest Level", "Quest Rank", "Drop", "Type", "Amount", "Chance"];
let csv = initCsv(headers);

for( const obj of data )
{
	const main = getBlankLine();
	const others = [];
	insertMultiple(main,1,4,obj);

	const drops = obj["Drops"];

	for( const drop of drops )
	{
		const line = getBlankLine();
		insertMultiple( line,5,8, drop );
		others.push(line);
	}

	csv.push(main);
	csv = csv.concat( others );
}

writeCsv("quests.csv",csv);
