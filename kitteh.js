(() => {
  const images = {};
  const sounds = {};
  document.addEventListener('keydown', (e) => onkey(e, e.keyCode, true));
  document.addEventListener('keyup', (e) => onkey(e, e.keyCode, false));
  let before = Date.now(); // A timestamp for use with smooth updating.

  window.onload = async () => {
    await loadImages();
    await loadSounds();
    main();
  };

  const ctx = document.getElementById('game').getContext('2d');

  const loadImages = async () => {
    const imgNames = ['background', 'kitteh', 'zombie', 'pumpkin', 'candy'];
    imgNames.forEach((name) => {
      images[name] = new Image();
      images[name].src = name + '.png';
    });
  };

  const loadSounds = async () => {
    const sndNames = ['smash', 'eat', 'life', 'death', 'cat', 'zombie', 'halloween'];
    sndNames.forEach((name) => {
      sounds[name] = new Audio();
      sounds[name].src = name + '.mp3';
    });

    sounds.halloween.volume = 0.1;
    sounds.halloween.loop = true;
    sounds.halloween.play();
  };

  const main = () => {
    const now = Date.now();
    const delta = now - before;
    update(delta/1000);
    draw();
    before = now;
    requestAnimationFrame(main);
  };

  const draw = () => {
    if (!entities.game.paused) {
      ctx.drawImage(images.background, 0, 0);
      ctx.drawImage(images.kitteh, entities.kitteh.x, entities.kitteh.y);
      ctx.drawImage(images.pumpkin, entities.pumpkin.x, entities.pumpkin.y);
      ctx.drawImage(images.zombie, entities.zombie.x, entities.zombie.y);
      ctx.drawImage(images.candy, entities.candy.x, entities.candy.y);

      document.getElementById('kp').textContent = entities.kitteh.pumpkins;
      document.getElementById('el').textContent = `+${entities.kitteh.lives - 1}`;
      document.getElementById('zp').textContent = entities.zombie.pumpkins;
    } else {
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(0, 0, 640, 480);
      ctx.font = '30px "Fontdiner Swanky"';
      ctx.fillStyle = 'black';
      ctx.fillText('Zombie ate Kitteh!', 180, 75);
      ctx.fillText(entities.game.pausedText, 230, 250);
      ctx.fillText('Press Enter to Continue', 130, 450);
    }
  };

  const setField = () => { // Rrandomly places the pumpkin. Shows the candy or hides it off-canvas.
    entities.pumpkin.x = 64 + (Math.random() * (ctx.canvas.width - 128));
    entities.pumpkin.y = 64 + (Math.random() * (ctx.canvas.height - 128));

    if (entities.kitteh.pumpkins !== 0 && entities.kitteh.pumpkins % 10 === 0 && !entities.zombie.hasCandy) {
      entities.candy.x = 10;
      entities.candy.y = 10;
      entities.zombie.hasCandy = false;
    } else {
      entities.candy.x = -120;
      entities.candy.y = -120;
    }
  };

  resetZombieVelocity = () => {
    entities.zombie.xv = (Math.random() < 0.5 ? -1 : 1) * 175;
    entities.zombie.yv = (Math.random() < 0.5 ? -1 : 1) * 175;
  };

  const update = (delta) => {
    if (entities.game.paused) {
      if (entities.kitteh.input.enter) {
        if (entities.kitteh.lives === 0) {
          document.location.reload();
        } else {
          entities.game.paused = false;
        }
      }
    } else {
      if (entities.kitteh.input.up) { entities.kitteh.y -= entities.kitteh.speed * delta; }
      if (entities.kitteh.input.down) { entities.kitteh.y += entities.kitteh.speed * delta; }
      if (entities.kitteh.input.left) { entities.kitteh.x -= entities.kitteh.speed * delta; }
      if (entities.kitteh.input.right) { entities.kitteh.x += entities.kitteh.speed * delta; }

      entities.zombie.x += entities.zombie.xv * delta;
      entities.zombie.y += entities.zombie.yv * delta;

      handleWallCollisions();

      if (detectEntityCollisions(entities.kitteh, entities.pumpkin)) {
        entities.zombie.hasCandy = false;
        entities.kitteh.pumpkins += 1;
        sounds.smash.src = 'smash.mp3'; // A hack. browsers can't play same sound fast, without reloading.
        sounds.smash.play();

        if (entities.kitteh.pumpkins !== 0 && entities.kitteh.pumpkins % 60 === 0) {
          entities.kitteh.lives += 1;
          sounds.life.play();
        }
        setField();
      }

      if (detectEntityCollisions(entities.kitteh, entities.candy)) {
        entities.kitteh.pumpkins += 1;
        entities.zombie.hasCandy = false;
        sounds.cat.play();
        resetZombieVelocity();
        setField();
      }

      if (detectEntityCollisions(entities.kitteh, entities.zombie)) {
        entities.kitteh.lives -= 1;
        entities.zombie.hasCandy = false;

        if (entities.kitteh.lives > 0) {
          entities.kitteh.x = ctx.canvas.width - 65;
          entities.kitteh.y = ctx.canvas.height - 65;
          entities.zombie.x = 120;
          entities.zombie.y = 120;
          resetZombieVelocity();
          setField();
          entities.game.paused = true;
          entities.game.pausedText = 'Lives left: ' + entities.kitteh.lives;
        } else {
          entities.game.paused = true;
          entities.game.pausedText = 'GAME OVER!';
        }
        sounds.death.play();
      }

      if (detectEntityCollisions(entities.zombie, entities.pumpkin)) {
        entities.zombie.pumpkins += 1;
        entities.zombie.xv += entities.zombie.xv > 0 ? 15 : -15;
        entities.zombie.xy += entities.zombie.xy > 0 ? 15 : -15;

        sounds.eat.src = 'eat.mp3'; // A hack. browsers can't play same sound fast, without reloading.
        sounds.eat.play();
        setField();
      }

      if (detectEntityCollisions(entities.zombie, entities.candy)) {
        entities.zombie.pumpkins += 1;
        entities.zombie.xv += entities.zombie.xv > 0 ? 50 : -50;
        entities.zombie.xy += entities.zombie.xy > 0 ? 50 : -50;

        entities.zombie.hasCandy = true;
        sounds.zombie.play();
        setField();
      }
    }
  };

  const entities = {
    game: {
      paused: false,
      pausedText: '',
    },
    kitteh: {
      speed: 256,
      x: ctx.canvas.width - 64,
      y: ctx.canvas.height - 64,
      lives: 3,
      pumpkins: 0,
      input: {up: false, down: false, left: false, right: false, enter: false},
    },
    pumpkin: {
      x: 64 + (Math.random() * (ctx.canvas.width - 128)),
      y: 64 + (Math.random() * (ctx.canvas.height - 128)),
    },
    zombie: {
      x: 128,
      y: 128,
      xv: (Math.random() < 0.5 ? -1 : 1) * 175,
      yv: (Math.random() < 0.5 ? -1 : 1) * 175,
      pumpkins: 0,
      hasCandy: false, // If the zombie ate the candy but the cat still has 10 pumpkins it must not reappear.
    },
    candy: {
      x: -120,
      y: -120,
    }
  };

  const onkey = (e, key, pressed) => {
    switch(key) {
      case 38:
        entities.kitteh.input.up = pressed;
        e.preventDefault();
        break;
      case 40:
        entities.kitteh.input.down = pressed;
        e.preventDefault();
        break;
      case 37:
        entities.kitteh.input.left = pressed;
        e.preventDefault();
        break;
      case 39:
        entities.kitteh.input.right = pressed;
        e.preventDefault();
        break;
      case 13:
        entities.kitteh.input.enter = pressed;
        e.preventDefault();
        break;
    };
  };

  const detectEntityCollisions = (en1, en2) => en1.x <= (en2.x + 64)
    && en2.x <= (en1.x + 64)
    && en1.y <= (en2.y + 64)
    && en2.y <= (en1.y + 64);

  const handleWallCollisions = () => {
    if (entities.kitteh.y <= 0) { entities.kitteh.y = 0; }
    if (entities.kitteh.y >= ctx.canvas.height - 64) { entities.kitteh.y = ctx.canvas.height - 64; }
    if (entities.kitteh.x <= 0) { entities.kitteh.x = 0; }
    if (entities.kitteh.x >= ctx.canvas.width - 64) { entities.kitteh.x = ctx.canvas.width - 64; }

    if (entities.zombie.y <= 0) {
      entities.zombie.y = 0;
      entities.zombie.yv = -entities.zombie.yv;
    }
    if (entities.zombie.y >= ctx.canvas.height - 64) {
      entities.zombie.y = ctx.canvas.height - 64;
      entities.zombie.yv = -entities.zombie.yv;
    }
    if (entities.zombie.x <= 0) {
      entities.zombie.x = 0;
      entities.zombie.xv = -entities.zombie.xv;
    }
    if (entities.zombie.x >= ctx.canvas.width - 64) {
      entities.zombie.x = ctx.canvas.width - 64;
      entities.zombie.xv = -entities.zombie.xv;
    }
  };
})();
