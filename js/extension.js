(function() {
    class Browser extends window.Extension {
        constructor() {
            super('browser');
            //console.log("Adding Browser to menu");
            this.addMenuEntry('Browser');


			window.extension_browser_kiosk = false;
            this.kiosk = false;
            if (document.getElementById('virtualKeyboardChromeExtension') != null) {
                document.body.classList.add('kiosk');
                this.kiosk = true;
				window.extension_browser_kiosk = true;
            }
			/*
			document.onmousemove = function(event)
			{
				console.log("mouse moved");
			 //cursor_x = event.pageX;
			 //cursor_y = event.pageY;
			}
			*/

            //console.log(window.API);

            this.debug = false;
            this.content = '';

            // Fullscreen
            this.fullscreen_delay = 60000;
			window.extension_browser_fullscreen_delay = 60;
			this.fullscreen_interval = null;
            this.previous_last_activity_time = 0;
			this.last_activity_time = new Date().getTime();

			window.extension_browser_history_length = 10;
			window.extension_browser_restore_tabs = false;
			window.extension_browser_restoring_tabs = false;
			window.extension_browser_slideshow = false;
			this.slideshow = false;
			this.last_slide_change_time = 0;
			
			window.extension_browser_recent_urls = [];
			
			window.extension_browser_search_url = localStorage.getItem("extension_browser_search_url");
			if(window.extension_browser_search_url == null){
				window.extension_browser_search_url = 'https://swisscows.com/en/web?query=';
				localStorage.setItem("extension_browser_search_url",window.extension_browser_search_url);
			}
			
			window.document.addEventListener('extension_browser_iframe_event', handleEvent, false)
			function handleEvent(e) {
				console.log("extension_browser_iframe_event: ", e.detail); // outputs: {foo: 'bar'}
			}
			/*
			window.addEventListener(
			  "message",
			  (event) => {
				  
				  if(event.data.new_url){
					  console.log("event.data.new_url: ", event.data.new_url);
				  }
				  
				  console.log("message event: ", event);
				  console.log("message event.origin: ", event.origin);
			    //if (event.origin !== "http://example.org:8080") return;

			    // …
			  },
			  false,
			);
			*/
			
			
			
			/*
			window.onerror = () => {
			    console.log("window.onerror");
			};
			*/
			
			
			
			
			
			/*
			if (console.everything === undefined) {
			  console.everything = [];
			  function TS(){
			    return (new Date).toLocaleString("sv", { timeZone: 'UTC' }) + "Z"
			  }
			  window.onerror = function (error, url, line) {
				  console.log("detected an error: ", error, url, line);
			    console.everything.push({
			      type: "exception",
			      timeStamp: TS(),
			      value: { error, url, line }
			    })
			    return false;
			  }
			  window.onunhandledrejection = function (e) {
				  console.log("detected an error: ", e);
			    console.everything.push({
			      type: "promiseRejection",
			      timeStamp: TS(),
			      value: e.reason
			    })
			  } 

			  function hookLogType(logType) {
			    const original= console[logType].bind(console)
			    return function(){
			      console.everything.push({ 
			        type: logType, 
			        timeStamp: TS(), 
			        value: Array.from(arguments) 
			      })
			      original.apply(console, arguments)
			    }
			  }

			  // ['log', 'error', 'warn', 'debug'].forEach(logType=>{
			  ['error', 'warn', 'debug'].forEach(logType=>{
			    console[logType] = hookLogType(logType)
			  })
			}   
			*/



            fetch(`/extensions/${this.id}/views/content.html`)
                .then((res) => res.text())
                .then((text) => {
                    this.content = text;
                    if (document.location.href.endsWith("/browser")) {
                        setTimeout( () => {
							// crude way to wait for border library to load
                        	this.show();
                        },2000);
                    }
                })
                .catch((e) => console.error('Failed to fetch content:', e));


            // Check if screensaver should be active
            window.API.postJson(
                `/extensions/${this.id}/api/ajax`, {
                    'action': 'init'
                }

            ).then((body) => {
				
				
				if(typeof body.debug != 'undefined'){
					this.debug = body.debug;
					
				}
				if(this.debug){
					console.log("browser init response: ", body);
				}
				
				// Search URL
				if(typeof body.search_url != 'undefined'){
					window.extension_browser_search_url = body.search_url;
					localStorage.setItem("extension_browser_search_url",body.search_url);
				}
				
				
				// save history
				if(typeof body.history_length != 'undefined'){
					window.extension_browser_history_length = parseInt(body.history_length);
					if(body.history_length){
						window.extension_browser_recent_urls = localStorage.getItem("extension_browser_recent_urls");
						
						if(window.extension_browser_recent_urls == null){
							window.extension_browser_recent_urls = [];
						}
						else{
							window.extension_browser_recent_urls = JSON.parse(window.extension_browser_recent_urls);
						}
						if(this.debug){
							console.log("browser: window.extension_browser_recent_urls: ",typeof window.extension_browser_recent_urls, window.extension_browser_recent_urls);
						}
					}
					else{
						window.extension_browser_recent_urls = [];
						localStorage.setItem("extension_browser_recent_urls","[]");
					}
				}
				
				
				// restore tabs
				if(typeof body.restore_tabs != 'undefined'){
					if(body.restore_tabs){
						window.extension_browser_restore_tabs = true;
						window.extension_browser_restoring_tabs = true;
						window.extension_browser_open_tabs = localStorage.getItem("extension_browser_open_tabs");
						if(window.extension_browser_open_tabs == null){
							window.extension_browser_open_tabs = [];
						}
						else{
							window.extension_browser_open_tabs = JSON.parse(window.extension_browser_open_tabs);
						}
					}
					else{
						window.extension_browser_open_tabs = [];
						localStorage.setItem("extension_browser_open_tabs","[]");
					}
				}
				if(this.debug){
					console.log("browser: window.extension_browser_restore_tabs: ", window.extension_browser_restore_tabs);
				}
				
				// fullscreen delay
				if(typeof body.fullscreen_delay != 'undefined'){
					window.extension_browser_fullscreen_delay = parseInt(body.fullscreen_delay);
					this.fullscreen_delay = parseInt(body.fullscreen_delay) * 1000;
				}
				
				// slideshow
				if(typeof body.slideshow != 'undefined'){
					window.extension_browser_slideshow = body.slideshow;
					this.slideshow = body.slideshow;
				}
				
				if(this.debug){
					console.log("browser: fullscreen_delay: ", this.fullscreen_delay);
				}
			
				
				
				
				
				/*
                if (typeof body.settings.screensaver_delay != 'undefined') {
                    this.screensaver_delay = body.settings.screensaver_delay;
                    if (body.settings.screensaver_delay > 1) {
                        //console.log('calling start screensaver listeners');
                        this.start_screensaver_listeners();
                    }

                }

                this.debug = body.debug;
                if (this.debug) {
                    console.log("photo frame: init response: ");
                    console.log(body);
                }

                if (typeof body.printer != 'undefined') {
                    this.printer_available = body.printer;
                }
                /*
                if( typeof body.weather_addon_exists != 'undefined'){
                    if(body.weather_addon_exists == true){
                        if(this.weather_addon_exists == false){
                            this.weather_addon_exists = true;
                            this.find_weather_thing();
                        }
                        
                    }
                }
                */
               



            }).catch((e) => {
                console.log("Browser: error in init function: ", e);
            });


        }




        //
        //  SCREENSAVER
        //

        




        // HELPER METHODS

        hasClass(ele, cls) {
            return !!ele.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'));
        }

        addClass(ele, cls) {
            if (!this.hasClass(ele, cls)) ele.className += " " + cls;
        }

        removeClass(ele, cls) {
            if (this.hasClass(ele, cls)) {
                var reg = new RegExp('(\\s|^)' + cls + '(\\s|$)');
                ele.className = ele.className.replace(reg, ' ');
            }
        }

        thing_list_click(the_target) {
            const pre = document.getElementById('extension-browser-response-data');
        }

		
		



        show() {
            //console.log("in photo frame show");

            if (this.content == '') {
                return;
            } else {
                this.view.innerHTML = this.content;
            }

			window.extension_browser_restoring_tabs = true;
			
			this.browser = new Border();
			//console.log("this.browser: ", this.browser);


			if(localStorage.getItem('extension-browser-shown-limitations-hint') == null){
				
				const hint_el = document.getElementById('extension-browser-limitations-hint');
				if(hint_el){
					hint_el.style.display = 'flex';
					hint_el.addEventListener('click', () => {
	                	hint_el.style.display = 'none';
						localStorage.setItem('extension-browser-shown-limitations-hint',1);
	            	});
				}
			}

			const browser_root_el = document.getElementById('extension-browser-border-root');
            
			if(this.fullscreen_delay > 0){
				
				// Mouse
	            browser_root_el.addEventListener('mousemove', () => {
	                this.last_activity_time = new Date().getTime();
	            }, {
	                passive: true
	            });
	            browser_root_el.addEventListener('mousedown', () => {
	                this.last_activity_time = new Date().getTime();
	            }, {
	                passive: true
	            });
	            browser_root_el.addEventListener('click', () => {
	                if (this.screensaver_ignore_click) {
	                    //console.log('ignoring click');
	                } else {
	                    this.last_activity_time = new Date().getTime();
	                }

	            }, {
	                passive: true
	            });

	            // Touch
	            browser_root_el.addEventListener('touchstart', () => {
	                this.last_activity_time = new Date().getTime();
	            }, {
	                passive: true
	            });
	            browser_root_el.addEventListener('touchmove', () => {
	                this.last_activity_time = new Date().getTime();
	            }, {
	                passive: true
	            });

	            // Scroll
	            browser_root_el.addEventListener('scroll', () => {
	                this.last_activity_time = new Date().getTime();
	            }, true);
				
				const search_bar_el = document.getElementById('extension-browser-border-searchbar')
				if(search_bar_el){
					search_bar_el.addEventListener('input', () => {
	                this.last_activity_time = new Date().getTime();
	            }, true);
				}
				

	            this.fullscreen_interval = setInterval(() => {

					const now_stamp = new Date().getTime();
					if (document.activeElement.tagName === "INPUT"){
						this.last_activity_time = now_stamp;
						
					}
					else{
						
		                const delta = now_stamp - this.last_activity_time;
		                //console.log('browser activity delta: ', delta, ' vs ',  this.fullscreen_delay*1000);
		                if (delta > this.fullscreen_delay) {
		                	//console.log("time to switch to fullscreen browser");
							browser_root_el.classList.add('extension-browser-fullscreen');
							
							if(this.slideshow){
								//console.log("this.slideshow is true. this.last_slide_change_time: ", (now_stamp - this.last_slide_change_time) / 1000);
								if(now_stamp - this.last_slide_change_time > this.fullscreen_delay){
									this.last_slide_change_time = now_stamp;
									this.next_slide();
								}
							}
							else{
								//console.log("this.slideshow is false. this.last_slide_change_time: ", (now_stamp - this.last_slide_change_time) / 1000);
							}
		                }
						else{
							//console.log("browser: recent activity");
							browser_root_el.classList.remove('extension-browser-fullscreen');
						}
						
					}
					
				},100);
				
			}
			
        } // end of show function



        hide() {

            try {
               // window.clearInterval(this.photo_interval);
            } catch (e) {
                //console.log("Could not clear photo rotation interval");
                //console.log(e); //logMyErrors(e); // pass exception object to error handler
            }

            try {
                //window.clearInterval(this.wake_interval);
            } catch (e) {
                //console.log("Could not clear keep awake interval");
                //console.log(e); //logMyErrors(e); // pass exception object to error handler
            }
        }



        next_slide(){
			console.log("in next_slide");
        	let tabs_el = document.getElementById('extension-browser-border-tab-container');
			let tabs = tabs_el.querySelectorAll('.extension-browser-border-tab');
			
			if(tabs.length > 1){
				let frames_el = document.getElementById('extension-browser-border-view-container');
				let frame_els = frames_el.querySelectorAll('.extension-browser-border-view');
				console.log("frame_els: ", frame_els);
				var found_it = false;
				for(var i = 0; i < tabs.length; i++){
					console.log(i, tabs[i].classList);
					if(found_it == false){
						if(tabs[i].classList.contains('extension-browser-border-current')){
							found_it = true;
							console.log("found current tab");
							if(i + 1 < tabs.length){
								console.log("setting next tab as active");
								tabs[i + 1].classList.add('extension-browser-border-current');
								frame_els[i + 1].classList.add('extension-browser-border-current');
								document.getElementById('extension-browser-border-searchbar').value = tabs[i + 1].dataset.url;
							}
							else{
								console.log("setting first tab as active");
								tabs[0].classList.add('extension-browser-border-current');
								frame_els[0].classList.add('extension-browser-border-current');
								document.getElementById('extension-browser-border-searchbar').value = tabs[0].dataset.url;
							}
						}
						tabs[i].classList.remove("extension-browser-border-current");
						frame_els[i].classList.remove("extension-browser-border-current");
					}
				
				}
			}
			
        }


        //
        //  SHOW LIST
        //


        show_list(file_list) {
            //console.log("Updating photo list")
            //const pre = document.getElementById('extension-browser-response-data');
        }



        delete_file(filename) {
            //console.log("Deleting file:" + filename);

            //const pre = document.getElementById('extension-browser-response-data');
            /*
			const photo_list = document.getElementById('extension-browser-photo-list');

            window.API.postJson(
                `/extensions/${this.id}/api/delete`, {
                    'action': 'delete',
                    'filename': filename
                }

            ).then((body) => {
                //console.log(body);
                this.show_list(body['data']);

            }).catch((e) => {
                console.log("Browser: error in delete response: ", e);
                alert("Could not delete file - connection error?");
            });
			*/

        }


        




        

		/*
        find_weather_thing() {
            //console.log("in get_weather_thing");
            if (this.show_weather) {
                if (this.weather_thing_url == null) {

                    API.getThings().then((things) => {
                        //console.log('things:', things);
                        this.all_things = things;

                        // First try to find the Candle weather addon
                        for (let key in things) {

                            if (things[key].hasOwnProperty('href')) {
                                if (things[key]['href'].indexOf('/things/candle-weather-today') != -1) {
                                    //console.log("found candle weather thing. href: ", things[key]['href'], things[key]);
                                    this.weather_thing_url = things[key]['href'];
                                    //console.log('description: ', things[key]['properties']['description']['value'] );
                                    //console.log('temperature: ', things[key]['properties']['temperature']['value'] );
                                    this.update_weather();
                                    //return;
                                    break;
                                }
                            }

                        }

                        if (this.weather_thing_url == null) {
                            // If the Candle weather addon doesn't exist, try the other one.
                            for (let key in things) {

                                if (things[key].hasOwnProperty('href')) {
                                    if (things[key]['href'].indexOf('/things/weather-') != -1) {
                                        //console.log("found weather thing. href: ", things[key]['href']);
                                        this.weather_thing_url = things[key]['href'];
                                        //console.log('description: ', things[key]['properties']['description']['value'] );
                                        //console.log('temperature: ', things[key]['properties']['temperature']['value'] );
                                        this.update_weather();
                                        break;
                                    }
                                }

                            }
                        }

                    });

                } else {
                    //console.log("weather thing url was already found: ", this.weather_thing_url);
                }

            } else {
                //console.log('show weather is disabled, not finding thing');
            }

        }
		*/

        /*
		update_weather() {
            //console.log("in update_weather");
            if (this.weather_thing_url != null) {
                API.getJson(this.weather_thing_url + '/properties/temperature')
                    .then((prop) => {
                        //console.log("weather temperature property: ", prop);
                        let temperature_el = document.getElementById('extension-browser-weather-temperature');
                        if (temperature_el != null) {
                            document.getElementById('extension-browser-weather-temperature').innerText = prop;
                            //document.getElementById('extension-browser-weather-description').innerText = things[key]['properties']['description']['value'];
                        } else {
                            //console.log('weather temperature element did not exist yet');
                        }
                    }).catch((e) => {
                        console.log("Browser: update_weather: error getting temperature property: ", e);
                    });

                API.getJson(this.weather_thing_url + '/properties/description')
                    .then((prop) => {
                        //console.log("weather description property: ", prop);
                        let description_el = document.getElementById('extension-browser-weather-description');
                        if (description_el != null) {
                            document.getElementById('extension-browser-weather-description').innerText = prop;
                        } else {
                            //console.log('weather description element did not exist yet');
                        }
                    }).catch((e) => {
                        console.log("Browser: update_weather: error getting description property: ", e);
                    });
            } else {
                //console.log('Warning, in update_weather, but no thing url');
            }
        }
		*/


        


    }

    new Browser();

})();