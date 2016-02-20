class SpaceGame {

    game: Phaser.Game;
    ship: Phaser.Sprite;

    key_left: Phaser.Key;
    key_right: Phaser.Key;
    key_thrust: Phaser.Key;

    sfx_thrust: Phaser.Sound;
    sfx_left: Phaser.Sound;
    sfx_right: Phaser.Sound;

    constructor() {
        this.game = new Phaser.Game(1024, 768, Phaser.AUTO, 'content', { preload: this.preload, create: this.create, update: this.update, checkBoundaries: this.checkBoundaries });
    }

    preload() {
        this.game.load.image('farback', 'Images/farback.png');
        this.game.load.spritesheet('ship', 'Images/shipsheet.png', 130, 65);
        this.game.load.audio('thrust', 'Sounds/thrust.wav');
        this.game.load.audio('left', 'Sounds/left.wav');
        this.game.load.audio('right', 'Sounds/right.wav');
    }

    create() {
        //init world
        this.game.world.setBounds(0, 0, 5000, 5000);

        //init sound
        this.sfx_thrust = this.game.add.audio('thrust');
        this.sfx_left = this.game.add.audio('left');
        this.sfx_right = this.game.add.audio('right');

        //init graphics
        var farback = this.game.add.tileSprite(0, 0, 5000, 5000, 'farback');                        

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

        //init physics
        this.game.physics.startSystem(Phaser.Physics.ARCADE);
        this.game.physics.enable(this.ship, Phaser.Physics.ARCADE);
        this.ship.body.drag.set(100);
        this.ship.body.maxVelocity.set(300);
        this.ship.body.collideWorldBounds = true;

        //init keyboard
        this.key_left = this.game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
        this.key_right = this.game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
        this.key_thrust = this.game.input.keyboard.addKey(Phaser.Keyboard.UP);

        //init camera
        this.game.camera.follow(this.ship);
    }

    checkBoundaries(sprite : Phaser.Sprite) {
        if (sprite.x < 0) {
            sprite.x = this.game.world.width;
        } else if (sprite.x > this.game.world.width) {
            sprite.x = 0;
        }

        if (sprite.y < 0) {
            sprite.y = this.game.world.height;
        } else if (sprite.y > this.game.world.height) {
            sprite.y = 0;
        }
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
                this.ship.body.angularVelocity = -200;
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
                this.ship.body.angularVelocity = 200;
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
            this.game.physics.arcade.accelerationFromRotation(this.ship.rotation, 300, this.ship.body.acceleration);

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

        //this.checkBoundaries(this.ship);        
    }
}

window.onload = () => {
    var game = new SpaceGame();
};