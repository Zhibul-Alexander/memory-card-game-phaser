import Phaser from 'phaser'
import GameScene from './scenes/GameScene'

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#1E1E2F',
  parent: 'game-container',
  scene: [GameScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
}

new Phaser.Game(config)
