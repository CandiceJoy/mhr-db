import fs                                                                                             from "fs";
import {debug, color, fetchAsFile, getFile, fetchAsText, sanitise, tableToArrayOfObj, getObjFromFile} from "./util.js";
import {load}                                                                                         from "cheerio";
import ora from "ora";

const monsterUrl = "https://mhrise.kiranico.com/data/monsters?view=lg";
const monstersPage = "monsters.html";

let spinner = ora("Fetching monster list");
spinner.start();
const html = await fetchAsText(monsterUrl);
let $ = load(html);

const monsterTags = $(".group .text-center h3 a");
const monsters = [];

for(const monsterTag of monsterTags)
{
	//debug("Monster", monster,true);
	//debug("Child 2",monster.children[2],true);
	const name = sanitise(monsterTag.children[2].data);
	const link = monsterTag.attribs["href"];
	monsters.push({
		              name: name,
		              url : link
	              });
}

spinner.succeed("Monster list fetched");
spinner = ora("Fetching monster data");
spinner.start();

for(const monster of monsters)
{
	const name = monster.name;
	const url = monster.url;
	const monsterHtml = await fetchAsText(url);
	$ = load(monsterHtml);
	const tables = $("table");
	const physTable = tables[0];
	const partTable = tables[1];
	const ailmentTable = tables[3];
	const itemTable = tables[5];

	monster.physiology = tableToArrayOfObj(physTable,
	                                       ["Part", "State", "Sharp", "Blunt", "Ranged", "Fire", "Water", "Ice",
	                                        "Thunder", "Dragon", "Stun"]);
	monster.parts = tableToArrayOfObj(partTable, ["Part", "HP", "Break", "Extract"]);
	monster.ailments = tableToArrayOfObj( ailmentTable, ["Ailment","Buildup","Decay","damage","Duration","Other"] );
	monster.items = tableToArrayOfObj(itemTable,["Item","Rank", "Method","Target", "Amount", "Rate"]);
}
spinner.succeed("Monster data fetched");
spinner = ora("Writing monster data to JSON file");
spinner.start();
fs.writeFileSync("monsters.json",JSON.stringify(monsters,null,"\t"));

spinner.text = "Writing monster data to CSV file";

const monsters = getObjFromFile("monsters.json");
let weakness = "Monster,Part,State,Sharp,Blunt,Ranged,Fire,Water,Ice,Thunder,Dragon,Stun,Ailment,Buildup,Decay,Damage,Duration,Other\n";
let drops = "Monster,Item,Rank,Method,Target,Amount,Rate\n";

for( const monster of monsters )
{
	const physiology = monster.physiology;
	const items = monster.items;
	const ailments = monster.ailments;
	const parts = monster.parts;

	for( const row of physiology )
	{
		weakness += [monster.name].concat(Object.values(row)).join(",") + "\n";
	}

	for( const row of ailments )
	{
		weakness += [monster.name,"","","","","","","","","","",""].concat(Object.values(row)).join(",") + "\n";
	}

	for( const row of items )
	{
		drops += [monster.name].concat(Object.values(row)).join(",") + "\n";
	}
}

fs.writeFileSync("weaknesses.csv",weakness);
fs.writeFileSync("drops.csv",drops);
spinner.succeed("Monsters done");
