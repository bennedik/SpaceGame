const windowWidth: number = 1024;
const windowHeight: number = 768;
const worldWidth: number = 5000;
const worldHeight: number = 5000;
const shipDrag: number = 100;
const shipAcceleration: number = 300;
const shipMaxVelocity: number = 300;
const shipAngularVelocity: number = 200;
const laserLifespan: number = 2000;
const laserSpeed: number = 600;
const laserGap: number = 250;
const asteroidCount: number = 200;
const asteroidMinAngularVelocity: number = 0;
const asteroidMaxAngularVelocity: number = 100;
const asteroidMinVelocity: number = 0;
const asteroidMaxVelocity: number = 75;
const stationSize: number = 364;

class SpaceGame {    
    game: Phaser.Game;

    constructor() {
        this.game = new Phaser.Game(windowWidth, windowHeight, Phaser.AUTO, 'content', { preload: this.preload, create: this.create });
    }

    preload() {
        this.game.load.image('farback', 'Images/farback.png');
        this.game.load.image('redlaser', 'Images/redlaser.png');
        this.game.load.image('asteroid1', 'Images/asteroid1.png');
        this.game.load.image('station', 'Images/station.png');
        this.game.load.spritesheet('ship', 'Images/shipsheet2.png', 111, 63);
        this.game.load.audio('thrust', 'Sounds/thrust.wav');
        this.game.load.audio('left', 'Sounds/left.wav');
        this.game.load.audio('right', 'Sounds/right.wav');
        this.game.load.audio('laser', 'Sounds/laser.wav');
        this.game.load.audio('collide', 'Sounds/collide.wav');
        this.game.load.audio('levelup', 'Sounds/levelup.wav');
        this.game.load.audio('explode', 'Sounds/explode.wav');
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

    laserInterval: number;
    level: number;
    shield: number;

    constructor() {
    }

    create() {
        //init camera
        this.game.camera.follow(this.ship);
    }

    init(level: number) {
        this.level = level;
        this.shield = 10;

        //init world
        this.game.world.setBounds(0, 0, worldWidth, worldHeight);

        //init sound
        this.sfx_thrust = this.game.add.audio('thrust');
        this.sfx_left = this.game.add.audio('left');
        this.sfx_right = this.game.add.audio('right');
        this.sfx_laser = this.game.add.audio('laser');
        this.sfx_laser.allowMultiple = true;
        this.sfx_collide = this.game.add.audio('collide');
        this.sfx_collide.allowMultiple = true;
        this.sfx_levelup = this.game.add.audio('levelup');
        this.sfx_explode = this.game.add.audio('explode');

        //init graphics
        var farback = this.game.add.tileSprite(0, 0, worldWidth, worldHeight, 'farback');

        this.ship = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY, 'ship');
        this.ship.angle = -90;
        this.ship.anchor.set(0.5, 0.5);
        var ignite = this.ship.animations.add('ignite');

        this.laserGroup = this.game.add.group();
        this.asteroidGroup = this.game.add.group();

        var stationLocation = [
            [stationSize, stationSize],
            [this.game.world.width - stationSize, stationSize],
            [stationSize, this.game.world.height - stationSize],
            [this.game.world.width - stationSize, this.game.world.height - stationSize]];

        var locationIndex = 0; // this.game.rnd.integerInRange(0, stationLocation.length - 1);
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

        for (var i = 0; i < asteroidCount; i++) {
            var x = this.game.rnd.between(0, this.game.world.width);
            var y = this.game.rnd.between(0, this.game.world.height);
            this.createAsteroid(x, y);
        }

        this.game.physics.enable(this.station, Phaser.Physics.ARCADE);
        this.station.body.immovable = true;

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

    shipCollision(ship, asteroid): boolean {
        if (this.shield == 0) {
            this.sfx_explode.play();
        }
        else {
            this.sfx_collide.play();
            this.shield = this.shield - 1;
        }
        return true;
    }

    levelUp(ship, station) {
        this.game.sound.stopAll();
        this.sfx_levelup.play();
        this.game.state.start('level', true, false, 2);
    }

    thrust: boolean;
    left: boolean;
    right: boolean;

    update() {
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
        
        //bounce asteroids off world boundaries
        //this.asteroidGroup.forEachExists(this.checkBoundaries, this);

        //asteroid collisions
        this.game.physics.arcade.overlap(this.laserGroup, this.asteroidGroup, this.asteroidCollision, null, this);

        this.game.physics.arcade.collide(this.asteroidGroup, this.asteroidGroup);
        this.game.physics.arcade.collide(this.asteroidGroup, this.ship, this.shipCollision, null, this);
        this.game.physics.arcade.collide(this.asteroidGroup, this.station);

        this.game.physics.arcade.overlap(this.ship, this.station, this.levelUp, null, this);
    }

    render() {
        this.game.debug.text('Level: ' + this.level, 5, 730);
        this.game.debug.text('Shields: ' + this.shield, 5, 750);
    }
}

window.onload = () => {
    var game = new SpaceGame();
};
