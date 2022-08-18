import fs                                                from "fs";
import {debug, color, fetchAsFile, getFile, fetchAsText, sanitise,tableToArrayOfObj} from "./util.js";
import {load}                                            from "cheerio";
import ora from "ora";

const monsterUrl = "https://mhrise.kiranico.com/data/monsters?view=lg";
const monstersPage = "monsters.html";

let spinner = ora("Fetching monster list");
spinner.start();
const html = await fetchAsText(monsterUrl, {
	cache   : monstersPage,
	cacheTtl: "5 minutes"
});
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
	const monsterHtml = await fetchAsText(url, {
		cache   : name + ".html",
		cacheTtl: "1 hour"
	});
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
spinner = ora("Writing monster data to file");
spinner.start();
fs.writeFileSync("monsters.json",JSON.stringify(monsters,null,"\t"));
spinner.succeed("Monster data written to file");
