import {load}                                             from "cheerio";
import {getBlankLine, getValue, insert, qualify, initCsv} from "./csv-utils.js";
import {
	arrayToString, debug, fetchAsText, generateCsv, getObjFromFile, isEmptyString, rearrangeObjs, sanitise,
	tableToArrayOfObj
}                                                         from "./util.js";
import ora            from "ora";
import fs             from "fs";

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
	Nrm     : "Normal",
	Prc     : "Piercing",
	Spr     : "Spread",
	Shr     : "Shrapnel",
	Sti     : "Sticky",
	Clu     : "Cluster",
	Dem     : "Demon",
	Amr     : "Armor",
	Wyv     : "Wyvern",
	Sli     : "Slicing",
	"Fir/P.": "Piercing Fire",
	"Wat/P.": "Piercing Water",
	"Thn/P.": "Piercing Thunder",
	"Ice/P.": "Piercing Ice",
	"Dra/P.": "Piercing Dragon",
	Poi     : "Poison",
	Par     : "Paralysis",
	Exh     : "Exhaust",
	Rec     : "Recovery",
	Sle     : "Sleep",
	Tra     : "Tranq"
};

function processBowStats($, text)
{
	const obj = {ShotTypes: []};
	const arcMatches = text.match(/^(\w+)\s/i);
	obj.ArcShot = arcMatches[1];
	text = text.replace(arcMatches[1] + " ", "");

	const shotPattern = "(\\w+)\\sLevel\\s(\\d)";
	const shotMatches = text.match(new RegExp(shotPattern, "ig"));

	for(const shotMatch of shotMatches)
	{
		const matches = shotMatch.match(new RegExp(shotPattern, "i"));
		const shotType = {
			Type : matches[1],
			Level: matches[2]
		};
		obj.ShotTypes.push(shotType);
	}

	return obj;
}

function processBowgunStats(html)
{
	const $ = load(html);
	const obj = {
		AmmoTypes: []
	};

	const statRows = $("table > tbody > tr > td > div");
	const statText = sanitise($(statRows).text());
	const statMatches = statText.match(/deviation\s(.+?)\srecoil\s(.+?)\sreload\s(.+)/i);
	obj.Deviation = statMatches[1];
	obj.Recoil = statMatches[2];
	obj.Reload = statMatches[3];

	const ammoRows = $("tr tr");

	for(const row of ammoRows)
	{
		const rowText = sanitise($(row).text());
		const ammoPattern = "([a-z\\/\\.]+)\\s(\\d+)(?:\\s(\\d+)(?:\\s(\\d+))?)?";
		const ammoMatches = rowText.match(new RegExp(ammoPattern, "ig"));

		if(ammoMatches)
		{
			for(const ammo of ammoMatches)
			{
				const matches = ammo.match(new RegExp(ammoPattern, "i"));
				const type = matches[1];

				for(let x = 2; x <= 4; x++)
				{
					if(matches.length > x && matches[x])
					{
						if(!ammoTypeXlat[type])
						{
							throw "Cannot find ammo type translate for " + type;
						}

						if(matches[x] && matches[x] >= 1)
						{
							obj.AmmoTypes.push({
								                   Type    : ammoTypeXlat[type],
								                   Level   : x - 1,
								                   Magazine: matches[x]
							                   });
						}
					}
				}
			}
		}
	}

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

	const slotImgs = $(slotDiv).find("img");

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
		Slots      : slots.join(""),
		RampageSlot: rampSlot
	};
}

function processBonuses($, element, text)
{
	//console.log("Data: ", data);
	//console.log("Text: ", text);
	//process.exit(0);
	if(!isEmptyString(text))
	{
		const img = element.find("img");
		const defenseBonusMatches = text.match(/Defense\sBonus\s+\+(\d+)\s?/);
		const affinityBonusMatches = text.match(/Affinity\s+([+-]\d+)%/);
		const obj = {};

		if(img && img[0])
		{
			const image = img[0].attribs.src;
			const imageMatches = image.match(/ElementType(\d)\.png/);
			const eleAttack = element.find("span[data-key='elementAttack']").text();

			if(imageMatches)
			{
				const element = elements[imageMatches[1]];
				obj[element] = eleAttack;
			}
		}

		if(defenseBonusMatches)
		{
			obj.Defense = defenseBonusMatches[1];
		}

		if(affinityBonusMatches)
		{
			obj.Affinity = affinityBonusMatches[1];
		}

		//console.log(bonuses);
		return obj;
	}
	else
	{
		return text;
	}
}

function processSongs(html)
{
	const $ = load(html);
	const divs = $("div div");
	const songs = [];

	for(const div of divs)
	{
		songs.push(sanitise($(div).text()));
	}

	return songs;
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

	data = tableToArrayOfObj(tables[0], [null/*Image*/, "Name", "Slots", "Attack", "Bonuses", "RangedStats", "Other",
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
				                         if(weaponTypes[weaponType].match(/bowgun/i))
				                         {
					                         return processBowgunStats(html);
				                         }
				                         else if(weaponTypes[weaponType] === "Bow")
				                         {
					                         return processBowStats($, text);
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
				                         else if(weaponTypes[weaponType] === "Hunting Horn")
				                         {
					                         return processSongs(html);
				                         }
				                         else
				                         {
											 //if( weaponTypes[weaponType] === "Switch Axe" )
											   //console.log(html);
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
	data = rearrangeObjs(data, ["Name", "WeaponType", "Rarity", "Attack", "Slots", "Bonuses", "Other", "RangedStats"]);

	weapons = weapons.concat(data);
}
spinner.text = "Writing weapon data to JSON file";
fs.writeFileSync("weapons.json", JSON.stringify(weapons, null, "\t"));

spinner.text = "Writing weapon data to CSV file";

/*const weaponsData = getObjFromFile("weapons.json");

 const csv = generateCsv(weaponsData,function(header,obj){
 let out = "";

 switch( header )
 {
 case "Slots":
 if( obj.Slots )
 {
 out += obj.Slots;
 }
 else
 {
 out += "-";
 }

 if( obj.RampageSlot )
 {
 if( !isEmptyString( out ) )
 {
 out += ", ";
 }

 out += "Rampage: " + obj.RampageSlot;
 }
 break;
 case "Bonuses":
 case "Other":
 out = arrayToString( obj );
 break;
 case "RangedStats":
 if( !obj )
 {
 break;
 }

 const ammoTypes = obj.AmmoTypes;
 const shotTypes = obj.ShotTypes;

 //console.log("Obj: ",obj);
 //console.log("ammo: ", ammoTypes);
 //console.log("shot: ", shotTypes);

 if( ammoTypes )
 {
 //Bowgun
 out += "Deviation: " + obj.Deviation;
 out += ", Recoil: " + obj.Recoil;
 out += ", Reload: " + obj.Reload;

 for( const type of ammoTypes )
 {
 out += ", " + `${type.Type} ${type.Level} @${type.Magazine}`;
 }
 }

 if( shotTypes  )
 {
 //console.log("shotTypes: ",shotTypes);
 //Bow
 out += "Arc Shot: " + obj.ArcShot + ", Shot Types: ";
 let first = true;

 for( const shotType of shotTypes )
 {
 //console.log("shotType: ", shotType);
 if( !first )
 {
 out += ", ";
 }
 else
 {
 first = false;
 }

 out += `${shotType.Type} ${shotType.Level}`;
 }
 }

 //console.log(out);
 break;
 default:
 throw "Unknown header: " + header;
 }

 return out;
 });*/

const headers = ["Name", "Type", "Rarity", "Attack", "Affinity", "Slots", "Rampage Slot", "Defense", "Element",
                 "Element Attack", "Song", "Shelling Type", "Shelling Level", "Kinsect Level", "Phial Type", "Phial Amount", "Coating", "Arc Shot",
                 "Shot Type", "Shot Level", "Deviation", "Recoil", "Reload", "Ammo Type", "Ammo Level",
                 "Ammo Magazine"];
initCsv(headers );
let csv = [headers];

function processCsvBonuses(main, others, weapon)
{
	for(const bonus of Object.keys(weapon.Bonuses))
	{
		const bonuses = weapon.Bonuses;
		if(bonus === "Affinity")
		{
			insert(main, "Affinity", bonuses[bonus]);
		}

		if(bonus === "Defense")
		{
			insert(main, "Defense", bonuses[bonus]);
		}

		if(bonus.includes("Attack"))
		{
			let line;

			if(!getValue(main, "Element"))
			{
				line = main;
			}
			else
			{
				line = getBlankLine();
				others.push(line);
			}

			insert(line, "Element", bonus);
			insert(line, "Element Attack", bonuses[bonus]);
		}
	}
}

function processCsvSlots(main, others, weapon)
{
	if(weapon.Slots && weapon.Slots.Slots && !isEmptyString(weapon.Slots.Slots))
	{
		insert(main, "Slots", weapon.Slots.Slots);
	}

	if(weapon.Slots && weapon.Slots.RampageSlot && !isEmptyString(weapon.Slots.RampageSlot))
	{
		insert(main, "Rampage Slot", weapon.Slots.RampageSlot);
	}
}

function processCsvMulti(main, others, header, arr)
{
	for(const song of arr)
	{
		if(!getValue(main, header))
		{
			insert(main, header, song);
		}
		else
		{
			const line = getBlankLine();
			insert(line, header, song);
			others.push(line);
		}
	}
}

function processCsvBowgun(main, others, weapon)
{
	const stats = weapon.RangedStats;
	const ammos = stats.AmmoTypes;

	insert( main, "Deviation", stats.Deviation );
	insert( main, "Recoil", stats.Recoil );
	insert( main, "Reload", stats.Reload );

	for( const ammo of ammos )
	{
		if( !getValue( main, "Ammo Type" ) )
		{
			insert( main, "Ammo Type", ammo.Type );
			insert( main, "Ammo Level", ammo.Level );
			insert( main, "Ammo Magazine", ammo.Magazine );
		}
		else
		{
			const line = getBlankLine();
			insert( line, "Ammo Type", ammo.Type );
			insert( line, "Ammo Level", ammo.Level );
			insert( line, "Ammo Magazine", ammo.Magazine );
			others.push( line );
		}
	}
}

function processCsvShotTypes( main, others, weapon )
{
	const stats = weapon.RangedStats;
	const shots = stats.ShotTypes;

	insert( main, "Arc Shot", stats.ArcShot );

	for( const shot of shots )
	{
		if( !getValue( main, "Shot Type" ) )
		{
			insert( main, "Shot Type", shot.Type );
			insert( main, "Shot Level", shot.Level );
		}
		else
		{
			const line = getBlankLine();
			insert( line, "Shot Type", shot.Type );
			insert( line, "Shot Level", shot.Level );
			others.push( line );
		}
	}
}

for(const weapon of weapons)
{
	const main = getBlankLine();
	insert(main, "Name", weapon.Name);
	insert(main, "Type", weapon.WeaponType);
	insert(main, "Rarity", weapon.Rarity);
	insert(main, "Attack", weapon.Attack);
	const others = [];

	processCsvSlots(main, others, weapon);
	processCsvBonuses(main, others, weapon);

	let other = weapon.Other;

	switch(weapon.WeaponType)
	{
		case "Hunting Horn":
			processCsvMulti(main, others, "Song", other);
			break;
		case "Gunlance":
			const matches = other.match(/(.+?)\s(\d+)/);
			insert(main, "Shelling Type", matches[1]);
			insert(main, "Shelling Level", matches[2]);
			break;
		case "Switch Axe":
		case "Charge Blade":
			other = other.replace( " Phial", "" );
			const phialMatches = other.match( /(.+?)\s(\d+)/);

			if( phialMatches )
			{
				insert( main, "Phial Type", phialMatches[1] );
				insert( main, "Phial Amount", phialMatches[2] );
			}
			else
			{
				insert(main, "Phial Type", other);
			}

			break;
		case "Insect Glaive":
			insert(main, "Kinsect Level", other.replace("Kinsect Level", ""));
			break;
		case "Bow":
			processCsvShotTypes( main, others, weapon );
			processCsvMulti(main, others, "Coating", other.map((ele)=>ele.replace(" Coating","")));
			break;
		case "Heavy Bowgun":
		case "Light Bowgun":
			processCsvBowgun(main, others, weapon);
			break;
	}

	//console.log(main);
	//console.log(others);
	csv.push( main );
	csv = csv.concat( others );
}

qualify( csv );

fs.writeFileSync("weapons.csv", csv.join("\n"));
spinner.succeed("Weapons Done");
