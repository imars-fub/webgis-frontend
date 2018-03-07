goog.provide('ol.control.LayerSwitcher');

goog.require('ol.control');
goog.require('ol.Collection');

var dragSrcEl = null;

/**
 * OpenLayers 3 Layer Switcher Control
 * Initial development by Matt Walker at https://github.com/walkermatt/ol3-layerswitcher
 * iMars additions by Sebastian Walter at https://github.com/imars-fub/frontend
 * @constructor
 * @extends {ol.control.Control}
 * @param {Object} opt_options Control options, extends olx.control.ControlOptions adding:
 *                              **`tipLabel`** `String` - the button tooltip.
 */
ol.control.LayerSwitcher = function(opt_options) {

    var options = opt_options || {};

    var tipLabel = options.tipLabel ?
        options.tipLabel : 'Legend';

    this.mapListeners = [];

    this.hiddenClassName = 'ol-unselectable layer-switcher';
    this.shownClassName = this.hiddenClassName + ' shown';

    var element = document.createElement('div');
    element.className = this.hiddenClassName;

    this.panel = document.createElement('div');
    this.panel.className = 'ls-panel';
    element.appendChild(this.panel);

    
    this.sortParam = 'time';

    this.sortPanelActive=false;

    var this_ = this;

    ol.control.Control.call(this, {
        element: element,
        target: options.target
    });

};

ol.inherits(ol.control.LayerSwitcher, ol.control.Control);


/**
 * Show the layer panel.
 */
ol.control.LayerSwitcher.prototype.showPanel = function() {
    if (this.element.className != this.shownClassName) {
        this.element.className = this.shownClassName;
        this.renderPanel();
    }
};

/**
 * Hide the layer panel.
 */
ol.control.LayerSwitcher.prototype.hidePanel = function() {
    if (this.element.className != this.hiddenClassName) {
        this.element.className = this.hiddenClassName;
    }
};

/**
 * Re-draw the layer panel to represent the current state of the layers.
 */
ol.control.LayerSwitcher.prototype.renderPanel = function() {

    this.ensureTopVisibleBaseLayerShown_();

    while (this.panel.firstChild) {
        this.panel.removeChild(this.panel.firstChild);
    }
    
    this.drawSortPanel_(this.panel);
    this.refreshCriterionButton_();

    var ul = document.createElement('ul');
    this.panel.appendChild(ul);

    this.renderLayers_(this.getMap(), ul);
};

/**
 * @private
 */
ol.control.LayerSwitcher.prototype.drawSortPanel_ = function(panel) {

    this.sortPanel = document.createElement('div');
    this.sortPanel.className="sort-panel";
    this.sortPanel.style.overflow='hidden';
    panel.appendChild(this.sortPanel);
    
    var sortText = document.createElement('div');
    sortText.id = "sortText";
    sortText.innerHTML = "Sort criterion:";
    this.sortPanel.appendChild(sortText);

    this.buttonName = document.createElement('button');
    this.buttonName.id = "title";
    this.buttonName.title = "Image name";
    this.buttonName.className = "fa fa-sort-alpha-asc";
    this.sortPanel.appendChild(this.buttonName);
    this.buttonName.addEventListener('click', this.criterionButtonClick_.bind(this), false);
    
    this.buttonTime = document.createElement('button');
    this.buttonTime.id = "time";
    this.buttonTime.title = "Acquisition time";
    this.buttonTime.className = "fa fa-clock-o";
    this.sortPanel.appendChild(this.buttonTime);
    this.buttonTime.addEventListener('click', this.criterionButtonClick_.bind(this), false);
    
    this.buttonResolution = document.createElement('button');
    this.buttonResolution.id = "resolution";
    this.buttonResolution.title = "Image resolution";
    this.buttonResolution.className = "fa fa-th";
    this.sortPanel.appendChild(this.buttonResolution);
    this.buttonResolution.addEventListener('click', this.criterionButtonClick_.bind(this), false);
  
    if (!this.sortPanelActive){
      this.sortPanel.classList.add('disabled');
      this.buttonName.classList.add('disabled');
      this.buttonTime.classList.add('disabled');
      this.buttonResolution.classList.add('disabled');
      this.buttonName.setAttribute('disabled','disabled');
      this.buttonTime.setAttribute('disabled','disabled');
      this.buttonResolution.setAttribute('disabled','disabled');
    }
};


/**
 * @private
 */
ol.control.LayerSwitcher.prototype.refreshCriterionButton_ = function() {
    this.buttonName.classList.remove('pushed');
    this.buttonTime.classList.remove('pushed');
    this.buttonResolution.classList.remove('pushed');
    if (this.sortParam=='time') {
        this.buttonTime.classList.add('pushed');
    }
    if (this.sortParam=='title') {
        this.buttonName.classList.add('pushed');
    }
    if (this.sortParam=='resolution') {
        this.buttonResolution.classList.add('pushed');
    }

};

/**
 * @private
 */
ol.control.LayerSwitcher.prototype.toggleSortPanel_ = function() {
  if (this.sortPanelActive){
    this.sortPanel.classList.add('disabled');
    this.buttonName.classList.add('disabled');
    this.buttonTime.classList.add('disabled');
    this.buttonResolution.classList.add('disabled');
    this.buttonName.setAttribute('disabled','disabled');
    this.buttonTime.setAttribute('disabled','disabled');
    this.buttonResolution.setAttribute('disabled','disabled');
    this.sortPanelActive=false;
  } else {
    this.sortPanel.classList.remove('disabled');
    this.buttonName.classList.remove('disabled');
    this.buttonTime.classList.remove('disabled');
    this.buttonResolution.classList.remove('disabled');
    this.buttonName.removeAttribute('disabled','disabled');
    this.buttonTime.removeAttribute('disabled','disabled');
    this.buttonResolution.removeAttribute('disabled','disabled');
    this.sortPanelActive=true;
  }
};

/**
 * @private
 */
ol.control.LayerSwitcher.prototype.criterionButtonClick_ = function(event) {
  event.preventDefault();
  this.sortParam = event.target.id;
  this.refreshCriterionButton_();
};

/**
 * Ensure only the top-most base layer is visible if more than one is visible.
 * @private
 */
ol.control.LayerSwitcher.prototype.ensureTopVisibleBaseLayerShown_ = function() {
    var lastVisibleBaseLyr;
    ol.control.LayerSwitcher.forEachRecursive(this.getMap(), function(l, idx, a) {
        if (l.get('type') === 'base' && l.getVisible()) {
            lastVisibleBaseLyr = l;
        }
    });
    if (lastVisibleBaseLyr) this.setVisible_(lastVisibleBaseLyr, true);
};

/**
 * Check if legend should be shown
 */
ol.control.LayerSwitcher.prototype.toggleLegend_ = function(map,lyr) {
    legend=document.getElementById(lyr.get('legenddoc'));
    var layercount=0;
    var groupcount=0;
    ol.control.LayerSwitcher.forEachRecursive(map, function(l, idx, a) {
        if (l.get('legenddoc') === lyr.get('legenddoc') && l.getVisible()) {
          if (l.getLayers) {
            groupcount++;
          } else {
            layercount++;
          }
        }
    });
    if (groupcount>0 && layercount>0) {
        legend.classList.remove('hidden');
    } else {
        legend.classList.add('hidden');
    }
};

/**
 * Toggle the visible state of a layer.
 * Takes care of hiding other layers in the same exclusive group if the layer
 * is toggle to visible.
 * @private
 * @param {ol.layer.Base} The layer whos visibility will be toggled.
 */
ol.control.LayerSwitcher.prototype.setVisible_ = function(lyr, visible) {
    var map = this.getMap();
    lyr.setVisible(visible);
    if (visible && lyr.get('type') === 'base') {
        ol.control.LayerSwitcher.forEachRecursive(map, function(l, idx, a) {
            if (l != lyr && l.get('type') === 'base') {
                l.setVisible(false);
                if (l.get('slider')){
                    l.get('slider').disabled=true;
                    l.get('slider').classList.add('disabled');
                }
            }
        });
    }
    if (visible && lyr.get('type') === 'query') {
        ol.control.LayerSwitcher.forEachRecursive(map, function(l, idx, a) {
            if (l != lyr && l.get('type') === 'query') {
                l.setVisible(false);
                l.get('input').checked=false;
                if (l.get('slider')){
                    l.get('slider').disabled=true;
                    l.get('slider').classList.add('disabled');
                }
            }
        });
    }

    //toggle legend if deselected
    if (lyr.get('legenddoc')) {
        ol.control.LayerSwitcher.prototype.toggleLegend_(map,lyr)
    };
    if (lyr.get('slider')){
        if (visible) {
            lyr.get('slider').disabled=false;
            lyr.get('slider').classList.remove('disabled');
        } else {
            lyr.get('slider').disabled=true;
            lyr.get('slider').classList.add('disabled');
        }
    }
};

/**
 * Remove a layer from the layers list.
 * @private
 * @param {ol.layer.Base} The layer which will be removed.
 */
ol.control.LayerSwitcher.prototype.removeLyr_ = function(lyr) {
    var lyrGroups = this.getMap().getLayers().getArray();
    for (var i = 0, l; i < lyrGroups.length; i++) {
        l = lyrGroups[i];
        if (l.getLayers) {
            var lyrs = l.getLayers().getArray();
            l.setLayers(new ol.Collection());
            for (var j = 0, g; j < lyrs.length; j++) {
                g = lyrs[j];
                if (g !== lyr) {
                    l.getLayers().push(g);
                }
            }
        }
    }
    this.renderPanel();
};

/**
 * Insert layer 1 into the layers list before layer 2 (on drop).
 * @private
 * @param {ol.layer.Base} The layer which will be removed.
 */
ol.control.LayerSwitcher.prototype.insertLyr_ = function(srcId, tgtId) {
    var src = null;
    // get src Layer
    console.dir(srcId);
    ol.control.LayerSwitcher.forEachRecursive(this.getMap(), function(l, idx, a) {
        if (l.get('id') === srcId) {
            src = l;
        }
    });
    var lyrGroups = this.getMap().getLayers().getArray();
    for (var i = 0, lyrGroup; i < lyrGroups.length; i++) {
        lyrGroup = lyrGroups[i];
        if (lyrGroup.getLayers) {
            var lyrs = lyrGroup.getLayers().getArray();
            lyrGroup.setLayers(new ol.Collection());
            for (var j = 0, lyr; j < lyrs.length; j++) {
                lyr = lyrs[j];
                var lyrId = lyr.get('id');
                if (lyrId != srcId) {
                    lyrGroup.getLayers().push(lyr);
                }
                if (lyrId == tgtId) {
                    lyrGroup.getLayers().push(src);
                }
            }
        }
    }
    this.renderPanel();
};


/**
 * Fold/unfold layer group
 */
ol.control.LayerSwitcher.prototype.toggleFold_ = function(e) {
    var lyrId = this.get('id');
    var lyrUl = document.getElementById('ul-' + lyrId);
    var foldIcon = document.getElementById('fold-' + lyrId);
    if (this.get('unfolded')) {
        lyrUl.style.display = 'none';
        foldIcon.classList.toggle('fa-caret-down', false);
        foldIcon.classList.toggle('fa-caret-right', true);
        this.set('unfolded', false);
    } else {
        lyrUl.style.display = 'block';
        foldIcon.classList.toggle('fa-caret-right', false);
        foldIcon.classList.toggle('fa-caret-down', true);
        this.set('unfolded', true);
    }
}

/**
 * Render all layers that are children of a group.
 * @private
 * @param {ol.layer.Base} lyr Layer to be rendered (should have a title property).
 * @param {Number} idx Position in parent group list.
 */
ol.control.LayerSwitcher.prototype.renderLayer_ = function(lyr, idx) {
    var this_ = this;
    var li = document.createElement('li');
    var lyrTitle = lyr.get('title');
    var lyrId = lyr.get('title').replace(/\s+/g, '-'); // + '_' + idx;
    lyr.set('id', lyrId);

    var label = document.createElement('label');
    
    // Check if lyr is only used for separator element
    if (lyr.get('type') == 'separator') {
        var wrapper=document.createElement('div');
        wrapper.style.overflow='hidden';
        var left=document.createElement('hr');
        left.style.width='150px';
        left.style.marginTop='6px';
        left.style.marginBottom='0px';
        left.style.float='left';
        var right=document.createElement('div');
        var p=document.createElement('p');
        p.style.margin='0px';
        p.style.position='relative';
        right.style.float='right';
        p.innerHTML=lyr.get('title');
        right.appendChild(p);
        wrapper.appendChild(left);
        wrapper.appendChild(right);
        li.appendChild(wrapper);
    // Check if lyr is group
    } else if (lyr.getLayers) {

        label.className='group';
        
        var input = document.createElement('input');
        input.type = 'checkbox';
        input.id = 'checkbox' + lyrId;
        input.checked = lyr.get('visible');
        input.onchange = function(e) {
            this_.setVisible_(lyr, e.target.checked);
        };
        li.appendChild(input);

        var ulDisp = null;
        var fold = document.createElement('i');
        fold.id = 'fold-' + lyrId;
        fold.className = 'fold fa';
        if (lyr.get('unfolded')) {
            ulDisp = 'block';
            fold.classList.add('fa-caret-down');
        } else {
            ulDisp = 'none';
            fold.classList.add('fa-caret-right');
        }
        fold.onclick = this.toggleFold_.bind(lyr);
        li.appendChild(fold);

        // Show number of layers (only dynamic layers)
        if (lyr.get('type') == 'dynamic') {
            lyrTitle = lyrTitle + ' (' + lyr.getLayers().getArray().length + ')';
            label.classList.add('dynamic');
        }

        label.classList.add('indentgroup');
        label.innerHTML = lyrTitle;

        li.appendChild(label);
    
        if (lyr.get('infodoc')) {
            var span = document.createElement('span');
            span.className = 'info fa fa-info-circle';
            span.onclick = function(e) {
                $('#layerInfoTitle').html(lyrTitle);
                $('#layerInfoBody').load(lyr.get('infodoc'));
                $('#layerInfoModal').modal({
                    show: true
                });
            }
            li.appendChild(span);
        }
        
        if (lyr.get('sortable')) {
            this.sortButton = document.createElement('input'); 
            this.sortButton.setAttribute("type", "button");
            this.sortButton.setAttribute("class", "sortbutton");
            this.sortButton.setAttribute("value", "sort"); 
            this.sortButton.setAttribute("title", "sort by selected criterion"); 
            this.sortButton.setAttribute("id", "but"+lyrId);
            this.sortButton.addEventListener('click', this.sortButtonClick_.bind(this,lyr), false);
            li.appendChild(this.sortButton);
        }

        var ul = document.createElement('ul');
        ul.id = 'ul-' + lyrId;
        ul.style.display = ulDisp;
        li.appendChild(ul);

        this.renderLayers_(lyr, ul);

    } else {
        li.className = 'layer';

        // lyr is single layer, no group
        var input = document.createElement('input');
        if (lyr.get('type') === 'base') {
            input.type = 'radio';
            input.name = 'base';
        } else if (lyr.get('type') === 'query') {
            input.type = 'checkbox';
            input.name = 'query';
        } else {
            input.type = 'checkbox';
        }
        input.id = 'input'+lyrId;
        input.checked = lyr.get('visible');
        input.onchange = function(e) {
            this_.setVisible_(lyr, e.target.checked);
        };
        lyr.set('input',input);
        li.appendChild(input);
        
        var fold = document.createElement('i');
        fold.id = 'fold-' + lyrId;

        label.className = 'indentlayer';
        label.innerHTML = lyrTitle;
        if (lyr.get('type') === 'dynamic') {
            label.draggable = true;
        }
        li.appendChild(label);

        // dynamic layers are draggable and can be removed
        if (lyr.get('type') === 'dynamic') {
            var del = document.createElement('i');
            del.className = 'fa fa-ban';
            del.onclick = function(e) {
                this_.removeLyr_(lyr);
            }
            li.appendChild(del);
            // DnD
            li.draggable = true;
            li.id = lyrId;
            li.addEventListener('dragstart', this.handleDragStart, false);
            li.addEventListener('dragenter', this.handleDragEnter, false);
            li.addEventListener('dragover', this.handleDragOver, false);
            li.addEventListener('dragleave', this.handleDragLeave, false);
            li.ondrop = this.handleDrop.bind(this);
            li.title=lyr.get('time').toISOString();
            li.addEventListener('dragend', this.handleDragEnd, false);
            if (lyr.get('highlight')) {
		      li.classList.add('highlight');
            }
        }
        if (lyr.get('infodoc')) {
            var span = document.createElement('span');
            span.className = 'fa fa-info-circle';
            span.onclick = function(e) {
                $('#layerInfoTitle').html(lyrTitle);
                $('#layerInfoBody').load(lyr.get('infodoc'));
                $('#layerInfoModal').modal({
                    show: true
                });
            }
            li.appendChild(span);
        }
        // Layer has opacity slider
        if (lyr.get('transparent')) {
            var opacity = document.createElement('input');
            opacity.className = 'opacitySlider';
            opacity.type = 'range';
            opacity.min='0';
            opacity.max='1';
            opacity.step='0.01';
            opacity.value=lyr.get('opacity');
            opacity.onchange=function(e) {
                lyr.setOpacity(parseFloat(opacity.value));
            }
            if (!input.checked) {
                opacity.disabled=true;
                opacity.classList.add('disabled');
            }
            lyr.set('slider',opacity);
            li.appendChild(opacity);
        }
    }
    return li;

};

ol.control.LayerSwitcher.prototype.handleDragStart = function(e) {
    e.target.style.opacity = '0.4';
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.id);
    dragSrcEl = this;
}
ol.control.LayerSwitcher.prototype.handleDragOver = function(e) {
    if (e.preventDefault) {
        e.preventDefault(); // Necessary. Allows us to drop.
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}
ol.control.LayerSwitcher.prototype.handleDragEnter = function(e) {
    this.classList.add('over');
}
ol.control.LayerSwitcher.prototype.handleDragLeave = function(e) {
    this.classList.remove('over');
}
ol.control.LayerSwitcher.prototype.handleDrop = function(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    var dragSrcElId = e.dataTransfer.getData("text/plain");
    this.insertLyr_(dragSrcElId, e.target.id);
    return false;
}
ol.control.LayerSwitcher.prototype.handleDragEnd = function(e) {
        this.classList.remove('over');
        this.sortParam=null;
    }
    /**
     * Render all layers that are children of a group.
     * @private
     * @param {ol.layer.Group} lyr Group layer whos children will be rendered.
     * @param {Element} elm DOM element that children will be appended to.
     */
ol.control.LayerSwitcher.prototype.renderLayers_ = function(lyr, elm) {
    var lyrs = lyr.getLayers().getArray().slice().reverse();
    for (var i = 0, l; i < lyrs.length; i++) {
        l = lyrs[i];
        if (l.get('title')) {
            elm.appendChild(this.renderLayer_(l, i));
        }
    }
};

/**
 * **Static** Call the supplied function for each layer in the passed layer group
 * recursing nested groups.
 * @param {ol.layer.Group} lyr The layer group to start iterating from.
 * @param {Function} fn Callback which will be called for each `ol.layer.Base`
 * found under `lyr`. The signature for `fn` is the same as `ol.Collection#forEach`
 */
ol.control.LayerSwitcher.forEachRecursive = function(lyr, fn) {
    lyr.getLayers().forEach(function(lyr, idx, a) {
        fn(lyr, idx, a);
        if (lyr.getLayers) {
            ol.control.LayerSwitcher.forEachRecursive(lyr, fn);
        }
    });
};

/**
 * Cycle Layers
 * @private
 * @param {ol.layer.Base} The layer which will be removed.
 */
ol.control.LayerSwitcher.prototype.stopCycleLyrs_ = function() {
    app.Toolbar.cycleStatus='stop';
    clearInterval(app.isCycling);
    app.isCycling = null;
    app.Toolbar.stop.classList.add('disabled');
    app.Toolbar.stop.removeAttribute('active');
	app.Toolbar.stop.setAttribute('disabled','disabled');
	app.Toolbar.play.classList.remove('pushed');
	this.count = app.cycleArray.length-1;
    for (var i = 0; i < app.cycleArray.length; i++) {
        app.cycleArray[i].setVisible(true);
        var prodid = app.cycleArray[i].getProperties().id;
        var listItem = document.getElementById(prodid);
        listItem.style.border = '';
        listItem.style.backgroundColor = '';
    }
    app.LayerSwitcher.renderPanel();
}

/**
 * Cycle Layers
 * @private
 * @param {ol.layer.Base} The layer which will be removed.
 */
ol.control.LayerSwitcher.prototype.skipCycleLyrs_ = function() {
}

/**
 * Cycle Layers
 * @private
 * @param {ol.layer.Base} The layer which will be removed.
 */
ol.control.LayerSwitcher.prototype.playCycleLyrs_ = function() {
    if (app.isCycling === null) {
        app.Toolbar.stop.classList.remove('disabled');
		app.Toolbar.stop.setAttribute('active', 'active');
		app.Toolbar.stop.removeAttribute('disabled');
        app.cycleArray=[]
        var lyrGroups = this.getMap().getLayers().getArray(),
        lyrs,
        lyr;
        for (var i = 0, lyrGroup; i < lyrGroups.length; i++) {
            lyrGroup = lyrGroups[i];
            if (lyrGroup.get('type') == 'dynamic' && lyrGroup.get('visible') && lyrGroup.getLayers) {
                lyrs = lyrGroup.getLayers().getArray();
                for (var j = 0, lyr; j < lyrs.length; j++) {
                    lyr = lyrs[j];
                    if (lyr.get('visible') && lyr.get('type') == 'dynamic') {
                        app.cycleArray.push(lyr);
                    }
                }
            }
        }
        this.count = app.cycleArray.length-1;
    }
    if (app.Toolbar.cycleStatus == 'play') {
        var that = this;
        app.isCycling = setInterval(function() {
            if (this.count > 0) {
                this.count--;
            } else {
                this.count = app.cycleArray.length-1;
            }
            for (var i = 0; i < app.cycleArray.length; i++) {
                app.cycleArray[i].setVisible(false);
                var prodid = app.cycleArray[i].getProperties().id;
                var listItem = document.getElementById(prodid);
                listItem.style.border = '';
                listItem.style.backgroundColor = '';
                app.cycleArray[this.count].setVisible(true);
                prodid = app.cycleArray[this.count].getProperties().id;
                listItem = document.getElementById(prodid);
                listItem.style.border = 'solid 1.25px #3399CC';
                listItem.style.borderRadius = '4px';
                listItem.style.backgroundColor = 'rgba(255,255,255,0.4)';
            }
        }, 500);
    } else if (app.Toolbar.cycleStatus=='pause' ) { //pause
        clearInterval(app.isCycling);
    }
};

/**
 * @private
 */
ol.control.LayerSwitcher.prototype.sortButtonClick_ = function(group,event) {
  this.sortLayerGroup_(group);
  this.renderPanel();
};


function compareByTime(a,b) {
  if (a.get('time') < b.get('time'))
    return 1;
  if (a.get('time') > b.get('time'))
    return -1;
  return 0;
}

function compareByName(a,b) {
  if (a.get('title') < b.get('title'))
    return 1;
  if (a.get('title') > b.get('title'))
    return -1;
  return 0;
}

function compareByResolution(a,b) {
  return b.get('resolution')-a.get('resolution');
}


/**
 * @private
 */
ol.control.LayerSwitcher.prototype.sortLayerGroup_ = function(group) {
  var crit=this.sortParam;
  groupArray=group.getLayers().getArray();
  if ( crit=='time') {
      groupArray.sort(compareByTime);
  } else if ( crit=='name') {
      groupArray.sort(compareByName);
  } else if ( crit=='resolution') {
      groupArray.sort(compareByResolution);
  }
  group.setLayers(new ol.Collection());
  for (var j = 0, lyr; j < groupArray.length; j++) {
        lyr = groupArray[j];
        group.getLayers().push(lyr);
    };
};

