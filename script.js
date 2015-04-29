(function() {
    'use strict';
    
    //Create Component
    videojs.containerDiv = videojs.Component.extend({ 
        init: function(player, options) {
            videojs.Component.call(this, player, options);
        }
    });
    
    // default options
    videojs.containerDiv.prototype.options_ = {
        advertisement: {
                        setTimeStart: 0,  // set number of seconds to show ads
                        contentAds: null, // Set null to disappear ads
                        setAdvertisementTime: 0
                    },
        wideScreen: {
            Width: 640,
            Height: 264
        },
        poster: ''
    }
    
    //Create new element
    videojs.containerDiv.prototype.createEl = function(type, props) {
        
        var newDiv = videojs.createEl('div', {
            className: 'vjs-new-div'
        });
        
        var newDivInside = videojs.createEl('div', {
            className: 'vjs-new-div-inside'
        });        
        
        var newDivClose = videojs.createEl('div', {
            className: 'vjs-btn-close',
            innerHTML: 'x'
        });
        
        var newDivTimer = videojs.createEl('div', {
            className: 'vjs-div-time',
            innerHTML: 'Ads in ' + (this.options_.advertisement.setAdvertisementTime)
        });
        
        this.newDivTimer_ = newDivTimer;
        
        newDiv.appendChild(this.newDivTimer_);
        
        this.newDivClose_ = newDivClose;
        
        newDiv.appendChild(this.newDivClose_);
        
        this.contentEl_ = newDivInside;
        
        newDiv.appendChild(this.contentEl_);
        
        return newDiv;
    };
    
    // get width size
    videojs.containerDiv.prototype.getNewWidth = function(type, props) {
        return this.options_.wideScreen.Width;
    };
    
    // get height size
    videojs.containerDiv.prototype.getNewHeight = function(type, props) {
        return this.options_.wideScreen.Height;
    }
    
    
    //Create extend
    videojs.Dashjs = videojs.Html5.extend({
      init: function(player, options, ready){
        var source, dashContext, dashPlayer;

        source = options.source;
        // need to remove the source so the HTML5 controller
        // doesn't try to use it
        delete options.source;

        // run the init of the HTML5 controller
        videojs.Html5.call(this, player, options, ready);

        dashContext = new Dash.di.DashContext();
        dashPlayer = new MediaPlayer(dashContext);

        dashPlayer.startup();
        dashPlayer.attachView(this.el());

        // dash.js autoplays by default
        if (!options.autoplay) {
          dashPlayer.setAutoPlay(false);
        }

        dashPlayer.attachSource(source.src);
      }
    });

    videojs.Dashjs.isSupported = function(){
      return !!window.MediaSource;
    };

    videojs.Dashjs.canPlaySource = function(srcObj){
      if (srcObj.type === 'application/dash+xml') {
        // TODO: allow codec info and check browser support
        return 'maybe';
      } else {
        return '';
      }
    };

    // add this to the list of available controllers
    videojs.options.techOrder.unshift('dashjs');
    
       
    //Plugin function
    var pluginFn = function(options) {
        
        var timeInSecs;
        var ticker;     
        
        var myComponent =  new videojs.containerDiv(this, options);
        
        //Get screen sizes
        var getWidth = this.width(this.offsetWidth, false);
        var getHeight = this.height(this.offsetHeight, false);
         
        this.player_.dimensions(myComponent.getNewWidth(this.options), myComponent.getNewHeight(this.options));
        
        if (options.advertisement.contentAds != null) {
            var c = false;
            this.on('timeupdate', function() {
                
                var getCTime = Math.floor(this.cache_.currentTime);
                
                if (getCTime == options.advertisement.setTimeStart && c == false) {
                    
                    var myNewDiv = this.addChild(myComponent);
                    myNewDiv.contentEl_.innerHTML = options.advertisement.contentAds;

                    function startTimer(secs){
                        timeInSecs = parseInt(secs - 1);
                        ticker = setInterval(tick,1000);   // every second
                    }

                    function tick() {
                        var secs = timeInSecs;
                        if (secs > 0) {
                            timeInSecs--;
                        } else {
                            clearInterval(ticker); // stop counting at zero
                        }
                        myComponent.newDivTimer_.innerText = 'Ads in ' + secs;
                    }
                    
                    startTimer(options.advertisement.setAdvertisementTime); // starts count down  
                    
                    //Get screen size of ads
                    var getWidthAds = myNewDiv.el_.offsetWidth;
                    var getHeightAds = myNewDiv.el_.offsetHeight;

                    var getSegmentWidth = getWidth - getWidthAds;

                    var randomWidth = Math.floor(1 + Math.random() * (getSegmentWidth - 1));
                    var randomHeight = Math.floor(1 + Math.random() * (getHeight - 1));

                    if (getWidthAds == myComponent.getNewWidth(this.options)) {
                        myNewDiv.el_.style.left = 1 + 'px';
                        myNewDiv.el_.style.top = Math.abs(randomHeight - (getHeightAds - 30)) + 'px';
                    } else {
                        myNewDiv.el_.style.left = Math.abs(randomWidth) + 'px';
                        myNewDiv.el_.style.top = Math.abs(randomHeight - (getHeightAds - 30)) + 'px';
                    }

                    this.one(myNewDiv.newDivClose_,'click', function() {
                        this.removeChild(myComponent);
                    });
                    
                    c = true; 
                }

                if (getCTime == (options.advertisement.setAdvertisementTime + options.advertisement.setTimeStart + 1) && c == true) {
                    this.removeChild(myComponent);
                }
            });
        }
       
        
        // Get and read MPD file
        
        this.on('play', function() {
            console.log('play');
        });
        
        this.on('pause', function() {
            //console.log(mpd.getSourceURL());            
        });

        
    };
    
    videojs.plugin( 'myPlugin', pluginFn );

})();