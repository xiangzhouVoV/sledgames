// Editorial card copy uses the gameplay facts recorded in data/games.json.
// Each route has its own opening so a recommendation explains why it fits here.
/** @type {Record<string, Record<string, string>>} */
const descriptionsByPage = {
  '/': {
    'sled-rider': "Sled Rider pairs an automatic downhill ride with a gift-funded sled shop. Steer around trees and rocks, jump gaps, and choose between distance and presents.",
    'snow-rider-2': "For a second endless sleigh run, open Snow Rider 2 and its Snow Rider 3D player. Rolling snowballs, logs, and gaps demand steering and jumps.",
    'snowboard-king-2024': "Take a board onto mountain courses after a sledding run in Snowboard King 2024. Choose a line past trees and rocks, escape the avalanche, and improve abilities with coins.",
    'snowboard-game-party': "Bring downhill steering to mouse or touch racing in Snowboard Game Party. Avoid snowballs and fences while progressing toward equipment unlocks.",
    'snowboard-girl': "Try a side view of the slopes in Snowboard Girl after the sledding collection. Use the on-screen buttons to jump through levels and gather coins.",
  },
  '/games': {
    'sled-rider': "Choose the automatic downhill sled run for distance and gift collecting. Steer through a 3D course, jump gaps, and save presents for sleds.",
    'downhill-snowboard': "The coin-collecting snowboard option keeps the focus on surviving a downhill run. Spend collected coins on characters and boards between attempts.",
    'snowboard-game': "SnowBoard Game brings finish-line racing to the collection, with a third-person 3D view. Follow snowy tracks, avoid barriers, and use V to grab.",
    'snowboard-king-2024': "Choose Snowboard King 2024 for downhill courses with route decisions and an avalanche chase. Arrow keys steer, Space accelerates, and collected coins improve your abilities.",
    'snowboard-game-party': "The mouse or touch racing option is Snowboard Game Party, with snowballs and fences along the route. Dodge the hazards and work toward equipment unlocks.",
    'snowboard-girl': "For side-scrolling board levels, open Snowboard Girl and follow the buttons inside the player. Time your jumps and collect coins as you advance.",
    'ski-king': "Pick marked ski courses when you want to work toward faster finish times. Pass flags on the correct side and use upgrade points between attempts.",
    'ski-rush': "For skiing without a finish-line goal, try this downhill survival challenge. Mouse or touch controls steer the skier past obstacles and toward flags for points.",
    'santa-collecting-gifts': "This Christmas score challenge puts Santa beneath falling presents and bombs. Move his sleigh with keyboard controls and keep collecting through a three-life attempt.",
    'crazy-christmas-fun': "The flying sleigh option follows Santa and his reindeer through balloons in the North Pole sky. Click to rise and reach the Christmas tree.",
    'merge-christmas': "Choose a festive merge puzzle when you want to plan each drop. Bring identical snowballs together inside the box to create bigger pieces and Christmas characters.",
    'snow-rider-2': "This endless sleigh entry runs Snow Rider 3D, the game commonly sought as Snow Rider 2. Jump logs and gaps while collecting gifts.",
    'snowball-io': "The arena choice is Snowball.io, where rolling builds a larger snowball to use against opponents. Watch surrounding characters and choose your approach before engaging.",
    'moto-x3m-winter': "Choose winter motorcycle courses for ramps, traps, and timed finishes. Earn stars to unlock riders, and try front or back flips for a time bonus.",
  },
  '/snowboard-games': {
    'downhill-snowboard': "Downhill Snowboard covers the survival side of snowboarding, with coins to collect on each descent. Unlock characters and boards as you keep improving your route.",
    'snowboard-game': "SnowBoard Game is the finish-line choice in this snowboard collection. Guide the rider through a third-person 3D track and practice the separate V grab action.",
    'snowboard-king-2024': "Snowboard King 2024 combines course progression with an avalanche chase in this board collection. Read the downhill route, avoid trees and rocks, and spend coins on ability upgrades.",
    'snowboard-game-party': "Snowboard Game Party adds mouse or touch racing to the slope selection. Steer past snowballs and fences, then check the equipment you can unlock.",
    'snowboard-girl': "Snowboard Girl supplies the side-scrolling option among these board rides. Jump through levels with the on-screen buttons and gather coins along the route.",
    'sled-rider': "Swap the board for an automatically moving sled in Sled Rider. The goal becomes staying on clear snow, jumping gaps, and collecting presents for sleds.",
    'snow-rider-2': "For another way down the mountain, Snow Rider 2 offers the Snow Rider 3D sleigh run. Jump over logs and gaps while pursuing distance.",
    'snowball-io': "Leave snowboard tracks for a snowball arena, where rolling grows your snowball before a fight. Watch nearby opponents and choose when to approach them.",
    'moto-x3m-winter': "Trade snowboard steering for a motorcycle course through winter ramps and traps. Reach each finish quickly to earn stars that can unlock riders.",
  },
  '/ski-games': {
    'ski-king': "Ski King is the marked-course option in this skiing collection. Pass flags on the correct side, avoid trees and rocks, and work toward faster finishes.",
    'ski-rush': "Ski Rush supplies the survival skiing option, using mouse or touch steering. Keep the descent going and collect flags along clear lines to raise your score.",
    'sled-rider': "Switch from skis to a sled that moves forward automatically through a 3D snow course. Jump gaps, avoid obstacles, and collect gifts for new sleds.",
    'snow-rider-2': "Extend your winter session with sleigh steering in the Snow Rider 3D game on Snow Rider 2. Distance, gift collecting, and jumps replace ski-course flags.",
    'snowball-io': "Move from downhill skiing to arena snowball fights with Snowball.io. Roll to grow your snowball, watch other characters, and use it to eliminate opponents.",
    'moto-x3m-winter': "Take a motorcycle onto winter courses after the ski slopes. Navigate ramps, explosives, and traps, then improve your finish times for stars and rider unlocks.",
  },
  '/christmas-games': {
    'santa-collecting-gifts': "Santa Collecting Gifts is the keyboard-controlled Christmas score challenge: catch falling presents and avoid bombs. You have three lives as the falling objects get faster.",
    'crazy-christmas-fun': "Crazy Christmas Fun takes Santa and his reindeer through a balloon-filled sky. Click to raise the sleigh, collect gifts, and reach each level's Christmas tree.",
    'merge-christmas': "Merge Christmas brings snowball matching to the Christmas collection. Position each drop with a mouse or touch, then combine matching pieces into larger festive characters.",
    'sled-rider': "Keep collecting presents after the Santa games with Sled Rider's automatic downhill run. Steer past trees and rocks, jump gaps, and save gifts for new sleds.",
    'snow-rider-2': "Continue the festive sleigh theme on Snow Rider 2's endless snowy track. Its Snow Rider 3D player challenges you to jump logs and gaps while collecting gifts.",
    'snowball-io': "Take a break from Santa's sleigh for an arena snowball fight in Snowball.io. Roll to build a larger snowball, then choose when to approach opponents.",
    'moto-x3m-winter': "For winter action beyond Santa and presents, try Moto X3M Winter's motorcycle courses. Clear ramps and traps, reach timed finishes, and earn stars toward rider unlocks.",
  },
  '/404': {
    'sled-rider': "Take another trail with an automatic sled descent through snow, trees, rocks, and gaps. Collect presents for the shop while keeping the run alive.",
    'downhill-snowboard': "A downhill snowboard score run offers a new starting point after this missing page. Follow clear lines, gather coins, and unlock characters or boards.",
    'snowboard-game': "Return to the slopes in SnowBoard Game, where a snowy 3D track leads to a finish line. Use movement keys and a separate grab input.",
    'snowboard-king-2024': "Find a fresh route in Snowboard King 2024's mountain courses after this missing page. Dodge trees and rocks, escape the avalanche, and collect coins for ability upgrades.",
    'snowboard-game-party': "Return to winter racing with Snowboard Game Party's mouse or touch controls. Work around snowballs and fences as you pursue equipment unlocks.",
    'snowboard-girl': "Pick up a new trail through Snowboard Girl's side-scrolling levels. The player shows buttons for jumping and movement as you collect coins.",
    'ski-king': "Head to a marked ski course and work toward a faster finish in Ski King. Pass each flag on its required side and avoid hazards.",
    'ski-rush': "Restart your visit with a survival skiing run controlled by mouse or touch. Dodge obstacles and collect flags when the route leaves enough room.",
    'santa-collecting-gifts': "Find Santa in the snowy sky and catch the presents falling toward his sleigh. Keyboard movement, bombs, and three lives shape this scoring challenge.",
    'crazy-christmas-fun': "Follow Santa and his reindeer toward a Christmas tree to pick up a different route. Click to lift the sleigh past balloons and gather gifts.",
    'merge-christmas': "Find a new starting point inside a Christmas snowball puzzle. Drop matching pieces together and watch them combine into bigger snowballs or festive characters.",
    'snow-rider-2': "Open the Snow Rider 2 page to ride the embedded Snow Rider 3D sleigh game. Build distance, collect gifts, and jump over logs and gaps.",
    'snowball-io': "Try an arena route in Snowball.io: roll to build a larger snowball, then approach opponents. The objective here is elimination rather than downhill distance.",
    'moto-x3m-winter': "Return to a timed motorcycle course filled with winter ramps, traps, and explosives. Faster finishes earn stars, and flips can add a time bonus.",
  },
  '/downhill-snowboard': {
    'snowboard-game': "SnowBoard Game changes the goal from Downhill Snowboard's survival and coin collecting to reaching a finish line. Its 3D rider also has a separate grab action.",
    'snowboard-king-2024': "Snowboard King 2024 puts course progression and an avalanche chase after Downhill Snowboard's survival attempts. Coins fund ability upgrades, while trees and rocks shape your route.",
    'snowboard-game-party': "Swap Downhill Snowboard's keyboard score runs for mouse or touch racing in Snowboard Game Party. Navigate snowballs and fences, with equipment to unlock between attempts.",
    'snowboard-girl': "Keep the board and coins after Downhill Snowboard while changing to Snowboard Girl's side-scrolling levels. Use the player's buttons to move and time each jump.",
    'sled-rider': "Sled Rider changes Downhill Snowboard's coin collection to presents for a sled shop. Steer an automatically moving sled, jump gaps, and aim for distance.",
    'snow-rider-2': "Take a sleigh onto the endless Snow Rider 3D track after Downhill Snowboard. The Snow Rider 2 page swaps coin collecting for gifts and jumping.",
    'snowball-io': "Snowball.io moves away from Downhill Snowboard's slope to an arena full of opponents. Build a larger snowball as you roll, then choose when to engage.",
    'moto-x3m-winter': "A motorcycle time trial changes the rhythm after Downhill Snowboard's survival attempts. Moto X3M Winter combines ramps and traps with stars earned through fast finishes.",
  },
  '/snowboard-game': {
    'downhill-snowboard': "Keep snowboarding after SnowBoard Game with a survival score run and coin unlocks. Downhill Snowboard focuses on extending the descent and collecting toward characters and boards.",
    'snowboard-king-2024': "Snowboard King 2024 adds an avalanche chase to your course session after SnowBoard Game. Pick lines around trees and rocks, accelerate with Space, and upgrade abilities with coins.",
    'snowboard-game-party': "Change from SnowBoard Game's keyboard track riding to Snowboard Game Party's mouse or touch racing. Avoid snowballs and fences while working toward new equipment.",
    'snowboard-girl': "Move from SnowBoard Game's third-person tracks to Snowboard Girl's side view. Follow on-screen buttons, jump through levels, and collect coins as you advance.",
    'sled-rider': "Switch from SnowBoard Game's finish line to Sled Rider's automatic descent. The objective becomes surviving longer while collecting presents for the sled shop.",
    'snow-rider-2': "Snow Rider 2 replaces SnowBoard Game's 3D snowboard courses with the endless Snow Rider 3D sleigh run. Jump logs and gaps while pursuing distance.",
    'snowball-io': "Try arena elimination after SnowBoard Game's course racing with Snowball.io. Grow a snowball by rolling, watch nearby opponents, and decide when to approach.",
    'moto-x3m-winter': "Moto X3M Winter carries SnowBoard Game's finish-line focus onto a motorcycle course. Navigate winter ramps and traps, then improve times to earn stars for rider unlocks.",
  },
  '/snowboard-king-2024': {
    'downhill-snowboard': "Downhill Snowboard keeps coin collecting after Snowboard King 2024, with characters and boards to unlock. Extend a survival run instead of progressing through avalanche courses.",
    'snowboard-game': "SnowBoard Game offers a 3D track ride after Snowboard King 2024's route choices and upgrades. Avoid barriers as you approach the finish and try V for a grab.",
    'snowboard-game-party': "Try mouse or touch racing after Snowboard King 2024 in Snowboard Game Party. Snowballs and fences replace the mountain's trees and rocks, with equipment unlocks to pursue.",
    'snowboard-girl': "Take a side-scrolling route after Snowboard King 2024 with Snowboard Girl. Levels, jumps, and coin collecting use the buttons shown inside the player.",
    'sled-rider': "Sled Rider changes Snowboard King 2024's course progression to an ongoing sled descent. Jump gaps, steer around obstacles, and collect presents for the sled shop.",
    'snow-rider-2': "Try an endless sleigh route after Snowboard King 2024 on the Snow Rider 2 page. Its Snow Rider 3D player adds logs and gaps to clear while collecting gifts.",
    'snowball-io': "Snowball.io replaces Snowboard King 2024's avalanche chase with arena opponents. Roll to build a larger snowball and choose when to approach another character.",
    'moto-x3m-winter': "Move from Snowboard King 2024's mountain lines to Moto X3M Winter's motorcycle courses. Ramps, traps, and optional flips shape the route toward faster finishes.",
  },
  '/snowboard-game-party': {
    'downhill-snowboard': "Downhill Snowboard offers survival and coin collecting after Snowboard Game Party's racing. Use keyboard steering and save coins toward characters and boards between attempts.",
    'snowboard-game': "Take a third-person 3D track after Snowboard Game Party in SnowBoard Game. Follow the course past barriers, aim for the finish, and practice the separate grab action.",
    'snowboard-king-2024': "Move from Snowboard Game Party's equipment unlocks to ability upgrades in Snowboard King 2024. Read downhill routes, dodge trees and rocks, and stay ahead of the avalanche.",
    'snowboard-girl': "Snowboard Girl keeps touch-friendly on-screen buttons while changing Snowboard Game Party's racing to side-scrolling levels. Jump past hazards and collect coins through the course.",
    'sled-rider': "Sled Rider takes Snowboard Game Party's obstacle avoidance onto an automatic sled descent. Use keyboard steering and jumps, with presents to collect for the shop.",
    'snow-rider-2': "Switch from Snowboard Game Party's board to the Snow Rider 3D sleigh on Snow Rider 2. Keep an endless attempt alive through jumps, hazards, and gift collecting.",
    'snowball-io': "Take Snowboard Game Party's snowballs into an arena challenge with Snowball.io. Here rolling grows your own snowball before you choose an approach to opponents.",
    'moto-x3m-winter': "Moto X3M Winter brings course racing onto a motorcycle after Snowboard Game Party. Navigate winter ramps and traps, then improve finish times for stars and rider unlocks.",
  },
  '/snowboard-girl': {
    'downhill-snowboard': "Carry Snowboard Girl's coin collecting into Downhill Snowboard's survival challenge. Keep the descent going and use collected coins to unlock characters and boards.",
    'snowboard-game': "Leave Snowboard Girl's side view for SnowBoard Game's third-person 3D tracks. Keyboard movement and a separate V grab input guide the rider toward each finish.",
    'snowboard-king-2024': "Snowboard King 2024 adds route planning and an avalanche chase after Snowboard Girl's jump levels. Steer around trees and rocks, accelerate with Space, and improve abilities with coins.",
    'snowboard-game-party': "Try obstacle racing after Snowboard Girl in Snowboard Game Party. Use mouse or touch to pass snowballs and fences while progressing toward equipment unlocks.",
    'sled-rider': "Trade Snowboard Girl's board for an automatically moving sled in Sled Rider. Steer and jump through a snowy 3D course while collecting presents for new sleds.",
    'snow-rider-2': "Snow Rider 2 changes Snowboard Girl's level progression to an endless sleigh run. The embedded Snow Rider 3D player asks you to jump logs and gaps while gathering gifts.",
    'snowball-io': "Snowball.io brings a different use for snowballs after Snowboard Girl's levels. Roll through an arena to grow one, watch nearby characters, and choose when to engage.",
    'moto-x3m-winter': "Take jumping practice from Snowboard Girl onto a motorcycle in Moto X3M Winter. Timed levels combine ramps, traps, and flips, with stars rewarding faster finishes.",
  },
  '/ski-king': {
    'ski-rush': "Ski Rush shifts from Ski King's marked courses to surviving an ongoing descent. Mouse or touch steers the skier, and collected flags add to your score.",
    'sled-rider': "Sled Rider removes Ski King's marked-course finish from the session. Follow an automatic downhill route, jump gaps, and collect presents toward new sleds.",
    'snow-rider-2': "Keep descending after Ski King's flag courses in the Snow Rider 3D sleigh game. On Snow Rider 2, distance and gifts replace required flag passes.",
    'snowball-io': "Leave Ski King's required ski route for Snowball.io's arena movement. Rolling grows your snowball; choosing an approach to opponents matters more than a finish time.",
    'moto-x3m-winter': "Take Ski King's timed-course goal onto a motorcycle in Moto X3M Winter. Ramps, traps, and flips provide a different route toward faster finishes and unlockable riders.",
  },
  '/ski-rush': {
    'ski-king': "Try Ski King when you want a finish time after Ski Rush's survival runs. Flags mark the required route, and passing the wrong side resets the level.",
    'sled-rider': "Trade Ski Rush's mouse or touch steering for Sled Rider's keyboard-controlled descent. Steer around obstacles, jump gaps, and collect presents for the sled shop.",
    'snow-rider-2': "After Ski Rush's flag collecting, try gifts and jumps on Snow Rider 2's endless sleigh track. The embedded Snow Rider 3D player keeps distance as the goal.",
    'snowball-io': "Snowball.io turns Ski Rush's obstacle survival into a contest against arena opponents. Keep rolling to grow a snowball before selecting a route into the fight.",
    'moto-x3m-winter': "Move from Ski Rush's ongoing slope to Moto X3M Winter's levels. Guide a motorcycle through ramps and traps, aiming for fast finishes instead of survival distance.",
  },
  '/santa-collecting-gifts': {
    'crazy-christmas-fun': "Crazy Christmas Fun trades falling presents and bombs for a flying route around balloons. Click to raise Santa's sleigh and reach a Christmas tree to advance.",
    'merge-christmas': "Trade Santa's falling presents for snowballs you place yourself in Merge Christmas. Aim matching pieces at one another and combine them inside a portrait puzzle box.",
    'sled-rider': "Sled Rider takes Santa Collecting Gifts' presents onto a downhill course. Steer and jump through hazards while saving gifts for sleds, with distance extending the challenge.",
    'snow-rider-2': "For gift collecting along a moving route after Santa Collecting Gifts, try Snow Rider 2. Its Snow Rider 3D sleigh run adds logs and gaps to clear.",
    'snowball-io': "Snowball.io swaps Santa Collecting Gifts' falling objects for opponents in a snowball arena. Roll to grow your snowball, then choose when to engage another character.",
    'moto-x3m-winter': "Try timed motorcycle levels after Santa Collecting Gifts' three-life score attempts. Moto X3M Winter offers ramps, traps, and stars that reward faster course finishes.",
  },
  '/crazy-christmas-fun': {
    'santa-collecting-gifts': "Santa Collecting Gifts replaces Crazy Christmas Fun's route to a tree with a three-life score challenge. Use keyboard movement to catch falling presents and avoid bombs.",
    'merge-christmas': "Switch from flying past balloons to lining up snowball matches in Merge Christmas. Use the mouse or drag and release on a phone to place each piece.",
    'sled-rider': "Bring Crazy Christmas Fun's gift collecting down to the snow in Sled Rider. Automatic downhill movement, keyboard steering, and jumps replace raising a flying sleigh.",
    'snow-rider-2': "Snow Rider 2 offers a ground-level sleigh route after Crazy Christmas Fun's flying levels. Survive the endless Snow Rider 3D track, jumping logs and collecting gifts.",
    'snowball-io': "Leave Crazy Christmas Fun's balloon route for Snowball.io's arena opponents. Roll to grow a snowball and choose an approach, with elimination replacing the Christmas tree destination.",
    'moto-x3m-winter': "Moto X3M Winter replaces Crazy Christmas Fun's flying sleigh with a motorcycle. Follow winter ramps and traps toward timed finishes, earning stars for rider unlocks.",
  },
  '/merge-christmas': {
    'santa-collecting-gifts': "Santa Collecting Gifts changes snowball placement into a keyboard catching challenge. Guide Santa's sleigh beneath falling presents, avoid bombs, and protect three lives.",
    'crazy-christmas-fun': "Keep the Christmas setting while swapping the merge box for a flying sleigh in Crazy Christmas Fun. Click or tap to rise past balloons and reach the tree.",
    'sled-rider': "After planning snowball drops, try steering a moving sled through a snowy 3D course. Sled Rider combines jumps, obstacle avoidance, and presents saved for the sled shop.",
    'snow-rider-2': "Snow Rider 2 adds an endless sleigh descent after Merge Christmas's matching puzzle. Its Snow Rider 3D player asks you to jump logs and gaps while collecting gifts.",
    'snowball-io': "Take snowballs from the merge box into an arena in Snowball.io. Grow a larger snowball by rolling, then choose an approach to nearby opponents.",
  },
  '/sled-rider': {
    'snow-rider-2': "Snow Rider 2 offers another endless sleigh route after Sled Rider. Follow its Snow Rider 3D track past rolling snowballs, logs, and gaps.",
    'snowball-io': "Leave Sled Rider's downhill route for Snowball.io's arena fights. Roll to build your snowball before approaching opponents, making elimination the next goal.",
    'moto-x3m-winter': "Move from Sled Rider's endless descent to Moto X3M Winter's timed motorcycle courses. Ramps, traps, and optional flips lead toward faster finishes and rider unlocks.",
    'downhill-snowboard': "Keep the downhill survival goal after Sled Rider while changing to a snowboard. Gather coins in Downhill Snowboard to unlock characters and boards between attempts.",
    'snowboard-game': "SnowBoard Game gives you a finish line after Sled Rider's ongoing descent. Steer a snowboarder through a 3D course and use V for grabs.",
  },
  '/snow-rider-2': {
    'sled-rider': "Stay with sledding after Snow Rider 2 and try Sled Rider's increasing pace and gift-funded sled shop. Its automatic descent asks you to steer and jump.",
    'downhill-snowboard': "Move from Snow Rider 2's sleigh to a snowboard score run with coin collecting. Downhill Snowboard spends those coins on characters and boards between attempts.",
    'snowboard-game': "Choose SnowBoard Game for a finish-line goal after Snow Rider 2's endless sleigh ride. Steer a snowboarder through 3D tracks and try the V grab action.",
    'ski-king': "Trade Snow Rider 2's endless run for Ski King's marked ski courses. Pass each flag on the correct side, then improve skills and chase faster finishes.",
    'ski-rush': "Ski Rush carries downhill survival onto skis after Snow Rider 2, using mouse or touch controls. Collect flags for points while keeping clear of obstacles.",
    'snowball-io': "Snowball.io changes Snow Rider 2's distance objective to eliminating arena opponents. Roll around to build a larger snowball before choosing a route toward another character.",
    'moto-x3m-winter': "Moto X3M Winter replaces the sleigh with a motorcycle and timed obstacle courses. After Snow Rider 2, try ramps, traps, and flips that can improve your time.",
  },
  '/snowball-io': {
    'sled-rider': "Sled Rider moves the challenge from Snowball.io's arena opponents to obstacles on an automatic downhill route. Choose clear lines, jump gaps, and gather gifts for sleds.",
    'downhill-snowboard': "Take a snowboard downhill after Snowball.io and collect coins along a survival run. Those coins unlock characters and boards, replacing the arena's opponent-elimination objective.",
    'snowboard-game': "Aim for a course finish in SnowBoard Game after Snowball.io's arena battles. A third-person snowboard view and separate grab input replace growing and fighting with snowballs.",
    'ski-king': "Swap Snowball.io's arena movement for Ski King's required flag passes and timed finishes. Trees, rocks, and icy ground shape the route through each mountain course.",
    'ski-rush': "Ski Rush offers mouse or touch skiing after Snowball.io's snowball fights. Extend a downhill attempt and collect flags for score while staying away from obstacles.",
    'snow-rider-2': "Snow Rider 2 takes you from Snowball.io's arena to the endless Snow Rider 3D sleigh track. Jump logs and gaps as distance increases your score.",
    'moto-x3m-winter': "Ride through timed motorcycle levels after Snowball.io's open arena fights. Moto X3M Winter adds ramps, traps, and explosives, with stars earned through quicker finishes.",
  },
  '/moto-x3m-winter': {
    'sled-rider': "After Moto X3M Winter's timed bike courses, Sled Rider makes survival on an automatic sled descent the objective. Gather presents to work toward shop unlocks.",
    'downhill-snowboard': "Exchange Moto X3M Winter's bike and finish times for Downhill Snowboard's coin-collecting survival run. Steer along the slope and unlock new boards or characters.",
    'snowboard-game': "SnowBoard Game keeps a finish-line objective after Moto X3M Winter, but puts you on a snowboard. Guide the 3D rider past barriers and practice a grab.",
    'ski-king': "Bring your course practice from Moto X3M Winter to Ski King's downhill flag routes. A wrong-side flag pass resets the level, so line up each turn.",
    'ski-rush': "Step off Moto X3M Winter's motorcycle for Ski Rush's mouse or touch skiing. Keep the descent going instead of reaching a timed finish, collecting flags for points.",
    'snow-rider-2': "Take an endless sleigh run after Moto X3M Winter's motorcycle levels on the Snow Rider 2 page. Its Snow Rider 3D player rewards distance and gift collecting.",
    'snowball-io': "Switch from Moto X3M Winter's timed course hazards to Snowball.io's arena fights. Roll a larger snowball, watch surrounding opponents, and choose when to engage.",
  },
};

/** @type {Record<string, Record<string, string>>} */
const sledExpansionDescriptionsByPage = {
  '/': {
    'gnome-bobsled': "Gnome Bobsled brings timed ice-track racing to this sled collection. Build speed with the starting push, lean through bends, and brake when the next corner needs it.",
    'sled-line': "Sled Line makes drawing the road your main sledding skill. Use a mouse or finger to connect slopes and gaps, then see how your route guides the sled.",
    'sleigh-o-balance': "Sleigh O’Balance adds gift loading and balance to the sled selection. Distribute the presents across the sleigh and respond when a falling anvil changes the load.",
  },
  '/games': {
    'gnome-bobsled': "Choose Gnome Bobsled for timed races inside a 3D ice channel. Practice the push at the start, control each bend, and chase medals or your own best-record ghost.",
    'sled-line': "The route-drawing choice in this winter collection is Sled Line. Sketch a road with a mouse or finger to carry the sled over gaps and along the slopes.",
    'sleigh-o-balance': "The gift-balancing option is Sleigh O’Balance, with presents and falling anvils affecting the sleigh. Plan where the weight goes instead of steering through a downhill course.",
  },
  '/404': {
    'gnome-bobsled': "Find a fresh start on Gnome Bobsled’s timed ice tracks after this missing page. Push off, work through the bends, and compare the result with your personal best.",
    'sled-line': "Draw a new way forward in Sled Line after this missing page. A mouse or finger lays the road that guides a sled through slopes and gaps.",
    'sleigh-o-balance': "Pick up a gift-loading challenge in Sleigh O’Balance to continue your visit. Balance the sleigh’s load by weighing presents against anvil drops.",
  },
  '/snowboard-games': {
    'gnome-bobsled': "Exchange the snowboard for an ice-track time trial in Gnome Bobsled. A timed push, cornering, and braking shape your run toward medals and a better personal record.",
    'sled-line': "Leave snowboard steering for road drawing in Sled Line. Sketch a smooth path across slopes and gaps, then guide the sled with the route you created.",
    'sleigh-o-balance': "Take a break from snowboard courses with Sleigh O’Balance’s loaded sleigh. Place gifts to manage the weight and react to anvils falling into the challenge.",
  },
  '/ski-games': {
    'gnome-bobsled': "Carry a taste for timed ski finishes into Gnome Bobsled’s ice channel. Practice its starting push, lean through the bends, and manage braking to improve your time.",
    'sled-line': "Change from ski turns to drawing a route for a sled in Sled Line. Mouse or touch input builds the road through gaps and slopes before the sled follows it.",
    'sleigh-o-balance': "Move away from the ski slopes for gift balancing in Sleigh O’Balance. Spread the load across the sleigh and stay alert for falling anvils.",
  },
  '/christmas-games': {
    'gnome-bobsled': "Add a timed winter race after the festive games with Gnome Bobsled. Push the bobsled off the start, take the ice-track bends, and aim for a medal.",
    'sled-line': "Keep the sled theme after the Christmas collection by drawing roads in Sled Line. Use a mouse or finger to bridge gaps and shape a route along snowy slopes.",
    'sleigh-o-balance': "Sleigh O’Balance turns Christmas presents into a weight-management challenge. Load the gifts across a sleigh and decide when an anvil can counterbalance them.",
  },
  '/sled-rider': {
    'gnome-bobsled': "Gnome Bobsled replaces Sled Rider’s ongoing descent with timed ice-track finishes. Push off at the start, take the corners, and race your own best-record ghost.",
    'sled-line': "Put the route in your own hands after Sled Rider with Sled Line. Draw roads across slopes and gaps rather than steering around obstacles on an automatic descent.",
    'sleigh-o-balance': "Turn Sled Rider’s gift collecting into gift placement in Sleigh O’Balance. Keep the sleigh’s load balanced as presents and falling anvils change the challenge.",
  },
  '/snow-rider-2': {
    'gnome-bobsled': "Try a marked ice course after Snow Rider 2’s endless sleigh run in Gnome Bobsled. The timed push, bends, and braking give you a finish time to improve.",
    'sled-line': "Sled Line changes Snow Rider 2’s steering and jumps into road drawing. Sketch the path through slopes and gaps, then let your lines guide the sled.",
    'sleigh-o-balance': "After Snow Rider 2’s downhill gifts, arrange presents on the sleigh in Sleigh O’Balance. Manage the load’s balance and watch how falling anvils affect it.",
  },
  '/snowball-io': {
    'gnome-bobsled': "Gnome Bobsled changes Snowball.io’s arena battles into a race against the clock. Time the starting push and manage ice-track bends as you chase your personal best.",
    'sled-line': "Swap Snowball.io’s moving opponents for a path you design in Sled Line. Draw roads across slopes and gaps to guide the sled with mouse or touch input.",
    'sleigh-o-balance': "Replace Snowball.io’s growing snowball with a loaded sleigh in Sleigh O’Balance. Use mouse controls to weigh gifts against anvil drops and keep the load balanced.",
  },
  '/moto-x3m-winter': {
    'gnome-bobsled': "Keep chasing finish times after Moto X3M Winter with Gnome Bobsled’s ice-track races. A starting push, cornering, and braking replace motorcycle ramps and flips.",
    'sled-line': "Sled Line turns Moto X3M Winter’s fixed course into a road-drawing challenge. Sketch smooth connections between slopes and gaps to guide a sled with a mouse or finger.",
    'sleigh-o-balance': "Change from Moto X3M Winter’s bike balance to distributing weight in Sleigh O’Balance. Load gifts, consider anvil counterweights, and keep the sleigh from tipping too far.",
  },
  '/gnome-bobsled': {
    'sled-rider': "Sled Rider changes Gnome Bobsled’s timed track into an ongoing downhill survival run. Steer past trees and rocks, jump gaps, and collect gifts for new sleds.",
    'snow-rider-2': "Leave Gnome Bobsled’s ice channel for the Snow Rider 3D sleigh on Snow Rider 2. Jump logs and gaps while building distance and collecting gifts.",
    'sled-line': "Sled Line trades Gnome Bobsled’s racing inputs for a road you draw yourself. Plan smooth connections between slopes and gaps with a mouse or finger.",
    'sleigh-o-balance': "Move from Gnome Bobsled’s cornering to managing a loaded sleigh in Sleigh O’Balance. Place gifts to preserve balance and respond to falling anvils.",
    'snowball-io': "Snowball.io takes your session beyond Gnome Bobsled’s solo time trials into an arena. Roll to grow a snowball, watch nearby opponents, and choose an approach before engaging.",
  },
  '/sled-line': {
    'sled-rider': "Trade Sled Line’s drawn roads for steering and jumps in Sled Rider. An automatic downhill run asks you to avoid trees, rocks, and gaps while collecting gifts.",
    'snow-rider-2': "Try Snow Rider 2 when you want an endless sleigh track after Sled Line’s route drawing. Its Snow Rider 3D player combines logs, gaps, jumps, and gift collecting.",
    'gnome-bobsled': "Gnome Bobsled puts you inside an ice channel after Sled Line’s road building. Time the starting push, control bends and braking, and work toward a faster finish.",
    'sleigh-o-balance': "Keep planning each move after Sled Line with Sleigh O’Balance’s gift loads. Balance presents across the sleigh and adapt when an anvil falls.",
    'snowball-io': "Switch from Sled Line’s route planning to moving among opponents in Snowball.io. Rolling builds a larger snowball before you decide where to approach another character.",
  },
  '/sleigh-o-balance': {
    'sled-rider': "Carry the sleigh theme from Sleigh O’Balance into Sled Rider’s downhill survival challenge. Collect gifts through steering and jumps to work toward sled-shop unlocks.",
    'snow-rider-2': "Snow Rider 2 turns Sleigh O’Balance’s gift loading into gift collecting on a moving course. The embedded Snow Rider 3D sleigh must jump logs and gaps to keep going.",
    'gnome-bobsled': "Race for a finish time after Sleigh O’Balance in Gnome Bobsled. Push off the start, lean into ice-track bends, and use braking to prepare for the next corner.",
    'sled-line': "Sled Line keeps a planning focus after Sleigh O’Balance while changing the task to road drawing. Lay a route across slopes and gaps with a mouse or finger.",
    'snowball-io': "Leave Sleigh O’Balance’s presents for a snowball arena in Snowball.io. Grow your snowball by rolling and watch opponents before choosing when to engage.",
  },
};

/** @type {Record<string, Record<string, string>>} */
const waddlePeaksDescriptionsByPage = {
  '/games': {
    'waddle-peaks': "Waddle Peaks sends a penguin down 3D ski slopes through several event types. Try races, slalom, tricks, fish collecting, and escapes from avalanches or a yeti.",
  },
  '/404': {
    'waddle-peaks': "Find another ski slope with Waddle Peaks and its penguin mountain challenges. Turn through slalom gates, jump for tricks, collect fish, or race away from an avalanche or a yeti.",
  },
  '/ski-games': {
    'waddle-peaks': "Waddle Peaks adds a penguin and varied events to this ski collection. Take on races, slalom turns, trick challenges, and fish collecting, with avalanche and yeti escapes to try too.",
  },
  '/ski-king': {
    'waddle-peaks': "Waddle Peaks expands Ski King's marked-course session with several penguin ski events. Practice slalom and time trials, jump for trick scores, or try escaping an avalanche or a yeti.",
  },
  '/ski-rush': {
    'waddle-peaks': "Follow Ski Rush's survival descent with Waddle Peaks' 3D penguin ski challenges. Choose races, slalom, tricks, or fish collecting, and try downhill escapes from an avalanche or a yeti.",
  },
  '/waddle-peaks': {
    'ski-king': "Ski King follows Waddle Peaks' varied events with marked ski courses and faster finish times to pursue. Pass flags on the correct side and use upgrade points between attempts.",
    'ski-rush': "Keep skiing after Waddle Peaks with Ski Rush's ongoing survival descent. Mouse or touch input steers past obstacles while collected flags add to your score.",
    'sled-rider': "Trade Waddle Peaks' skis for an automatically moving sled in Sled Rider. Steer around trees and rocks, jump gaps, and collect presents toward new sleds in the shop.",
    'snow-rider-2': "Snow Rider 2 takes your session beyond Waddle Peaks' ski events onto an endless sleigh track. Its Snow Rider 3D player combines distance, gift collecting, and jumps over logs or gaps.",
    'snowball-io': "Leave Waddle Peaks' mountain events for a snowball arena in Snowball.io. Rolling builds a larger snowball before you choose when and where to approach opponents.",
  },
};

/** @type {Record<string, Record<string, string>>} */
const snowRidersDescriptionsByPage = {
  '/games': {
    'snow-riders': "Snow Riders brings skier-against-skier racing to the winter directory. Dodge obstacles, collect gems, and use rewards for equipment upgrades and more snowy courses.",
  },
  '/404': {
    'snow-riders': "Head back onto a ski course with Snow Riders and its downhill races. Steer past obstacles, gather gems, and work toward new gear, levels, and mountain maps.",
  },
  '/ski-games': {
    'snow-riders': "Snow Riders adds races against other skiers to this skiing collection. Use A/D, arrow keys, or the joystick to avoid obstacles and collect gems for progression.",
  },
  '/ski-king': {
    'snow-riders': "Carry Ski King's course practice into Snow Riders' races against other skiers. Navigate obstacles, gather gems, and check equipment upgrades between runs.",
  },
  '/ski-rush': {
    'snow-riders': "Move from Ski Rush's survival challenge to Snow Riders' ski races. Keep an open line past obstacles while collecting gems and working toward more gear and snowy maps.",
  },
  '/waddle-peaks': {
    'snow-riders': "Snow Riders follows Waddle Peaks' varied events with skier racing and equipment progression. Steer with keys or the joystick, avoid obstacles, and collect gems during each descent.",
  },
  '/snow-riders': {
    'ski-king': "Ski King swaps Snow Riders' rivals for a marked course and a finish time to improve. Pass each flag on the correct side and use upgrade points between attempts.",
    'ski-rush': "Keep descending after Snow Riders with Ski Rush's mouse or touch survival run. Steer around obstacles and collect scoring flags when the route leaves room.",
    'waddle-peaks': "Waddle Peaks turns Snow Riders' skier races into a penguin mountain adventure with several event types. Practice slalom, tricks, timed runs, and escapes from avalanches or a yeti.",
    'sled-rider': "Sled Rider changes Snow Riders' ski races into an ongoing sled descent. Jump gaps, steer around trees and rocks, and collect presents for the sled shop.",
    'snow-rider-2': "Compare a different winter ride after Snow Riders on the Snow Rider 2 page. Its Snow Rider 3D sleigh player combines endless distance, gift collecting, and jumps over logs or gaps.",
  },
};

/** @type {Record<string, Record<string, string>>} */
const christmasExpansionDescriptionsByPage = {
  '/games': {
    'xmas-triple-mahjong': "The three-tile matching choice is Xmas Triple Mahjong. Clear identical pictures in groups of three, choosing tiles with at least two adjacent sides open.",
    'xmas-balls': "Xmas Balls turns present clearing into an aiming challenge from the bottom of the board. Shoot the gift blocks before they touch the ground and pick up extra balls.",
    'xmas-memory-match': "Choose Xmas Memory Match for Christmas picture pairs in Easy or Medium mode. Flip cards and remember their positions to find each matching pair.",
    'scroll-and-spot': "Scroll and Spot adds a Christmas observation puzzle to the winter collection. Drag to move two aligned pictures together, then select all five differences to advance.",
    'subway-santa-runner-christmas': "Subway Santa Runner Christmas supplies an endless run through a snowy village. Help Santa after his presents scatter, using mouse or touch controls shown in the player.",
  },
  '/404': {
    'xmas-triple-mahjong': "Find a new match in Xmas Triple Mahjong after this missing page. Select three identical festive tiles with at least two adjacent sides open to clear them.",
    'xmas-balls': "Aim for another game with Xmas Balls and its falling gift blocks. Shoot from the bottom, collect additional balls, and clear the blocks before they reach the ground.",
    'xmas-memory-match': "Turn over a fresh card in Xmas Memory Match to continue your visit. Choose Easy or Medium and remember the Christmas pictures to uncover matching pairs.",
    'scroll-and-spot': "Look for a different route in Scroll and Spot's paired Christmas scenes. Drag the aligned pictures together and find five differences to reach the next level.",
    'subway-santa-runner-christmas': "Return to a snowy village with Subway Santa Runner Christmas. Santa's scattered presents set the scene for an endless run with mouse or touch input.",
  },
  '/christmas-games': {
    'xmas-triple-mahjong': "Xmas Triple Mahjong brings groups of three to the Christmas puzzle selection. Match identical festive pictures while checking that each tile has two adjacent sides open.",
    'xmas-balls': "Keep the Christmas gifts off the ground in Xmas Balls. Aim upward from the bottom to break falling blocks and collect extra balls for later shots.",
    'xmas-memory-match': "Xmas Memory Match offers a festive memory challenge with Easy and Medium modes. Reveal the cards, remember the Christmas pictures, and find their matching partners.",
    'scroll-and-spot': "Explore two Christmas scenes side by side in Scroll and Spot. Drag to scroll both pictures in sync, then select five differences to complete each level.",
    'subway-santa-runner-christmas': "Take Santa through a snowy village in Subway Santa Runner Christmas. This endless runner follows his scattered presents and supports mouse or touch play.",
  },
};

/** @type {Record<string, { title: string; challenge: string; detail: string }>} */
const christmasRecommendationFacts = {
  'santa-collecting-gifts': {
    title: 'Santa Collecting Gifts',
    challenge: 'catching falling presents while avoiding bombs',
    detail: 'Use keyboard movement to guide the sleigh and protect Santa’s three lives as the pace increases.',
  },
  'crazy-christmas-fun': {
    title: 'Crazy Christmas Fun',
    challenge: 'flying Santa’s sleigh through a balloon-filled sky',
    detail: 'Click or tap to rise, gather presents, and reach the Christmas tree to advance.',
  },
  'merge-christmas': {
    title: 'Merge Christmas',
    challenge: 'dropping matching snowballs into a festive merge box',
    detail: 'Position each piece with mouse or touch input and combine matching pieces into larger snowballs or Christmas characters.',
  },
  'xmas-triple-mahjong': {
    title: 'Xmas Triple Mahjong',
    challenge: 'clearing festive tiles in identical groups of three',
    detail: 'Check for at least two adjacent open sides before choosing a tile for the next match.',
  },
  'xmas-balls': {
    title: 'Xmas Balls',
    challenge: 'aiming balls at falling gift blocks from the bottom of the board',
    detail: 'Break the blocks before they touch the ground and pick up extra balls to expand your shots.',
  },
  'xmas-memory-match': {
    title: 'Xmas Memory Match',
    challenge: 'remembering Christmas pictures and finding matching card pairs',
    detail: 'Choose Easy or Medium, flip the cards, and use remembered positions to uncover each pair.',
  },
  'scroll-and-spot': {
    title: 'Scroll and Spot',
    challenge: 'finding five differences between aligned Christmas pictures',
    detail: 'Drag to scroll both scenes together and select the differences to reach the next level.',
  },
  'subway-santa-runner-christmas': {
    title: 'Subway Santa Runner Christmas',
    challenge: 'an endless run through Santa’s snowy village',
    detail: 'Help Santa after his presents scatter and follow the mouse or touch controls inside the player.',
  },
};

/**
 * Keep new Christmas recommendations specific to both their source and destination.
 * @param {import('./types').Game} game
 * @param {string} page
 * @returns {string | undefined}
 */
function christmasRecommendationDescription(game, page) {
  const sourceSlug = page.slice(1);
  const source = christmasRecommendationFacts[sourceSlug];
  const target = christmasRecommendationFacts[game.slug];
  if (!source || !target || sourceSlug === game.slug) return undefined;
  return `After ${source.title}, try ${target.title} for ${target.challenge}. ${target.detail}`;
}

/**
 * Return copy for the card's page context without reusing its SEO description.
 * @param {import('./types').Game} game
 * @param {string} pathname
 * @returns {string}
 */
export function gameCardDescription(game, pathname) {
  const path = pathname.replace(/\/+$/, '') || '/';
  const page = path === '/404.html' ? '/404' : path;
  const description = descriptionsByPage[page]?.[game.slug] ?? sledExpansionDescriptionsByPage[page]?.[game.slug] ?? waddlePeaksDescriptionsByPage[page]?.[game.slug] ?? snowRidersDescriptionsByPage[page]?.[game.slug] ?? christmasExpansionDescriptionsByPage[page]?.[game.slug] ?? christmasRecommendationDescription(game, page);
  if (description) return description;

  // New catalog entries remain useful before their contextual copy is written.
  return `${game.title} has a play page with its game window and instructions. Open the guide to check the objective and controls before you begin.`;
}
