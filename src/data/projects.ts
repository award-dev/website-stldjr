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
  { file: 'crew/team.webp', category: 'crew', alt: 'Two crew members standing in the street in front of the white Isuzu junk removal truck', width: 1200, height: 1500, source: 'owner' },
];
