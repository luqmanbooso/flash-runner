import k from "../kaplayCtx";
import { makeSonic } from "../entities/sonic";
import { makeMinion } from "../entities/minion";
import { makeRing } from "../entities/ring";

export default function game() {
  const citySfx = k.play("city", { volume: 0.2, loop: true });
  k.setGravity(3100);
  const bgPieceWidth = 1920;
  const bgPieces = [
    k.add([k.sprite("chemical-bg"), k.pos(0, 0), k.scale(2), k.opacity(0.8)]),
    k.add([
      k.sprite("chemical-bg"),
      k.pos(bgPieceWidth, 0),
      k.scale(2),
      k.opacity(0.8),
    ]),
  ];

  const platforms = [
    k.add([k.sprite("platforms"), k.pos(0, 450), k.scale(4)]),
    k.add([k.sprite("platforms"), k.pos(384, 450), k.scale(4)]),
  ];

  const sonic = makeSonic(k.vec2(200, 745));
  sonic.setControls();
  sonic.setEvents();

  const controlsText = k.add([
    k.text("Press Space/Click/Touch to Jump!", {
      font: "mania",
      size: 64,
    }),
    k.anchor("center"),
    k.pos(k.center()),
  ]);

  const dismissControlsAction = k.onButtonPress("jump", () => {
    k.destroy(controlsText);
    dismissControlsAction.cancel();
  });

  const scoreText = k.add([
    k.text("SCORE : 0", { font: "mania", size: 72 }),
    k.pos(20, 20),
  ]);

  const lightningBarBg = k.add([
    k.rect(300, 20),
    k.pos(20, 110),
    k.color(0, 0, 0),
    k.outline(2, k.rgb(255, 255, 255)),
    k.fixed(),
  ]);

  const lightningBar = k.add([
    k.rect(0, 20),
    k.pos(20, 110),
    k.color(255, 255, 0),
    k.fixed(),
  ]);

  const lightningText = k.add([
    k.text("LIGHTNING", { font: "mania", size: 24 }),
    k.pos(20, 85),
    k.fixed(),
  ]);

  let score = 0;
  let scoreMultiplier = 0;
  let lightningPoints = 0;
  const maxLightningPoints = 3;
  sonic.onCollide("ring", (ring) => {
    k.play("ring", { volume: 0.5 });
    k.destroy(ring);
    score++;
    scoreText.text = `SCORE : ${score}`;
    sonic.ringCollectUI.text = "+1";
    k.wait(1, () => {
      sonic.ringCollectUI.text = "";
    });

    if (lightningPoints < maxLightningPoints) {
      lightningPoints++;
      lightningBar.width = (lightningPoints / maxLightningPoints) * 300;
      if (lightningPoints === maxLightningPoints) {
        lightningBar.color = k.rgb(255, 255, 200);
        lightningText.text = "LIGHTNING READY! (Press F)";
        k.play("hyper-ring", { volume: 0.3 });
      }
    }
  });
  sonic.onCollide("enemy", (enemy) => {
    if (!sonic.isGrounded()) {
      k.play("destroy", { volume: 0.5 });
      k.play("hyper-ring", { volume: 0.5 });
      k.destroy(enemy);
      const blood = k.add([
        k.sprite("blood", { anim: "splash" }),
        k.pos(enemy.pos),
        k.scale(3),
        k.anchor("center"),
        k.z(100),
      ]);
      blood.onAnimEnd((anim) => {
        if (anim === "splash") k.destroy(blood);
      });

      const crushed = k.add([
        k.sprite("minion_crushed", { anim: "crushed" }),
        k.pos(enemy.pos),
        k.scale(2.5),
        k.anchor("center"),
        k.z(99),
      ]);
      crushed.onAnimEnd((anim) => {
        if (anim === "crushed") k.destroy(crushed);
      });

      sonic.play("jump");
      sonic.jump();
      scoreMultiplier += 1;
      score += 10 * scoreMultiplier;
      scoreText.text = `SCORE : ${score}`;
      if (scoreMultiplier === 1)
        sonic.ringCollectUI.text = `+${10 * scoreMultiplier}`;
      if (scoreMultiplier > 1) sonic.ringCollectUI.text = `x${scoreMultiplier}`;
      k.wait(1, () => {
        sonic.ringCollectUI.text = "";
      });
      return;
    }

    k.play("hurt", { volume: 0.5 });
    k.setData("current-score", score);
    k.go("gameover", citySfx);
  });

  k.onButtonPress("shoot", () => {
    if (lightningPoints < maxLightningPoints) return;

    lightningPoints = 0;
    lightningBar.width = 0;
    lightningBar.color = k.rgb(255, 255, 0);
    lightningText.text = "LIGHTNING";

    k.play("hyper-ring", { volume: 0.8 });
    k.shake(15);

    // Visual Effect: lightning beam
    const beam = k.add([
      k.rect(k.width(), 80),
      k.pos(sonic.pos.x, sonic.pos.y - 40),
      k.color(255, 250, 150),
      k.opacity(1),
      k.z(150),
    ]);

    beam.onUpdate(() => {
      beam.opacity -= k.dt() * 4;
      if (beam.opacity <= 0) k.destroy(beam);
    });

    // Decorative lightning bolts
    for (let i = 0; i < 8; i++) {
        k.add([
            k.rect(k.width(), k.rand(5, 15)),
            k.pos(sonic.pos.x, sonic.pos.y - 40 + k.rand(-100, 100)),
            k.color(255, 255, 0),
            k.opacity(0.8),
            k.z(149),
        ]).onUpdate(function() {
            this.opacity -= k.dt() * 6;
            if (this.opacity <= 0) k.destroy(this);
        });
    }

    // Destroy all enemies in front
    k.get("enemy").forEach((enemy) => {
      if (enemy.pos.x > sonic.pos.x) {
        k.play("destroy", { volume: 0.5 });
        const pos = enemy.pos;
        k.destroy(enemy);

        const blood = k.add([
          k.sprite("blood", { anim: "splash" }),
          k.pos(pos),
          k.scale(3),
          k.anchor("center"),
          k.z(100),
        ]);
        blood.onAnimEnd((anim) => {
          k.destroy(blood);
        });

        const crushed = k.add([
          k.sprite("minion_crushed", { anim: "crushed" }),
          k.pos(pos),
          k.scale(2.5),
          k.anchor("center"),
          k.z(99),
        ]);
        crushed.onAnimEnd((anim) => {
          k.destroy(crushed);
        });

        score += 50;
        scoreText.text = `SCORE : ${score}`;
      }
    });
  });

  let gameSpeed = 300;
  k.loop(1, () => {
    gameSpeed += 50;
  });

  const spawnMinion = () => {
    const minion = makeMinion(k.vec2(1950, 773));
    minion.onUpdate(() => {
      if (gameSpeed < 3000) {
        minion.move(-(gameSpeed + 300), 0);
        return;
      }
      minion.move(-gameSpeed, 0);
    });

    minion.onExitScreen(() => {
      if (minion.pos.x < 0) k.destroy(minion);
    });

    const waitTime = k.rand(0.5, 2.5);

    k.wait(waitTime, spawnMinion);
  };

  spawnMinion();

  const spawnRing = () => {
    const ring = makeRing(k.vec2(1950, 745));
    ring.onUpdate(() => {
      ring.move(-gameSpeed, 0);
    });
    ring.onExitScreen(() => {
      if (ring.pos.x < 0) k.destroy(ring);
    });

    const waitTime = k.rand(0.5, 3);

    k.wait(waitTime, spawnRing);
  };

  spawnRing();

  k.add([
    k.rect(1920, 300),
    k.opacity(0),
    k.area(),
    k.pos(0, 832),
    k.body({ isStatic: true }),
    "platform",
  ]);

  k.onUpdate(() => {
    if (sonic.isGrounded()) scoreMultiplier = 0;

    if (bgPieces[1].pos.x < 0) {
      bgPieces[0].moveTo(bgPieces[1].pos.x + bgPieceWidth * 2, 0);
      bgPieces.push(bgPieces.shift());
    }

    bgPieces[0].move(-100, 0);
    bgPieces[1].moveTo(bgPieces[0].pos.x + bgPieceWidth * 2, 0);

    // for jump effect
    bgPieces[0].moveTo(bgPieces[0].pos.x, -sonic.pos.y / 10 - 50);
    bgPieces[1].moveTo(bgPieces[1].pos.x, -sonic.pos.y / 10 - 50);

    if (platforms[1].pos.x < 0) {
      platforms[0].moveTo(platforms[1].pos.x + platforms[1].width * 4, 450);
      platforms.push(platforms.shift());
    }

    platforms[0].move(-gameSpeed, 0);
    platforms[1].moveTo(platforms[0].pos.x + platforms[1].width * 4, 450);
  });
}
