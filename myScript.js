(function() {
    'use strict';
    
    var file;
    var initialization;
    var ms;
    var file;
    var type;
    var codecs;
    var width;
    var height;
    var bandwidth;
    var segments;
    var vidDuration;
    var segDuration;
    var videoSource;
    
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
    
    // get url of videos
    videojs.mpegDash.prototype.getSourceURL = function() {
        var getURL = document.getElementsByTagName('source');
        return getURL[0].src;
    };
    
    //get mpd file
    videojs.mpegDash.prototype.getMPDFile = function() {
        var getMPD = document.getElementsByTagName('video');
        return getMPD[0].getAttribute('file');
    }
    
    //parses from mpd file
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
                    videojs.mpegDash.prototype.getFileTypes(xmlData);
                    videojs.mpegDash.prototype.showTypes(file);
                    //this.showTypes();
                    //setupVideo(); // Set up video object, buffers, etc 
                    //clearVars(); // Initialize a few variables on reload
                }
            }
            
        }
    };
    
    // Get and display the parameters of the .mpd file 
    
    videojs.mpegDash.prototype.getFileTypes = function(data) {
        
        try {
            this.file = data.querySelectorAll("BaseURL")[0].textContent.toString();
            var rep = data.querySelectorAll("Representation");
            this.type = rep[0].getAttribute("mimeType");
            this.codecs = rep[0].getAttribute("codecs");
            this.width = rep[0].getAttribute("width");
            this.height = rep[0].getAttribute("height");
            this.bandwidth = rep[0].getAttribute("bandwidth");
            
            var ini = data.querySelectorAll("Initialization");
            this.initialization = ini[0].getAttribute("range");
            this.segments = ini[0].querySelectorAll("SegmentURL");
            
            var period = data.querySelectorAll("Period");
            var vidTempDuration = period[0].getAttribute("duration");
            //vidDuration = parseDuration(vidTempDuration);
            
            var segList = data.querySelectorAll("SegmentList");
            this.segDuration = segList[0].getAttribute("duration");
            
            console.log(this.segDuration);
            
        } catch(e) {
            console.log('error');
            return;
        }
        
        this.showTypes();
    };
    
    videojs.mpegDash.prototype.showTypes = function() {

    };

    // create mediaSource and initialize video.
    videojs.mpegDash.prototype.setupVideo = function(data) {

        var url = URL.createObjectURL(ms);
        this.player_.pause();
        videojs.src = url;
        //this.initVideo(initialization, file);
        
        
        console.log(videojs.mpegDash.prototype.hasOwnProperty());
        /*
        ms.addEventListener('sourceopen', function(e) {
            try {
                videoSource = ms.addSourceBuffer('video/mp4');
                //this.initVideo(initialization, file);
                console.log(videoSource);
            } catch (e) {
                console.log('Exception calling addSourceBuffer for video', e);
                return;
            }
        }, false);
        */
    };
    
    
    videojs.mpegDash.prototype.initVideo = function(range, url) {
    
        var xhr = new XMLHttpRequest();
        if(url) {
            xhr.open('GET', url);
            //xhr.setRequestHeader('Range', 'bytes=' +  range);
            //segCheck = (timeToDownload(range) * .8).toFixed(3);
            xhr.responseType = 'arraybuffer';
            xhr.send();
            console.log('a');
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
        
        if(window.MediaSource || window.WebKitMediaSource) {
            // create MediaSource
            ms = new (window.MediaSource || window.WebKitMediaSource)();
            mpd.setupVideo(ms);
        } else {
            console.log('mediasource or syntax not supported');
            return;
        }
        
        //console.log();

        //console.log(mpd.setupVideo(ms));
        
        //mpd.initVideo(ms, mpd.getSourceURL());
       
        mpd.getData(ms, mpd.getMPDFile());
    };
    
    videojs.plugin( 'myPlugin', pluginFn );

})();