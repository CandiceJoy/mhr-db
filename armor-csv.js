import fs                            from "fs";
import {generateCsv, getObjFromFile} from "./util.js";

const armors = getObjFromFile("armor.json");
const csv = generateCsv(armors,function(header,obj){
	switch( header )
	{
		case "Slots":
			return obj.join("");
		case "Skills":
			let skills = [];
			for( const skill of Object.keys(obj))
			{
				const level = obj[skill];
				skills.push(skill + " " + level);
			}
			return skills.join(", ");
		default:
			throw "Unknown header: " + header;
	}
});

fs.writeFileSync("armor.csv",csv);
