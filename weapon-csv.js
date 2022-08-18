import fs                                                          from "fs";
import {arrayToString, generateCsv, getObjFromFile, isEmptyString} from "./util.js";

const armors = getObjFromFile("weapons.json");
const csv = generateCsv(armors,function(header,obj){
	let out = "";

	switch( header )
	{
		case "Slots":
			if( typeof obj.slots === "object" )
			{
				out += obj.slots.join("");
			}

			if( obj.rampageSlot )
			{
				if( !isEmptyString( out ) )
				{
					out += ", ";
				}

				out += "Rampage: " + obj.rampageSlot;
			}
			break;
		case "Bonuses":
		case "Other":
			out = arrayToString( obj );
			break;
		case "Ranged Stats":
			if( obj )
			{
				out += "Deviation: " + obj.Deviation;
				out += ", Recoil: " + obj.Recoil;
				out += ", Reload: " + obj.Reload;
			}

			break;
		default:
			throw "Unknown header: " + header;
	}

	return out;
});

fs.writeFileSync("weapons.csv",csv);
