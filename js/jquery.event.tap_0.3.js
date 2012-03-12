// jquery.event.tap
// 
// 0.3
// 
// Emits a tap event as soon as touchend is heard, or a taphold. This is better than simulated
// click events on touch devices, which wait ~300ms before firing, in case they
// should be interpreted as double clicks.
// 
// TODO: There's a bug when a second tap occurs while a first tap has not yet reached held state.
// All subsequent taps while the first tap is held emit taphold events. Its very puzzling. What's
// odd is that we never enter the touchend function.


// Make jQuery copy touch event properties over to the jQuery event
// object, if they are not already listed.
(function(jQuery, undefined){
	var props = ["radiusX", "radiusY", "rotationAngle", "force", "touches", "targetTouches", "changedTouches"],
	    l = props.length;
	
	while (l--) {
		if (jQuery.event.props.indexOf(props[l]) === -1) {
			jQuery.event.props.push(props[l]);
		}
	}
})(jQuery);


(function(jQuery, undefined){
	var debug = true;
	
	var duration = 480;
	
	var j = 0;
		
	// TouchList.identifiedTouch does not exist in early webkit.
	function identifiedTouch(touchList, id) {
		var i, l;
		
		if (touchList.identifiedTouch) {
			return touchList.identifiedTouch(id);
		}
		
		i = -1;
		l = touchList.length;
		
		while (++i < l) {
			if (touchList[i].identifier === id) {
				return touchList[i];
			}
		}
	}
	
	function touchstart(e) {
		var target = e.target,
		    currentTarget = e.currentTarget,
		    startTime = e.timeStamp;
		
		if (!e.changedTouches) {
			if (debug) { console.log('This event object has no changedTouches array.', e); }
			return;
		}
		
		jQuery.each(e.changedTouches, function(i, startTouch) {
			var startX = startTouch.clientX,
			    startY = startTouch.clientY,
			    timer;

			function bindHandlers() {
				jQuery.event.add(currentTarget, "touchcancel", unbindHandlers);
				jQuery.event.add(currentTarget, "touchcancel", clearTimer);
				jQuery.event.add(currentTarget, "touchend", touchend);
			}

			function unbindHandlers() {
				jQuery.event.remove(currentTarget, "touchcancel", unbindHandlers);
				jQuery.event.remove(currentTarget, "touchcancel", clearTimer);
				jQuery.event.remove(currentTarget, "touchend", touchend);
			}

			function clearTimer() {
				clearTimeout(timer);
			}

			function timeout() {
				var _type = e.type;
				
				clearTimer();
				unbindHandlers();
				
				// Ignore if the touch has moved significantly (ie > 16px)
				if ((Math.pow(startTouch.clientX - startX, 2) + Math.pow(startTouch.clientY - startY, 2)) > 256) { return; }
				
				e.type = "taphold";
				jQuery.event.handle.call(currentTarget, e);
				e.type = _type;
			}

			function touchend(e) {
				var _type = e.type,
				    endTouch = identifiedTouch(e.changedTouches, startTouch.identifier),
				    endX = endTouch.clientX,
				    endY = endTouch.clientY;

				// If the touchend id does not match an id from touchstart, abort.
				if (!endTouch) { return; }
				
				clearTimer();
				unbindHandlers();
				
				// Ignore if the end target is not the same as the start target.
				if (e.target !== target) { return; }
				
				// Ignore if the touch has moved significantly
				if ((Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)) > 256) { return; }
				
				// Double check that the required time has passed. iOS appears to
				// suspend the timer while a page is gestured, causing a tap event
				// to fire at the end of a scroll. By checking the time we can
				// mitigate this.
				if ((e.timeStamp - startTime) > duration) { return; }
				
				e.type = 'tap';
				jQuery.event.handle.call(currentTarget, e);
				e.type = _type;
				
				// Stop simulated mouse events.
				//e.preventDefault();
			}
			
			timer = setTimeout(timeout, duration);
			bindHandlers();
		});
	}

	jQuery.event.special.tap = {
		setup: function setup() {
			jQuery.event.add(this, "touchstart", touchstart);
		},
		
		teardown: function teardown() {
			jQuery.event.remove(this, "touchstart", touchstart);
		}
	};

	// Delegate taphold events to tap events, seeing as that is where
	// they originate.
	jQuery.event.special.taphold = {
		setup: function() {
			jQuery.event.add(this, 'tap', jQuery.noop);
		},
		
		teardown: function() {
			jQuery.event.remove(this, 'tap', jQuery.noop);
		}
	};
})(jQuery);


jQuery(document).ready(function(){
	jQuery('p').on('tap', function(e) {
		console.log('tap', e);
	});
})
.on('mousedown', function(e){
  console.log('[document] mousedown', e);
})
.on('tap', function(e){
  console.log('[document] tap', e);
});