////////////////////////////////////////////////////////////////////////////////////////////////////
// Globals
////////////////////////////////////////////////////////////////////////////////////////////////////
// State to determine which screen to draw
let state = 'intro';

// This is for inputting name for leaderboard
let input = '';

// Stores video for intro and background to dynamically move
let video;
let backgroundImage;
let backgroundPos;

// Stores all animation images
let shipImages;
let smallEnemyImages;
let mediumEnemyImages;
let bigEnemyImages;
let bossImages;
let explosionImages;
let mineImages;
let bulletImages;

// Custom font
let retroFont;

// Stores all music and sound
let music;
let shootSound;
let hitSound;
let damageSound;
let winSound;
let loseSound;
let clickSound;
let deathSound;
let buySound;

// Stores the screen classes 
let screens = {};

// Data that needs to be saved when in game
let levels;
let saveData;
let leaderboardData;
let modifier = 0;

////////////////////////////////////////////////////////////////////////////////////////////////////
// Menu Class
// Use to display the menu and interact with menu buttons
////////////////////////////////////////////////////////////////////////////////////////////////////
class MenuScreen {
  constructor() {}

  // Called just before the screen is displayed this is to set defaults every time
  load() {
    saveData = loadJSON('data/defaultShip.json');
    this.loadButtons();
    state = 'menu';
  }

  // Loads buttons each button is mapped to do stuff when hovered or clicked
  loadButtons() {
    this.playButton = createSprite(width / 2, height / 2, 150, 50);
    this.playButton.shapeColor = color(0, 255, 0);
    this.playButton.onMousePressed = function () {
      console.log('Play clicked.');
      clickSound.play();
      loadScreen('upgrade', 1);
    };
    this.playButton.onMouseOver = function () {
      this.shapeColor = color(255, 0, 0);
    };
    this.playButton.onMouseOut = function () {
      this.shapeColor = color(0, 255, 0);
    };
    this.playButton.mouseActive = true;
    

    this.leaderboardButton = createSprite(width / 2, height / 2 + 60, 150, 50);
    this.leaderboardButton.shapeColor = color(0, 255, 0);
    this.leaderboardButton.onMousePressed = function () {
      console.log('Leaderboad clicked.');
      clickSound.play();
      loadScreen('leaderboard', 1);
    };
    this.leaderboardButton.onMouseOver = function () {
      this.shapeColor = color(255, 0, 0);
    };
    this.leaderboardButton.onMouseOut = function () {
      this.shapeColor = color(0, 255, 0);
    };
    this.leaderboardButton.mouseActive = true;
  }

  // The draw loop for this screen
  draw() {
    // Background
    background(0);
    image(backgroundImage, 0, backgroundPos - height * 2, width, height * 2);
    image(backgroundImage, 0, backgroundPos, width, height * 2);
    backgroundPos = backgroundPos < height * 2 ? backgroundPos + 60 / frameRate() : 0;
    // Buttons
    drawSprite(this.playButton);
    drawSprite(this.leaderboardButton);
    text(`PLAY`, width / 2 - 20, height / 2);
    text(`LEADERBOARD`, width / 2 - 55, height / 2 + 60);
    //Title
    textSize(65);
    textAlign(CENTER);
    fill(0, 255, 0);
    text(`Space`, width / 2 - 200, 150);
    fill(255, 0, 0);
    text(`Shooter`, width / 2 + 150, 150);
    fill(0, 255, 0);
    textSize(30);
    text(`By Carl Humphries`, width / 2, 180);
  }
}
////////////////////////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////////////////////////
// Leading Class
// Use to display a loading text and clear the screen currently waits to "simulate loading"
// This is because everything loads instantly so unable to see this in time.
////////////////////////////////////////////////////////////////////////////////////////////////////
class LoadingScreen {
  constructor() {
  }

  // Loading time on when it started and sets next screen
  load(screen, delay) {
    // Fake loading because its quick anyway
    this.startLoading = frameCount;
    this.screenToLoad = screen;
    this.delay = delay;
  }

  // Draw loop to display text
  draw() {
    background(0);
    fill(255);
    textAlign(CENTER);
    text('Loading...', width / 2, height / 2);
    if (this.startLoading + frameRate() * this.delay < frameCount) {
      screens[this.screenToLoad].load();
    }
  }
}
////////////////////////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////////////////////////
// Game Class
// Use to to display game and keep track of all game related things
////////////////////////////////////////////////////////////////////////////////////////////////////
class GameScreen {
  constructor() {}

  // Loads current state based on savedata and sets defaults
  load() {
    this.ship = createSprite(width / 2, height - 50, 64, 64);
    this.bullets = new Group();
    this.enemyBullets = new Group();
    this.mines = new Group();
    this.enemys = new Group();
    this.explosions = new Group();
    
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 3; j++) {
        this.ship.addImage(`${i}${j}`, shipImages[i][j]);
      }
    }
    this.ship.changeImage(`${saveData.ship.hull}${saveData.ship.booster}`);
    this.ship.health = saveData.ship.hull * 100 + 100;
    this.start = frameCount;
    this.startMoney = saveData.money;
    this.level = levels[saveData.level - 1];
    this.wave = 0;
    this.lastSpawn = frameCount;
    this.lastShot = 0;
    this.lastMine = 0;
    this.modifier = modifier;

    state = 'game';
  }

  // Spawn enemy if its been 5 seconds
  spawn() {
    if (this.lastSpawn + frameRate() * 5 <= frameCount) {
      let spawns = this.level.waves[this.wave];
      for (let i = 0; i < spawns.length; i++) {
        // These if statements spawn different enemies dependant on the level
        if (spawns[i] == 0) {
          let e = createSprite(random(width - 20) + 10, 0, 60, 60);
          e.type = spawns[i];
          e.scale = 2;
          e.addAnimation('move', mediumEnemyImages);
          e.setVelocity(0, 0.5 + 0.05 * this.modifier);
          e.health = 10 + (this.level.modifier + this.modifier) * 20;
          e.dmg = 10 * (this.level.modifier + this.modifier);
          e.value = 10;
          this.enemys.add(e);
        } else if (spawns[i] == 1) {
          let e = createSprite(random(width - 20) + 10, 0, 60, 60);
          e.type = spawns[i];
          e.scale = 2;
          e.addAnimation('move', smallEnemyImages);
          e.setVelocity(0, 1.5 + 0.1 * this.modifier);
          e.health = 10 + (this.level.modifier + this.modifier) * 10;
          e.dmg = 10 * (this.level.modifier + this.modifier);
          e.value = 20;
          this.enemys.add(e);
        } else if (spawns[i] == 2) {
          let e = createSprite(random(width - 20) + 10, 0, 60, 60);
          e.type = spawns[i];
          e.scale = 2;
          e.addAnimation('move', bigEnemyImages);
          e.setVelocity(0, 0.2 + 0.05 * this.modifier);
          e.health = 100 + (this.level.modifier + this.modifier) * 200;
          e.dmg = 10 * (this.level.modifier + this.modifier);
          e.value = 50;
          this.enemys.add(e);
        } else if (spawns[i] == 3) {
          let e = createSprite(width / 2, 0, 60, 60);
          e.immovable = true;
          e.type = spawns[i];
          e.scale = 4;
          e.addAnimation('move', bossImages);
          e.setVelocity(0, 0.05);
          e.health = 10000 + 10000 * this.modifier;
          e.dmg = 1000;
          e.value = 100;
          this.enemys.add(e);
        }
      }
      this.wave++;
      this.lastSpawn = frameCount;
      
    }
  }

  // Handles collision using p5.play does both collision and displace (required 2)
  collision() {
    this.enemys.displace(this.enemys);
    this.ship.collide(this.enemys, function(a, b) {
      a.health -= b.dmg;
      b.remove();
      if (a.health <= 0) {
        loseSound.play();
        loadScreen('gameover', 2);
      }
    });
    // Clean up for projectiles and enemies
    for (let i = 0; i < this.enemys.size(); i++) {
      let e = this.enemys.get(i);
      if (e.position.y > 500) {
        this.enemys.remove(e);
        e.remove();
        if (e.type == 3) {
          this.ship.health = 0;
          loseSound.play();
          loadScreen('gameover', 2);
        }
      }
    }
    for (let i = 0; i < this.bullets.size(); i++) {
      let b = this.bullets.get(i);
      if (b.position.y < 0) {
        this.bullets.remove(b);
        b.remove();
      }
    }
    for (let i = 0; i < this.enemyBullets.size(); i++) {
      let b = this.enemyBullets.get(i);
      if (b.position.y > 500) {
        this.enemyBullets.remove(b);
        b.remove();
      }
    }

    this.enemyBullets.collide(this.ship, function (a, b) {
      animation(explosionImages, a.position.x, a.position.y);
      b.health -= a.dmg;
      damageSound.play();
      a.remove();
      if (b.health <= 0) {
        loseSound.play();
        loadScreen('gameover', 2);
      }
    });

    this.bullets.collide(this.enemys, function (a, b) {
      animation(explosionImages, a.position.x, a.position.y);
      b.health -= saveData.ship.gun.dmg * 10 + 10;
      hitSound.play();
      a.remove();
      if (b.health <= 0) {
        b.remove();
        deathSound.play();
        saveData.money += b.value;
      }
    });

    this.mines.collide(this.enemys, function (a, b) {
      animation(explosionImages, a.position.x, a.position.y);
      b.health -= saveData.ship.mine.dmg * 50 + 50;
      hitSound.play();
      a.remove();
      if (b.health <= 0) {
        b.remove();
        deathSound.play();
        saveData.money += b.value;
      }
    });
  }

  // Handles inputs from user 
  input() {
    if (saveData.ship) {
      // move
      if (keyIsDown(LEFT_ARROW)) {
        this.ship.position.x -= (saveData.ship.booster * 2 + 2);
      }
      if (keyIsDown(RIGHT_ARROW)) {
        this.ship.position.x += (saveData.ship.booster * 2 + 2);
      }

      // shoot
      if (keyIsDown(32) && this.lastShot + frameRate() * (0.9 - (saveData.ship.gun.rate * 0.15)) <= frameCount) {
        this.lastShot = frameCount;
        let spaceing = 100 / (saveData.ship.gun.shots + 2);
        for (let i = 0; i < saveData.ship.gun.shots + 1; i++) {
          let bullet = createSprite(this.ship.position.x + spaceing * (i + 1) - 50, this.ship.position.y - 20, 5, 5);
          bullet.addAnimation('move', bulletImages);
          bullet.setVelocity(0, -5);
          this.bullets.add(bullet);
          shootSound.play();
        }
      }

      if (keyIsDown(16) && this.lastMine + frameRate() * (5 - (saveData.ship.mine.speed * 0.3)) <= frameCount) {
        this.lastMine = frameCount;

        let mine = createSprite(this.ship.position.x, this.ship.position.y, 10, 10);
        mine.scale = (saveData.ship.mine.radius+1) / 2;
        mine.addAnimation('beep', mineImages);
        this.mines.add(mine);
        clickSound.play();
      }
    }
  }

  // Handles when the boos and type 2 enemy can shoot
  enemyAttack() {
    if (frameCount % 120 == 0) {
      for (let i = 0; i < this.enemys.size(); i++) {
        if (this.enemys.get(i).type == 2) {
          let bullet = createSprite(this.enemys.get(i).position.x, this.enemys.get(i).position.y + 10, 5, 5);
          bullet.rotation = 180;
          bullet.addAnimation('move', bulletImages);
          bullet.setVelocity(0, 5);
          bullet.dmg = 20 * (this.modifier + 1);
          this.enemyBullets.add(bullet);
          shootSound.play();
        }
      }
    } 

    if (frameCount % 100 == 0) {
      for (let i = 0; i < this.enemys.size(); i++) {
        if (this.enemys.get(i).type == 3) {
          let bullet = createSprite(this.enemys.get(i).position.x, this.enemys.get(i).position.y + 10, 5, 5);
          bullet.rotation = 180;
          bullet.addAnimation('move', bulletImages);
          bullet.setVelocity(0, 5);
          bullet.dmg = 20 * (this.modifier + 1);
          this.enemyBullets.add(bullet);
          shootSound.play();
        }
      }
    }
  }


  // Draw loop for the game 
  draw() {
    background(0);
    image(backgroundImage, 0, backgroundPos - height * 2, width, height * 2);
    image(backgroundImage, 0, backgroundPos, width, height * 2);
    backgroundPos = backgroundPos < height * 2 ? backgroundPos + 60 / frameRate() : 0;
    

    fill(255, 0, 0);
    text(`${this.level.level} + M=${this.modifier}`, width / 2, 20);
    text(`Health ${this.ship.health}/${(saveData.ship.hull * 100 + 100)}`, width - 210, height - 40);
    text(`$${saveData.money}`, width - width / 4, 20);
    drawSprites(this.bullets);
    drawSprites(this.mines);
    drawSprite(this.ship);
    drawSprites(this.enemyBullets);
    drawSprites(this.enemys);

    fill(255, 0, 0);
    rect(width - 210, height - 30, 200, 20);

    fill(0, 255, 0);
    rect(width - 210, height - 30, 200 + ((this.ship.health - (saveData.ship.hull * 100 + 100)) / (saveData.ship.hull * 100 + 100)) * 200, 20);

    this.enemyAttack();
    this.collision();
    this.input();
    // Handles win lose cases so the game ends when last enemy is killed
    if (this.wave != 10) {
      this.spawn();
    } else {
      if (this.enemys.size() <= 0 && this.ship.health > 0) {
        winSound.play();
        let maxLvl = levels.length;
        console.log(levels.length)
        saveData.level++;
        if (saveData.level > maxLvl) {
          modifier++;
          saveData.level = maxLvl;
        }
        loadScreen('upgrade', 1);
      }
    }    
  }
}
////////////////////////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////////////////////////
// Upgrade Class
// Use to display the upgrades inbetween each level
////////////////////////////////////////////////////////////////////////////////////////////////////
class UpgradeScreen {
  constructor() {}

  load() {
    this.loadButtons();
    state = 'upgrade';
  }

  // Loads all clickable buttons for upgrades they are basic but just repeatitive
  loadButtons() {
    // Button Group
    this.buttons = new Group();

    // Playbutton
    this.playButton = createSprite(width - 100, height - 50, 100, 50);
    this.playButton.shapeColor = color(0, 255, 0);
    this.playButton.onMousePressed = function () {
      console.log('Play clicked.');
      clickSound.play();
      loadScreen('game', 3);
    }
    this.playButton.onMouseOver = function () {
      this.shapeColor = color(255, 0, 0);
    };
    this.playButton.onMouseOut = function () {
      this.shapeColor = color(0, 255, 0);
    }
    this.playButton.active = true;
    this.buttons.add(this.playButton);

    // hull purchase
    this.hullButton = createSprite(45, 55, 50, 50);
    this.hullButton.addImage(shipImages[saveData.ship.hull][0]);
    this.hullButton.onMousePressed = function () {
      let price = 10;
      let maxLvl = 3;
      for (let i = 0; i < saveData.ship.hull; i++)
        price *= 2;
      
      if (saveData.money >= price && saveData.ship.hull < maxLvl) {
        saveData.ship.hull++;
        saveData.money -= price;
        this.addImage(shipImages[saveData.ship.hull][0]);
        buySound.play();
      }
    }
    this.hullButton.active = true;
    this.buttons.add(this.hullButton);

    // booster purchase
    this.boosterButton = createSprite(45, 115, 50, 50);
    this.boosterButton.addImage(shipImages[0][saveData.ship.booster]);
    this.boosterButton.onMousePressed = function () {
      let price = 10;
      let maxLvl = 2;
      for (let i = 0; i < saveData.ship.booster; i++)
        price *= 2;

      if (saveData.money >= price && saveData.ship.booster < maxLvl) {
        saveData.ship.booster++;
        saveData.money -= price;
        this.addImage(shipImages[0][saveData.ship.booster]);
        buySound.play();
      }
    }
    this.boosterButton.active = true;
    this.buttons.add(this.boosterButton);

    //GUN

    // Gunfire purchase
    this.fireRateButton = createSprite(45, 265, 50, 50);
    this.fireRateButton.shapeColor = color(0, 255, 0);
    this.fireRateButton.onMousePressed = function () {
      let price = 10;
      let maxLvl = 5;
      for (let i = 0; i < saveData.ship.gun.rate; i++)
        price *= 2;

      if (saveData.money >= price && saveData.ship.gun.rate < maxLvl) {
        saveData.ship.gun.rate++;
        saveData.money -= price;
        buySound.play();
      }
    }
    this.fireRateButton.onMouseOver = function () {
      this.shapeColor = color(255, 0, 0);
    };
    this.fireRateButton.onMouseOut = function () {
      this.shapeColor = color(0, 255, 0);
    }
    this.fireRateButton.active = true;
    this.buttons.add(this.fireRateButton);

    // Shots purchase
    this.shotsButton = createSprite(45, 325, 50, 50);
    this.shotsButton.shapeColor = color(0, 255, 0);
    this.shotsButton.onMousePressed = function () {
      let price = 10;
      let maxLvl = 5;
      for (let i = 0; i < saveData.ship.gun.shots; i++)
        price *= 2;

      if (saveData.money >= price && saveData.ship.gun.shots < maxLvl) {
        saveData.ship.gun.shots++;
        saveData.money -= price;
        buySound.play();
      }
    }
    this.shotsButton.onMouseOver = function () {
      this.shapeColor = color(255, 0, 0);
    };
    this.shotsButton.onMouseOut = function () {
      this.shapeColor = color(0, 255, 0);
    }
    this.shotsButton.active = true;
    this.buttons.add(this.shotsButton);

    // Damage purchase
    this.gunDmgButton = createSprite(45, 385, 50, 50);
    this.gunDmgButton.shapeColor = color(0, 255, 0);
    this.gunDmgButton.onMousePressed = function () {
      let price = 10;
      let maxLvl = 5;
      for (let i = 0; i < saveData.ship.gun.dmg; i++)
        price *= 2;

      if (saveData.money >= price && saveData.ship.gun.dmg < maxLvl) {
        saveData.ship.gun.dmg++;
        saveData.money -= price;
        buySound.play();
      }
    }
    this.gunDmgButton.onMouseOver = function () {
      this.shapeColor = color(255, 0, 0);
    };
    this.gunDmgButton.onMouseOut = function () {
      this.shapeColor = color(0, 255, 0);
    }
    this.gunDmgButton.active = true;
    this.buttons.add(this.gunDmgButton);

    //Mine

    // Mine Speed purchase
    this.speedButton = createSprite(230, 265, 50, 50);
    this.speedButton.shapeColor = color(0, 255, 0);
    this.speedButton.onMousePressed = function () {
      let price = 10;
      let maxLvl = 5;
      for (let i = 0; i < saveData.ship.mine.speed; i++)
        price *= 2;

      if (saveData.money >= price && saveData.ship.mine.speed < maxLvl) {
        saveData.ship.mine.speed++;
        saveData.money -= price;
        buySound.play();
      }
    }
    this.speedButton.onMouseOver = function () {
      this.shapeColor = color(255, 0, 0);
    };
    this.speedButton.onMouseOut = function () {
      this.shapeColor = color(0, 255, 0);
    }
    this.speedButton.active = true;
    this.buttons.add(this.speedButton);

    // Radius purchase
    this.radiusButton = createSprite(230, 325, 50, 50);
    this.radiusButton.shapeColor = color(0, 255, 0);
    this.radiusButton.onMousePressed = function () {
      let price = 10;
      let maxLvl = 5;
      for (let i = 0; i < saveData.ship.mine.radius; i++)
        price *= 2;

      if (saveData.money >= price && saveData.ship.mine.radius < maxLvl) {
        saveData.ship.mine.radius++;
        saveData.money -= price;
        buySound.play();
      }
    }
    this.radiusButton.onMouseOver = function () {
      this.shapeColor = color(255, 0, 0);
    };
    this.radiusButton.onMouseOut = function () {
      this.shapeColor = color(0, 255, 0);
    }
    this.radiusButton.active = true;
    this.buttons.add(this.radiusButton);

    // Damage purchase
    this.mineDmgButton = createSprite(230, 385, 50, 50);
    this.mineDmgButton.shapeColor = color(0, 255, 0);
    this.mineDmgButton.onMousePressed = function () {
      let price = 10;
      let maxLvl = 5;
      for (let i = 0; i < saveData.ship.mine.dmg; i++)
        price *= 2;

      if (saveData.money >= price && saveData.ship.mine.dmg < maxLvl) {
        saveData.ship.mine.dmg++;
        saveData.money -= price;
        buySound.play();
      }
    }
    this.mineDmgButton.onMouseOver = function () {
      this.shapeColor = color(255, 0, 0);
    };
    this.mineDmgButton.onMouseOut = function () {
      this.shapeColor = color(0, 255, 0);
    }
    this.mineDmgButton.active = true;
    this.buttons.add(this.mineDmgButton);

  }

  // Draws the custom UI for the upgrade screen
  draw() {
    background(0);
    fill(255, 0, 0);
    text(`$${saveData.money}`, width - width / 4, 20);

    fill(255, 0, 0);
    noStroke();
    text(`Ship Upgrades`, 10, 15);
    text(`Prices`, 160, 15);
    fill(0);
    stroke(0, 255, 0);
    rect(10, 20, 130, 130);
    rect(155, 20, 130, 130);

    fill(255, 0, 0);
    noStroke();
    text(`Level 1: $10`, 170, 40);
    text(`Level 2: $20`, 170, 60);
    text(`Level 3: $40`, 170, 80);
    text(`Level 4: $80`, 170, 100);
    text(`Level 5: $160`, 170, 120);
    

    fill(255, 0, 0);
    noStroke();
    text(`Weapon Upgrades`, 10, 195);
    fill(0);
    stroke(0, 255, 0);
    rect(10, 200, 400, 250);
    drawSprites(this.buttons);

    fill(255, 0, 0);
    noStroke();
    text(`Gun (SPACEBAR)`, 35, 225);
    text(`Mine (SHIFT)`, 225, 225);

    fill(0);
    text(`Rate`, 25, 270);
    text(`Shot`, 25, 330);
    text(`DMG`, 25, 390);

    text(`SPD`, 210, 270);
    text(`Size`, 210, 330);
    text(`DMG`, 210, 390);

    text(`PLAY`, width - 130, height - 45);

    noStroke();
    for (let i = 0; i < 3; i++) {
      if (saveData.ship.hull >= i+1)
        fill(0, 255, 0);
      else
        fill(255, 0, 0);
      rect(80 + i*20, 30, 10, 50);
    }
    for (let i = 0; i < 2; i++) {
      if (saveData.ship.booster >= i + 1)
        fill(0, 255, 0);
      else
        fill(255, 0, 0);
      rect(80 + i * 20, 90, 10, 50);
    }
    
    for (let i = 0; i < 5; i++) {
      if (saveData.ship.gun.rate >= i + 1)
        fill(0, 255, 0);
      else
        fill(255, 0, 0);
      rect(80 + i * 20, 240, 10, 50);
    }
    for (let i = 0; i < 5; i++) {
      if (saveData.ship.gun.shots >= i + 1)
        fill(0, 255, 0);
      else
        fill(255, 0, 0);
      rect(80 + i * 20, 300, 10, 50);
    }
    for (let i = 0; i < 5; i++) {
      if (saveData.ship.gun.dmg >= i + 1)
        fill(0, 255, 0);
      else
        fill(255, 0, 0);
      rect(80 + i * 20, 360, 10, 50);
    }

    for (let i = 0; i < 5; i++) {
      if (saveData.ship.mine.speed >= i + 1)
        fill(0, 255, 0);
      else
        fill(255, 0, 0);
      rect(265 + i * 20, 240, 10, 50);
    }
    for (let i = 0; i < 5; i++) {
      if (saveData.ship.mine.radius >= i + 1)
        fill(0, 255, 0);
      else
        fill(255, 0, 0);
      rect(265 + i * 20, 300, 10, 50);
    }
    for (let i = 0; i < 5; i++) {
      if (saveData.ship.mine.dmg >= i + 1)
        fill(0, 255, 0);
      else
        fill(255, 0, 0);
      rect(265 + i * 20, 360, 10, 50);
    }
  }
}
////////////////////////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////////////////////////
// Leaderboard Class
// Shows the top 10 highscores
////////////////////////////////////////////////////////////////////////////////////////////////////
class LeaderboardScreen {
  constructor() {}

  // Loads the back button and sorts the scores
  load() {
    // Backbutton
    this.backButton = createSprite(width - 100, height - 50, 100, 50);
    this.backButton.shapeColor = color(0, 255, 0);
    this.backButton.onMousePressed = function () {
      console.log('Back clicked.');
      clickSound.play();
      loadScreen('menu', 0);
    }
    this.backButton.onMouseOver = function () {
      this.shapeColor = color(255, 0, 0);
    };
    this.backButton.onMouseOut = function () {
      this.shapeColor = color(0, 255, 0);
    }
    this.backButton.active = true;
    console.log(leaderboardData)
    leaderboardData.scores.sort((a, b) => b.score - a.score);
    state = 'leaderboard';
  }

  // Draws the leaderboard screen
  draw() {
    background(0);
    image(backgroundImage, 0, backgroundPos - height * 2, width, height * 2);
    image(backgroundImage, 0, backgroundPos, width, height * 2);
    backgroundPos = backgroundPos < height * 2 ? backgroundPos + 60 / frameRate() : 0;
    drawSprite(this.backButton);
    text(`Back`, width - 130, height - 45);
    fill(0, 255, 0);
    text(`LeaderBoard`, 30, 20);

    for (let i = 0; i < 10; i++) {
      text(`${i+1}.`, 30, 50 + i * 20);
      if (leaderboardData.scores[i]) {
        text(`${leaderboardData.scores[i].name}`, 60, 50 + i * 20);
        text(`$${leaderboardData.scores[i].score}`, 300, 50 + i * 20);
      }
    }
  }
}
////////////////////////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////////////////////////
// Gameover Class
// Death screen that allows user to enter data to be used for leaderboards
////////////////////////////////////////////////////////////////////////////////////////////////////
class GameoverScreen {
  constructor() {}

  // Loads score and button
  load() {
    // Donebutton
    this.doneButton = createSprite(width - 100, height - 50, 100, 50);
    this.doneButton.shapeColor = color(0, 255, 0);
    this.doneButton.onMousePressed = function () {
      console.log('Done clicked.');
      clickSound.play();
      leaderboardData.scores.push({
        "name": input,
        "score": saveData.money
      })
      //Doesnt save to server but you can manually add it
      saveJSON(leaderboardData, 'leaderboard.json');
      loadScreen('menu', 0);
    }
    this.doneButton.onMouseOver = function () {
      this.shapeColor = color(255, 0, 0);
    };
    this.doneButton.onMouseOut = function () {
      this.shapeColor = color(0, 255, 0);
    }
    this.doneButton.active = true;
    this.lastInput = frameCount;
    input = '';
    state = 'gameover';
  }

  // Draw loop gameoeverscreen
  draw() {
    background(0);
    image(backgroundImage, 0, backgroundPos - height * 2, width, height * 2);
    image(backgroundImage, 0, backgroundPos, width, height * 2);
    backgroundPos = backgroundPos < height * 2 ? backgroundPos + 60 / frameRate() : 0;
    drawSprite(this.doneButton);

    text(`DONE`, width - 130, height - 45);

    textSize(20);
    fill(0, 255, 0);
    text(`Type your name: ${input}`, 30, 300);

    if (keyIsPressed && frameCount > this.lastInput + 0.5 * frameRate()) {
      if (keyCode >= 65 && keyCode <= 90) {
        this.lastInput = frameCount;
        input += key;
        shootSound.play();
      } else if (keyCode == 8) {
        this.lastInput = frameCount;
        input = input.substr(0, input.length - 1);
        damageSound.play();
      }
    }

    textSize(65);
    textAlign(CENTER);
    fill(255, 0, 0);
    text(`Game Over`, width / 2, 150);
  }
}
////////////////////////////////////////////////////////////////////////////////////////////////////




////////////////////////////////////////////////////////////////////////////////////////////////////
// P5 functions
////////////////////////////////////////////////////////////////////////////////////////////////////
// Loads all files needed ie images and sound
function preload() {
  backgroundImage = loadImage('images/background.png');
  shipImages = [
    [loadImage('images/ship00.png'), loadImage('images/ship01.png'), loadImage('images/ship02.png')],
    [loadImage('images/ship10.png'), loadImage('images/ship11.png'), loadImage('images/ship12.png')],
    [loadImage('images/ship20.png'), loadImage('images/ship21.png'), loadImage('images/ship22.png')],
    [loadImage('images/ship30.png'), loadImage('images/ship31.png'), loadImage('images/ship32.png')]
  ];
  retroFont = loadFont('fonts/retro_font.ttf');
  smallEnemyImages = loadAnimation('images/small0.png', 'images/small1.png');
  mediumEnemyImages = loadAnimation('images/medium0.png', 'images/medium1.png');
  bigEnemyImages = loadAnimation('images/big0.png', 'images/big1.png');
  bossImages = loadAnimation('images/boss0.png', 'images/boss1.png');
  explosionImages = loadAnimation('images/explosion0.png', 'images/explosion4.png');
  mineImages = loadAnimation('images/mine0.png', 'images/mine1.png');
  bulletImages = loadAnimation('images/bullet0.png', 'images/bullet1.png');
  levelData = loadJSON('data/levels.json', function (data) {
    levels = data.levels;
  });
  shootSound = loadSound('sounds/shoot.wav');
  shootSound.setVolume(0.3);
  hitSound = loadSound('sounds/hit.wav');
  damageSound = loadSound('sounds/damage.wav');
  winSound = loadSound('sounds/win.wav');
  loseSound = loadSound('sounds/lose.wav');
  clickSound = loadSound('sounds/click.wav');
  deathSound = loadSound('sounds/death.wav');
  buySound = loadSound('sounds/buy.wav');
  music = loadSound('sounds/music.wav');
}

// Setup for all the screens and data
function setup() {
  createCanvas(750, 500);
  backgroundPos = 0;
  textFont(retroFont);
  screens['menu'] = new MenuScreen();
  screens['loading'] = new LoadingScreen();
  screens['game'] = new GameScreen();
  screens['upgrade'] = new UpgradeScreen();
  screens['leaderboard'] = new LeaderboardScreen();
  screens['gameover'] = new GameoverScreen();
  leaderboardData = loadJSON('data/leaderboard.json');
  saveData = loadJSON('data/defaultShip.json');
  video = createVideo('intro/intro.mp4');
  video.play();
  video.hide();
}

// Draw loop that plays video for the first 15 seconds then loads 
// NOTE P5 is bad at handling video so sometimes it doesn't load it will still take 15
// to display the game and the game works as intention
function draw() {
  if (frameCount < 60 * 15) {
    image(video, 0, 0, width, height);
  } else if (state == 'intro') {
    state = 'loading';
    loadScreen('menu', 1);
    music.setVolume(0.2);
    music.loop();
  } else {
    screens[state].draw();
  }
}
////////////////////////////////////////////////////////////////////////////////////////////////////

// Function to display loading screen before changing to next screen
function loadScreen(screen, delay) {
  state = 'loading';
  allSprites.removeSprites();
  screens['loading'].load(screen, delay);
}
