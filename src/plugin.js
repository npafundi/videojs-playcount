import videojs from 'video.js';

// Default options for the plugin.
const defaults = {};

/**
 * A video.js plugin to handle basic play counting for videos. By default, a
 * `played` event will be triggered on the player if the video has played for a
 * cumulative 10% of its total video length.
 *
 * Options
 *  playTimer:  Number of seconds necessary for a view to be considered a play.
 *              Note that this takes precedence over `playTimerPercent`. If the
 *              given video is shorter than `playTimer`, no plays will be
 *              counted.
 *  playTimerPercent:  Percentage (as a decimal between 0 and 1) of a video
 *                     necessary for a view to be considered a play. Note that
 *                     the `playTimer` option takes precedence.
 *
 * Limitations
 * This is only intended for basic play counting. Anyone with familiarity with
 * JavaScript and a browser console could adjust values to artificially inflate
 * the play count.
 */
const playcount = function(options) {
  this.ready(function() {
    options = options || {};
    this.on('play', play);
    this.on('pause', pause);
  });

  var playtime = 0;
  var neededPlaytime, played, timer;

  function play() {
    var player = this;

    calculateNeededPlaytime(this.duration());

    // If the video has been restarted at 0 and was already played, reset the
    // played flag to allow multiple plays
    if (played && this.currentTime() === 0) {
      resetInterval();
      played = false;
      playtime = 0;
    }

    // If the video hasn't completed a play (and no timer is running), set up a
    // timer to track the play time.
    if (!timer && !played) {
      // Round everything to 500ms. Every time this interval ticks, add .5s to
      // the total counted play time. Once we hit the needed play time for a
      // play, trigger a 'played' event.
      timer = setInterval(function() {
        playtime += 0.5;
        if (playtime >= neededPlaytime) {
          played = true;
          player.trigger('played');
          resetInterval();
        }
      }, 500);
    }
  }

  // On pause, reset the current timer
  function pause() {
    if (timer) resetInterval(timer);
  }

  // Clear and nullify the timer
  function resetInterval() {
    clearInterval(timer);
    timer = null;
  }

  // Calculate the needed playtime based on any provided options.
  function calculateNeededPlaytime(duration) {
    // TODO: Move 0.1 to defaults for playTimerPercent and merge defaults with options
    var percent = options.playTimerPercent || 0.1;
    neededPlaytime = neededPlaytime || options.playTimer || (duration * percent);
  }
};

// Register the plugin with video.js.
videojs.plugin('playcount', playcount);

export default playcount;
