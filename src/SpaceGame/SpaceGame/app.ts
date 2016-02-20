﻿const windowWidth: number = 1024;
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
const asteroidMaxAngularVelocity: number = 200;
const asteroidMinVelocity: number = 0;
const asteroidMaxVelocity: number = 150;

class SpaceGame {    
    game: Phaser.Game;
    ship: Phaser.Sprite;
    laserGroup: Phaser.Group;
    asteroidGroup: Phaser.Group;

    key_left: Phaser.Key;
    key_right: Phaser.Key;
    key_thrust: Phaser.Key;
    key_fire: Phaser.Key;

    sfx_thrust: Phaser.Sound;
    sfx_left: Phaser.Sound;
    sfx_right: Phaser.Sound;
    sfx_laser: Phaser.Sound;

    laserInterval: number;

    constructor() {
        this.game = new Phaser.Game(windowWidth, windowHeight, Phaser.AUTO, 'content', { preload: this.preload, create: this.create, update: this.update, checkBoundaries: this.checkBoundaries, createAsteroid: this.createAsteroid, asteroidCollision: this.asteroidCollision });
    }

    preload() {
        this.game.load.image('farback', 'Images/farback.png');
        this.game.load.image('redlaser', 'Images/redlaser.png');
        this.game.load.image('asteroid1', 'Images/asteroid1.png');
        this.game.load.spritesheet('ship', 'Images/shipsheet.png', 130, 65);
        this.game.load.audio('thrust', 'Sounds/thrust.wav');
        this.game.load.audio('left', 'Sounds/left.wav');
        this.game.load.audio('right', 'Sounds/right.wav');
        this.game.load.audio('laser', 'Sounds/laser.wav');
    }

    create() {
        //init world
        this.game.world.setBounds(0, 0, worldWidth, worldHeight);

        //init sound
        this.sfx_thrust = this.game.add.audio('thrust');
        this.sfx_left = this.game.add.audio('left');
        this.sfx_right = this.game.add.audio('right');
        this.sfx_laser = this.game.add.audio('laser');
        this.sfx_laser.allowMultiple = true;

        //init graphics
        var farback = this.game.add.tileSprite(0, 0, worldWidth, worldHeight, 'farback');                        

        this.ship = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY, 'ship');
        this.ship.angle = -90;
        this.ship.anchor.set(0.5, 0.5);
        var ignite = this.ship.animations.add('ignite');
        ignite.onComplete.add((sprite, animation) => {
            /*if (this.thrust) {
                this.ship.animations.stop(null, true);
                this.ship.animations.play('thrust', 30, true);
            }*/
        }, this);
        this.ship.animations.add('thrust', [7, 8, 9, 8]);

        this.laserGroup = this.game.add.group();
        this.asteroidGroup = this.game.add.group();

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

        //init keyboard
        this.key_left = this.game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
        this.key_right = this.game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
        this.key_thrust = this.game.input.keyboard.addKey(Phaser.Keyboard.UP);
        this.key_fire = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

        //init camera
        this.game.camera.follow(this.ship);
    }

    checkBoundaries(sprite : Phaser.Sprite) {
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

        var math: Phaser.Math = this.game.math;
        var randomAngle = math.degToRad(this.game.rnd.angle());
        var randomVelocity = this.game.rnd.integerInRange(asteroidMinVelocity, asteroidMaxVelocity);
        this.game.physics.arcade.velocityFromRotation(randomAngle, randomVelocity, asteroid.body.velocity);

        this.game.physics.enable(asteroid, Phaser.Physics.ARCADE);
        asteroid.body.collideWorldBounds = true;
        asteroid.body.bounce.setTo(1, 1);
    }

    asteroidCollision(target, asteroid) {

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
        //this.game.physics.arcade.overlap(this.asteroidGroup, this.asteroidGroup, this.asteroidCollision, null, this); 
        
        this.game.physics.arcade.collide(this.asteroidGroup, this.asteroidGroup);
        this.game.physics.arcade.collide(this.asteroidGroup, this.ship);                
    }
}

window.onload = () => {
    var game = new SpaceGame();
};