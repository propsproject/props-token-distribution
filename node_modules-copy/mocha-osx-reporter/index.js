/**
 * Module dependencies.
 */

var Base = require('mocha').reporters.Base, util = require('util'), notify = require('osx-notifier');

/**
 * Expose `OSXReporter`.
 */

exports = module.exports = OSXReporter;

/**
 * Initialize a new `OSXReporter` test reporter.
 *
 * @param {Runner} runner
 * @api public
 */
function OSXReporter (runner) {
  Base.call(this, runner);

  var self = this;

  runner.on('end', function () {
    var title, message, stats = self.stats, type = stats.failures ? 'fail' : 'pass';
    title = util.format('%d passed, %d failed, %d pending', stats.passes, stats.failures, stats.pending);
    message = util.format('Duration: %dms, Tests: %d', stats.duration, stats.passes + stats.failures + stats.pending);
    notify({ type: type, title: 'Test results', subtitle: title, message: message, group: 'mocha' });
  });
}

OSXReporter.prototype.__proto__ = Base.prototype;

if (process.platform !== 'darwin') {
  // overwrite reporter with void function for non-OSX
  exports = module.exports = OSXReporter = function (runner) {}
}
