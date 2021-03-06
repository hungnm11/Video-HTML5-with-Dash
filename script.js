(function() {
    'use strict';
    
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
    var maxBandwidth = 8 * 1024 * 1024; // 4Mbps
    var cacheControl_;
    var timeID_;
    
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
                        contentAds: "Hey! I'm here", // Set null to disappear ads
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
    
    videojs.mpegDash.prototype.DASHPlayer = function() {
        console.log(this.getMPDFile());
    };
    
    //parses from mpd file
    videojs.mpegDash.prototype.loadMPD = function(ms_, url) {
        
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
                    videojs.mpegDash.prototype.setupVideo(); // Set up video object, buffers, etc 
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
            
        } catch(e) {
            console.log('error');
            return;
        }
        
        this.showTypes();
        this.fetchSegment();
    };
    
    videojs.mpegDash.prototype.showTypes = function() {
        //console.log(this.file);
    };

    // create mediaSource and initialize video.
    videojs.mpegDash.prototype.setupVideo = function() {

        var url = URL.createObjectURL(ms);
        //this.player_.pause();
        videojs.src = url;
        
        file = this.file;
        initialization = this.initialization;
        this.initVideo(initialization, file);
        //console.log(this);
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
            xhr.setRequestHeader('Range', 'bytes=' +  range);
            //segCheck = (timeToDownload(range) * .8).toFixed(3);
            xhr.responseType = 'arraybuffer';
            xhr.send();
            
            try {
                xhr.addEventListener("readystatechange", function() {
                    if(xhr.readyState == xhr.DONE) {
                        try {
                           // videoSource.appendBuffer(new Unit8Array(xhr.response));
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
    
    
    function bandwidth(initial_bps, weight_f, weight_s) {
        this.identifier = 0;
        this.bps = initial_bps;
        this.weight_f = weight_f;
        this.weight_s = weight_s;
        this.observer = new Array();
        this.observer_num = 0;
    };
    
    bandwidth.prototype.endBitrateMeasurementByID = function(id, lengthInBytes) {
        var end = new Date().getTime();
    }
    
    bandwidth.prototype.addObserver = function(obj_) {
        this.observer[this.observer_num++] = obj_;
    };
    
    
    videojs.mpegDash.prototype.fetchSegment = function() {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', this.getMPDFile, true);
        xhr.setRequestHeader('Cache-Control', cacheControl_);
        if(this.initialization != null) {
            xhr.setRequestHeader('Range', 'bytes=' + this.initialization);
            console.log('DASH JS Client fetching byte range: ' + this.initialization);
        }
        xhr.responseType = 'arraybuffer';
        
        xhr.onload = function(e) {
            var data = new Uint8Array(this.response);
            console.log(data);
        }
        
    };
    
    //Plugin function
    var pluginFn = function(options) {
        
        var timeInSecs;
        var ticker;
        
        
        //Bandwidth
        var myBandwidth = new bandwidth(10000, 1.1, 0.9);
        
        
        
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
        var mpd = new videojs.mpegDash(this, options);
        
        this.on('play', function() {
            console.log('play');
        });
        
        this.on('pause', function() {
            console.log(mpd.getSourceURL());            
        });
        
        // create MediaSource
        if(window.MediaSource || window.WebKitMediaSource) {
            ms = new (window.MediaSource || window.WebKitMediaSource)();
        } else {
            console.log('mediasource or syntax not supported');
            return;
        }
        
        mpd.fetchSegment();

        //console.log(mpd.setupVideo(ms));
        
        //mpd.initVideo(ms, mpd.getSourceURL());
        //mpd.showTypes();
        mpd.loadMPD(ms, mpd.getMPDFile());
        mpd.DASHPlayer();
    };
    
    videojs.plugin( 'myPlugin', pluginFn );

})();