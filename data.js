// Starter sample pool. Replace/extend this with your real MLB data source later.
// Keeping this here prevents the bot from crashing if an external source fails.
export async function getStolenBaseCandidates() {
  return [
    { name: 'Elly De La Cruz', team: 'CIN', opponent: 'TBD', seasonSB: 30, last14SB: 6, sprintPercentile: 99, obp: .345, lineupSpot: 1, pitcherSBAAllowed: 16, catcherCSRate: .18, odds: '+210' },
    { name: 'Bobby Witt Jr.', team: 'KC', opponent: 'TBD', seasonSB: 22, last14SB: 4, sprintPercentile: 98, obp: .370, lineupSpot: 2, pitcherSBAAllowed: 13, catcherCSRate: .22, odds: '+240' },
    { name: 'Corbin Carroll', team: 'ARI', opponent: 'TBD', seasonSB: 17, last14SB: 3, sprintPercentile: 97, obp: .340, lineupSpot: 1, pitcherSBAAllowed: 12, catcherCSRate: .20, odds: '+260' },
    { name: 'CJ Abrams', team: 'WSH', opponent: 'TBD', seasonSB: 19, last14SB: 3, sprintPercentile: 94, obp: .330, lineupSpot: 1, pitcherSBAAllowed: 10, catcherCSRate: .21, odds: '+280' },
    { name: 'Julio Rodríguez', team: 'SEA', opponent: 'TBD', seasonSB: 14, last14SB: 2, sprintPercentile: 91, obp: .335, lineupSpot: 2, pitcherSBAAllowed: 9, catcherCSRate: .23, odds: '+320' }
  ];
}
