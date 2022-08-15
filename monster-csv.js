import fs               from "fs";
import {getObjFromFile} from "./util.js";

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
