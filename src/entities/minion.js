import k from "../kaplayCtx";

export function makeMinion(pos) {
  return k.add([
    k.sprite("minion", { anim: "run" }),
    k.area({ shape: new k.Rect(k.vec2(-60, -75), 120, 150) }),
    k.scale(0.8),
    k.anchor("center"),
    k.pos(pos),
    k.offscreen(),
    "enemy",
  ]);
}
