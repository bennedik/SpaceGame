//constants
const windowWidth: number = 1024;
const windowHeight: number = 768;
const shipDrag: number = 100;
const shipAcceleration: number = 300;
const shipMaxVelocity: number = 300;
const shipAngularVelocity: number = 200;
const laserLifespan: number = 2000;
const laserSpeed: number = 600;
const laserGap: number = 250;
const asteroidMinAngularVelocity: number = 0;
const asteroidMaxAngularVelocity: number = 100;
const asteroidMinVelocity: number = 0;
const asteroidMaxVelocity: number = 75;
const stationSize: number = 364;
const enemySpeed: number = 100;
const enemyFireSpeed: number = 200;
const enemyFireGap: number = 2000;

//constants for level set up
const worldWidth: number = 2000;
const worldHeight: number = 2000;
const worldIncrease: number = 250;
const asteroidDensity: number = 133333;
const asteroidDensityDecrease: number = 1000;
const enemyCount: number = 1;
const enemyIncrease: number = 1;

class SpaceGame {    
    game: Phaser.Game;

    constructor() {
        this.game = new Phaser.Game(windowWidth, windowHeight, Phaser.AUTO, 'content', { preload: this.preload, create: this.create });
    }

    preload() {
        //load images
        this.game.load.image('farback', 'Images/farback.png');
        this.game.load.image('redlaser', 'Images/redlaser.png');
        this.game.load.image('asteroid1', 'Images/asteroid1.png');
        this.game.load.image('station', 'Images/station.png');
        this.game.load.spritesheet('ship', 'Images/shipsheet3.png', 111, 63);
        this.game.load.image('enemy', 'Images/enemy2.png');
        this.game.load.image('enemyfire', 'Images/enemyfire.png');

        //load sounds
        this.game.load.audio('thrust', 'Sounds/thrust.wav');
        this.game.load.audio('left', 'Sounds/left.wav');
        this.game.load.audio('right', 'Sounds/right.wav');
        this.game.load.audio('laser', 'Sounds/laser.wav');
        this.game.load.audio('collide', 'Sounds/collide.wav');
        this.game.load.audio('levelup', 'Sounds/levelup.wav');
        this.game.load.audio('explode', 'Sounds/explode.wav');
        this.game.load.audio('gameover', 'Sounds/gameover.wav');
        this.game.load.audio('enemycollide', 'Sounds/enemycollide.wav');
        this.game.load.audio('enemyfire', 'Sounds/enemyfire.wav');
    }

    create() {
        this.game.state.add('level', new Level());
        this.game.state.start('level', false, false, 1);
    }
}

class Level {
    game: Phaser.Game;
    ship: Phaser.Sprite;
    laserGroup: Phaser.Group;
    asteroidGroup: Phaser.Group;
    station: Phaser.Sprite;
    enemyGroup: Phaser.Group;
    enemyFireGroup: Phaser.Group;

    key_left: Phaser.Key;
    key_right: Phaser.Key;
    key_thrust: Phaser.Key;
    key_fire: Phaser.Key;

    sfx_thrust: Phaser.Sound;
    sfx_left: Phaser.Sound;
    sfx_right: Phaser.Sound;
    sfx_laser: Phaser.Sound;
    sfx_collide: Phaser.Sound;
    sfx_levelup: Phaser.Sound;
    sfx_explode: Phaser.Sound;
    sfx_gameOver: Phaser.Sound;
    sfx_enemyCollide: Phaser.Sound;
    sfx_enemyFire: Phaser.Sound;

    laserInterval: number;
    level: number;
    shield: number;
    alive: boolean;

    constructor() {
    }

    create() {
        //init camera
        this.game.camera.follow(this.ship);
    }

    init(level: number) {
        this.level = level;
        this.shield = 10;
        this.alive = true;

        //init world
        this.game.world.setBounds(0, 0, worldWidth + level * worldIncrease, worldHeight + level * worldIncrease);

        //init sound
        this.sfx_thrust = this.game.add.audio('thrust');
        this.sfx_left = this.game.add.audio('left');
        this.sfx_right = this.game.add.audio('right');
        this.sfx_laser = this.game.add.audio('laser');
        this.sfx_laser.allowMultiple = true;
        this.sfx_collide = this.game.add.audio('collide');
        this.sfx_levelup = this.game.add.audio('levelup');
        this.sfx_explode = this.game.add.audio('explode');
        this.sfx_gameOver = this.game.add.audio('gameover');
        this.sfx_enemyCollide = this.game.add.audio('enemycollide');
        this.sfx_enemyFire = this.game.add.audio('enemyfire');
        this.sfx_enemyFire.allowMultiple = true;

        //init graphics
        var farback = this.game.add.tileSprite(0, 0, this.game.world.width, this.game.world.height, 'farback');

        this.ship = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY, 'ship');
        this.ship.angle = -90;
        this.ship.anchor.set(0.5, 0.5);
        var ignite = this.ship.animations.add('ignite', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
        var explode = this.ship.animations.add('explode', [0, 10, 11, 12, 13, 14]);
        explode.onComplete.add(this.gameOver, this);

        this.laserGroup = this.game.add.group();
        this.asteroidGroup = this.game.add.group();
        this.enemyGroup = this.game.add.group();
        this.enemyFireGroup = this.game.add.group();

        var stationLocation = [
            [stationSize, stationSize],
            [this.game.world.width - stationSize, stationSize],
            [stationSize, this.game.world.height - stationSize],
            [this.game.world.width - stationSize, this.game.world.height - stationSize]];

        var locationIndex = this.game.rnd.integerInRange(0, stationLocation.length - 1);
        var x = stationLocation[locationIndex][0];
        var y = stationLocation[locationIndex][1];

        this.station = this.game.add.sprite(x, y, 'station');
        this.station.anchor.set(0.5, 0.5);

        //init physics
        this.game.physics.startSystem(Phaser.Physics.ARCADE);

        this.game.physics.enable(this.ship, Phaser.Physics.ARCADE);
        this.ship.body.drag.set(shipDrag);
        this.ship.body.maxVelocity.set(shipMaxVelocity);
        this.ship.body.collideWorldBounds = true;
        this.ship.body.bounce.setTo(1.0, 1.0); //

        this.laserGroup.enableBody = true;
        this.laserGroup.physicsBodyType = Phaser.Physics.ARCADE;
        this.laserGroup.createMultiple(30, 'redlaser');
        this.laserGroup.setAll('anchor.x', 0.5);
        this.laserGroup.setAll('anchor.y', 0.5);
        this.laserGroup.setAll('lifespan', laserLifespan);

        this.laserInterval = this.game.time.now;

        this.asteroidGroup.enableBody = true;
        this.asteroidGroup.physicsBodyType = Phaser.Physics.ARCADE;

        var area = this.game.world.width * this.game.world.height;
        var density = asteroidDensity - level * asteroidDensityDecrease;
        var asteroids = area / density;
        for (var i = 0; i < asteroids; i++) {
            var x = this.game.rnd.between(0, this.game.world.width);
            var y = this.game.rnd.between(0, this.game.world.height);
            this.createAsteroid(x, y);
        }

        this.game.physics.enable(this.station, Phaser.Physics.ARCADE);
        this.station.body.immovable = true;

        this.enemyGroup.enableBody = true;
        this.enemyGroup.physicsBodyType = Phaser.Physics.ARCADE;

        var enemies = enemyCount + level * enemyIncrease;
        for (i = 0; i < enemies; i++) {
            x = this.game.rnd.between(0, this.game.world.width);
            y = this.game.rnd.between(0, this.game.world.height);
            this.createEnemy(x, y);
        }

        this.enemyFireGroup.enableBody = true;
        this.enemyFireGroup.physicsBodyType = Phaser.Physics.ARCADE;
        this.enemyFireGroup.createMultiple(30, 'enemyfire');
        this.enemyFireGroup.setAll('anchor.x', 0.5);
        this.enemyFireGroup.setAll('anchor.y', 0.5);
        this.enemyFireGroup.setAll('lifespan', laserLifespan);

        //init keyboard
        this.key_left = this.game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
        this.key_right = this.game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
        this.key_thrust = this.game.input.keyboard.addKey(Phaser.Keyboard.UP);
        this.key_fire = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    }

    checkBoundaries(sprite: Phaser.Sprite) {
        if (sprite.x < 0 && sprite.body.velocity.x < 0) {
            sprite.body.velocity.x = -sprite.body.velocity.x;
        } else if (sprite.x > this.game.world.width && sprite.body.velocity.x > 0) {
            sprite.body.velocity.x = -sprite.body.velocity.x;
        }

        if (sprite.y < 0 && sprite.body.velocity.y < 0) {
            sprite.body.velocity.y = -sprite.body.velocity.y;
        } else if (sprite.y > this.game.world.height && sprite.body.velocity.y > 0) {
            sprite.body.velocity.y = -sprite.body.velocity.y;
        }
    }

    createEnemy(x: number, y: number) {
        var enemy = this.enemyGroup.create(x, y, 'enemy');
        enemy.anchor.set(0.5, 0.5);
        this.game.physics.enable(enemy, Phaser.Physics.ARCADE);
        enemy.body.collideWorldBounds = true;
        enemy.body.bounce.setTo(1, 1);
        enemy.shield = 2;
        enemy.fireInterval = this.game.time.now + this.game.rnd.integerInRange(0, 1000);
    }

    createAsteroid(x: number, y: number) {
        var asteroid = this.asteroidGroup.create(x, y, 'asteroid1');
        asteroid.anchor.set(0.5, 0.5);
        asteroid.body.angularVelocity = this.game.rnd.integerInRange(asteroidMinAngularVelocity, asteroidMaxAngularVelocity);

        var randomAngle = Phaser.Math.degToRad(this.game.rnd.angle());
        var randomVelocity = this.game.rnd.integerInRange(asteroidMinVelocity, asteroidMaxVelocity);
        this.game.physics.arcade.velocityFromRotation(randomAngle, randomVelocity, asteroid.body.velocity);

        this.game.physics.enable(asteroid, Phaser.Physics.ARCADE);
        asteroid.body.collideWorldBounds = true;
        asteroid.body.bounce.setTo(1, 1);
    }

    asteroidCollision(target, asteroid) {
        asteroid.body.velocity.x += target.body.velocity.x * 0.075;
        asteroid.body.velocity.y += target.body.velocity.y * 0.075;
        target.kill();
    }

    shipDestroyed() {
        if (this.alive) {
            this.alive = false;
            this.sfx_thrust.stop();
            this.sfx_left.stop();
            this.sfx_right.stop();
            this.sfx_explode.play();
            this.ship.animations.play('explode', 5, false, true);
        }
    }

    shipCollision(ship, asteroid): boolean {
        if (this.shield == 0) {
            this.shipDestroyed();
        }
        else {
            this.sfx_collide.play();
            this.shield = this.shield - 1;
        }
        return true;
    }

    enemyCollision(ship, enemy): boolean {
        this.sfx_enemyCollide.play();
        return true;
    }

    enemyShot(laser, enemy) {
        if (enemy.shield == 0) {
            enemy.kill();
        } else {
            enemy.shield--;
        }
        laser.kill();
    }

    enemyHit(ship, enemyfire) {
        if (this.shield == 0) {
            this.shipDestroyed();
        }
        else {
            this.sfx_collide.play();
            this.shield = this.shield - 1;
        }

        enemyfire.kill();
    }

    fireHit(enemyfire, laser) {
        enemyfire.kill();
        laser.kill();
    }

    enemyAi(enemy) {
        var distance = this.game.physics.arcade.distanceBetween(enemy, this.ship);
        if (distance < 500) {
            //enemy following
            var speed = (enemy.shield == 0) ? -enemySpeed : (distance > 300 ? enemySpeed : 0); //run away if shields are down or too close
            this.game.physics.arcade.accelerateToObject(enemy, this.ship, speed, 100, 100);
            enemy.angle = Phaser.Math.radToDeg(this.game.physics.arcade.angleBetween(enemy, this.ship));

            //enemy fire
            if (this.game.time.now > enemy.fireInterval) {
                var enemyFire = this.enemyFireGroup.getFirstExists(false);

                if (enemyFire) {
                    var length = enemy.width * 0.5;
                    var x = enemy.x + (Math.cos(enemy.rotation) * length);
                    var y = enemy.y + (Math.sin(enemy.rotation) * length);

                    enemyFire.reset(x, y);
                    enemyFire.lifespan = laserLifespan;
                    enemyFire.rotation = enemy.rotation;

                    this.game.physics.arcade.velocityFromRotation(enemy.rotation, enemyFireSpeed, enemyFire.body.velocity);

                    this.sfx_enemyFire.play();

                    enemy.fireInterval = this.game.time.now + enemyFireGap;
                }
            }
        } 
    }

    gameOver() {
        var style = { font: "65px Arial", fill: "white", align: "center" };
        var text = this.game.add.text(this.game.camera.position.x, this.game.camera.position.y, "GAME OVER", style);
        text.anchor.set(0.5);

        this.sfx_gameOver.play();
    }

    levelUp(ship, station) {
        this.game.sound.stopAll();
        this.sfx_levelup.play();
        this.game.state.start('level', true, false, this.level + 1);
    }

    thrust: boolean;
    left: boolean;
    right: boolean;

    update() {
        if (this.alive) {
            var leftDown = this.key_left.isDown;
            var rightDown = this.key_right.isDown;

            if (leftDown) {
                if (!this.left) {
                    this.left = true;
                    this.ship.body.angularVelocity = -shipAngularVelocity;
                    this.sfx_left.loopFull(0.2);
                }
            }
            else {
                if (this.left) {
                    this.left = false;
                    this.sfx_left.stop();
                }
            }

            if (rightDown) {
                if (!this.right) {
                    this.right = true;
                    this.ship.body.angularVelocity = shipAngularVelocity;
                    this.sfx_right.loopFull(0.2);
                }
            }
            else {
                if (this.right) {
                    this.right = false;
                    this.sfx_right.stop();
                }
            }

            if (!rightDown && !leftDown) {
                this.ship.body.angularVelocity = 0;
            }

            if (this.key_thrust.isDown) {
                this.game.physics.arcade.accelerationFromRotation(this.ship.rotation, shipAcceleration, this.ship.body.acceleration);

                if (!this.thrust) {
                    this.thrust = true;
                    this.ship.animations.play('ignite', 30, false);
                    this.sfx_thrust.loopFull(0.6);
                }
            } else {
                this.ship.body.acceleration.set(0);

                if (this.thrust) {
                    this.thrust = false;
                    this.ship.animations.stop(null, true);
                    this.sfx_thrust.stop();
                }
            }

            if (this.key_fire.isDown) {
                if (this.game.time.now > this.laserInterval) {
                    var laser = this.laserGroup.getFirstExists(false);

                    if (laser) {
                        var length = this.ship.width * 0.5;
                        var x = this.ship.x + (Math.cos(this.ship.rotation) * length);
                        var y = this.ship.y + (Math.sin(this.ship.rotation) * length);

                        laser.reset(x, y);
                        laser.lifespan = laserLifespan;
                        laser.rotation = this.ship.rotation;

                        this.game.physics.arcade.velocityFromRotation(this.ship.rotation, laserSpeed, laser.body.velocity);

                        this.sfx_laser.play();

                        this.laserInterval = this.game.time.now + laserGap;
                    }
                }
            }
        }
        
        //asteroid collisions
        this.game.physics.arcade.overlap(this.laserGroup, this.asteroidGroup, this.asteroidCollision, null, this);

        this.game.physics.arcade.collide(this.asteroidGroup, this.asteroidGroup);
        this.game.physics.arcade.collide(this.asteroidGroup, this.enemyGroup);
        this.game.physics.arcade.collide(this.asteroidGroup, this.station);

        //ship collisions
        if (this.alive) {
            this.game.physics.arcade.collide(this.asteroidGroup, this.ship, this.shipCollision, null, this);
            this.game.physics.arcade.collide(this.enemyGroup, this.ship, this.enemyCollision, null, this);
            this.game.physics.arcade.overlap(this.ship, this.station, this.levelUp, null, this);
        }

        //enemy collisions
        this.game.physics.arcade.collide(this.enemyGroup, this.station);
        this.game.physics.arcade.overlap(this.laserGroup, this.enemyGroup, this.enemyShot, null, this);

        //enemy fire collisions
        this.game.physics.arcade.overlap(this.enemyFireGroup, this.asteroidGroup, this.asteroidCollision, null, this);
        this.game.physics.arcade.overlap(this.enemyFireGroup, this.ship, this.enemyHit, null, this);
        this.game.physics.arcade.overlap(this.enemyFireGroup, this.laserGroup, this.fireHit, null, this);

        //enemy ai
        if (this.alive) {
            this.enemyGroup.forEachAlive(this.enemyAi, this);
        }
    }

    render() {
        this.game.debug.text('Level: ' + this.level, 5, 730);
        this.game.debug.text('Shields: ' + this.shield, 5, 750);
    }
}

window.onload = () => {
    var game = new SpaceGame();
};
