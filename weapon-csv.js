import fs                                                          from "fs";
import {arrayToString, generateCsv, getObjFromFile, isEmptyString} from "./util.js";

const armors = getObjFromFile("weapons.json");
const csv = generateCsv(armors,function(header,obj){
	let out = "";

	switch( header )
	{
		case "Slots":
			if( Array.isArray( obj.Slots ) )
			{
				out += obj.Slots.join("");
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
});

fs.writeFileSync("weapons.csv",csv);
