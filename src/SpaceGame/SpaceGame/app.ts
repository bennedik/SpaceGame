class SpaceGame {

    game: Phaser.Game;

    constructor() {
        this.game = new Phaser.Game(1024, 768, Phaser.AUTO, 'content', { preload: this.preload, create: this.create });
    }

    preload() {
        this.game.load.image('farback', 'Images/farback.gif');
    }

    create() {
        var farback = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY, 'farback');
        farback.anchor.setTo(0.5, 0.5);
    }
}

window.onload = () => {
    var game = new SpaceGame();
};