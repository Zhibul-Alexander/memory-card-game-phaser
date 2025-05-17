import { shuffleArray } from '../utils/shuffle'

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene')
  }

  preload() {
    for (let i = 1; i <= 10; i++) {
      this.load.image(`card${i}`, `src/assets/card${i}.jpg`)
    }
    this.load.image('back', 'src/assets/back.jpg')
  }

  create() {
    const screenWidth = this.scale.width
    const screenHeight = this.scale.height
    const isMobile = screenWidth < 768

    const COLS = isMobile ? 4 : 5
    const ROWS = isMobile ? 5 : 4
    const TOTAL_CARDS = COLS * ROWS
    const PADDING = 12

    const horizontalPadding = screenWidth * 0.05
    const verticalPadding = screenHeight * 0.05

    const availableWidth = screenWidth - 2 * horizontalPadding
    const availableHeight = screenHeight - 2 * verticalPadding
    const maxCardWidth = (availableWidth - (COLS - 1) * PADDING) / COLS
    const maxCardHeight = (availableHeight - (ROWS - 1) * PADDING) / ROWS

    const CARD_WIDTH = Math.min(maxCardWidth, maxCardHeight)
    const CARD_HEIGHT = CARD_WIDTH

    this.cards = []
    this.firstCard = null
    this.canClick = true
    this.matchedPairs = 0
    this.totalPairs = TOTAL_CARDS / 2
    this.timeLimit = 180
    this.remainingTime = this.timeLimit

    const pairs = []
    for (let i = 1; i <= this.totalPairs; i++) {
      pairs.push(`card${i}`, `card${i}`)
    }
    shuffleArray(pairs)

    const spacingX = CARD_WIDTH + PADDING
    const spacingY = CARD_HEIGHT + PADDING
    const offsetX = (screenWidth - spacingX * (COLS - 1)) / 2
    const offsetY = (screenHeight - spacingY * (ROWS - 1)) / 2

    pairs.forEach((cardKey, index) => {
      const col = index % COLS
      const row = Math.floor(index / COLS)
      const x = offsetX + col * spacingX
      const y = offsetY + row * spacingY

      const card = this.add.image(x, y, 'back')
        .setInteractive({ useHandCursor: true })
        .setData({ key: cardKey, isFlipped: false, isMatched: false })

      const tex = this.textures.get('back').getSourceImage()
      const scaleX = CARD_WIDTH / tex.width
      const scaleY = CARD_HEIGHT / tex.height
      card.setScale(scaleX, scaleY)

      card.on('pointerup', () => this.flipCard(card, CARD_WIDTH, CARD_HEIGHT))
      this.cards.push(card)
    })

    this.timerText = this.add.text(screenWidth * 0.05, screenHeight * 0.05, `Time: ${this.remainingTime}`, {
      fontSize: `${Math.max(16, Math.round(screenWidth * 0.035))}px`,
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setDepth(1000)

    this.timerEvent = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        this.remainingTime--
        this.timerText.setText(`Time: ${this.remainingTime}`)
        if (this.remainingTime <= 0) {
          this.endGame(false)
        }
      }
    })
  }

  flipCard(card, targetWidth, targetHeight) {
    if (!this.canClick || card.getData('isFlipped') || card.getData('isMatched') || this.remainingTime <= 0) return

    this.canClick = false

    this.tweens.add({
      targets: card,
      scaleX: 0.01,
      duration: 150,
      onComplete: () => {
        const key = card.getData('key')
        const newTex = this.textures.get(key).getSourceImage()
        const scaleX = targetWidth / newTex.width
        const scaleY = targetHeight / newTex.height

        card.setTexture(key)
        card.setData('isFlipped', true)
        card.setScale(0.01, scaleY)

        this.tweens.add({
          targets: card,
          scaleX: scaleX,
          duration: 150,
          onComplete: () => {
            if (!this.firstCard) {
              this.firstCard = card
              this.canClick = true
            } else {
              this.time.delayedCall(150, () => {
                if (card.getData('key') === this.firstCard.getData('key')) {
                  card.setData('isMatched', true)
                  this.firstCard.setData('isMatched', true)
                  this.matchedPairs++
                  if (this.matchedPairs === this.totalPairs) {
                    this.endGame(true)
                  }
                  this.firstCard = null
                  this.canClick = true
                } else {
                  this.tweens.add({
                    targets: [card, this.firstCard],
                    scaleX: 0.01,
                    duration: 150,
                    onComplete: () => {
                      const backTex = this.textures.get('back').getSourceImage()
                      const bScaleX = targetWidth / backTex.width
                      const bScaleY = targetHeight / backTex.height

                      card.setTexture('back').setData('isFlipped', false).setScale(0.01, bScaleY)
                      this.firstCard.setTexture('back').setData('isFlipped', false).setScale(0.01, bScaleY)

                      this.tweens.add({
                        targets: [card, this.firstCard],
                        scaleX: bScaleX,
                        duration: 150,
                        onComplete: () => {
                          this.firstCard = null
                          this.canClick = true
                        }
                      })
                    }
                  })
                }
              })
            }
          }
        })
      }
    })
  }

  endGame(win) {
    this.timerEvent.remove(false)

    this.cards.forEach(card => {
      card.disableInteractive();
    });

    const screenWidth = this.scale.width
    const screenHeight = this.scale.height

    const message = win ? 'You Win!' : 'Time\'s Up!'
    const boxWidth = screenWidth * 0.6
    const boxHeight = screenHeight * 0.3
    const centerX = screenWidth / 2
    const centerY = screenHeight / 2

    const bg = this.add.rectangle(centerX, centerY, boxWidth, boxHeight, 0x1E1E2F)
      .setOrigin(0.5)

    const title = this.add.text(centerX, centerY - boxHeight / 4, message, {
      fontSize: `${Math.round(screenWidth * 0.035)}px`,
      fontFamily: 'Arial',
      color: '#ffffff',
    }).setOrigin(0.5)

    const restartBtn = this.add.text(centerX, centerY + boxHeight / 6, 'Restart', {
      fontSize: `${Math.round(screenWidth * 0.025)}px`,
      fontFamily: 'Arial',
      backgroundColor: '#000',
      padding: { x: 48, y: 16 },
      color: '#ffffff',
      align: 'center'
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })

    restartBtn.on('pointerup', () => {
      this.scene.restart()
    })

    this.children.bringToTop(bg)
    this.children.bringToTop(title)
    this.children.bringToTop(restartBtn)
  }
}
