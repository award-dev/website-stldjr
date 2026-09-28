#!/usr/bin/env python3
"""Generate hero-animation.svg: a looping cartoon of two crew members loading
a cab-over dump truck with a couch, a box and a trash bag.

The whole scene runs on one 18-second timeline. Every moving part is described
below as a function of time, sampled into CSS @keyframes, so the SVG needs no
JavaScript and plays inside a plain <img> tag.

Run:  python3 tools/build_hero_animation.py   (writes ./hero-animation.svg)
"""
import math
from pathlib import Path

DUR = 18.0      # loop length in seconds
DT = 0.1        # keyframe sampling step
GROUND = 392    # y of the crew's feet / bottom of the tires
DOOR_X = 80     # crew is clipped (hidden inside the house) left of this x

# ---------------------------------------------------------------- helpers

def ease(u):
    return u * u * (3 - 2 * u)

def ease_in(u):
    return u * u

def ease_out(u):
    return 1 - (1 - u) * (1 - u)

def track(t, segs, default=0.0):
    """segs: list of (t0, t1, v0, v1[, easing]). Holds last value between segs."""
    val = default
    for s in segs:
        t0, t1, v0, v1 = s[:4]
        fn = s[4] if len(s) > 4 else (lambda u: u)
        if t < t0:
            return val
        if t <= t1:
            u = 0.0 if t1 == t0 else (t - t0) / (t1 - t0)
            return v0 + (v1 - v0) * fn(u)
        val = v1
    return val

def step(t, points):
    """points: list of (t, value); value holds from t until the next point."""
    val = points[0][1]
    for pt, v in points:
        if t >= pt - 1e-9:
            val = v
    return val

def moving(t, spans):
    return 1.0 if any(a <= t <= b for a, b in spans) else 0.0

def arc(t, t0, t1, p0, p1, peak):
    """Point on a parabola from p0 to p1 whose top is at y=peak."""
    u = min(max((t - t0) / (t1 - t0), 0), 1)
    x = p0[0] + (p1[0] - p0[0]) * u
    ylin = p0[1] + (p1[1] - p0[1]) * u
    lift = (min(p0[1], p1[1]) - peak) * 4 * u * (1 - u)
    return x, ylin - lift

WALK_PERIOD = 0.6

def leg_swing(t, walk):
    return 26 * math.sin(2 * math.pi * t / WALK_PERIOD) * walk

def bob(t, walk):
    return -2.5 * abs(math.sin(2 * math.pi * t / WALK_PERIOD)) * walk

# ---------------------------------------------------------------- timeline
#  0.0 - 4.5  carry couch out the door to the truck (A walks backwards)
#  4.5 - 6.3  heave couch into the bed
#  6.2 - 9.0  walk back inside
#  9.6 - 12.6 come back out with a box and a trash bag
# 12.6 - 13.5 toss them in
# 13.6 - 14.2 celebrate
# 14.2 - 17.0 head back inside; truck drives off (14.6) and backs in empty

def truck_tx(t):
    return track(t, [(14.6, 15.8, 0, 360, ease_in), (15.8, 16.1, 360, 360),
                     (16.1, 17.6, 360, 0, ease_out)])

def truck_dy(t):
    # small suspension bounces when things land and when the truck stops
    d = 0.0
    for t0, amp in ((6.25, 3.0), (13.3, 2.0), (13.5, 2.0), (17.6, 2.5)):
        if t0 <= t <= t0 + 0.4:
            d += amp * math.sin(math.pi * (t - t0) / 0.4)
    return d

# Worker A: orange cap, leads the couch walking backwards, carries the box.
def a_x(t):
    return track(t, [(0, 4.5, 60, 300), (6.2, 9.0, 300, 50), (9.6, 12.4, 50, 258),
                     (14.2, 17.0, 258, 50)], 60)

def a_face(t):
    return step(t, [(0, -1), (4.6, 1), (6.2, -1), (9.5, 1), (14.2, -1)])

A_WALK = [(0, 4.5), (6.2, 9.0), (9.6, 12.4), (14.2, 17.0)]

def a_arm(t, w):
    base = track(t, [(4.5, 5.1, -75, -165, ease), (5.1, 6.0, -165, -165),
                     (6.0, 6.3, -165, -5, ease), (9.3, 9.6, -5, -80, ease),
                     (12.6, 13.0, -80, -155, ease), (13.0, 13.4, -155, -20, ease),
                     (13.6, 13.8, -20, -170, ease), (14.0, 14.3, -170, -5, ease),
                     (17.2, 17.6, -5, -75, ease)], -75)
    carrying = t < 4.5 or 9.3 <= t < 12.6 or t >= 17.2
    swing = 0 if carrying else -18 * math.sin(2 * math.pi * t / WALK_PERIOD) * w
    return base + swing, base - swing

def jump(t):
    if 13.6 <= t <= 14.15:
        return -16 * math.sin(math.pi * (t - 13.6) / 0.55)
    return 0.0

# Worker B: yellow hard hat, beard, back end of the couch, carries the bag.
def b_x(t):
    return track(t, [(0, 4.5, -60, 180), (6.2, 8.6, 180, 50), (10.1, 12.6, 50, 200),
                     (14.2, 16.4, 200, 50)], -60)

def b_face(t):
    return step(t, [(0, 1), (6.2, -1), (9.8, 1), (14.2, -1), (17.3, 1)])

B_WALK = [(0, 4.5), (6.2, 8.6), (10.1, 12.6), (14.2, 16.4)]

def b_arm(t, w):
    base = track(t, [(4.5, 5.1, -75, -165, ease), (5.1, 6.0, -165, -165),
                     (6.0, 6.3, -165, -5, ease), (9.6, 9.9, -5, -60, ease),
                     (12.8, 13.2, -60, -160, ease), (13.2, 13.5, -160, -20, ease),
                     (13.6, 13.8, -20, -170, ease), (14.0, 14.3, -170, -5, ease),
                     (17.2, 17.6, -5, -75, ease)], -75)
    carrying = t < 4.5 or 9.6 <= t < 12.8 or t >= 17.2
    swing = 0 if carrying else -18 * math.sin(2 * math.pi * t / WALK_PERIOD) * w
    return base + swing, base - swing

# Items (absolute scene coordinates; those in the bed follow the truck)
COUCH_BED = (400, 290)
BOX_BED = (344, 294)
BAG_BED = (448, 293)

def couch(t):
    if t < 4.5:
        return ((a_x(t) + b_x(t)) / 2, 340, 0, 1)
    if t < 5.1:
        return (240, track(t, [(4.5, 5.1, 340, 272, ease)]), 0, 1)
    if t < 6.0:
        u = ease((t - 5.1) / 0.9)
        return (240 + 160 * u, 272 - 8 * math.sin(math.pi * u), -6 * math.sin(math.pi * u), 1)
    if t < 6.3:
        u = ease_in((t - 6.0) / 0.3)
        return (400, 272 + (COUCH_BED[1] - 272) * u, 0, 1)
    if t < 15.9:
        return (COUCH_BED[0] + truck_tx(t), COUCH_BED[1] + truck_dy(t), 0, 1)
    return (0, 340, 0, 0 if t < 16.2 else 1)   # reset, hidden inside the house

def box(t):
    if t < 9.3:
        return (0, 336, 0, 0)
    if t < 12.6:
        return (a_x(t) + 30 * a_face(t), 336 + bob(t, moving(t, A_WALK)), 0, 1)
    if t < 13.3:
        x, y = arc(t, 12.6, 13.3, (a_x(t) + 30, 336), BOX_BED, 250)
        return (x, y, track(t, [(12.6, 13.3, 0, 188)]), 1)
    if t < 15.9:
        return (BOX_BED[0] + truck_tx(t), BOX_BED[1] + truck_dy(t), 8, 1)
    return (0, 336, 0, 0)

def bag(t):
    if t < 9.9:
        return (0, 350, 0, 0)
    if t < 12.8:
        return (b_x(t) + 24 * b_face(t), 350 + bob(t, moving(t, B_WALK)), 0, 1)
    if t < 13.5:
        x, y = arc(t, 12.8, 13.5, (b_x(t) + 24, 350), BAG_BED, 225)
        return (x, y, track(t, [(12.8, 13.5, 0, 350)]), 1)
    if t < 15.9:
        return (BAG_BED[0] + truck_tx(t), BAG_BED[1] + truck_dy(t), -10, 1)
    return (0, 350, 0, 0)

# ---------------------------------------------------------------- keyframes

def fmt(v):
    s = f"{v:.1f}"
    return "0" if s in ("-0.0", "0.0") else s.rstrip("0").rstrip(".")

def keyframes(name, fn):
    """fn(t) -> CSS declaration string. Collapses runs of identical frames."""
    n = int(round(DUR / DT))
    frames = [(i / n * 100, fn(i * DT)) for i in range(n + 1)]
    # the loop must end exactly where it starts
    frames[-1] = (100.0, fn(0.0))
    keep = []
    for i, (p, v) in enumerate(frames):
        prev_same = i > 0 and frames[i - 1][1] == v
        next_same = i < len(frames) - 1 and frames[i + 1][1] == v
        if not (prev_same and next_same):
            keep.append((p, v))
    body = "".join(f"{p:.2f}%{{{v}}}" for p, v in keep)
    return f"@keyframes {name}{{{body}}}"

def worker_css(prefix, xf, facef, walk_spans, armf, jumpf):
    out = []
    def root(t):
        w = moving(t, walk_spans)
        y = GROUND + bob(t, w) + jumpf(t)
        return f"transform:translate({fmt(xf(t))}px,{fmt(y)}px) scaleX({facef(t)})"
    out.append(keyframes(f"{prefix}", root))
    out.append(keyframes(f"{prefix}LegF", lambda t: f"transform:rotate({fmt(leg_swing(t, moving(t, walk_spans)))}deg)"))
    out.append(keyframes(f"{prefix}LegB", lambda t: f"transform:rotate({fmt(-leg_swing(t, moving(t, walk_spans)))}deg)"))
    out.append(keyframes(f"{prefix}ArmF", lambda t: f"transform:rotate({fmt(armf(t, moving(t, walk_spans))[0])}deg)"))
    out.append(keyframes(f"{prefix}ArmB", lambda t: f"transform:rotate({fmt(armf(t, moving(t, walk_spans))[1])}deg)"))
    return out

def item_css(name, fn):
    def decl(t):
        x, y, r, o = fn(t)
        return f"transform:translate({fmt(x)}px,{fmt(y)}px) rotate({fmt(r)}deg);opacity:{o}"
    return keyframes(name, decl)

def build_css():
    css = []
    css += worker_css("wa", a_x, a_face, A_WALK, a_arm, jump)
    css += worker_css("wb", b_x, b_face, B_WALK, b_arm, jump)
    css.append(item_css("couch", couch))
    css.append(item_css("box", box))
    css.append(item_css("bag", bag))
    css.append(keyframes("truck", lambda t: f"transform:translate({fmt(truck_tx(t))}px,{fmt(truck_dy(t))}px)"))
    css.append(keyframes("wheel", lambda t: f"transform:rotate({fmt(math.degrees(truck_tx(t) / 24))}deg)"))

    def dust(i):
        t0 = 14.65 + i * 0.12
        def d(t):
            if t0 <= t <= t0 + 0.9:
                u = (t - t0) / 0.9
                return f"transform:translate({fmt(-30 * u - i * 8)}px,{fmt(-10 * u)}px) scale({fmt(0.4 + 1.3 * u)});opacity:{fmt(0.8 * (1 - u))}"
            return "transform:translate(0,0) scale(0.4);opacity:0"
        return d
    for i in range(3):
        css.append(keyframes(f"dust{i}", dust(i)))

    def beep(t):
        on = 16.3 <= t <= 17.5 and int((t - 16.3) / 0.3) % 2 == 0
        return f"opacity:{1 if on else 0}"
    css.append(keyframes("beep", beep))

    # dump bed rides up slightly while items are tossed in (visual "thunk")
    return "\n".join(css)

# ---------------------------------------------------------------- drawing

def worker_svg(prefix, skin, hat, beard):
    arm = lambda cls: f'''<g transform="translate(0,-66)"><g class="{cls}">
      <rect x="-4.5" y="-2" width="9" height="28" rx="4.5" fill="#1a8c3d"/>
      <circle cx="0" cy="28" r="5.5" fill="#d9a441" stroke="#8a6320" stroke-width="1"/>
    </g></g>'''
    leg = lambda cls, dx: f'''<g transform="translate({dx},-38)"><g class="{cls}">
      <rect x="-5.5" y="0" width="11" height="32" rx="4" fill="#2b3a55"/>
      <path d="M-6 30 h11 a6 6 0 0 1 6 6 v2 h-17 z" fill="#1d1f22"/>
    </g></g>'''
    beard_svg = ('<path d="M-9 -84 q2 14 12 14 q9 0 10 -12 q-4 5 -10 5 q-7 0 -12 -7z" fill="#3b2314"/>'
                 if beard else "")
    if hat == "cap":
        hat_svg = ('<path d="M-12 -90 a12 11 0 0 1 24 0 z" fill="#FF7A1A"/>'
                   '<path d="M8 -91 h11 a2 2 0 0 1 0 4 h-11 z" fill="#E0650A"/>'
                   '<rect x="-12.5" y="-92" width="21" height="3" fill="#E0650A"/>')
    else:
        hat_svg = ('<path d="M-13 -89 a13 13 0 0 1 26 0 z" fill="#F6C343"/>'
                   '<rect x="-15" y="-91" width="31" height="4" rx="2" fill="#E3AE22"/>'
                   '<rect x="-1.5" y="-101" width="3" height="11" rx="1.5" fill="#E3AE22"/>')
    return f'''<g class="{prefix}">
    {arm(prefix + "ArmB")}
    {leg(prefix + "LegB", -3)}
    {leg(prefix + "LegF", 3)}
    <rect x="-14" y="-74" width="28" height="40" rx="10" fill="#22B24C"/>
    <path d="M-14 -56 h28 v5 h-28z M-14 -45 h28 v4 h-28z" fill="#FFD84D" opacity=".9"/>
    <rect x="-14" y="-38" width="28" height="5" rx="2" fill="#1d2a3a"/>
    <rect x="-4" y="-76" width="10" height="6" rx="2" fill="{skin}"/>
    <circle cx="2" cy="-84" r="12" fill="{skin}"/>
    <circle cx="-8" cy="-83" r="3" fill="{skin}" stroke="rgba(0,0,0,.15)"/>
    {beard_svg}
    <circle cx="7" cy="-86" r="1.7" fill="#1b1b1b"/>
    <path d="M13 -84 q3 1 0 3" stroke="rgba(0,0,0,.35)" stroke-width="1.5" fill="none"/>
    <path d="M4 -78 q4 3 8 -1" stroke="#1b1b1b" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    {hat_svg}
    {arm(prefix + "ArmF")}
  </g>'''

COUCH_SVG = '''<g class="couch">
    <rect x="-44" y="16" width="6" height="7" fill="#4a2b17"/><rect x="38" y="16" width="6" height="7" fill="#4a2b17"/>
    <rect x="-40" y="-20" width="80" height="26" rx="7" fill="#9c5a2e"/>
    <rect x="-48" y="-6" width="96" height="24" rx="6" fill="#b86b3e"/>
    <rect x="-35" y="-4" width="34" height="11" rx="4" fill="#cd8452"/>
    <rect x="1" y="-4" width="34" height="11" rx="4" fill="#cd8452"/>
    <rect x="-52" y="-12" width="14" height="30" rx="6" fill="#a4602f"/>
    <rect x="38" y="-12" width="14" height="30" rx="6" fill="#a4602f"/>
    <path d="M-30 -14 l6 6 M20 -16 l-5 7" stroke="#7b4422" stroke-width="2" stroke-linecap="round"/>
  </g>'''

BOX_SVG = '''<g class="box">
    <rect x="-17" y="-14" width="34" height="28" rx="2" fill="#c89458" stroke="#8f6333" stroke-width="1.5"/>
    <path d="M-17 -6 h34" stroke="#8f6333" stroke-width="1.2"/>
    <rect x="-4" y="-14" width="8" height="28" fill="#e2c28f" opacity=".8"/>
    <path d="M-12 2 h10 M-12 6 h7" stroke="#8f6333" stroke-width="1.4" stroke-linecap="round"/>
  </g>'''

BAG_SVG = '''<g class="bag">
    <path d="M-15 12 q-5 -20 6 -26 l3 -6 l-3 -4 h18 l-3 4 l3 6 q11 6 6 26 q-15 6 -30 0z" fill="#23272b"/>
    <path d="M-6 -6 q-4 8 -2 16" stroke="#4a5158" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M-5 -24 l4 -5 l4 5" stroke="#23272b" stroke-width="3" fill="none" stroke-linecap="round"/>
  </g>'''

def wheel(cx):
    lugs = "".join(
        f'<circle cx="{fmt(7 * math.cos(a))}" cy="{fmt(7 * math.sin(a))}" r="1.8" fill="#6b7277"/>'
        for a in (i * 2 * math.pi / 5 for i in range(5)))
    return f'''<g transform="translate({cx},368)"><g class="wheel">
      <circle r="24" fill="#1c1f22"/><circle r="20" fill="none" stroke="#2c3135" stroke-width="3" stroke-dasharray="4 5"/>
      <circle r="12" fill="#b9c0c4"/><circle r="12" fill="none" stroke="#8d959a" stroke-width="2"/>
      {lugs}<circle r="3" fill="#6b7277"/>
    </g></g>'''

def build_svg():
    css = build_css()
    anims = [
        ("wa", "wa"), ("waLegF", "waLegF"), ("waLegB", "waLegB"), ("waArmF", "waArmF"), ("waArmB", "waArmB"),
        ("wb", "wb"), ("wbLegF", "wbLegF"), ("wbLegB", "wbLegB"), ("wbArmF", "wbArmF"), ("wbArmB", "wbArmB"),
        ("couch", "couch"), ("box", "box"), ("bag", "bag"), ("truck", "truck"), ("wheel", "wheel"),
        ("dust0", "dust0"), ("dust1", "dust1"), ("dust2", "dust2"), ("beep", "beep"),
    ]
    rules = "\n".join(f".{c}{{animation:{a} {DUR:g}s linear infinite}}" for c, a in anims)

    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480" role="img" aria-labelledby="t d">
<title id="t">STL Demolition and Junk Removal crew loading a dump truck</title>
<desc id="d">Cartoon animation: two crew members carry a couch out of a house and load it into a green cab-over dump truck, then toss in a box and a trash bag. The truck drives off to haul it away and backs in empty for the next load.</desc>
<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7cc8ef"/><stop offset="1" stop-color="#d6f0fb"/></linearGradient>
  <clipPath id="outside"><rect x="{DOOR_X}" y="0" width="1200" height="480"/></clipPath>
</defs>
<style>
.cloud{{animation:cloud 36s linear infinite}}
.cloud2{{animation:cloud 36s linear -19s infinite}}
@keyframes cloud{{from{{transform:translateX(-180px)}}to{{transform:translateX(820px)}}}}
.sunrays{{transform-box:fill-box;transform-origin:center;animation:spin 36s linear infinite}}
@keyframes spin{{to{{transform:rotate(360deg)}}}}
.dust0,.dust1,.dust2{{transform-box:fill-box;transform-origin:center}}
{rules}
{css}
@media (prefers-reduced-motion:reduce){{*{{animation-delay:-3s!important;animation-play-state:paused!important}}}}
</style>

<!-- sky -->
<rect width="640" height="480" fill="url(#sky)"/>
<g transform="translate(560,70)">
  <g class="sunrays" stroke="#FFD84D" stroke-width="5" stroke-linecap="round">
    <path d="M0 -52v-12M0 52v12M-52 0h-12M52 0h12M-37 -37l-8 -8M37 37l8 8M-37 37l-8 8M37 -37l8 -8"/>
  </g>
  <circle r="34" fill="#FFD84D"/><circle r="34" fill="none" stroke="#FFC21A" stroke-width="3"/>
</g>
<g class="cloud"><g fill="#fff" opacity=".95"><ellipse cx="80" cy="80" rx="46" ry="18"/><ellipse cx="62" cy="70" rx="22" ry="18"/><ellipse cx="96" cy="66" rx="26" ry="22"/></g></g>
<g class="cloud2"><g fill="#fff" opacity=".85"><ellipse cx="60" cy="140" rx="36" ry="13"/><ellipse cx="72" cy="130" rx="20" ry="16"/></g></g>

<!-- far background -->
<path d="M0 330 q80 -46 170 -22 q90 -40 190 -6 q100 -44 280 -4 v80 h-640z" fill="#8fd18a"/>
<g fill="#3e9e4f">
  <circle cx="250" cy="300" r="26"/><circle cx="276" cy="290" r="30"/><circle cx="300" cy="304" r="22"/>
  <circle cx="610" cy="296" r="30"/><circle cx="636" cy="306" r="24"/>
</g>
<rect x="272" y="300" width="7" height="40" fill="#6d4a2b"/>
<rect x="0" y="330" width="640" height="46" fill="#6cc46a"/>

<!-- house -->
<g>
  <rect x="160" y="196" width="20" height="40" fill="#8a3f31"/>
  <rect x="14" y="248" width="196" height="146" fill="#F2E3C6"/>
  <path d="M14 270h196M14 292h196M14 314h196M14 336h196M14 358h196M14 380h196" stroke="#e0cca6" stroke-width="2"/>
  <path d="M0 254 L112 184 L224 254 Z" fill="#9C4A3A"/>
  <path d="M0 254 L112 184 L224 254" fill="none" stroke="#7d3a2d" stroke-width="6" stroke-linejoin="round"/>
  <rect x="74" y="280" width="54" height="114" fill="#fff"/>
  <rect x="80" y="286" width="42" height="108" fill="#2b211b"/>
  <path d="M80 286 l10 5 v98 l-10 5z" fill="#4f6f8f"/>
  <circle cx="87" cy="342" r="1.8" fill="#FFD84D"/>
  <rect x="142" y="282" width="52" height="46" fill="#fff"/>
  <rect x="146" y="286" width="44" height="38" fill="#a8dcf2"/>
  <path d="M168 286v38M146 305h44" stroke="#fff" stroke-width="3"/>
  <path d="M150 300 l12 -10" stroke="#fff" stroke-width="3" opacity=".6" stroke-linecap="round"/>
  <g fill="#3e9e4f"><circle cx="150" cy="384" r="12"/><circle cx="168" cy="380" r="14"/><circle cx="188" cy="385" r="11"/><circle cx="30" cy="384" r="12"/><circle cx="48" cy="386" r="10"/></g>
  <g fill="#FF7A1A"><circle cx="160" cy="378" r="2.5"/><circle cx="176" cy="374" r="2.5"/><circle cx="36" cy="380" r="2.5"/></g>
</g>

<!-- driveway -->
<rect x="0" y="372" width="640" height="62" fill="#c9ced1"/>
<rect x="0" y="372" width="640" height="4" fill="#b4babe"/>
<path d="M130 376 l-20 58 M330 376 l-10 58 M520 376 l0 58" stroke="#b4babe" stroke-width="2"/>
<rect x="0" y="434" width="640" height="46" fill="#58b85a"/>
<rect x="0" y="434" width="640" height="5" fill="#a9afb3"/>
<rect x="72" y="386" width="58" height="8" rx="2" fill="#a9afb3"/>

<!-- truck: back of dump bed -->
<g class="truck">
  <rect x="312" y="284" width="170" height="20" fill="#0f5f2a"/>
</g>

<!-- items (hidden inside the house left of the door) -->
<g clip-path="url(#outside)">
  {COUCH_SVG}
  {BOX_SVG}
  {BAG_SVG}
</g>

<!-- truck: bed side panel, chassis, cab, wheels -->
<g class="truck">
  <rect x="300" y="356" width="296" height="12" rx="3" fill="#2a2f33"/>
  <rect x="306" y="298" width="178" height="60" rx="3" fill="#178F3C"/>
  <rect x="306" y="296" width="178" height="8" rx="3" fill="#14803A"/>
  <path d="M340 304v54M378 304v54M416 304v54M454 304v54" stroke="#14803A" stroke-width="3"/>
  <rect x="320" y="311" width="150" height="38" rx="4" fill="#14181B" opacity=".25"/>
  <text x="395" y="327" text-anchor="middle" font-family="Barlow Condensed,Arial Narrow,Arial,sans-serif" font-weight="800" font-size="16" fill="#fff" letter-spacing=".5">STL DEMOLITION</text>
  <text x="395" y="344" text-anchor="middle" font-family="Barlow Condensed,Arial Narrow,Arial,sans-serif" font-weight="700" font-size="12.5" fill="#FFD84D" letter-spacing=".5">&amp; JUNK REMOVAL</text>
  <rect x="302" y="340" width="6" height="14" rx="2" fill="#e53935"/>
  <rect x="316" y="362" width="12" height="26" rx="2" fill="#1d1f22"/>
  <rect x="470" y="210" width="8" height="90" rx="3" fill="#8d959a"/>
  <rect x="468" y="206" width="12" height="8" rx="2" fill="#6b7277"/>
  <path d="M486 356 V246 q0 -12 12 -12 h78 q12 0 14 12 l6 60 v50 z" fill="#F4F6F5"/>
  <path d="M486 322 h110 v14 h-110z" fill="#22B24C"/>
  <path d="M486 336 h110 v4 h-110z" fill="#14803A"/>
  <path d="M572 246 h8 q6 0 7 6 l6 50 h-21z" fill="#5fb3dc"/>
  <path d="M578 252 l6 16" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>
  <rect x="498" y="248" width="62" height="46" rx="5" fill="#5fb3dc"/>
  <path d="M506 286 l20 -32 M520 288 l14 -24" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".55"/>
  <path d="M494 242 h72 v112 h-72z" fill="none" stroke="#cfd6d9" stroke-width="2"/>
  <rect x="548" y="304" width="12" height="4" rx="2" fill="#8d959a"/>
  <path d="M487 250 h-10 v34 h10" fill="none" stroke="#6b7277" stroke-width="3"/>
  <rect x="472" y="258" width="7" height="22" rx="2" fill="#40474D"/>
  <circle cx="502" cy="239" r="3" fill="#FF7A1A"/><circle cx="530" cy="239" r="3" fill="#FF7A1A"/><circle cx="558" cy="239" r="3" fill="#FF7A1A"/>
  <rect x="588" y="310" width="8" height="12" rx="3" fill="#FFE27A"/>
  <rect x="586" y="342" width="14" height="22" rx="3" fill="#8d959a"/>
  <rect x="512" y="356" width="46" height="8" rx="3" fill="#40474D"/>
  <path d="M508 368 a40 40 0 0 1 80 0" fill="#2a2f33"/>
  {wheel(358)}
  {wheel(416)}
  {wheel(548)}
</g>

<!-- dust as the truck pulls out -->
<g fill="#d9d2c3">
  <circle class="dust0" cx="312" cy="382" r="14"/>
  <circle class="dust1" cx="330" cy="376" r="12"/>
  <circle class="dust2" cx="300" cy="370" r="10"/>
</g>

<!-- back-up beeper -->
<g class="beep">
  <path d="M600 250 q12 12 0 24 M610 242 q20 20 0 40" stroke="#FF7A1A" stroke-width="4" fill="none" stroke-linecap="round"/>
  <text x="596" y="232" text-anchor="end" font-family="Barlow Condensed,Arial Narrow,Arial,sans-serif" font-weight="800" font-size="20" fill="#E0650A">BEEP! BEEP!</text>
</g>

<!-- crew -->
<g clip-path="url(#outside)">
  {worker_svg("wb", "#8d5524", "hardhat", True)}
  {worker_svg("wa", "#f1c27d", "cap", False)}
</g>
</svg>
'''

if __name__ == "__main__":
    out = Path(__file__).resolve().parent.parent / "hero-animation.svg"
    svg = build_svg()
    out.write_text(svg)
    print(f"wrote {out} ({len(svg) / 1024:.1f} KB)")
