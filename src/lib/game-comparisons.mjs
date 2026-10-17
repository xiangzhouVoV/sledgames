/** @type {Record<string, { otherSlug: string; title: string; objective: string; controls: string; choice: string }>} */
const comparisons = {
  'ski-king': {
    otherSlug: 'ski-rush',
    title: 'Ski King vs Ski Rush',
    objective: 'Ski King asks you to complete a marked course with a fast time. Every flag must be passed on its correct side; a wrong-side pass resets the level. Ski Rush instead focuses on staying on the slope and collecting flags for points.',
    controls: 'Ski King shows Left and Right arrows for carving; its menu interactions use mouse or touch. Ski Rush uses mouse or touch to steer during the descent. Choose the steering method you want to practice when switching games.',
    choice: 'Choose Ski King to practice a course, refine flag approaches, and compare finishing times. Choose Ski Rush for an ongoing descent where you decide which scoring flags are worth reaching.',
  },
  'ski-rush': {
    otherSlug: 'ski-king',
    title: 'Ski Rush vs Ski King',
    objective: 'A flag in Ski Rush adds to your score during an ongoing descent. In Ski King, flags mark the required route, and passing one on the wrong side restarts the level. Decide whether you want a longer survival run or a completed, timed course.',
    controls: 'Ski Rush follows mouse or touch input, while Ski King shows Left and Right arrow keys for carving. With the mouse, practice moving side to side on clear snow before making a detour for a scoring flag.',
    choice: 'Ski King also offers upgrade points that affect skiing skills. Its course retries let you compare a familiar route after an upgrade; stay with Ski Rush if your next goal is surviving longer and choosing safer flags.',
  },
  'downhill-snowboard': {
    otherSlug: 'snowboard-game',
    title: 'Downhill Snowboard vs SnowBoard Game',
    objective: 'Downhill Snowboard uses a 2D descent and an endless score objective, with coins to unlock characters and boards. SnowBoard Game follows a 3D rider toward a finish line, so reaching the end of its course is the immediate goal.',
    controls: 'Steer Downhill Snowboard with A/D or the arrow keys. SnowBoard Game lists WASD or arrows plus V for a separate grab action.',
    choice: 'Choose Downhill Snowboard to extend a run and save coins for unlocks. For a route with a destination and a separate grab action to practice, switch to SnowBoard Game.',
  },
};

/** @param {string} slug */
export function gameComparison(slug) {
  return comparisons[slug];
}
