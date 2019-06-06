/* global MainGameContainer */
MainGameContainer.GameLoadingScreen = function (game) {};

MainGameContainer.GameLoadingScreen.prototype = {
  // Game Objects or Groups
  preloadBar: undefined,
  bck: undefined,
  ready: false,
  // Game Assets
  gameAssets: {
    images: [
      { name: 'block_32_32', src: './assets/img/mockups/block_32x32.png', },
    ],
    sounds: [
      { name: 'confirm', src: './assets/sound/confirm.wav' },
      { name: 'error', src: './assets/sound/error.wav' },
      { name: 'loadsave', src: './assets/sound/loadsave.wav' },
      { name: 'coin', src: './assets/sound/coin_1.wav' },
    ],
    music: [
      { name: 'blue_beat', src: './assets/music/blue_beat.mp3' },
      { name: 'happy_adventure', src: './assets/music/happy_adventure.mp3' },
      { name: 'jump_run', src: './assets/music/jump_run.mp3' },
    ],
    spritesheets: [
      { name: 'coin', src: './assets/img/coin.png', w: 16, h: 16},
      { name: 'block_320x32', src: './assets/img/mockups/block_320x32.png', w: 320, h: 32},
      { name: 'block_160x32', src: './assets/img/mockups/block_160x32.png', w: 160, h: 32},
      { name: 'block_32x32', src: './assets/img/mockups/block_32x32.png', w: 32, h: 32},
      { name: 'block_64x160', src: './assets/img/mockups/block_64x160.png', w: 64, h: 160},
      { name: 'block_64x64', src: './assets/img/mockups/block_64x64.png', w: 64, h: 64},
      { name: 'block_64x80', src: './assets/img/mockups/block_64x80.png', w: 64, h: 80},
      { name: 'block_64x80', src: './assets/img/mockups/block_64x80.png', w: 64, h: 240},
      { name: 'block_32x64', src: './assets/img/mockups/block_32x64.png', w: 32, h: 64},
      { name: 'pole_32x32', src: './assets/img/mockups/pole_32x32.png', w: 32, h: 32},
    ],
  },
	preload: function () {

		//Show the load bar
		this.bck = this.add.sprite(this.world.centerX, this.world.centerY, 'preloaderBackground');
		this.bck.anchor.setTo(0.5,0.5);
		this.bck.scale.setTo(1,1);
		this.preloadBar = this.add.sprite(this.world.centerX, this.world.centerY, 'preloaderBar');
		this.preloadBar.anchor.setTo(0,0.5);
		this.preloadBar.scale.setTo(1,1);
		this.preloadBar.x = this.world.centerX - this.preloadBar.width/2;
		
		this.load.setPreloadSprite(this.preloadBar);
		
		//Start loading assets
    
    // load image assets
    var x = 0;
    var imagesn = this.gameAssets.images.length;
    for (x=0; x<imagesn; x++) {
      this.game.load.image(
        this.gameAssets.images[x].name,
        this.gameAssets.images[x].src
      );
    }
    
    // load music assets
    var x = 0;
    var soundsn = this.gameAssets.music.length;
    for (x=0; x<soundsn; x++) {
      this.game.load.audio(
        this.gameAssets.music[x].name,
        this.gameAssets.music[x].src
      );
    }
    
    // load sounds assets
    var x = 0;
    var soundsn = this.gameAssets.sounds.length;
    for (x=0; x<soundsn; x++) {
      this.game.load.audio(
        this.gameAssets.sounds[x].name,
        this.gameAssets.sounds[x].src
      );
    }
    
    // load sprite sheets
    var x = 0;
    var spritesheetsn = this.gameAssets.spritesheets.length;
    for (x=0; x<spritesheetsn; x++) {
      this.load.spritesheet(
        this.gameAssets.spritesheets[x].name,
        this.gameAssets.spritesheets[x].src,
        this.gameAssets.spritesheets[x].w,
        this.gameAssets.spritesheets[x].h,
        this.gameAssets.spritesheets[x].frameMax,
        this.gameAssets.spritesheets[x].m,
        this.gameAssets.spritesheets[x].s,
      );
    }
    
    // load json maps
    this.game.load.tilemap("LEVEL1x1xObjFix", "./assets/maps/smb1-1-obj.json", null, Phaser.Tilemap.TILED_JSON);
	},

	create: function () {
		this.preloadBar.cropEnabled = false;
	},

	update: function () {
		if (this.ready == false)
		{
			this.ready = true;
			this.state.start('GamePlay');
		}
	}

};
