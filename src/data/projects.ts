/**
 * Job photos in src/assets/jobs/<category>/<file>. Only the company's own photos (no stock, no AI).
 * Alt text describes what is in the frame; it is also the gallery caption in the lightbox.
 * A before/after pair is two entries with the same `pair` key and role 'before' / 'after'.
 */
export interface Project {
  file: string;
  category: string;
  alt: string;
  role?: 'before' | 'after';
  pair?: string;
  width: number;
  height: number;
  source?: string;
}

export const projects: Project[] = [
  { file: 'junk-removal/couch-carry.webp', category: 'junk-removal', alt: 'Two crew members carrying a brown leather couch overhead down the driveway to the truck', width: 1422, height: 1635, source: 'owner' },
  { file: 'cleanouts/sweep.webp', category: 'cleanouts', alt: 'Crew member in work gloves sweeping debris into a dustpan on a cleared living room floor', width: 1200, height: 1320, source: 'owner' },
  { file: 'demolition/kitchen-gut.webp', category: 'demolition', alt: 'Kitchen gutted to the bare brick wall and floorboards after interior demolition, old pipes and wiring exposed', width: 1200, height: 1600, source: 'owner' },
  { file: 'construction-debris/loaded-bed.webp', category: 'construction-debris', alt: 'Truck bed packed with full bags of construction debris', width: 1080, height: 1435, source: 'owner' },
  { file: 'crew/truck.webp', category: 'crew', alt: 'White box truck with a high-sided black dump bed, company logo and phone number on the door, parked on a residential street', width: 1600, height: 1200, source: 'owner' },
  // Owner's job photos. The Webster Groves bathroom pairs are "before" (as found) and "after" (our demo).
  { file: 'demolition/webster-groves-bathroom-before.jpg', category: 'demolition', role: 'before', pair: 'webster-groves-bathroom', alt: 'Webster Groves bathroom before demolition, with a dark double vanity, octagonal mirror and gray tile floor', width: 1500, height: 2000, source: 'owner, 2026' },
  { file: 'demolition/webster-groves-bathroom-gutted.jpg', category: 'demolition', role: 'after', pair: 'webster-groves-bathroom', alt: 'The same Webster Groves bathroom after our demolition, stripped to the studs, insulation and subfloor with the drain and water lines exposed', width: 1500, height: 2000, source: 'owner, 2026-10-29' },
  { file: 'demolition/webster-groves-shower-before.jpg', category: 'demolition', role: 'before', pair: 'webster-groves-shower', alt: 'Webster Groves walk-in shower before demolition, with striped wall tile, a bench and a pebble floor', width: 1500, height: 2000, source: 'owner, 2026' },
  { file: 'demolition/webster-groves-shower-gutted.jpg', category: 'demolition', role: 'after', pair: 'webster-groves-shower', alt: 'The shower corner after our demolition, down to bare studs, insulation and subfloor', width: 1500, height: 2000, source: 'owner, 2026-10-29' },
  { file: 'demolition/ladue-curved-shower-demo.jpg', category: 'demolition', alt: 'Curved walk-in shower in Ladue torn out to the framing, exposing the copper plumbing, ceiling joists and three windows', width: 1500, height: 2000, source: 'owner, 2026-10-14' },
  { file: 'junk-removal/ofallon-carpet-removal-living-room.jpg', category: 'junk-removal', alt: "O'Fallon living room with the carpet and pad pulled up and hauled out, leaving bare subfloor under a vaulted ceiling", width: 1500, height: 2000, source: 'owner' },
  { file: 'junk-removal/ofallon-carpet-removal-bedroom.jpg', category: 'junk-removal', alt: "Empty O'Fallon bedroom after carpet and junk removal, down to the subfloor with the tack strip along the walls", width: 1500, height: 2000, source: 'owner' },
  { file: 'junk-removal/florissant-sleigh-bed-removal.jpg', category: 'junk-removal', alt: 'Crew member in an STL shirt carrying a wooden sleigh bed frame across a Florissant front porch to the truck', width: 1500, height: 2000, source: 'owner, 2026-09-30' },
  { file: 'junk-removal/ballwin-display-cabinets.jpg', category: 'junk-removal', alt: 'Pair of oak display cabinets with glass doors in a Ballwin basement, ready to be hauled out', width: 1500, height: 2000, source: 'owner, 2026-09-25' },
  { file: 'junk-removal/ballwin-armoire.jpg', category: 'junk-removal', alt: 'Oak armoire with mirrored doors in a Ballwin garage, ready for removal', width: 1500, height: 2000, source: 'owner, 2026-09-25' },
  { file: 'demolition/ferguson-room-demo.jpg', category: 'demolition', alt: 'Ferguson room after interior demolition, with the walls taken out, the ceiling and floor marked where they stood, and the floor swept clean', width: 1500, height: 2000, source: 'owner' },
  { file: 'demolition/st-louis-kitchen-demo.jpg', category: 'demolition', alt: 'St. Louis kitchen after demolition, with the cabinets, counters and floor tile removed down to the underlayment', width: 1500, height: 2000, source: 'owner, 2026-09-16' },
  { file: 'junk-removal/cottleville-fence-pickup.jpg', category: 'junk-removal', alt: 'Pile of old wooden fence boards and posts beside a metal barn in Cottleville, waiting to be loaded and hauled away', width: 1500, height: 2000, source: 'owner' },
  { file: 'construction-debris/hazelwood-debris-pile.jpg', category: 'construction-debris', alt: 'Pile of old gutters, siding and trim scraps, flooring boxes and bagged debris beside a carport in Hazelwood, ready to be loaded', width: 2000, height: 1500, source: 'owner' },
  { file: 'junk-removal/spanish-lake-loaded-truck.jpg', category: 'junk-removal', alt: 'Our truck bed seen from above, packed with filing cabinets, shelving, pallets and storage bins from a Spanish Lake garage', width: 1500, height: 2000, source: 'owner' },
  { file: 'cleanouts/maryland-heights-garage-before.jpg', category: 'cleanouts', role: 'before', pair: 'maryland-heights-garage', alt: 'Maryland Heights garage before the cleanout, packed with a washer and dryer, a utility sink, rolled carpet pad, boxes and scrap wood', width: 1500, height: 2000, source: 'owner' },
  { file: 'cleanouts/maryland-heights-garage-after.jpg', category: 'cleanouts', role: 'after', pair: 'maryland-heights-garage', alt: 'The same Maryland Heights garage after our cleanout, empty down to the concrete floor and bare shelves', width: 1500, height: 2000, source: 'owner' },
  { file: 'junk-removal/chesterfield-curbside-pickup.jpg', category: 'junk-removal', alt: 'Curbside pickup in Chesterfield: dresser drawers, a desk, a metal bed frame, a mirror and framed art set out on the lawn by the sidewalk', width: 1500, height: 2000, source: 'owner' },
  { file: 'junk-removal/wildwood-backyard-junk-pile.jpg', category: 'junk-removal', alt: 'Backyard pile in Wildwood along a wood fence: bagged trash, scrap lumber and drywall, old pipe, a storm door, a speaker and paint buckets, ready to be loaded', width: 2000, height: 1500, source: 'owner' },
  { file: 'construction-debris/ballwin-garage-remodel-debris.jpg', category: 'construction-debris', alt: 'Remodel debris piled in a Ballwin garage: drywall scraps, trim and lumber offcuts, flooring boxes, buckets and bagged debris, ready for pickup', width: 1500, height: 2000, source: 'owner' },
  { file: 'junk-removal/creve-coeur-basketball-hoop.jpg', category: 'junk-removal', alt: 'Portable basketball hoop from a Creve Coeur driveway loaded in the back of our dump truck, with the base, pole, backboard and rim', width: 1500, height: 2000, source: 'owner' },
  { file: 'construction-debris/affton-remodel-debris-load.jpg', category: 'construction-debris', alt: 'Our dump truck bed in Affton loaded with broken green wall tile on wire mesh, scrap trim and lumber, an old washer and a trash can', width: 1500, height: 2000, source: 'owner' },
  { file: 'demolition/manchester-bathroom-vanity-wall.jpg', category: 'demolition', alt: 'Manchester bathroom after our demolition, with the vanity and drywall removed down to the studs and insulation, the drain and supply lines exposed, and bare subfloor', width: 1500, height: 2000, source: 'owner' },
  { file: 'demolition/manchester-bathroom-gutted.jpg', category: 'demolition', alt: 'The other side of the gutted Manchester bathroom, with insulation, copper supply lines and the drain exposed and the floor down to plywood', width: 1500, height: 2000, source: 'owner' },
  { file: 'crew/team.webp', category: 'crew', alt: 'Two crew members standing in the street in front of the white Isuzu junk removal truck', width: 1200, height: 1500, source: 'owner' },
];
