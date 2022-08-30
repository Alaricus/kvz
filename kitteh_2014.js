var images;
var sounds;

window.onload = function()
{
  var imgSources = ["background", "kitteh", "zombie", "pumpkin", "candy"];      //names of images used in the game
  var sndSources = ["smash", "eat", "life", "death", "cat", "zombie", "halloween"];          //names of sounds used in the game

  loadImages(imgSources, function()                                             //loads images, once done calls loadSounds()
  {
    loadSounds(sndSources, function()                                           //loads sounds, once done calls main()
    {
      sounds.halloween.volume = 0.1;
      sounds.halloween.loop = true;
      sounds.halloween.play();
      main();
    })
  });
};

var c = document.getElementById("game").getContext("2d");                       //canvas context

var loadImages = function(names, callback)                                      //this function makes sure that all the images
{                                                                               //are loaded before the game tries to to use them
  var n;
  var name;
  var result = {};
  var count = names.length;

  for(n = 0 ; n < names.length ; n++)                                           //it puts all of them into an object for later use
  {
    name = names[n];
    result[name] = new Image();
    result[name].onload = function()
    {
      if (--count == 0) {images = result; callback();}                          //once all are loaded it calls the next function
    };
    result[name].src = name + ".png";
  }
};

var loadSounds = function(names, callback)                                      //this function makes sure that all the sounds
{                                                                               //are loaded before the game tries to to use them
  var n;
  var name;
  var result = {};
  var count = names.length;

  for(n = 0 ; n < names.length ; n++)
  {
    name = names[n];
    result[name] = new Audio();
    result[name].oncanplaythrough = function()
    {
      if (--count == 0) {sounds = result; callback();}
    };
    result[name].src = name + ".mp3";
  }
};

var before = Date.now();                                                        //a timestamp for use with smooth updating
var main = function()
{
  var now = Date.now();                                                         //a timestamp for use with smooth updating
  var delta = now - before;                                                     //difference between times
  update(delta/1000);
  draw();
  before = now;
  requestAnimationFrame(main);                                                  //loops the main function to animate the game
};

var draw = function()
{
  if (!entities.kitteh.paused)                                                  //this is the normal set of draw events
  {
    c.drawImage(images.background, 0, 0);                                       //drawing the images
    c.drawImage(images.kitteh, entities.kitteh.x, entities.kitteh.y);
    c.drawImage(images.pumpkin, entities.pumpkin.x, entities.pumpkin.y);
    c.drawImage(images.zombie, entities.zombie.x, entities.zombie.y);
    c.drawImage(images.candy, entities.candy.x, entities.candy.y);

    document.getElementById("kp").innerHTML = entities.kitteh.pumpkins;         //updating the score, etc. on the html page
    document.getElementById("el").innerHTML = "+" + (entities.kitteh.lives - 1);
    document.getElementById("zp").innerHTML = entities.zombie.pumpkins;
  }
  else                                                                          //a set of draw events for when the cat dies
  {
    c.fillStyle = "#FF0000";
    c.fillRect(0, 0, 640, 480);
    c.font = "30px 'Fontdiner Swanky'";
    c.fillStyle = "black";
    c.fillText("Zombie ate Kitteh!", 180, 75);
    c.fillText(entities.kitteh.pausedText, 230, 250);
    c.fillText("Press Enter to Continue", 130, 450);
  }
};

var reset = function()                                                          //resets the properties of game entities
{
  entities.pumpkin.x = 64 + (Math.random() * (c.canvas.width - 128));           //randomly places the pumpkin
  entities.pumpkin.y = 64 + (Math.random() * (c.canvas.height - 128));

  if (entities.kitteh.pumpkins != 0 && entities.kitteh.pumpkins % 10 == 0 && !entities.zombie.candy)
  {
    entities.candy.x = 10;                                                      //puts the candy on the canvas
    entities.candy.y = 10;                                                      //when the above conditions are met
    entities.zombie.candy = false;
  }
  else                                                                          //hides the candy by placing it outside the canvas
  {
    entities.candy.x = -120;
    entities.candy.y = -120;
  }
};

var update = function(delta)
{
  if (entities.kitteh.paused)                                                   //when the cat dies the game is paused
  {
      if (entities.kitteh.input.enter)                                          //until the enter key is pressed
      {
        entities.kitteh.paused = false;
        if (entities.kitteh.lives == 0)                                         //when no more lives the game ends
        {
          document.location.reload();
          entities.kitteh.paused = true;                                        //hack. prevents a split second reload of the old canvas
        }                                                                       //by draw() while the page is reloading
      }
  }
  else                                                                          //the normal update cycle
  {
    if (entities.kitteh.input.up){entities.kitteh.y -= entities.kitteh.speed * delta;};
    if (entities.kitteh.input.down){entities.kitteh.y += entities.kitteh.speed * delta;};
    if (entities.kitteh.input.left){entities.kitteh.x -= entities.kitteh.speed * delta;};
    if (entities.kitteh.input.right){entities.kitteh.x += entities.kitteh.speed * delta;};

    entities.zombie.x += entities.zombie.xv * delta;                            //makes the zombie move
    entities.zombie.y += entities.zombie.yv * delta;

    handleWallCollisions();                                                     //checks for cat's and zombie's wall collisions

    if (detectEntityCollisions(entities.kitteh, entities.pumpkin))              //when cat and pumpkin collide
    {
      entities.zombie.candy = false;
      ++entities.kitteh.pumpkins;                                               //increases cat's score
      sounds.smash.src = "smash.mp3";                                           //a hack. browsers can't play same sound fast, without reloading
      sounds.smash.play();

      if (entities.kitteh.pumpkins != 0 && entities.kitteh.pumpkins % 60 == 0)  //if a mumtiple of 60 pumpkins is reached
      {
        entities.kitteh.lives += 1;                                             //grants a new life
        sounds.life.play();
      }
      reset();
    }
    if (detectEntityCollisions(entities.kitteh, entities.candy))                //when cat and candy collide
    {
      entities.zombie.xv = (Math.random() < 0.5 ? -1 : 1) * 175;                //resets zombie's speed
      entities.zombie.yv = (Math.random() < 0.5 ? -1 : 1) * 175;
      ++entities.kitteh.pumpkins;
      entities.zombie.candy = false;
      sounds.cat.play();
      reset();
    }
    if (detectEntityCollisions(entities.kitteh, entities.zombie))               //when cat and zombie collide
    {
      entities.kitteh.lives -= 1;                                               //subtracts a life from cat
      entities.zombie.candy = false;

      if (entities.kitteh.lives > 0)                                            //if more lives are left
      {
        reset();
        entities.kitteh.x = c.canvas.width-65;                                  //resets cat's position
        entities.kitteh.y = c.canvas.height-65;
        entities.zombie.x = 120;                                                //resets zombie's position
        entities.zombie.y = 120;
        entities.zombie.xv = (Math.random() < 0.5 ? -1 : 1) * 175;              //resets zombie's speed
        entities.zombie.yv = (Math.random() < 0.5 ? -1 : 1) * 175;
        entities.kitteh.paused = true;                                          //pauses the game
        entities.kitteh.pausedText = "Lives left: " + entities.kitteh.lives;    //provides a text for the pause screen
      }
      else                                                                      //if no more lives
      {
        entities.kitteh.paused = true;                                          //pauses the game
        entities.kitteh.pausedText = "GAME OVER!";                              //another text for the pause screen
      }

      sounds.death.play();
    }
    if (detectEntityCollisions(entities.zombie, entities.pumpkin))              //when zombie and pumpkin collide
    {
      ++entities.zombie.pumpkins;                                               //increases zombie's score
      if (entities.zombie.xv > 0) {entities.zombie.xv += 15}                    //increases zombie's speed
      else {entities.zombie.xv -= 15};
      if (entities.zombie.yv > 0) {entities.zombie.yv += 15}
      else {entities.zombie.yv -= 15};
      sounds.eat.src = "eat.mp3";                                               //a hack. browsers can't play same sound fast, without reloading
      sounds.eat.play();
      reset();
    }
    if (detectEntityCollisions(entities.zombie, entities.candy))                //when zombie and candy collide
    {
      ++entities.zombie.pumpkins;                                               //increases zombie's score
      if (entities.zombie.xv > 0) {entities.zombie.xv += 50}                    //increases zombie's speed
      else {entities.zombie.xv -= 50};
      if (entities.zombie.yv > 0) {entities.zombie.yv += 50}
      else {entities.zombie.yv -= 50};
      entities.zombie.candy = true;
      sounds.zombie.play();
      reset();
    }
  }
};

var entities =                                                                  //all of the in-game entities
{
  kitteh:
  {
    speed: 256, x: c.canvas.width-64, y: c.canvas.height-64,
    lives: 3, pumpkins: 0, paused: false, pausedText: "",
    input: {up: false, down: false, left: false, right: false, enter: false}
  },
  pumpkin:
  {
    x: 64 + (Math.random() * (c.canvas.width - 128)),
    y: 64 + (Math.random() * (c.canvas.height - 128))
  },
  zombie:
  {
    x: 128,
    y: 128,
    xv: (Math.random() < 0.5 ? -1 : 1) * 175,
    yv: (Math.random() < 0.5 ? -1 : 1) * 175,
    pumpkins: 0,
    candy: false                                                                //if the zombie ate the candy but cat still has 10 pumpkins
  },                                                                            //the candy must not reappear. this helps ensure that
  candy: {x: -120, y: -120}
};

document.addEventListener("keydown", function(e){return onkey(e, e.keyCode, true)});
document.addEventListener("keyup", function(e){return onkey(e, e.keyCode, false)});

var onkey = function(e, key, pressed)
{
  switch(key)
  {
    case 38: entities.kitteh.input.up = pressed; e.preventDefault(); break;
    case 40: entities.kitteh.input.down = pressed; e.preventDefault(); break;
    case 37: entities.kitteh.input.left = pressed; e.preventDefault(); break;
    case 39: entities.kitteh.input.right = pressed; e.preventDefault(); break;
    case 13: entities.kitteh.input.enter = pressed; e.preventDefault(); break;
  }
};

var handleWallCollisions = function()
{                                                                               //makes the cat not go outside of the canvas
  if (entities.kitteh.y <= 0){entities.kitteh.y = 0};
  if (entities.kitteh.y >= c.canvas.height-64){entities.kitteh.y = c.canvas.height-64};
  if (entities.kitteh.x <= 0){entities.kitteh.x = 0};
  if (entities.kitteh.x >= c.canvas.width-64){entities.kitteh.x = c.canvas.width-64};
                                                                                //makes the zombie not go outside of the canvas
  if (entities.zombie.y <= 0){entities.zombie.y = 0; entities.zombie.yv = -entities.zombie.yv;};
  if (entities.zombie.y >= c.canvas.height-64){entities.zombie.y = c.canvas.height-64; entities.zombie.yv = -entities.zombie.yv;};
  if (entities.zombie.x <= 0){entities.zombie.x = 0; entities.zombie.xv = -entities.zombie.xv;};
  if (entities.zombie.x >= c.canvas.width-64){entities.zombie.x = c.canvas.width-64; entities.zombie.xv = -entities.zombie.xv;};
};

var detectEntityCollisions = function(en1, en2)                                 //checks if two entities collide
{
  if (en1.x <= (en2.x + 64) && en2.x <= (en1.x + 64) && en1.y <= (en2.y + 64) && en2.y <= (en1.y + 64))
  {
    return true;
  }
};