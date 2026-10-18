// Editorial card copy uses the gameplay facts recorded in data/games.json.
// Each route has its own opening so a recommendation explains why it fits here.
/** @type {Record<string, Record<string, string>>} */
const descriptionsByPage = {
  '/': {
    'sled-rider': "Sled Rider pairs an automatic downhill ride with a gift-funded sled shop. Steer around trees and rocks, jump gaps, and choose between distance and presents.",
    'snow-rider-2': "For a second endless sleigh run, open Snow Rider 2 and its Snow Rider 3D player. Rolling snowballs, logs, and gaps demand steering and jumps.",
  },
  '/games': {
    'sled-rider': "Choose the automatic downhill sled run for distance and gift collecting. Steer through a 3D course, jump gaps, and save presents for sleds.",
    'downhill-snowboard': "The coin-collecting snowboard option keeps the focus on surviving a downhill run. Spend collected coins on characters and boards between attempts.",
    'snowboard-game': "SnowBoard Game brings finish-line racing to the collection, with a third-person 3D view. Follow snowy tracks, avoid barriers, and use V to grab.",
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
    'sled-rider': "Sled Rider changes Downhill Snowboard's coin collection to presents for a sled shop. Steer an automatically moving sled, jump gaps, and aim for distance.",
    'snow-rider-2': "Take a sleigh onto the endless Snow Rider 3D track after Downhill Snowboard. The Snow Rider 2 page swaps coin collecting for gifts and jumping.",
    'snowball-io': "Snowball.io moves away from Downhill Snowboard's slope to an arena full of opponents. Build a larger snowball as you roll, then choose when to engage.",
    'moto-x3m-winter': "A motorcycle time trial changes the rhythm after Downhill Snowboard's survival attempts. Moto X3M Winter combines ramps and traps with stars earned through fast finishes.",
  },
  '/snowboard-game': {
    'downhill-snowboard': "Keep snowboarding after SnowBoard Game with a survival score run and coin unlocks. Downhill Snowboard focuses on extending the descent and collecting toward characters and boards.",
    'sled-rider': "Switch from SnowBoard Game's finish line to Sled Rider's automatic descent. The objective becomes surviving longer while collecting presents for the sled shop.",
    'snow-rider-2': "Snow Rider 2 replaces SnowBoard Game's 3D snowboard courses with the endless Snow Rider 3D sleigh run. Jump logs and gaps while pursuing distance.",
    'snowball-io': "Try arena elimination after SnowBoard Game's course racing with Snowball.io. Grow a snowball by rolling, watch nearby opponents, and decide when to approach.",
    'moto-x3m-winter': "Moto X3M Winter carries SnowBoard Game's finish-line focus onto a motorcycle course. Navigate winter ramps and traps, then improve times to earn stars for rider unlocks.",
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

/**
 * Return copy for the card's page context without reusing its SEO description.
 * @param {import('./types').Game} game
 * @param {string} pathname
 * @returns {string}
 */
export function gameCardDescription(game, pathname) {
  const path = pathname.replace(/\/+$/, '') || '/';
  const page = path === '/404.html' ? '/404' : path;
  const description = descriptionsByPage[page]?.[game.slug];
  if (description) return description;

  // New catalog entries remain useful before their contextual copy is written.
  return `${game.title} has a play page with its game window and instructions. Open the guide to check the objective and controls before you begin.`;
}
