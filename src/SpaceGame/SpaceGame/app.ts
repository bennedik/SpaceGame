class SpaceGame {

    game: Phaser.Game;
    ship: Phaser.Sprite;

    key_left: Phaser.Key;
    key_right: Phaser.Key;
    key_thrust: Phaser.Key;

    constructor() {
        this.game = new Phaser.Game(1024, 768, Phaser.AUTO, 'content', { preload: this.preload, create: this.create, update: this.update, checkBoundaries: this.checkBoundaries });
    }

    preload() {
        this.game.load.image('farback', 'Images/farback.gif');
        //this.game.load.image('ship', 'Images/ship.png');
        this.game.load.spritesheet('ship', 'Images/shipsheet.png', 130, 65);
    }

    create() {
        //init world
        this.game.world.setBounds(0, 0, 5000, 5000);

        //init graphics
        var farback = this.game.add.tileSprite(0, 0, 5000, 5000, 'farback');                        

        this.ship = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY, 'ship');
        this.ship.angle = -90;
        this.ship.anchor.set(0.5, 0.5);
        this.ship.animations.add('thrust');

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

    update() {
        if (this.key_left.isDown) {
            this.ship.body.angularVelocity = -200;
        } else if (this.key_right.isDown) {
            this.ship.body.angularVelocity = 200;
        } else {
            this.ship.body.angularVelocity = 0;
        }

        if (this.key_thrust.isDown) {
            this.game.physics.arcade.accelerationFromRotation(this.ship.rotation, 300, this.ship.body.acceleration);
            this.ship.animations.play('thrust', 30, true);
        } else {
            this.ship.body.acceleration.set(0);
            this.ship.animations.stop(null, true);
        }

        //this.checkBoundaries(this.ship);        
    }
}

window.onload = () => {
    var game = new SpaceGame();
};