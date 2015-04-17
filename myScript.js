(function() {
    'use strict';
    
    var file;
    var initialization;
    var ini;
    
    //Create Component
    videojs.containerDiv = videojs.Component.extend({ 
        init: function(player, options) {
            videojs.Component.call(this, player, options);
        }
    });
    
    // default options
    videojs.containerDiv.prototype.options_ = {
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
    
    
    //Create New Component
    videojs.mpegDash = videojs.Component.extend({ 
        init: function(player, options) {
            videojs.Component.call(this, player, options);
        }
    });
    
    videojs.mpegDash.prototype.options_ = {};
    
    videojs.mpegDash.prototype.getSourceURL = function() {
        var getURL = document.getElementsByTagName('source');
        return getURL[0].src;
    };
    
    //get mpd file and parses it
    videojs.mpegDash.prototype.getData = function(ms_, url) {
        
        if(url !== "") {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.responseType = 'text';
            xhr.send();
            
            xhr.onreadystatechange = function() {
                if(xhr.readyState == xhr.DONE) {
                    var tempoutput = xhr.response;
                    var parser = new DOMParser();
                    
                    var xmlData = parser.parseFromString(tempoutput, "text/xml", 0);
                    console.log("parsing mpd file");
                    /*
                    // Get and display the parameters of the .mpd file   
                    try {
                        file = xmlData.querySelectorAll("BaseURL")[0].textContent.toString();
                        
                        ini = xmlData.querySelectorAll("Initialization");
                        initialization = ini[0].getAttribute("range");
                        console.log(initialization);
                    } catch(e) {
                        console.log('error');
                        return;
                    }
                    */
                    videojs.mpegDash.prototype.getFileTypes(xmlData);
                    videojs.mpegDash.prototype.showTypes(file);
                    //this.showTypes();
                    //setupVideo(); // Set up video object, buffers, etc 
                    //console.log(videojs.mpegDash.prototype);
                    //clearVars(); // Initialize a few variables on reload
                }
            }
            
        }
    };
    
    videojs.mpegDash.prototype.getFileTypes = function(data) {
        var file;
        try {
            file = data.querySelectorAll("BaseURL")[0].textContent.toString();
            
            ini = data.querySelectorAll("Initialization");
            initialization = ini[0].getAttribute("range");
            console.log(initialization);
        } catch(e) {
        
        }
    };
    
    videojs.mpegDash.prototype.showTypes = function() {

    };

    // create mediaSource and initialize video.
    videojs.mpegDash.prototype.setupVideo = function(ms) {
        var url = URL.createObjectURL(ms);
        this.player_.pause();
        videojs.src = url;
        
        ms.addEventListener('sourceopen', function(e) {
            try {
                var videoSource = ms.addSourceBuffer('video/mp4');
                this.initVideo(initialization, file);
            } catch (e) {
                console.log('Exception calling addSourceBuffer for video', e);
                return;
            }
        }, false);
        
    };
    
    
    videojs.mpegDash.prototype.initVideo = function(ms, url) {
    
        var xhr = new XMLHttpRequest();
        if(url) {
            xhr.open('GET', url);
            //xhr.setRequestHeader('Range', 'bytes=' +  range);
            //segCheck = (timeToDownload(range) * .8).toFixed(3);
            xhr.responseType = 'arraybuffer';
            xhr.send();
            
            try {
                xhr.addEventListener("readystatechange", function() {
                    if(xhr.readyState == xhr.DONE) {
                        console.log('not error');
                        try {
                            videoSource.appendBuffer(new Unit8Array(xhr.response));
                        } catch(e) {
                            console.log('error');
                        }
                        
                    }
                    
                }, false);
            } catch(e) {
                console.log('b');   
            }
        } else {
            return
        }
    };
    
    //Plugin function
    var pluginFn = function(options) {
        
        var videoSource;
        var initialization;
        
        var myComponent =  new videojs.containerDiv(this, options);
        
        //Get screen sizes
        var getWidth = this.width(this.offsetWidth, false);
        var getHeight = this.height(this.offsetHeight, false);
         
        this.player_.dimensions(myComponent.getNewWidth(this.options), myComponent.getNewHeight(this.options));
        
        if (options.contentAds != null) {
            var c = false;

            this.on('timeupdate', function() {
                var getCTime = Math.floor(this.cache_.currentTime);
                if (getCTime == options.onTime && c == false) {

                    var myNewDiv = this.addChild(myComponent);
                    myNewDiv.contentEl_.innerHTML = options.contentAds;

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

                if (getCTime == options.offTime && c == true) {
                    this.removeChild(myComponent);
                    c = false;
                }
            });
        }
        
        // Get and read MPD file
        var mpd = new videojs.mpegDash(this, options);
        
        this.on('play', function() {
            console.log('play');
        });
        
        this.on('pause', function() {
            console.log(mpd.getSourceURL());            
        });
        
        //console.log(mpd.getSourceURL());
        
        
        
        // create MediaSource
        var ms = new (window.MediaSource || window.WebKitMediaSource)();
        
        //console.log(mpd.setupVideo(ms));
        mpd.setupVideo(ms);
        
        //mpd.initVideo(ms, mpd.getSourceURL());
       
        mpd.getData(ms, mpd.getSourceURL());
    };
    
    videojs.plugin( 'myPlugin', pluginFn );

})();