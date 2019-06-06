/* global MainGameContainer */
MainGameContainer.GamePlay = function (game) {};

MainGameContainer.GamePlay.prototype = {
  // Game Objects or Groups
  bgMusic: undefined,
  player: {
    obj: {},
    state: 'idle',
    status: 'simple',
    direction: 'right',
    damageTransition:  false,
  },
  enemies: [],
  coins: [],
  items: [],
  platforms: undefined,
  colliders: {
  	ground: undefined,
  },
  map: undefined,
  CONSTANTS: {

  },
  buttons: {
  	cursors: undefined,
  	jumpButton: undefined,
  },
  ui: {
  	coinsLabel: undefined,
  	timeLabel: undefined,
  	scoreLabel: undefined,
  	livesLabel: undefined,
  },
  sounds: {
  	coin: undefined,
  },
  gameState: 'preparing',
  jumpTimer: 0,
  coinsCount: 0,
  scoreCount: 0,
  timeCount: 180,
  livesCount: 3,
  touchedCount: 0,
  pauseRefreshCounter: 0,

  preload: function () {

  },
  shutdown: function() {
    this.game.world.removeAll();
    // reset everything
    this.resetAll();
  },
	create: function () {
		// Enable Global Phisics
		this.game.physics.startSystem(Phaser.Physics.ARCADE);
		
		// set game world size
		this.game.world.setBounds(0,0, 6960, 390);
		
	  // BG image
	  // this.mainMenuBackground = this.add.sprite(0, 0, 'game_bg');
    
    // init game objects
    this.initGameObjets();

	  // player controller for update behavior
	  this.buttons.cursors = this.game.input.keyboard.createCursorKeys();
    this.buttons.jumpButton = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    
    // simple keystrockes not need to check on update
    this.game.input.keyboard.addCallbacks(this,this.onKeyDown);
    
    // set camera
    this.game.camera.follow(this.player.obj);
    
    // init sounds
    this.initSounds();
    
    // init ui
	  this.addUIElements();
    
	  this.startGame();
	},
	update: function() {
		var pauseGameplay = false;
		if (this.player.status === 'going_super'
		|| this.player.status === 'going_simple'
		|| this.player.status === 'died') {
			pauseGameplay = true;
			this.game.physics.arcade.isPaused = true;
		} else {
			pauseGameplay = false;
			this.game.physics.arcade.isPaused = false;
		}
		// game logic
		var self = this;
		if (!pauseGameplay) {
			// manage collisions first ALWAYS!!
			// player colliders
			this.game.physics.arcade.collide(this.player.obj, this.colliders.ground);
			this.game.physics.arcade.collide(this.player.obj, this.colliders.pipes);
			this.game.physics.arcade.collide(this.player.obj, this.colliders.pole);
			this.game.physics.arcade.collide(this.player.obj, this.colliders.coinBlocks, function(player, coinBlock) {self.playerCoinBlockCollision(player, coinBlock, self);});
			this.game.physics.arcade.collide(this.player.obj, this.colliders.mushroomBlocks, function(player, mushroomBlock) {self.playerMushroomBlockCollision(player, mushroomBlock, self);});
			this.game.physics.arcade.collide(this.player.obj, this.colliders.blocks, function(player, block) {self.playerBlockCollision(player, block, self);});

			// items colliders
			this.game.physics.arcade.collide(this.items, this.colliders.ground, function(item, ground) {self.itemPlatformCollisions(item, ground, self)});
			this.game.physics.arcade.collide(this.items, this.colliders.pipes, function(item, pipe) {self.itemPlatformCollisions(item, pipe, self)});
			this.game.physics.arcade.collide(this.items, this.colliders.coinBlocks, function(item, coinBlock) {self.itemPlatformCollisions(item, coinBlock, self)});
			this.game.physics.arcade.collide(this.items, this.colliders.mushroomBlocks, function(item, mushroomBlock) {self.itemPlatformCollisions(item, mushroomBlock, self)});
			this.game.physics.arcade.collide(this.items, this.colliders.blocks, function(item, block) {self.itemPlatformCollisions(item, block, self)});
			
			// enemies colliders
			this.game.physics.arcade.collide(this.enemies, this.colliders.ground, function(enemy, pipe) {self.enemyPlatformCollisions(enemy, pipe, self)});
			this.game.physics.arcade.collide(this.enemies, this.colliders.pipes, function(enemy, pipe) {self.enemyPlatformCollisions(enemy, pipe, self)});
			this.game.physics.arcade.collide(this.enemies, this.colliders.coinBlocks, function(enemy, coinBlock) {self.enemyPlatformCollisions(enemy, coinBlock, self)});
			this.game.physics.arcade.collide(this.enemies, this.colliders.mushroomBlocks, function(enemy, mushRoomBlock) {self.enemyPlatformCollisions(enemy, mushRoomBlock, self)});
			this.game.physics.arcade.collide(this.enemies, this.colliders.blocks, function(enemy, block) {self.enemyPlatformCollisions(enemy, block, self)});
			this.game.physics.arcade.collide(this.enemies, this.enemies, function(enemy1, enemy2) {self.enemyEnemyCollisions(enemy1, enemy2, self)});
			if (!this.player.damageTransition) {
				this.game.physics.arcade.collide(this.player.obj, this.enemies, function(player, enemy) {self.playerEnemyCollisions(player, enemy, self);});
			} else {
				this.game.physics.arcade.overlap(this.player.obj, this.enemies, function(player, enemy) {self.playerEnemyCollisions(player, enemy, self);});
			}
			
			// this.game.physics.arcade.overlap(this.player.obj, this.coins, function(player, coin) {self.coinsCollisions(player, coin, self);});

			this.game.physics.arcade.collide(this.player.obj, this.items, function(player, item) {self.playerItemsCollisions(player, item, self)});
			
			// manage other logic
			this.playerController();
			this.enemiesLogic();
			this.itemsLogic();
			
			if (this.timeCount <= 0) {
				// this.playerDie();
				// this.sounds.hit.play();
			}
		}
		
		this.updateUI();
	},
	
	// init game
	initGameObjets() {
		
		// init player
		this.initPlayer();
		
		// set world gravity
		this.game.physics.arcade.gravity.y = 600;
		
		// init items layer (so items can raise "inside" blocks)
		this.items = this.add.group();
		
		// init other objects
		// this.initGameWorldItems();

		this.initTiledPlatforms();
		this.initGameWorldEnemies();
	},
	initTiledPlatforms() {
		this.map = this.game.add.tilemap('LEVEL1x1xObjFix', 32, 32, 212, 12);

		// create generic layers
		this.colliders.blocks = this.add.physicsGroup();
		this.colliders.blocks.enableBody = true;
		this.colliders.coinBlocks = this.add.physicsGroup();
		this.colliders.coinBlocks.enableBody = true;
		this.colliders.mushroomBlocks = this.add.physicsGroup();
		this.colliders.mushroomBlocks.enableBody = true;
    
    // draw map
    // tileset name fom json doc and image name from asset list cache
    this.map.addTilesetImage("block_32x32","block_32_32");

    this.colliders.pipes = this.map.createLayer("Pipes");
    this.colliders.pipes.tint = 0x00FF00;
    
    this.colliders.clouds = this.map.createLayer("Clouds");
    
    this.colliders.pole = this.map.createLayer("Pole");

    this.colliders.ground = this.map.createLayer('Ground');
    this.colliders.ground.tint = 0xec4707;

    this.map.setCollision(1, true, 'Ground');
    this.map.setCollision(1, true, 'Pipes');
    this.map.setCollision(1, true, 'Pole');
    
    this.map.createFromObjects('Blocks', 1, 'block_32x32', 0, true, false, this.colliders.blocks);
    this.map.createFromObjects('Coin-Blocks', 1, 'block_32x32', 0, true, false, this.colliders.coinBlocks);
    this.map.createFromObjects('Mushroom-Blocks', 1, 'block_32x32', 0, true, false, this.colliders.mushroomBlocks);
    
    this.colliders.blocks.setAll('body.allowGravity', false);
		this.colliders.blocks.setAll('body.immovable', true);
		this.colliders.blocks.setAll('tint', 0x886d03);

		this.colliders.coinBlocks.setAll('body.allowGravity', false);
		this.colliders.coinBlocks.setAll('body.immovable', true);
		this.colliders.coinBlocks.setAll('tint', 0xf3eb04);
		// this.colliders.coinBlocks.setAll('data.status', 'new');
	
		this.colliders.mushroomBlocks.setAll('body.allowGravity', false);
		this.colliders.mushroomBlocks.setAll('body.immovable', true);
		this.colliders.mushroomBlocks.setAll('tint', 0xf3eb04);
		// this.colliders.mushroomBlocks.setAll('state', 'new');
		
		// set attributes mannualy
		// looks like the setAll will not work with new attributes
		this.colliders.coinBlocks.forEach(function (block) {
			block.status = 'new';
		});
		this.colliders.mushroomBlocks.forEach(function (block) {
			block.status = 'new';
		});
	},
	initPlayer() {
		// init player
		this.player.obj = this.game.add.sprite(100, 260, 'block_32x32');
		this.player.obj.tint = 0x0000ff;
		this.player.status = 'simple';
		this.player.state = 'idle';
		
		// enable player physics
		this.game.physics.arcade.enable(this.player.obj);
		this.player.obj.enableBody = true;
		
		// set player collider sizes
		this.player.obj.body.setSize(24, 32, 4, 0);
		
		// set player from falling off screen
		this.player.obj.body.collideWorldBounds = true;
	},
	initGameWorldEnemies() {
		// add enemies
		this.enemies = this.add.physicsGroup();
		this.enemies.enableBody = true;

		this.map.createFromObjects('Enemies', 1, 'block_32x32', 0, true, false, this.enemies);

		this.enemies.forEach(function(enemy) {
			enemy.directionString = 'left';
			enemy.isActive = false;
			switch (enemy.enemyClass) {
				case 'goomba':
					enemy.tint = 0xca0909;
					break;
					
				case 'turtle':
					enemy.tint = 0x348007;
					enemy.state = 'out';
					enemy.directionString = 'right';
					break;
			}
		});
		
		window.console.log('Enemies: ', this.enemies);
		
	},
	initGameWorldItems() {
		this.coins = this.add.physicsGroup();
		this.coins.enableBody = true;
		
		var coin = this.coins.create(100, 300, 'coin');
		
		this.coins.setAll('body.allowGravity', false);
		this.coins.setAll('body.immovable', true);
	},
	initSounds() {
		this.sounds.coin = this.game.add.audio('coin');
		this.sounds.smash = this.game.add.audio('confirm');
		this.sounds.hit = this.game.add.audio('error');
		this.sounds.mushrom = this.game.add.audio('loadsave');
	},
	startGame() {
	  this.gameState = 'playing';
	  
	  // game music
	  this.bgMusic = this.game.add.audio('blue_beat');
    this.bgMusic.volume = 0.2;
    this.bgMusic.loop = true;
    this.bgMusic.play();
    
    var self = this;
    self.game.time.events.loop(Phaser.Timer.SECOND, function() {
    	if (!(self.player.status === 'going_super'
				|| self.player.status === 'going_simple'
				|| self.player.status === 'died'))
			self.timeCount -= 1;
		}, self);
	},
	onKeyDown(e) {
		switch(e.keyCode){
			// left
			case 37:
				// this.movePlayer('left');
			break;
			default:
				// this.movePlayer('default');
			break;
		}
	},
	addUIElements() {
		// set text label style
		var style = {
			font: '16px Arial',
			fill: '#FFFFFF',
			align: 'center',
			stroke: '#000000',
			strokeThickness: 2,
		};
		
		// add labels/texts
		this.ui.coinsLabel = this.game.add.text(5, 5, 'Coins:\n' + this.coinsCount, style);
		this.ui.coinsLabel.fixedToCamera = true;
		this.ui.scoreLabel = this.game.add.text(150, 5, 'Score:\n' + this.scoreCount, style);
		this.ui.scoreLabel.fixedToCamera = true;
		this.ui.livesLabel = this.game.add.text(300, 5, 'Lives:\n' + this.livesCount, style);
		this.ui.livesLabel.fixedToCamera = true;
		this.ui.timeLabel = this.game.add.text(450, 5, 'Time Left:\n' + this.timeCount, style);
		this.ui.timeLabel.fixedToCamera = true;
	},
	updateUI() {
		this.ui.coinsLabel.setText('Coins:\n' + this.coinsCount);
		this.ui.scoreLabel.setText('Score:\n' + this.scoreCount);
		this.ui.livesLabel.setText('Lives:\n' + this.livesCount);
		this.ui.timeLabel.setText('Time Left:\n' + this.timeCount);
	},
	playerController() {
		if (this.buttons.cursors.left.isDown) {
			this.movePlayer('left');
		} else if (this.buttons.cursors.right.isDown) {
			this.movePlayer('right');
		} else {
			this.movePlayer('idle');
		}
		
		// if button down is pressed
		// and player is touching ground or touching another enemy
		// and fail safe jumptimer is lesser than delta time
		if (this.buttons.jumpButton.isDown && (this.player.obj.body.onFloor()
		|| this.player.obj.body.touching.down) && this.game.time.now > this.jumpTimer) {
				this.jumpTimer = this.game.time.now + 350;
        this.movePlayer('jump');
    }
	},
	
	// movement ia
	enemiesLogic() {
		var self = this;
		this.enemies.forEach(function(enemy) {
			if (enemy.inCamera) {
				enemy.isActive = true;
			}
			if (enemy.isActive) {
				switch (enemy.enemyClass) {
					case 'goomba':
						if (enemy.directionString === 'left') {
							enemy.body.velocity.x = -100;
						} else if (enemy.directionString === 'right'){
							enemy.body.velocity.x = 100;
						}
						break;
						
					case 'turtle':
						if (enemy.state === 'curled_moving') {
							if (enemy.directionString === 'left') {
								enemy.body.velocity.x = -300;
							} else if (enemy.directionString === 'right') {
								enemy.body.velocity.x = 300;
							}
						} else if (enemy.state === 'out') {
							if (enemy.directionString === 'left') {
								enemy.body.velocity.x = -100;
							} else if (enemy.directionString === 'right') {
								enemy.body.velocity.x = 100;
							}
						} else if (enemy.state === 'curled_idle') {
							enemy.body.velocity.x = 0;
						}
					break;
				}
			} else {
				enemy.body.velocity.x = 0;
			}
			
		});
	},
	itemsLogic() {
		this.items.forEach(function(item) {
			if (item.state === 'moving') {
				if (item.directionString === 'left') {
					item.body.velocity.x = -150;
				} else if (item.directionString === 'right') {
					item.body.velocity.x = 150;
				} else {
					item.body.velocity.x = 0;
				}
			}
		});
	},
	
	movePlayer(direction) {
		if(this.gameState === 'playing'){
			if (direction === 'right') {
				this.player.obj.body.velocity.x = 250;
				this.player.directionString = 'right';
			} else if (direction === 'left') {
				this.player.obj.body.velocity.x = -250;
				this.player.directionString = 'left';
			} else if (direction === 'idle') {
				this.player.obj.body.velocity.x = 0;
			} else if (direction === 'jump') {
				this.player.obj.body.velocity.y = -400;
			}
		}
	},
	// collisions
	playerBlockCollision(player, block, self) {
		if (block.body.touching.down && player.body.touching.up) {
			block.destroy();
		}
	},
	playerCoinBlockCollision(player, coinBlock, self) {
		if (coinBlock.body.touching.down && self.player.obj.body.touching.up) {
			if (coinBlock.status === 'new') {
				coinBlock.status = 'used';
				coinBlock.tint = 0x612c04;
				self.coinsCount += 1;
				self.sounds.coin.play();
			}
		}
	},
	playerMushroomBlockCollision(player, mushroomBlock, self) {
		if (mushroomBlock.body.touching.down && self.player.obj.body.touching.up) {
			if (mushroomBlock.status === 'new') {
				mushroomBlock.status = 'used';
				mushroomBlock.tint = 0x612c04;
				self.sounds.mushrom.play();
				self.createItem(mushroomBlock.x, mushroomBlock.y, 'mushrom', self.player.directionString);
			}
		}
	},
	coinsCollisions(player, coin, self) {
		self.coinsCount += 1;
		self.sounds.coin.play();
		coin.destroy();
	},
	playerEnemyCollisions(player, enemy, self) {
		switch (enemy.enemyClass) {
				case 'goomba':
					if (enemy.body.touching.up && player.body.touching.down) {
						player.body.velocity.y -= 300;
						enemy.destroy();
						self.sounds.smash.play();
						self.scoreCount += 100;
					} else if (((enemy.body.touching.left && player.body.touching.right)
					|| (enemy.body.touching.right && player.body.touching.left) || (enemy.body.touching.down && player.body.touching.up))
					&& !self.player.damageTransition) {
						if (self.player.status === 'super' && self.player.damageTransition === false) {
							self.turnPlayer('simple');
							self.sounds.hit.play();
						} else if (self.player.status === 'simple' && self.player.damageTransition === false) {
							self.livesCount -= 1;
							self.playerDie();
						self.sounds.hit.play();
						}
					}
				break;
					
				case 'turtle':
					if (enemy.body.touching.up && player.body.touching.down) {
						player.body.velocity.y -= 300;
						if (enemy.state === 'out') {
							enemy.tint = 0x53ce0b;
							enemy.state = 'curled_idle';
							self.sounds.smash.play();
							self.scoreCount += 100;
						} else if (enemy.state === 'curled_idle') {
							enemy.state = 'curled_moving';
							if (player.x <= enemy.x) {
								enemy.directionString = 'right';
							} else if (player.x > enemy.x) {
								enemy.directionString = 'left';
							}
							self.sounds.smash.play();
							self.scoreCount += 100;
						} else if (enemy.state === 'curled_moving') {
							enemy.state = 'curled_idle';
							self.sounds.smash.play();
							self.scoreCount += 100;
						}
					} else if (((enemy.body.touching.left && player.body.touching.right)
					|| (enemy.body.touching.right && player.body.touching.left))
					&& !self.player.damageTransition) {
						if (enemy.state === 'curled_idle') {
							enemy.state = 'curled_moving';
							if (enemy.body.touching.left) {
								enemy.directionString = 'right';
							} else if (enemy.body.touching.right) {
								enemy.directionString = 'left';
							}
							self.sounds.smash.play();
							self.scoreCount += 100;
						} else if (enemy.state === 'curled_moving' || enemy.state === 'out') {
							if (self.player.status === 'super') {
								self.turnPlayer('simple');
								self.sounds.hit.play();
							} else if (self.player.status === 'simple') {
								self.livesCount -= 1;
								self.playerDie();
								self.sounds.hit.play();
							}
						}
					}
					break;
				
				default:
					// code
			}
	},
	enemyPlatformCollisions(enemy, platform, self) {
		if (enemy.body.blocked.left) {
			enemy.directionString = 'right';
		} else if (enemy.body.blocked.right) {
			enemy.directionString = 'left';
		}
	},
	enemyEnemyCollisions(enemy1, enemy2, self) {
		if (enemy1.enemyClass === 'turtle' && enemy1.state === 'curled_moving') {
			enemy2.destroy();
			return true;
		} else if (enemy2.enemyClass === 'turtle' && enemy2.state === 'curled_moving') {
			enemy1.destroy();
			return true;
		}
		
		if (enemy1.body.touching.left) {
			enemy1.directionString = 'right';
		} else if (enemy1.body.touching.right) {
			enemy1.directionString = 'left';
		}
		
		if (enemy2.body.touching.left) {
			enemy2.directionString = 'right';
		} else if (enemy2.body.touching.right) {
			enemy2.directionString = 'left';
		}
	},
	playerItemsCollisions(player, item, self) {
		if (item.type === 'mushrom') {
			item.destroy();
			self.sounds.coin.play();
			self.turnPlayer('super');
		}
		
		if (item.type === 'mushrom_1up') {
			item.destroy();
			self.sounds.coin.play();
			self.livesCount += 1;
		}
	},
	itemPlatformCollisions(item, platform, self) {
		if (item.body.blocked.left === true) {
			window.console.log('item: left');
			item.directionString = 'right';
		} else if (item.body.blocked.right === true) {
			window.console.log('item: right');
			item.directionString = 'left';
		}
	},
	
	// iteam creation
	createItem(x, y, itemName, direction) {
		
		if (itemName === 'mushrom') {
			var mushroom = this.items.create(x, y, 'block_32x32');
			mushroom.type = itemName;
			mushroom.tint = 0x928844;
			mushroom.state = 'rising';
			window.console.log('player direction: ', direction);
			mushroom.directionString = direction === 'left' ? 'right' : 'left';
			
			var tween = this.game.add.tween(mushroom).to({ y: (y-32)}, 1000);
			var self = this;
			tween.onComplete.add(function() {
				self.game.physics.arcade.enable(mushroom);
				mushroom.state = 'moving';
				mushroom.body.setSize(24, 32, 4, 0);
				mushroom.enableBody = true;
			}, this);
			tween.start();
		}
		
		if (itemName === 'mushrom_1up') {
			var mushroom = this.items.create(x, y, 'block_32x32');
			mushroom.type = itemName;
			mushroom.tint = 0x19882c;
			mushroom.state = 'rising';
			mushroom.directionString = direction === 'left' ? direction : 'right';
			mushroom.enableBody = false;
			
			var tween = this.game.add.tween(mushroom).to({ y: (y-32)}, 1000);
			var self = this;
			tween.onComplete.add(function() {
				self.game.physics.arcade.enable(mushroom);
				mushroom.state = 'moving';
				mushroom.body.setSize(24, 32, 4, 0);
				mushroom.enableBody = true;
			}, this);
			tween.start();
		}
		
		
	},
	
	// player gameover
	playerDie() {
		this.player.status = 'died';
		var playerC = this.player.obj;
		var tween = this.game.add.tween(this.player.obj).to({y: [(playerC.y - 32), (playerC.y + 64)]}, 1000);
		tween.start();
	},
	// transform player
	turnPlayer(status) {
		var self = this;
		self.player.status = 'going_' + status;
		if (status === 'super') {
			self.player.obj.loadTexture('block_32x64');
			self.player.obj.body.setSize(24, 64, 4, 0);
			self.player.obj.y -= 33;
		} else if (status === 'simple') {
			self.player.obj.loadTexture('block_32x32');
			self.player.obj.body.setSize(24, 32, 4, 0);
			self.player.obj.y += 32;
			self.player.damageTransition = true;
		}

		var tween = this.game.add.tween(self.player.obj).to({alpha: [0.5, 1, 0.5, 1, 0.5, 1]}, 1000);
		
		if (status === 'simple') {
			tween.onComplete.add(function() {
				var tween2 = self.game.add.tween(self.player.obj).to({alpha: [0.5, 1, 0.5, 1, 0.5, 1]}, 1500);
				tween2.onComplete.add(function() {
					self.player.damageTransition = false;
				});
				tween2.start();
			}, this);
		}
		
		tween.start();

		this.game.time.events.repeat(Phaser.Timer.SECOND, 1, function() {
			this.player.status = status;
		}, this);
	},
	render() {
		// this.game.debug.body(this.player.obj);
		// this.game.debug.body(this.plaforms);
		// this.game.debug.text( "This is debug text", 100, 380 );
		// this.game.debug.bodyInfo(this.colliders.ground, 32, 100);
	},
};
