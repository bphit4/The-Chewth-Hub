export type NcaafDivisionKey = "fbs" | "fcs" | "d2" | "d3";

export type NcaafConferenceGroup = {
  name: string;
  teams: string[];
};

export const NCAAF_CONFERENCES: Record<NcaafDivisionKey, NcaafConferenceGroup[]> = {
  fbs: [
    {
      name: "ACC",
      teams: [
        "Boston College Eagles",
        "Clemson Tigers",
        "Duke Blue Devils",
        "Florida State Seminoles",
        "Georgia Tech Yellow Jackets",
        "Louisville Cardinals",
        "Miami Hurricanes",
        "NC State Wolfpack",
        "North Carolina Tar Heels",
        "Pittsburgh Panthers",
        "SMU Mustangs",
        "Stanford Cardinal",
        "Syracuse Orange",
        "Virginia Cavaliers",
        "Virginia Tech Hokies",
        "Wake Forest Demon Deacons",
        "California Golden Bears"
      ]
    },
    {
      name: "Big Ten",
      teams: [
        "Illinois Fighting Illini",
        "Indiana Hoosiers",
        "Iowa Hawkeyes",
        "Maryland Terrapins",
        "Michigan State Spartans",
        "Michigan Wolverines",
        "Minnesota Golden Gophers",
        "Nebraska Cornhuskers",
        "Northwestern Wildcats",
        "Ohio State Buckeyes",
        "Oregon Ducks",
        "Penn State Nittany Lions",
        "Purdue Boilermakers",
        "Rutgers Scarlet Knights",
        "UCLA Bruins",
        "USC Trojans",
        "Washington Huskies",
        "Wisconsin Badgers"
      ]
    },
    {
      name: "Big 12",
      teams: [
        "Arizona Wildcats",
        "Arizona State Sun Devils",
        "BYU Cougars",
        "Baylor Bears",
        "Cincinnati Bearcats",
        "Colorado Buffaloes",
        "Houston Cougars",
        "Iowa State Cyclones",
        "Kansas Jayhawks",
        "Kansas State Wildcats",
        "Oklahoma State Cowboys",
        "TCU Horned Frogs",
        "Texas Tech Red Raiders",
        "UCF Knights",
        "Utah Utes",
        "West Virginia Mountaineers"
      ]
    },
    {
      name: "SEC",
      teams: [
        "Alabama Crimson Tide",
        "Arkansas Razorbacks",
        "Auburn Tigers",
        "Florida Gators",
        "Georgia Bulldogs",
        "Kentucky Wildcats",
        "LSU Tigers",
        "Mississippi State Bulldogs",
        "Missouri Tigers",
        "Oklahoma Sooners",
        "Ole Miss Rebels",
        "South Carolina Gamecocks",
        "Tennessee Volunteers",
        "Texas Longhorns",
        "Texas A&M Aggies",
        "Vanderbilt Commodores"
      ]
    },
    {
      name: "Pac-12",
      teams: ["Oregon State Beavers", "Washington State Cougars"]
    },
    {
      name: "American",
      teams: [
        "Army Black Knights",
        "Charlotte 49ers",
        "East Carolina Pirates",
        "Florida Atlantic Owls",
        "Memphis Tigers",
        "Navy Midshipmen",
        "North Texas Mean Green",
        "Rice Owls",
        "South Florida Bulls",
        "Temple Owls",
        "Tulane Green Wave",
        "Tulsa Golden Hurricane",
        "UAB Blazers",
        "UTSA Roadrunners"
      ]
    },
    {
      name: "Mountain West",
      teams: [
        "Air Force Falcons",
        "Boise State Broncos",
        "Colorado State Rams",
        "Fresno State Bulldogs",
        "Hawaii Rainbow Warriors",
        "Nevada Wolf Pack",
        "New Mexico Lobos",
        "San Diego State Aztecs",
        "San Jose State Spartans",
        "UNLV Rebels",
        "Utah State Aggies",
        "Wyoming Cowboys"
      ]
    },
    {
      name: "Sun Belt",
      teams: [
        "Appalachian State Mountaineers",
        "Coastal Carolina Chanticleers",
        "Georgia Southern Eagles",
        "Georgia State Panthers",
        "James Madison Dukes",
        "Marshall Thundering Herd",
        "Old Dominion Monarchs",
        "Arkansas State Red Wolves",
        "Louisiana Ragin' Cajuns",
        "Louisiana-Monroe Warhawks",
        "South Alabama Jaguars",
        "Southern Miss Golden Eagles",
        "Texas State Bobcats",
        "Troy Trojans"
      ]
    },
    {
      name: "Conference USA",
      teams: [
        "Delaware Blue Hens",
        "Florida International Panthers",
        "Jacksonville State Gamecocks",
        "Kennesaw State Owls",
        "Liberty Flames",
        "Louisiana Tech Bulldogs",
        "Middle Tennessee Blue Raiders",
        "Missouri State Bears",
        "New Mexico State Aggies",
        "Sam Houston Bearkats",
        "UTEP Miners",
        "Western Kentucky Hilltoppers"
      ]
    },
    {
      name: "MAC",
      teams: [
        "Akron Zips",
        "Ball State Cardinals",
        "Bowling Green Falcons",
        "Buffalo Bulls",
        "Central Michigan Chippewas",
        "Eastern Michigan Eagles",
        "Kent State Golden Flashes",
        "Massachusetts Minutemen",
        "Miami (OH) RedHawks",
        "Northern Illinois Huskies",
        "Ohio Bobcats",
        "Toledo Rockets",
        "Western Michigan Broncos"
      ]
    },
    {
      name: "FBS Independents",
      teams: ["Notre Dame Fighting Irish", "UConn Huskies"]
    }
  ],
  fcs: [
    {
      name: "Big Sky Conference",
      teams: [
        "Eastern Washington",
        "Idaho",
        "Idaho State",
        "Montana",
        "Montana State",
        "Northern Arizona",
        "Northern Colorado",
        "Portland State",
        "Sacramento State",
        "UC Davis",
        "Weber State",
        "Cal Poly"
      ]
    },
    {
      name: "Big South-OVC Football Association",
      teams: [
        "Charleston Southern",
        "Gardner-Webb",
        "Lindenwood",
        "Robert Morris",
        "Southeast Missouri State",
        "Tennessee State",
        "Tennessee Tech",
        "UT Martin"
      ]
    },
    {
      name: "CAA Football",
      teams: [
        "Albany",
        "Bryant",
        "Campbell",
        "Delaware",
        "Elon",
        "Hampton",
        "Maine",
        "Monmouth",
        "New Hampshire",
        "Rhode Island",
        "Richmond",
        "Stony Brook",
        "Towson",
        "Villanova",
        "William & Mary",
        "North Carolina A&T"
      ]
    },
    {
      name: "Ivy League",
      teams: [
        "Brown",
        "Columbia",
        "Cornell",
        "Dartmouth",
        "Harvard",
        "Penn",
        "Princeton",
        "Yale"
      ]
    },
    {
      name: "MEAC",
      teams: [
        "Delaware State",
        "Howard",
        "Morgan State",
        "Norfolk State",
        "North Carolina Central",
        "South Carolina State"
      ]
    },
    {
      name: "Missouri Valley Football Conference",
      teams: [
        "Illinois State",
        "Indiana State",
        "Missouri State",
        "Murray State",
        "North Dakota",
        "North Dakota State",
        "Northern Iowa",
        "South Dakota",
        "South Dakota State",
        "Southern Illinois",
        "Youngstown State"
      ]
    },
    {
      name: "NEC",
      teams: [
        "Central Connecticut State",
        "Duquesne",
        "Long Island University (LIU)",
        "Mercyhurst",
        "Sacred Heart",
        "Saint Francis (PA)",
        "Stonehill",
        "Wagner"
      ]
    },
    {
      name: "Patriot League",
      teams: [
        "Bucknell",
        "Colgate",
        "Fordham",
        "Georgetown",
        "Holy Cross",
        "Lafayette",
        "Lehigh"
      ]
    },
    {
      name: "Pioneer Football League",
      teams: [
        "Butler",
        "Davidson",
        "Dayton",
        "Drake",
        "Marist",
        "Morehead State",
        "Presbyterian",
        "San Diego",
        "St. Thomas (MN)",
        "Valparaiso"
      ]
    },
    {
      name: "SoCon",
      teams: [
        "Chattanooga",
        "The Citadel",
        "East Tennessee State",
        "Furman",
        "Mercer",
        "Samford",
        "VMI",
        "Western Carolina",
        "Wofford"
      ]
    },
    {
      name: "Southland Conference",
      teams: [
        "Houston Christian",
        "Incarnate Word",
        "Lamar",
        "McNeese",
        "Nicholls",
        "Northwestern State",
        "Southeastern Louisiana",
        "Texas A&M-Commerce"
      ]
    },
    {
      name: "SWAC",
      teams: [
        "Alabama A&M",
        "Alabama State",
        "Bethune-Cookman",
        "Florida A&M",
        "Jackson State",
        "Mississippi Valley State",
        "Alcorn State",
        "Arkansas-Pine Bluff",
        "Grambling State",
        "Prairie View A&M",
        "Southern",
        "Texas Southern"
      ]
    },
    {
      name: "United Athletic Conference",
      teams: [
        "Abilene Christian",
        "Austin Peay",
        "Central Arkansas",
        "Eastern Kentucky",
        "North Alabama",
        "Tarleton State",
        "Utah Tech",
        "West Georgia"
      ]
    }
  ],
  d2: [
    {
      name: "CIAA",
      teams: [
        "Bowie State",
        "Bluefield State",
        "Central State (OH)",
        "Elizabeth City State",
        "Fayetteville State",
        "Johnson C. Smith",
        "Livingstone",
        "Lincoln (PA)",
        "Shaw",
        "Virginia State",
        "Virginia Union",
        "Winston-Salem State"
      ]
    },
    {
      name: "GLIAC",
      teams: [
        "Davenport",
        "Ferris State",
        "Grand Valley State",
        "Michigan Tech",
        "Northern Michigan",
        "Saginaw Valley State",
        "Wayne State (MI)"
      ]
    },
    {
      name: "GLVC",
      teams: [
        "Indianapolis",
        "McKendree",
        "Missouri S&T",
        "Quincy",
        "Southwest Baptist",
        "William Jewell"
      ]
    },
    {
      name: "GAC",
      teams: [
        "Arkansas Tech",
        "East Central (OK)",
        "Harding",
        "Henderson State",
        "Northwestern Oklahoma State",
        "Oklahoma Baptist",
        "Ouachita Baptist",
        "Southern Arkansas",
        "Southeastern Oklahoma State",
        "Southern Nazarene"
      ]
    },
    {
      name: "GNAC",
      teams: ["Central Washington", "Simon Fraser", "Western Oregon"]
    },
    {
      name: "Lone Star Conference",
      teams: [
        "Angelo State",
        "Eastern New Mexico",
        "Midwestern State",
        "Sul Ross State",
        "Texas A&M-Commerce",
        "Texas A&M-Kingsville",
        "Texas-Permian Basin",
        "Western New Mexico"
      ]
    },
    {
      name: "MEC",
      teams: [
        "Concord",
        "Fairmont State",
        "Frostburg State",
        "Glenville State",
        "Notre Dame (OH)",
        "UNC Pembroke",
        "West Liberty",
        "West Virginia State",
        "West Virginia Wesleyan",
        "Wheeling"
      ]
    },
    {
      name: "MIAA",
      teams: [
        "Central Missouri",
        "Central Oklahoma",
        "Emporia State",
        "Fort Hays State",
        "Missouri Southern",
        "Missouri Western",
        "Nebraska-Kearney",
        "Northwest Missouri State",
        "Pittsburg State",
        "Washburn"
      ]
    },
    {
      name: "NE10",
      teams: [
        "American International",
        "Assumption",
        "Bentley",
        "Franklin Pierce",
        "New Haven",
        "Pace",
        "Saint Anselm",
        "Southern Connecticut State"
      ]
    },
    {
      name: "NSIC",
      teams: [
        "Augustana (SD)",
        "Bemidji State",
        "Concordia-St. Paul",
        "University of Mary",
        "Minnesota Duluth",
        "Minnesota State",
        "Minnesota State Moorhead",
        "Minot State",
        "Northern State",
        "Sioux Falls",
        "Southwest Minnesota State",
        "Wayne State (NE)",
        "Winona State"
      ]
    },
    {
      name: "PSAC",
      teams: [
        "Bloomsburg",
        "East Stroudsburg",
        "Kutztown",
        "Lock Haven",
        "Millersville",
        "Shippensburg",
        "West Chester",
        "California (PA)",
        "Clarion",
        "Edinboro",
        "Gannon",
        "IUP (Indiana PA)",
        "Seton Hill",
        "Slippery Rock"
      ]
    },
    {
      name: "RMAC",
      teams: [
        "Adams State",
        "Black Hills State",
        "Chadron State",
        "Colorado Mesa",
        "Colorado Mines",
        "CSU Pueblo",
        "Fort Lewis",
        "New Mexico Highlands",
        "South Dakota Mines",
        "Western Colorado"
      ]
    },
    {
      name: "SIAC",
      teams: [
        "Albany State",
        "Allen",
        "Benedict",
        "Central State",
        "Clark Atlanta",
        "Edward Waters",
        "Fort Valley State",
        "Kentucky State",
        "Lane",
        "Miles",
        "Morehouse",
        "Savannah State",
        "Tuskegee"
      ]
    }
  ],
  d3: [
    {
      name: "American Rivers Conference",
      teams: [
        "Buena Vista",
        "Central (IA)",
        "Coe",
        "Dubuque",
        "Loras",
        "Luther",
        "Nebraska Wesleyan",
        "Simpson",
        "Wartburg"
      ]
    },
    {
      name: "American Southwest Conference",
      teams: [
        "East Texas Baptist",
        "Hardin-Simmons",
        "Howard Payne",
        "McMurry",
        "Sul Ross State",
        "Texas Lutheran"
      ]
    },
    {
      name: "Centennial Conference",
      teams: [
        "Dickinson",
        "Franklin & Marshall",
        "Gettysburg",
        "Johns Hopkins",
        "McDaniel",
        "Muhlenberg",
        "Swarthmore",
        "Ursinus",
        "Washington & Lee"
      ]
    },
    {
      name: "CCIW",
      teams: [
        "Augustana (IL)",
        "Carroll (WI)",
        "Carthage",
        "Elmhurst",
        "Illinois Wesleyan",
        "Millikin",
        "North Central (IL)",
        "North Park",
        "Wheaton (IL)"
      ]
    },
    {
      name: "ECFC",
      teams: ["Alfred State", "Anna Maria", "Castleton", "Dean", "Gallaudet", "Keystone"]
    },
    {
      name: "Empire 8",
      teams: [
        "Alfred",
        "Brockport",
        "Hartwick",
        "Hobart",
        "Morrisville State",
        "St. John Fisher",
        "Utica"
      ]
    },
    {
      name: "HCAC",
      teams: [
        "Anderson (IN)",
        "Bluffton",
        "Defiance",
        "Earlham",
        "Franklin",
        "Hanover",
        "Manchester",
        "Mount St. Joseph",
        "Rose-Hulman"
      ]
    },
    {
      name: "Liberty League",
      teams: ["Hobart", "Ithaca", "RPI", "Rochester", "St. Lawrence", "Union (NY)"]
    },
    {
      name: "MAC",
      teams: [
        "Albright",
        "Eastern",
        "Lebanon Valley",
        "Stevenson",
        "Widener",
        "Delaware Valley",
        "FDU-Florham",
        "King's (PA)",
        "Lycoming",
        "Misericordia",
        "Wilkes"
      ]
    },
    {
      name: "MASCAC",
      teams: [
        "Bridgewater State",
        "Fitchburg State",
        "Framingham State",
        "Massachusetts Maritime",
        "Plymouth State",
        "Westfield State",
        "Worcester State"
      ]
    },
    {
      name: "MIAC",
      teams: [
        "Augsburg",
        "Bethel (MN)",
        "Carleton",
        "Concordia (MN)",
        "Gustavus Adolphus",
        "Hamline",
        "Macalester",
        "Saint John's (MN)",
        "Saint Mary's (MN)",
        "St. Olaf"
      ]
    },
    {
      name: "MIAA",
      teams: [
        "Adrian",
        "Albion",
        "Alma",
        "Calvin",
        "Hope",
        "Kalamazoo",
        "Olivet",
        "Trine"
      ]
    },
    {
      name: "NACC",
      teams: ["Aurora", "Benedictine (IL)", "Concordia Chicago", "Lakeland", "Rockford"]
    },
    {
      name: "NCAC",
      teams: ["DePauw", "Denison", "Hiram", "Kenyon", "Oberlin", "Ohio Wesleyan", "Wabash", "Wooster"]
    },
    {
      name: "NEWMAC",
      teams: ["Catholic", "Coast Guard", "Merchant Marine", "MIT", "Norwich", "Springfield", "WPI"]
    },
    {
      name: "NJAC",
      teams: ["Christopher Newport", "Kean", "Montclair State", "Rowan", "Salisbury", "TCNJ", "William Paterson"]
    }
  ]
};
