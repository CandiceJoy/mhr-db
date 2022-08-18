import {load}                           from "cheerio";
import fs                               from "fs";
import ora                                                                        from "ora";
import {EMPTY_REGEX, fetchAsText, rearrangeObj, rearrangeObjs, tableToArrayOfObj} from "./util.js";

const baseUrl = "https://mhrise.kiranico.com/data/armors?view=";
const rarities = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const regexPrefix = "(?:\\s|^)";
const regexSuffix = "(?:\\s|$|\\s[sx]$)";

let armors = [];
const slots = [{
	name: "Head",
	list: ["(?:Lune|Sol)helm", "Scarf", "Gorget", "Goggles", "Patch", "Hawkhat", "Barrette", "Headwear", "Glasses",
	       "Beret", "Head", "Kasa", "Hair", "Face", "Feather", "Shades", "Flame Seal", "Headdress", "Glare", "Bandage",
	       "Choker", "Necklace", "Circlet", "Specs", "Archbun", "Cap", "Wig", "Lobos", "Visage", "Hair-tie", "Hood",
	       "Vertex", "Helm", "Cerato", "Mask", "Earrings", "Crown", "Diadem", "Casque", "Headgear", "Hat", "Brain",
	       "Vizor", "Chaoshroom"]
}, {
	name: "Chest",
	list: ["(?:Lune|Sol)mail", "Hawksuit", "Breastplate", "Archplate", "Top", "Blouse", "Bolero", "Dogi", "Cuirass",
	       "Body", "Guards", "Cista", "Coat", "Yukata", "Jersey", "Shirt", "Robe", "Cover", "Cloak", "Chest", "Baulo",
	       "Mail", "Haori", "Garb", "Armor", "Hauberk", "Vest", "Jacket", "Muscle", "Ribplate", "Plate", "Thorax",
	       "Suit", "Torso"]
}, {
	name: "Hands",
	list: ["(?:Lune|Sol)braces", "Bracelets", "Strongarm", "Mittens", "Sleeve", "Arms", "Cuffs", "Armguards", "Prayer",
	       "Hope", "Sleeves", "Hands", "Epine", "Pauldrons", "Braces", "Kote", "Gauntlets", "Wristrays", "Gloves",
	       "Branch", "Grip", "Creeper", "Brachia", "Vambraces"]
}, {
	name: "Waist",
	list: ["(?:Lune|Sol)coil", "Hawkcoil", "Bottoms", "Cuisse", "Skirt", "Tail", "Waist", "Cocoon", "Coil", "Ura",
	       "Fauld", "Obi", "Tassets", "Belt", "Sash", "Folia", "Bowels", "Elytra"]

}, {
	name: "Feet",
	list: ["(?:Lune|Sol)greaves", "Hawkboots", "Crura", "Leggings", "Bottom", "Socks", "Legwear", "Trousers", "Geta",
	       "Crus", "Wrap", "Zori", "Legs", "Shoes", "Foot", "Sceros", "Greaves", "Hakama", "Gaiters", "Pants", "Roots",
	       "Heel", "Sandals", "Shinguards", "Boots", "Feet"]

}];

for(const slot of slots)
{
	for(let x = 0; x < slot.list.length; x++)
	{
		slot.list[x] = slot.list[x].charAt(0).toUpperCase() + slot.list[x].slice(1);
	}

	slot.regex = new RegExp(regexPrefix + slot.list.join("|") + regexSuffix, "g");
}

const spinner = ora();
spinner.start();

for(const rarity of rarities)
{
	spinner.text = "Fetching rarity " + rarity;

	const url = baseUrl + (rarity - 1);
	const text = await fetchAsText(url);
	let $ = load(text);
	const tables = $("table");
	const data = tableToArrayOfObj(tables[0], [null, null, "Name", "Slots", "Defense,,Fire,,Water[[(.+)\\s(.+)\\s(.+)]]",
	                                           "Ice,,Thunder,,Dragon[[(.+)\\s(.+)\\s(.+)]]",
	                                           "Skills{{(?<=\\s\\d)\\s}}<<(.+?)\\sLv\\s(\\d)>>"], function(colNum, data)
	                               {
		                               if(colNum === 4 && !data.match(EMPTY_REGEX))
		                               {
			                               const $ = load(data);
			                               const out = [];
			                               const imgs = $("img");

			                               for(const img of imgs)
			                               {
				                               const src = img.attribs.src;
				                               const matches = src.match(/\/deco(\d)\.png/i);
				                               out.push(matches[1]);
			                               }

			                               return out.sort((a, b) => b - a);
		                               }
		                               else
		                               {
			                               return data;
		                               }
	                               });

	for(let x = 0; x < data.length; x++)
	{
		const ele = data[x];

		for(const slot of slots)
		{
			if(ele.Name.match(slot.regex))
			{
				ele.Slot = slot.name;
				break;
			}
		}

		if(!ele.Slot)
		{
			spinner.fail("Could not find slot for " + ele.Name);
			process.exit(1);
		}

		ele.Rarity = rarity;

		data[x] = rearrangeObj(data[x], ["Name", "Slot", "Rarity", "Slots", "Defense", "Fire", "Water", "Ice", "Thunder", "Dragon", "Skills"]);
	}

	armors = armors.concat(data);
}

spinner.text = "Writing data to file";
fs.writeFileSync("armor.json", JSON.stringify(armors, null, "\t"));
spinner.succeed("Done");
