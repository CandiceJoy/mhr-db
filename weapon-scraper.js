import {load}                                                                   from "cheerio";
import {fetchAsText, isEmptyString, rearrangeObjs, sanitise, tableToArrayOfObj} from "./util.js";
import ora                                                                      from "ora";
import fs from "fs";

const baseUrl = "https://mhrise.kiranico.com/data/weapons?view=";
const startingWeapon = 0;
const numWeapons = 14;

const weaponTypes = ["Greatsword", "Sword & Shield", "Dual Blades", "Longsword", "Hammer", "Hunting Horn", "Lance",
                     "Gunlance", "Switch Axe", "Charge Blade", "Insect Glaive", "Bow", "Heavy Bowgun", "Light Bowgun"];

const elements = {
	1: "Fire",
	2: "Water",
	3: "Thunder",
	4: "Ice",
	5: "Dragon",
	6: "Poison",
	7: "Sleep",
	8: "Paralysis",
	9: "Blast"
};

const ammoTypeXlat = {
Nrm: "Normal",
	Prc: "Piercing",
	Spr: "Spread",
	Shr: "Shrapnel",
	Sti: "Sticky",
	Clu: "Cluster",
	Dem: "Demon",
	Amr: "Armor",
	Wyv: "Wyvern",
	Sli: "Slicing",
	"Fir/P.": "Piercing Fire",
	"Wat/P.": "Piercing Water",
	"Thn/P.": "Piercing Thunder",
	"Ice/P.": "Piercing Ice",
	"Dra/P.": "Piercing Dragon",
	Poi: "Poison",
	Par: "Paralysis",
	Exh: "Exhaust",
	Rec: "Recovery",
	Sle: "Sleep",
	Tra: "Tranq"
};

function processBowStats( $, text )
{
	const obj = {"Shot Types":[]};
	const arcMatches = text.match( /^(\w+)\s/i );
	obj["Arc Shot"] = arcMatches[1];
	text = text.replace(arcMatches[1] + " ","");

	const shotPattern = "(\\w+)\\sLevel\\s(\\d)";
	const shotMatches = text.match( new RegExp( shotPattern, "ig" ) );

	for( const shotMatch of shotMatches )
	{
		const matches = shotMatch.match( new RegExp( shotPattern, "i" ) );
		const shotType = {
			type: matches[1],
			level: matches[2]
		};
		obj["Shot Types"].push( shotType );
	}

	return obj;
}
function processBowgunStats( $, element )
{
	const obj = {
		"Ammo Types": []
	};
	const tables = element.find("table");
	let rows = [];

	for( const table of tables )
	{
		const elements = $(table).find("tr");
		rows = rows.concat( elements );
	}

	for( const row of rows )
	{
		const rowText = sanitise($(row).text() );
		const statMatches = rowText.match(/^deviation\s(.+?)\srecoil\s(.+?)\sreload\s(.+?)\s\w\w\w\s\d\s\d\s\d/i);
		const ammoPattern = "([a-z\\/\\.]+)\\s(\\d+)(?:\\s(\\d+)(?:\\s(\\d+))?)?";
		const ammoMatches = rowText.match(new RegExp(ammoPattern,"ig"));

		if( statMatches )
		{
			obj.Deviation = statMatches[1];
			obj.Recoil = statMatches[2];
			obj.Reload = statMatches[3];
		}

		if( ammoMatches )
		{
			for( const ammo of ammoMatches )
			{
				const matches = ammo.match(new RegExp( ammoPattern, "i"));
				const type = matches[1];

				for( let x = 2; x <= 4; x++)
				{
					if( matches.length > x && matches[x] )
					{
						if( !ammoTypeXlat[type] )
						{
							throw "Cannot find ammo type translate for " + type;
						}

						if( matches[x] && matches[x] >= 1 )
						{
							obj["Ammo Types"].push({
								                       type: ammoTypeXlat[type],
								                       level: x-1,
								                       magazine: matches[x]
							                       });
						}
					}
				}
			}
		}
	}

	//console.log(obj);
	//process.exit(0);

	return obj;
}

function processCoatings($, text)
{
	const coatingMatches = text.match(/(?:\s|^)(.+?)\scoating/ig);

	if(coatingMatches)
	{
		return coatingMatches.map((ele) => ele.replace(/^\s/, ""));
	}

	return text.replaceAll(/\scoating/ig, "");
}

function processSlots(html)
{
	const $ = load(html);
	const divs = $("div");
	//console.log(divs);
	const slotDiv = divs[0];
	const rampDiv = divs[1];
	let slots = [];
	let rampSlot = 0;
	const out = [];

	const slotImgs = $("img");

	if(slotImgs && slotImgs.length >= 1)
	{
		for(const img of slotImgs)
		{
			const src = img.attribs.src;
			const matches = src.match(/deco(\d)\.png/);
			slots.push(matches[1]);
		}

		slots = slots.sort((a, b) => b - a);

		if(slots.length > 0)
		{
			out.push(`Slots: ${slots.join("")}`);
		}
	}

	const rampImgs = $(rampDiv).find("img");

	if(rampImgs && rampImgs.length >= 1)
	{
		const src = rampImgs[0].attribs.src;
		rampSlot = src.match(/deco(\d)\.png/)[1];
		if(rampSlot > 0)
		{
			out.push(`Rampage Slot: ${rampSlot}`);
		}
	}

	return {
		slots      : slots.join(""),
		rampageSlot: rampSlot
	};
}

function processBonuses($, element, text)
{
	//console.log("Data: ", data);
	//console.log("Text: ", text);
	//process.exit(0);
	if(isEmptyString(text))
	{
		const img = element.find("img");
		const defenseBonusMatches = text.match(/Defense\sBonus\s+\+(\d+)\s?/);
		const affinityBonusMatches = text.match(/Affinity\s+([+-]\d+)%/);
		const bonuses = [];
		let found = false;

		if(img && img[0])
		{
			const image = img[0].attribs.src;
			const imageMatches = image.match(/ElementType(\d)\.png/);
			const eleAttack = element.find("span[data-key='elementAttack']").text();

			if(imageMatches)
			{
				const element = elements[imageMatches[1]];
				bonuses.push(`${element} Attack ${eleAttack}`);
				found = true;
			}
		}

		if(defenseBonusMatches)
		{
			bonuses.push("Defense +" + defenseBonusMatches[1]);
			found = true;
		}

		if(affinityBonusMatches)
		{
			bonuses.push(`Affinity ${affinityBonusMatches[1]}`);
			found = true;
		}

		if(!found)
		{
			//throw("Unknown Text: " + html);
			return text;
		}

		return bonuses;
	}
	else
	{
		return text;
	}
}

const spinner = ora("Fetching weapons");
spinner.start();
let weapons = [];

for(let weaponType = startingWeapon; weaponType < numWeapons; weaponType++)
{
	spinner.text = "Fetching " + weaponTypes[weaponType];
	const url = baseUrl + weaponType;
	const text = await fetchAsText(url);
	let $ = load(text);
	const tables = $("table");
	let data;

	data = tableToArrayOfObj(tables[0], [null/*Image*/, "Name", "Slots", "Attack", "Bonuses", "Ranged Stats", "Other",
	                                     "Rarity\/\/Rare (\\d+)\\\\"], function(col, html, text)
	                         {
		                         const element = $(html);

		                         switch(col)
		                         {
			                         case 3:
				                         return processSlots(html);
			                         case 5:
				                         return processBonuses($, element, text);
			                         case 6:
										 if( weaponTypes[weaponType].match(/bowgun/i))
										 {
											 return processBowgunStats($, element);
										 }
										 else if( weaponTypes[weaponType] === "Bow" )
										 {
											 return processBowStats( $, text );
										 }
				                         else
										 {
											 return html;
										 }
			                         case 7:
				                         if(weaponTypes[weaponType] === "Bow")
				                         {
					                         return processCoatings($, text);
				                         }
				                         else
				                         {
					                         return html;
				                         }
			                         default:
				                         return html;
		                         }
	                         }, ":nth-child(3) > tr");

	data = data.map((ele) =>
	                {
		                ele["WeaponType"] = weaponTypes[weaponType];
		                return ele;
	                });
	data = rearrangeObjs(data,["Name","Rarity", "Attack", "Slots", "Bonuses", "Other", "Ranged Stats"]);

	weapons = weapons.concat( data );
}
spinner.text = "Writing weapons to file"
fs.writeFileSync("weapons.json",JSON.stringify(weapons,null,"\t"));
spinner.succeed("Weapons Done");
