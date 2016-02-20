class SpaceGame {

    game: Phaser.Game;
    ship: Phaser.Sprite;

    key_left: Phaser.Key;
    key_right: Phaser.Key;
    key_thrust: Phaser.Key;

    constructor() {
        this.game = new Phaser.Game(1024, 768, Phaser.AUTO, 'content', { preload: this.preload, create: this.create, update: this.update });
    }

    preload() {
        this.game.load.image('farback', 'Images/farback.gif');
        this.game.load.image('ship', 'Images/ship.png');
    }

    create() {
        //init graphics
        var farback = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY, 'farback');
        farback.anchor.setTo(0.5, 0.5);

        this.ship = this.game.add.sprite(this.game.width * 0.5, this.game.height * 0.5, 'ship');
        this.ship.angle = -90;
        this.ship.anchor.set(0.5, 0.5);

        //init physics
        this.game.physics.startSystem(Phaser.Physics.ARCADE);
        this.game.physics.enable(this.ship, Phaser.Physics.ARCADE);
        this.ship.body.drag.set(100);
        this.ship.body.maxVelocity.set(300);

        //init keyboard
        this.key_left = this.game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
        this.key_right = this.game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
        this.key_thrust = this.game.input.keyboard.addKey(Phaser.Keyboard.UP);
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
        } else {
            this.ship.body.acceleration.set(0);
        }
    }
}

window.onload = () => {
    var game = new SpaceGame();
};