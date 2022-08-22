import {load}                                                       from "cheerio";
import cliProgress                                                  from "cli-progress";
import {getBlankLine, initCsv, insert, insertMultiple, writeCsv}    from "./csv-utils.js";
import {color, fetchAsText, sanitise, tableToArrayOfObj, writeJson} from "./util.js";

const baseUrl = "https://mhworld.kiranico.com/items?type=1";
const listHtml = await fetchAsText(baseUrl);
let $ = load(listHtml);

const selector = "#app > div > div > div.content-w > div.content-i > div.content-box.p-4 > div:nth-child(3) > div > div.element-box-tp > div.row > div > a";
//analyzeSelector($, selector);

const rows = $(selector);
const items = [];

console.log(color("Gathering Item Data", "yellow"));
let bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
bar.start(rows.length, 0);

for(const row of rows)
{
	const url = $(row).attr("href");
	const html = await fetchAsText(url);
	$ = load(html);
	const tables = $("table.table:not(.w-100)");

	if(tables.length !== 7)
	{
		console.log(url);
	}

	const name = sanitise(
		$("#app > div > div > div.content-w > div.content-i > div.content-box.p-4 > div.projects-list > div > div.project-head > div.project-title > h5 > div > div.align-self-center")
			.text());
	//   //(\d+)\\
	const stats = tableToArrayOfObj(tables[0], ["Rarity\/\/Rarity\\s(\\d+)\\sRarity\\\\", "Stack Size\/\/(\\d+)\\\\",
	                                            "Buy Price\/\/(\\d+)\\\\", "Sell Price\/\/(\\d+)\\\\"]);
	const monsters = tableToArrayOfObj(tables[1],
	                                   ["Rank//(\\w+)\\sRank\\\\", "Monster", "Drop Type", "Amount//(\\d+)\\\\",
	                                    "Chance//(\\d+)\\\\"]);
	const quests = tableToArrayOfObj(tables[2],
	                                 ["Quest Level,,Quest Name[[(\\d+)\\s(.+)]]", "Drop Type", "Amount//(\\d+)\\\\",
	                                  "Chance//(\\d+)\\\\"]);
	const tailraiders = tableToArrayOfObj(tables[3],
	                                      ["Rank//(\\w+)\\sRank\\\\", "Location", "Level//(\\d+)\\\\", null, "Source",
	                                       "Amount//(\\d+)\\\\", "Chance//(\\d+)\\\\"]);
	const gathering = tableToArrayOfObj(tables[4], ["Rank//(\\w+)\\sRank\\\\", "Location", "Type", "Amount//(\\d+)\\\\",
	                                                "Chance//(\\d+)\\\\"]);
	const weaponUses = tableToArrayOfObj(tables[5], ["Name", "Amount//(\\d+)\\\\"]);
	const armorUses = tableToArrayOfObj(tables[6], ["Name", "Amount//(\\d+)\\\\"]);


	items.push({
		           name       : name,
		           stats      : stats,
		           monsters   : monsters,
		           quests     : quests,
		           tailraiders: tailraiders,
		           gathering  : gathering,
		           uses       : weaponUses.map((ele) =>
		                                        {
			                                        ele.Type = "Weapon";
			                                        return ele;
		                                        }).concat(armorUses.map((ele) =>
		                                                          {
			                                                          ele.Type = "Armor";
			                                                          return ele;
		                                                          }))
	           });

	bar.increment();
}

bar.stop();
writeJson("mhw-items.json", items);

const headers = ["Name", "Rarity", "Stack Size", "Buy Price", "Sell Price", "Source Type", "Rank", "Level",
                 "Source", "Method", "Amount", "Chance", "Use Type", "Use Name", "Use Amount"];
initCsv(headers);
let csv = [headers];

/*
 monsters   : monsters,
 quests     : quests,
 tailraiders: tailraiders,
 gathering  : gathering,
 uses       :
 */

for(const item of items)
{
	const main = getBlankLine();
	const others = [];

	insert(main,"Name",item.name);
	insertMultiple(main,2,5,item.stats[0]);

	for( const monster of item.monsters )
	{
		const line = getBlankLine();
		insert(line,"Source Type", "Monster");
		insert(line,"Source", monster.Monster);
		insert(line,"Rank",monster.Rank);
		insert(line,"Method", monster["Drop Type"]);
		insert(line,"Amount", monster.Amount);
		insert(line,"Chance",monster.Chance);
		others.push(line);
	}

	for( const quest of item.quests )
	{
		const line = getBlankLine();
		insert(line,"Source Type", "Quest");
		insert(line,"Level", quest["Quest Level"]);
		insert(line,"Source",quest["Quest Name"]);
		insert(line,"Method", quest["Drop Type"]);
		insert(line,"Amount", quest.Amount);
		insert(line,"Chance",quest.Chance);
		others.push(line);
	}

	for( const tailraider of item.tailraiders )
	{
		const line = getBlankLine();
		insert(line,"Source Type", tailraider.Source);
		insert(line,"Rank", tailraider.Rank);
		insert(line,"Source",tailraider.Location);
		insert(line,"Level", tailraider.Level);
		insert(line,"Amount", tailraider.Amount);
		insert(line,"Chance",tailraider.Chance);
		others.push(line);
	}

	for( const gather of item.gathering )
	{
		const line = getBlankLine();
		insert(line,"Source Type", "Gathering");
		insert(line,"Rank", gather.Rank);
		insert(line,"Source",gather.Location);
		insert(line,"Method", gather.Type);
		insert(line,"Amount", gather.Amount);
		insert(line,"Chance",gather.Chance);
		others.push(line);
	}

	for( const use of item.uses )
	{
		const line = getBlankLine();
		insert(line,"Use Type",use.Type);
		insert(line,"Use Name", use.Name);
		insert(line, "Use Amount", use.Amount);
		others.push(line);
	}

	csv.push(main);
	csv = csv.concat(others);
}

writeCsv("mhw-items.csv",csv);
