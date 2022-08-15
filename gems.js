import fs from "fs";

const gems = [["Absorber Jewel 1", 1, 1, 1, 99, {"Recoil Down": 1}],
              ["Quickload Jewel 1", 1, 1, 1, 99, {"Reload Speed": 1}],
              ["Steadfast Jewel 1", 1, 1, 1, 99, {"Stun Resistance": 1}],
              ["Sniper Jewel 1", 1, 1, 1, 99, {Steadiness: 1}], ["Brace Jewel 1", 1, 1, 1, 99, {"Flinch Free": 1}],
              ["Wind Res Jewel 1", 1, 1, 1, 99, {Windproof: 1}],
              ["Grinder Jewel 1", 1, 1, 1, 99, {"Speed Sharpening": 1}],
              ["Recovery Jewel 1", 1, 1, 1, 99, {"Recovery Speed": 1}],
              ["Sonorous Jewel 1", 1, 1, 1, 99, {"Horn Maestro": 1}],
              ["Drain Jewel 1", 1, 1, 1, 99, {"Stamina Thief": 1}],
              ["Venom Jewel 1", 1, 1, 1, 99, {"Poison Attack": 1}],
              ["Slider Jewel 1", 1, 1, 1, 99, {"Affinity Sliding": 1}],
              ["Bomber Jewel 1", 1, 1, 1, 99, {Bombardier: 1}], ["Blaze Jewel 1", 1, 1, 1, 99, {"Fire Attack": 1}],
              ["Stream Jewel 1", 1, 1, 1, 99, {"Water Attack": 1}],
              ["Bolt Jewel 1", 1, 1, 1, 99, {"Thunder Attack": 1}], ["Frost Jewel 1", 1, 1, 1, 99, {"Ice Attack": 1}],
              ["Dragon Jewel 1", 1, 1, 1, 99, {"Dragon Attack": 1}],
              ["Defense Jewel 1", 1, 1, 1, 99, {"Defense Boost": 1}],
              ["Carver Jewel 1", 1, 1, 1, 99, {"Carving Pro": 1}],
              ["Hungerless Jewel 1", 1, 1, 1, 99, {"Hunger Resistance": 1}],
              ["Satiated Jewel 1", 1, 1, 1, 99, {"Free Meal": 1}],
              ["Muck Jewel 1", 1, 1, 1, 99, {"Muck Resistance": 1}], ["Diversion Jewel 1", 1, 1, 1, 99, {Diversion: 1}],
              ["Dive Jewel 1", 1, 1, 1, 99, {"Leap of Faith": 1}], ["Geology Jewel 1", 1, 1, 1, 99, {Geologist: 1}],
              ["Botany Jewel 1", 1, 1, 1, 99, {Botanist: 1}],
              ["Antiblast Jewel 1", 1, 1, 1, 99, {"Blast Resistance": 1}],
              ["Pep Jewel 1", 1, 1, 1, 99, {"Sleep Resistance": 1}],
              ["Antipara Jewel 1", 1, 1, 1, 99, {"Paralysis Resistance": 1}],
              ["Antidote Jewel 1", 1, 1, 1, 99, {"Poison Resistance": 1}],
              ["Fire Res Jewel 1", 1, 1, 1, 99, {"Fire Resistance": 1}],
              ["Water Res Jewel 1", 1, 1, 1, 99, {"Water Resistance": 1}],
              ["Thunder Res Jewel 1", 1, 1, 1, 99, {"Thunder Resistance": 1}],
              ["Ice Res Jewel 1", 1, 1, 1, 99, {"Ice Resistance": 1}],
              ["Dragon Res Jewel 1", 1, 1, 1, 99, {"Dragon Resistance": 1}],
              ["Precise Jewel 2", 1, 2, 1, 99, {Ballistics: 1}],
              ["Crit Element Jewel 2", 1, 2, 1, 99, {"Critical Element": 1}],
              ["Artillery Jewel 2", 1, 2, 1, 99, {Artillery: 1}],
              ["Sprinter Jewel 2", 1, 2, 1, 99, {"Marathon Runner": 1}], ["Charger Jewel 2", 1, 2, 1, 99, {Focus: 1}],
              ["Mind's Eye Jewel 2", 1, 2, 1, 99, {"Mind's Eye": 1}], ["Potential Jewel 2", 1, 2, 1, 99, {Heroics: 1}],
              ["Trueshot Jewel 2", 1, 2, 1, 99, {"Special Ammo Boost": 1}],
              ["Magazine Jewel 2", 1, 2, 1, 99, {"Load Shells": 1}], ["Shield Jewel 2", 1, 2, 1, 99, {"Guard Up": 1}],
              ["Ironwall Jewel 2", 1, 2, 1, 99, {Guard: 1}], ["Refresh Jewel 2", 1, 2, 1, 99, {"Stamina Surge": 1}],
              ["Enhancer Jewel 2", 1, 2, 1, 99, {"Power Prolonger": 1}],
              ["Mighty Jewel 2", 1, 2, 1, 99, {"Maximum Might": 1}],
              ["Attack Jewel 2", 1, 2, 1, 99, {"Attack Boost": 1}],
              ["Expert Jewel 2", 1, 2, 1, 99, {"Critical Eye": 1}],
              ["Quickswitch Jewel 2", 1, 2, 1, 99, {"Rapid Morph": 1}], ["Blunt Jewel 2", 1, 2, 1, 99, {Bludgeoner: 1}],
              ["Footing Jewel 2", 1, 2, 1, 99, {"Tremor Resistance": 1}],
              ["Counter Jewel 2", 1, 2, 1, 99, {Counterstrike: 1}],
              ["Bubble Jewel 2", 1, 2, 1, 99, {"Bubbly Dance": 1}],
              ["Gambit Jewel 2", 1, 2, 1, 99, {"Punishing Draw": 1}],
              ["Jumping Jewel 2", 1, 2, 1, 99, {"Evade Extender": 1}],
              ["Evasion Jewel 2", 1, 2, 1, 99, {"Evade Window": 1}],
              ["Sheath Jewel 2", 1, 2, 1, 99, {"Quick Sheathe": 1}], ["KO Jewel 2", 1, 2, 1, 99, {Slugger: 1}],
              ["Friendship Jewel 2", 1, 2, 1, 99, {"Wide-Range": 1}],
              ["Destroyer Jewel 2", 1, 2, 1, 99, {Partbreaker: 1}],
              ["Resistor Jewel 2", 1, 2, 1, 99, {"Blight Resistance": 1}],
              ["Gobbler Jewel 2", 1, 2, 1, 99, {"Speed Eating": 1}],
              ["Protection Jewel 2", 1, 2, 1, 99, {"Divine Blessing": 1}],
              ["Wall Run Jewel 2", 1, 2, 1, 99, {"Wall Runner": 1}],
              ["Wirebug Jewel 2", 1, 2, 1, 99, {"Wirebug Whisperer": 1}],
              ["Enduring Jewel 2", 1, 2, 1, 99, {"Item Prolonger": 1}],
              ["Medicine Jewel 2", 1, 2, 1, 99, {"Recovery Up": 1}],
              ["Physique Jewel 2", 1, 2, 1, 99, {Constitution: 1}],
              ["Rodeo Jewel 2", 1, 2, 1, 99, {"Master Mounter": 1}], ["Fortitude Jewel 2", 1, 2, 1, 99, {Fortify: 1}],
              ["Capacity Jewel 3", 1, 3, 1, 99, {"Ammo Up": 1}],
              ["Guardian Jewel 3", 1, 3, 1, 99, {"Offensive Guard": 1}],
              ["Fungiform Jewel 3", 1, 3, 1, 99, {Mushroomancer: 1}],
              ["Draw Jewel 3", 1, 3, 1, 99, {"Critical Draw": 1}], ["Earplug Jewel 3", 1, 3, 1, 99, {Earplugs: 1}],
              ["Challenger Jewel 2", 1, 2, 1, 99, {Agitator: 1}],
              ["Flawless Jewel 2", 1, 2, 1, 99, {"Peak Performance": 1}],
              ["Furor Jewel 2", 1, 2, 1, 99, {Resentment: 1}], ["Crisis Jewel 2", 1, 2, 1, 99, {Resuscitate: 1}],
              ["Critical Jewel 2", 1, 2, 1, 99, {"Critical Boost": 1}],
              ["Tenderizer Jewel 2", 1, 2, 1, 99, {"Weakness Exploit": 1}],
              ["Throttle Jewel 2", 1, 2, 1, 99, {"Latent Power": 1}],
              ["Mastery Jewel 2", 1, 2, 1, 99, {"Master's Touch": 1}],
              ["Paralyzer Jewel 2", 1, 2, 1, 99, {"Paralysis Attack": 1}],
              ["Sleep Jewel 2", 1, 2, 1, 99, {"Sleep Attack": 1}], ["Blast Jewel 2", 1, 2, 1, 99, {"Blast Attack": 1}],
              ["Handicraft Jewel 3", 1, 3, 1, 99, {Handicraft: 1}], ["Razor Jewel 2", 1, 2, 1, 99, {"Razor Sharp": 1}],
              ["Thrift Jewel 2", 1, 2, 1, 99, {"Spare Shot": 1}],
              ["Sharp Jewel 2", 1, 2, 1, 99, {"Protective Polish": 1}],
              ["Forceshot Jewel 3", 1, 3, 1, 99, {"Normal/Rapid Up": 1}],
              ["Pierce Jewel 3", 1, 3, 1, 99, {"Pierce Up": 1}], ["Spread Jewel 3", 1, 3, 1, 99, {"Spread Up": 1}],
              ["Salvo Jewel 3", 1, 3, 1, 99, {"Rapid Fire Up": 1}], ["Fate Jewel 3", 1, 3, 1, 99, {"Good Luck": 1}],
              ["Leap Jewel 3", 1, 3, 1, 99, {"Jump Master": 1}],
              ["Hellfire Jewel 3", 1, 3, 1, 99, {"Hellfire Cloak": 1}],
              ["Hard Fire Res Jewel 4", 1, 4, 11, 99, {"Fire Resistance": 3}],
              ["Hard Water Res Jewel 4", 1, 4, 11, 99, {"Water Resistance": 3}],
              ["Hard Ice Res Jewel 4", 1, 4, 11, 99, {"Ice Resistance": 3}],
              ["Hard Thunder Res Jewel 4", 1, 4, 11, 99, {"Thunder Resistance": 3}],
              ["Hard Dragon Res Jewel 4", 1, 4, 11, 99, {"Dragon Resistance": 3}],
              ["Hard Botany Jewel 4", 1, 4, 11, 99, {Botanist: 3}],
              ["Hard Geology Jewel 4", 1, 4, 11, 99, {Geologist: 3}],
              ["Hard Satiated Jewel 4", 1, 4, 11, 99, {"Free Meal": 3}],
              ["Hard Drain Jewel 4", 1, 4, 11, 99, {"Stamina Thief": 3}],
              ["Hard Enduring Jewel 4", 1, 4, 11, 99, {"Item Prolonger": 3}],
              ["Hard Hungerless Jewel 4", 1, 4, 11, 99, {"Hunger Resistance": 3}],
              ["Blaze Jewel+ 2", 1, 2, 11, 99, {"Fire Attack": 2}],
              ["Hard Blaze Jewel 3", 1, 3, 11, 99, {"Fire Attack": 3}],
              ["Stream Jewel+ 2", 1, 2, 11, 99, {"Water Attack": 2}],
              ["Hard Stream Jewel 3", 1, 3, 11, 99, {"Water Attack": 3}],
              ["Frost Jewel+ 2", 1, 2, 11, 99, {"Ice Attack": 2}],
              ["Hard Frost Jewel 3", 1, 3, 11, 99, {"Ice Attack": 3}],
              ["Bolt Jewel+ 2", 1, 2, 11, 99, {"Thunder Attack": 2}],
              ["Hard Bolt Jewel 3", 1, 3, 11, 99, {"Thunder Attack": 3}],
              ["Dragon Jewel+ 2", 1, 2, 11, 99, {"Dragon Attack": 2}],
              ["Hard Dragon Jewel 3", 1, 3, 11, 99, {"Dragon Attack": 3}],
              ["Defense Jewel+ 2", 1, 2, 11, 99, {"Defense Boost": 2}],
              ["Hard Defense Jewel 3", 1, 3, 11, 99, {"Defense Boost": 3}],
              ["Hard Defense Jewel++ 4", 1, 4, 11, 99, {"Defense Boost": 5}],
              ["Hard Bomber Jewel 4", 1, 4, 11, 99, {Bombardier: 3}],
              ["Hard Grinder Jewel 4", 1, 4, 11, 99, {"Speed Sharpening": 3}],
              ["Medicine Jewel+ 4", 1, 4, 11, 99, {"Recovery Up": 2}],
              ["Physique Jewel+ 4", 1, 4, 11, 99, {Constitution: 2}],
              ["Wirebug Jewel+ 4", 1, 4, 11, 99, {"Wirebug Whisperer": 2}],
              ["Hard Wall Run Jewel 4", 1, 4, 11, 99, {"Wall Runner": 3}],
              ["Hard Recovery Jewel 4", 1, 4, 11, 99, {"Recovery Speed": 3}],
              ["Protection Jewel+ 4", 1, 4, 11, 99, {"Divine Blessing": 2}],
              ["Gobbler Jewel+ 4", 1, 4, 11, 99, {"Speed Eating": 2}],
              ["Resistor Jewel+ 4", 1, 4, 11, 99, {"Blight Resistance": 2}],
              ["Hard Friendship Jewel 3", 1, 3, 11, 99, {"Wide-Range": 3}],
              ["Hard Friendship Jewel+ 4", 1, 4, 11, 99, {"Wide-Range": 4}],
              ["Evasion Jewel+ 4", 1, 4, 11, 99, {"Evade Window": 2}],
              ["Gambit Jewel+ 4", 1, 4, 11, 99, {"Punishing Draw": 2}],
              ["Hard Brace Jewel 4", 1, 4, 11, 99, {"Flinch Free": 3}],
              ["Bubble Jewel+ 4", 1, 4, 11, 99, {"Bubbly Dance": 2}], ["KO Jewel+ 4", 1, 4, 11, 99, {Slugger: 2}],
              ["Jumping Jewel+ 4", 1, 4, 11, 99, {"Evade Extender": 2}],
              ["Hard Wind Res Jewel 4", 1, 4, 11, 99, {Windproof: 3}],
              ["Refresh Jewel+ 4", 1, 4, 11, 99, {"Stamina Surge": 2}], ["Ironwall Jewel+ 3", 1, 3, 11, 99, {Guard: 2}],
              ["Shield Jewel+ 4", 1, 4, 11, 99, {"Guard Up": 2}], ["Precise Jewel+ 4", 1, 4, 11, 99, {Ballistics: 2}],
              ["Crit Element Jewel+ 4", 1, 4, 11, 99, {"Critical Element": 2}],
              ["Charger Jewel+ 4", 1, 4, 11, 99, {Focus: 2}],
              ["Sprinter Jewel+ 4", 1, 4, 11, 99, {"Marathon Runner": 2}],
              ["Draw Jewel+ 4", 1, 4, 11, 99, {"Critical Draw": 2}],
              ["Fungiform Jewel+ 4", 1, 4, 11, 99, {Mushroomancer: 2}],
              ["Hard Steadfast Jewel 4", 1, 4, 11, 99, {"Stun Resistance": 3}],
              ["Mind's Eye Jewel+ 4", 1, 4, 11, 99, {"Mind's Eye": 2}],
              ["Earplug Jewel+ 4", 1, 4, 11, 99, {Earplugs: 2}],
              ["Enhancer Jewel+ 4", 1, 4, 11, 99, {"Power Prolonger": 2}],
              ["Footing Jewel+ 4", 1, 4, 11, 99, {"Tremor Resistance": 2}],
              ["Hellfire Jewel+ 4", 1, 4, 11, 99, {"Hellfire Cloak": 2}],
              ["Fate Jewel+ 4", 1, 4, 11, 99, {"Good Luck": 2}],
              ["Bladescale Jewel 2", 1, 2, 11, 99, {"Bladescale Hone": 1}],
              ["Flywall Jewel 1", 1, 1, 11, 99, {"Wall Runner (Boost)": 1}],
              ["Redirection Jewel 3", 1, 3, 11, 99, {Redirection: 1}],
              ["Breath Jewel 3", 1, 3, 11, 99, {"Quick Breath": 1}],
              ["Mighty Bow Jewel 4", 1, 4, 11, 99, {"Bow Charge Plus": 1}],
              ["Sniper Jewel+ 4", 1, 4, 11, 99, {Steadiness: 2}], ["Jewel 1", 1, 1, 1, 99, {"LV1 Slot Skill": 1}],
              ["Jewel 2", 1, 2, 1, 99, {"LV2 Slot Skill": 1}], ["Jewel 3", 1, 3, 1, 99, {"LV3 Slot Skill": 1}],
              ["Jewel 4", 1, 4, 1, 99, {"LV4 Slot Skill": 1}]];

const data = [];

for( const gem of gems )
{
    const obj = {};
    obj.name = gem[0];

    if( obj.name.match(/^Jewel\s\d$/) )
    {
        continue;
    }

    obj.size = gem[2];

    switch( gem[3] )
    {
        case 1:
            obj.source = "vanilla";
            break;
        case 11:
            obj.source = "sunbreak";
            break;
        default:
            throw "Invalid source: " + obj.source + " @ " + obj.name;
    }

    obj.skills = gem[5];
    data.push(obj);
}

fs.writeFileSync("gems.json",JSON.stringify(data, null, "\t"));
fs.writeFileSync("gems-raw.json", JSON.stringify(gems, null, "\t"));
