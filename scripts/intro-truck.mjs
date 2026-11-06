// Splits the logo (src/assets/brand/logo.png) into the two layers the intro animates:
//   intro-truck-bed.png  - the dump bed: top line, slanted back and STL, cut along the cab's back wall
//   intro-truck-base.png - everything else: cab, wheels, chassis, chrome stripe, lettering
// Both keep the logo's full canvas, so stacked at rest they are exactly the logo.
// Re-run after replacing the logo:  node scripts/intro-truck.mjs
import sharp from "sharp";

const src = "src/assets/brand/logo.png";
const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;
// Cut polygon in logo pixels (816 x 437 artwork): left of the line from (596, 0) to (566, 196), above y = 196.
const CUT_TOP_X = 596, CUT_BOTTOM_X = 566, CUT_Y = 196;
const inBed = (x, y) => y <= CUT_Y && x <= CUT_TOP_X + ((CUT_BOTTOM_X - CUT_TOP_X) * y) / CUT_Y;

const bed = Buffer.from(data);
const base = Buffer.from(data);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const i = (y * W + x) * 4 + 3;
  if (inBed(x, y)) base[i] = 0; else bed[i] = 0;
}
const out = (buf, file) => sharp(buf, { raw: { width: W, height: H, channels: 4 } }).png({ compressionLevel: 9 }).toFile(file);
await out(bed, "src/assets/brand/intro-truck-bed.png");
await out(base, "src/assets/brand/intro-truck-base.png");
console.log(`Split ${W}x${H} logo; bed pivot at (${CUT_BOTTOM_X > 0 ? 22 : 0}, ${CUT_Y}).`);
