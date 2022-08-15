import fs from "fs";
const armors = JSON.parse(fs.readFileSync("armors.json"));

//console.log(armors);

const searches = ["Weakness Exploit", "Critical Eye", "Ballistics", "Pierce Up", "Rapid Fire Up", "Recoil Down",
                  "Reload Speed", "Critical Boost", "Spare Shot", "Attack Boost", "Defense Boost", "Agitator",
                  "Evade Extender"];
const minRarity = 8;

for(const search of searches)
{
	let results = [];

	for(const armor of armors)
	{
		if(armor.rarity < minRarity)
		{
			continue;
		}

		const skills = armor.skills;
		let include = false;

		for(const skill of Object.keys(skills))
		{
			if(!include && skill === search)
			{
				include = true;
			}
		}

		if(include)
		{
			results.push({
				             name  : armor.name,
				             slot  : armor.slot,
				             def   : armor.defence,
				             slots : armor.slots,
				             skills: armor.skills
			             });
		}
	}

	results = results.sort((a, b) => b.skills[search] - a.skills[search]);

	if(results.length < 1)
	{
		console.log(search + " has no results");
	}
	else
	{
		fs.writeFileSync("results/" + search + ".json", JSON.stringify(results, null, "\t"));
	}
}
