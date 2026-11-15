/**
 * Page copy and media picks for the marketing pages. Facts come from config/*.json via site.ts and services.ts;
 * this file holds wording and which photos go where. Photo paths are relative to src/assets/jobs.
 * Any list may be left empty: the matching section is simply not rendered.
 */
import type { Faq } from './site';
import faqsFile from '../../config/faqs.json';
import pricing from '../../config/pricing.json';
import business from '../../config/business.json';

const fill = (s: string) => s.replaceAll('{phone}', business.phoneDisplay).replaceAll('{maxYards}', String(pricing.maxCubicYards));
const homeFaqs: Faq[] = faqsFile.items.filter((f) => (f as { home?: boolean }).home).map((f) => ({ q: f.q, a: fill(f.a) }));
const t = business.trust;

export const content = {
  /** Five-second intro loader (once per visit). The last word is accented. */
  intro: {
    enabled: true,
    /** 'truck' tilts the logo truck's dump bed (scripts/intro-truck.mjs); 'house' draws a blueprint house behind the headline. */
    drawing: 'truck' as 'house' | 'truck' | 'none',
    words: ['Point', 'at', 'the', 'mess.'],
    // Timed to the truck: the bed tilts up (34–52%), holds, and comes back down (60–81%).
    stages: [
      [0, 'Backing up the truck'],
      [0.2, 'Loading it up'],
      [0.34, 'Dumping the load'],
      [0.6, 'Lowering the bed'],
      [0.84, 'Hauled away'],
    ] as [number, string][],
  },

  home: {
    title: 'Junk Removal & Demolition in St. Louis, MO',
    description: 'St. Louis junk removal, demolition and cleanouts, priced by the load. See what a 1/4, 1/2, 3/4 or full 17-yard truck costs and book online in minutes.',
    areaLine: 'St. Louis City, St. Louis County & St. Charles County',
    kicker: 'Junk removal & demolition in St. Louis, MO',
    headline: 'Point at the mess.',
    headlineAccent: "We'll handle the rest.",
    lead: 'Junk removal, demolition and cleanouts across St. Louis. You pay for how much of the truck you fill: pick a size, see the price, book a time.',
    /** Background photo behind the hero copy. */
    heroPhoto: 'crew/team.webp',
    heroVideos: [] as string[],
    railExclude: [] as string[],
    marquee: ['Junk removal', 'Cleanouts', 'Demolition', 'Construction debris', 'Hot tubs', 'Sheds & decks', 'Appliances', 'Estates'],
    pairs: ['webster-groves-bathroom', 'webster-groves-shower'] as string[],
    wall: ['junk-removal/couch-carry.webp', 'demolition/ladue-curved-shower-demo.jpg', 'demolition/kitchen-gut.webp', 'crew/truck.webp', 'junk-removal/ofallon-carpet-removal-living-room.jpg', 'junk-removal/florissant-sleigh-bed-removal.jpg', 'demolition/st-louis-kitchen-demo.jpg', 'construction-debris/loaded-bed.webp', 'cleanouts/sweep.webp', 'crew/team.webp'],
    steps: [
      ['Pick a load size', `Choose 1/4, 1/2, 3/4 or a full ${pricing.maxCubicYards}-yard truck and see the price. Add a few photos if you're not sure.`],
      ['Choose a time', 'Book an open two-hour arrival window online, same day when the schedule allows. You get a confirmation with reschedule and cancel links.'],
      ['We confirm the price', "On arrival, we look at the pile and confirm the final price before anything is loaded. You don't have to be home."],
      ['We haul it off', 'We carry it out from wherever it is, load the truck, sweep up and take it to a facility that sorts and recycles materials.'],
    ] as [string, string][],
    facts: [
      t.foundedYear && [String(t.foundedYear), 'Founded in St. Louis'],
      t.completedJobs && [String(t.completedJobs), 'Jobs completed'],
      t.insuranceDetails && ['$3M', 'Insurance policy'],
      [`${pricing.maxCubicYards} yd³`, 'Truck capacity'],
    ].filter(Boolean) as [string, string][],
    faqs: homeFaqs,
  },

  /** About page: written in Aaron's voice. Facts here come from the owner, config/business.json and his LocateFaith listing. */
  about: {
    title: 'Hi, I’m Aaron.',
    metaTitle: 'About Aaron Ward: Family, Faith & Hard Work',
    description: 'Meet Aaron Ward, founder of STL Demolition & Junk Removal: a family-first, Christian-owned St. Louis business with 1,000+ jobs since 2023.',
    lead: 'I started STL Demolition & Junk Removal in 2023 to take the heaviest part of a mess off people’s hands. Family comes first for me, faith keeps me honest, and both shape how this business runs.',
    /** Portrait in src/assets/brand/ */
    portrait: 'aaron-family.jpg',
    portraitAlt: 'Aaron Ward smiling on the beach at sunset with his family',
    portraitPosition: 'center 38%',
    family: {
      title: 'Family first. Always.',
      quote: 'Every house we walk into belongs to somebody’s family. We treat it like it’s ours.',
      body: [
        'That photo up top is my why. Every early start and every heavy load is about the people I get to come home to.',
        'So I run this business the way I’d want someone to treat my own family: show up when we said we would, tell you the price before anything moves, and leave your place cleaner than we found it.',
        'A lot of our jobs land on hard days: an estate after a loss, a move that came too fast, a parent downsizing out of the house they raised everyone in. We slow down, listen, and handle your family’s things with care.',
      ],
      values: [
        ['On time', 'You get a real arrival window, and we stick to it.'],
        ['Price first', 'You hear the final number before we lift a thing.'],
        ['Broom-swept', 'We sweep the space we cleared before we leave.'],
      ] as [string, string][],
    },
    story: {
      title: 'Why I started this',
      body: [
        'Every job starts the same way: someone who’s been staring at a problem for too long. A basement that filled up over twenty years. A deck that’s one bad winter from falling down. A remodel stalled behind a pile of drywall.',
        'That weight is real, on your back and on your mind. I wanted people in St. Louis to have someone reliable to hand it to.',
        'It’s about the neighborhood too. Junk dumped in alleys and piled on curbs makes a block feel forgotten. Every couch, fridge and busted-up deck we haul away the right way is one less eyesore on a St. Louis street, and our loads go to a facility that sorts out what can be recycled.',
        'More than 1,000 jobs later, that’s still the whole idea: clear the mess, lighten the load, and help keep St. Louis clean, one truck at a time.',
      ],
      cards: [
        ['Hauling and demolition, one crew', 'Most messes come in two parts: the thing that has to come out, and the pile it leaves behind. We do both in one visit, on one bill. If a job needs a permit, we pull it.'],
        ['Priced by the load', 'It’s the fairest way I know. You can see what a quarter, half, three-quarter or full truck costs before you ever call.'],
      ] as [string, string][],
    },
    faith: {
      title: 'Built on faith',
      body: [
        'Faith is a big part of who I am, and it’s a big part of how this company runs. It’s why honesty isn’t a policy here; it’s just how we work. Fair prices, straight answers, and doing the job right even when nobody’s watching.',
        'It’s also why we’re proud to be listed on LocateFaith, a directory of Christian-owned local businesses. If you’re looking to support businesses that share your faith, you’ll find us there.',
      ],
      verse: { text: 'Whatever you do, work heartily, as for the Lord and not for men.', ref: 'Colossians 3:23' },
      listing: business.links.locateFaith,
    },
    vendor: {
      title: 'On the Buyers Club Vendor Team',
      body: 'I sat down with Buyers Club to talk about the business as part of their Vendor Team: how we work, what we haul and tear out, and why we do it the way we do.',
      youtubeId: new URL(business.links.buyersClubInterview).searchParams.get('v') ?? '',
      videoTitle: 'Buyers Club Vendor Team: STL Demolition & Junk Removal',
      channel: business.links.buyersClubChannel,
    },
  },

  featureSection: null as null | {
    tag: string; title: string; lead: string; bullets: string[];
    link?: { label: string; href: string }; onHome: boolean; onAbout: boolean;
  },

  /** Hub page copy. Titles get " | <short name>" appended. */
  pages: {
    services: {
      title: 'Junk Removal & Demolition Services',
      description: 'Junk removal, cleanouts, demolition and construction debris removal across St. Louis City, St. Louis County and St. Charles County. Priced by the load.',
      heading: 'What we haul and tear out',
      lead: 'Two trades, one truck. Pick a service to see what’s included, how it’s priced and the common questions.',
    },
    projects: {
      title: 'Our Work: Truck, Crew & Real St. Louis Jobs',
      description: 'Photos of our crew, our 17-yard truck and real St. Louis junk removal, cleanout, debris and demolition jobs. No stock photos, just the people who show up.',
      heading: 'Real crew. Real truck. Real jobs.',
      lead: 'No stock photos here. Just the people and the truck that’ll show up at your door, and the work they do.',
      photo: 'crew/truck.webp',
    },
    contact: {
      title: 'Contact Us: Call, Email or Book Online',
      description: 'Call (314) 379-7955 or email STL Demolition & Junk Removal. Book a pickup online, or send photos for a free quote on junk removal, cleanouts and demolition.',
      heading: 'Talk to us',
      lead: 'Call for anything that doesn’t fit a form. Or skip the call: book an arrival window online, or send a few photos for a free quote.',
    },
  },

  footer: {
    ctaPhoto: 'crew/truck.webp',
    ctaTag: 'Booking now across St. Louis',
    ctaTitle: 'Ready to clear it out?',
    ctaLead: 'Pick a load size, see the price and book an arrival window in a few minutes. Not sure what you need? Send photos and we’ll tell you.',
    blurb: `Junk removal, cleanouts and demolition in St. Louis, priced by the load. Licensed and insured${t.insuranceDetails ? ` (${t.insuranceDetails})` : ''}.`,
  },
};
