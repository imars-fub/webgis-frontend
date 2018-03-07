goog.provide('ol.control.Toolbar');

goog.require('goog.dom');
goog.require('ol.animation');
goog.require('ol.control.Control');
goog.require('ol.css');
goog.require('ol.easing');


/**
 * @classdesc
 * A control with 2 buttons, one for zoom in and one for zoom out.
 * This control is one of the default controls of a map. To style this control
 * use css selectors `.ol-zoom-in` and `.ol-zoom-out`.
 *
 * @constructor
 * @extends {ol.control.Control}
 * @param {olx.control.ZoomOptions=} opt_options Zoom options.
 * @api stable
 */
ol.control.Toolbar = function(opt_options) {

  var options = opt_options ? opt_options : {};

  var className = options.className !== undefined ? options.className : 'ol-toolbar';

  var selectBoxLabel = options.selectBoxLabel !== undefined ? options.selectBoxLabel : '';
  var stepBackwardLabel = options.cstepBackwardsLabel !== undefined ? options.cycleLayersLabel : '';

  var selectBoxTipLabel = options.zoomInTipLabel !== undefined ?
      options.zoomInTipLabel : 'select features by bounding box (disabled)';
  var stepBackwardTipLabel = options.zoomOutTipLabel !== undefined ?
      options.zoomOutTipLabel : 'step backward';

  this.loading = goog.dom.createDom('span', {
  'class': 'toolbar-loading fa fa-spinner fa-spin fa-3x fa-fw',
  'hidden': 'hidden'
  });

  this.info = goog.dom.createDom('BUTTON', {
    'class': 'toolbar-selectone fa fa-info',
    'type' : 'button',
    'title': 'get footprint info'
  }, '');

  this.selectSingle = goog.dom.createDom('BUTTON', {
    'class': 'toolbar-selectone fa fa-location-arrow',
    'type' : 'button',
    'title': 'select features by point'
  }, '');

  ol.events.listen(this.selectSingle,
      ol.events.EventType.CLICK, goog.partial(
          ol.control.Toolbar.prototype.handleSelectClick_), this);

  this.selectBox = goog.dom.createDom('BUTTON', {
    'class': 'toolbar-selectbox fa fa-square-o disabled',
    'type' : 'button',
    'disabled': 'disabled',
    'title': selectBoxTipLabel
  }, '');
  this.selectBoxPushed = false;

  ol.events.listen(this.selectBox,
      ol.events.EventType.CLICK, goog.partial(
          ol.control.Toolbar.prototype.handleSelectClick_), this);
  
  this.toggleSelection = goog.dom.createDom('BUTTON', {
    'class': 'toolbar-selectbox fa fa-eye-slash disabled',
    'type' : 'button',
    'disabled': 'disabled',
    'title': 'toggle selection'
  }, '');

  this.clearSelection = goog.dom.createDom('BUTTON', {
    'class': 'toolbar-selectbox fa fa-trash disabled',
    'type' : 'button',
    'disabled': 'disabled',
    'title': 'clear selection'
  }, ''); 

  this.zoomToSelection = goog.dom.createDom('BUTTON', {
    'class': 'toolbar-zoomto fa fa-compress disabled',
    'type' : 'button',
    'disabled': 'disabled',
    'title': 'zoom to selection'
  }, ''); 
  
  this.buildLayers = goog.dom.createDom('BUTTON', {
    'class': 'toolbar-buildlayers fa fa-reorder disabled',
    'type' : 'button',
    'disabled': 'disabled',
    'title': 'create layers from selection'
  }, '');

  this.speedSlider = goog.dom.createDom('INPUT', {
    'class': 'toolbar-cycle-layers speedslider disabled',
    'type': 'range',
    'min': '100',
    'max': '1000',
    'step': '100',
    'disabled': 'disabled'
  }, '');

  this.stepBackward = goog.dom.createDom('BUTTON', {
    'class': 'toolbar-cycle-layers fa fa-step-backward disabled',
    'type' : 'button',
    'disabled': 'disabled',
    'title': stepBackwardTipLabel
  }, '');

  this.play = goog.dom.createDom('BUTTON', {
    'class': 'toolbar-cycle-layers fa fa-play disabled',
    'type' : 'button',
    'disabled': 'disabled',
    'title': 'start cycling layers'
  }, '');
  this.cycleStatus = 'stop';

  this.stop = goog.dom.createDom('BUTTON', {
    'class': 'toolbar-cycle-layers fa fa-stop disabled',
    'type' : 'button',
    'disabled': 'disabled',
    'title': 'stop cycling layers'
  }, '');

  this.stepForward = goog.dom.createDom('BUTTON', {
    'class': 'toolbar-cycle-layers fa fa-step-forward disabled',
    'type' : 'button',
    'disabled': 'disabled',
  }, '');

  this.group1 = goog.dom.createDom('DIV', 'ol-toolbar-group1', this.loading, this.info, this.selectSingle, this.selectBox, this.zoomToSelection, this.toggleSelection, this.clearSelection, this.buildLayers);
  this.group2 = goog.dom.createDom('DIV', 'ol-toolbar-group2', this.stepBackward, this.play, this.stop, this.stepForward);

  ol.events.listen(this.play,
      ol.events.EventType.CLICK, goog.partial(
          ol.control.Toolbar.prototype.handleCycleLayersClick_), this);
          
  ol.events.listen(this.stop,
      ol.events.EventType.CLICK, goog.partial(
          ol.control.Toolbar.prototype.handleStopCycleLayersClick_), this);
  
  ol.events.listen(this.clearSelection,
      ol.events.EventType.CLICK, goog.partial(
          ol.control.Toolbar.prototype.handleClearSelectionClick_), this);

  var cssClasses = className + ' ' + ol.css.CLASS_UNSELECTABLE + ' ' +ol.css.CLASS_CONTROL;
  var element = goog.dom.createDom('DIV', cssClasses, this.group1, this.group2);

  goog.base(this, {
    element: element,
    target: options.target
  });

  /**
   * @type {number}
   * @private
   */
  this.duration_ = options.duration !== undefined ? options.duration : 250;

};
goog.inherits(ol.control.Toolbar, ol.control.Control);

/**
 * @param {number} delta Zoom delta.
 * @param {Event} event The event to handle
 * @private
 */
ol.control.Toolbar.prototype.handleSelectClick_ = function(event) {
  event.preventDefault();
  if (!event.target.classList.contains('pushed')) {
    event.target.classList.add('pushed');
  } else {
    event.target.classList.remove('pushed');
  }
};


/**
 * @param {Event} event The event to handle
 * @private
 */
ol.control.Toolbar.prototype.handleCycleLayersClick_ = function(event) {
  event.preventDefault();
  if (this.cycleStatus=='stop') {
    this.cycleStatus='play';
    this.play.classList.remove('fa-play');
    this.play.classList.add('fa-pause');
    this.play.classList.add('pushed');
    this.stepBackward.classList.add('disabled');
    this.stepForward.classList.add('disabled');
  } else if (this.cycleStatus=='play') {
    this.cycleStatus='pause';
    this.play.classList.add('fa-play');
    this.play.classList.remove('fa-pause');
    this.stepBackward.classList.remove('disabled');
    this.stepForward.classList.remove('disabled');
  } else if (this.cycleStatus=='pause') {
    this.cycleStatus='play';
    this.play.classList.add('fa-pause');
    this.play.classList.remove('fa-play');
    this.stepBackward.classList.add('disabled');
    this.stepForward.classList.add('disabled');
  } else {console.log('error', this.cycleStatus);}
};

/**
 * @param {Event} event The event to handle
 * @private
 */
ol.control.Toolbar.prototype.handleStopCycleLayersClick_ = function(event) {
  event.preventDefault();
  this.cycleStatus='stop';
  this.play.classList.remove('fa-pause');
  this.play.classList.add('fa-play');
  this.stepBackward.classList.add('disabled');
  this.stepForward.classList.add('disabled');
};

/**
 * @param {Event} event The event to handle
 * @private
 */
ol.control.Toolbar.prototype.handleClearSelectionClick_ = function(event) {
  event.preventDefault();
  this.cycleStatus='stop';
  this.play.classList.remove('fa-pause');
  this.play.classList.add('fa-play');
  this.play.classList.add('disabled');
};
