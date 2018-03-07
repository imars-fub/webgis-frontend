goog.provide('ol.control.ProjectionSwitcher');
goog.require('ol.control');

/**
 * Projectionswitcher adapted from  https://github.com/nsidc/ol3-projection-switcher
 * 
 * Copyright (c) 2013-2015 Regents of the University of Colorado
This software was developed by the National Snow and Ice Data Center with funding from multiple sources.
MIT License
Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:
The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

ol.control.ProjectionSwitcher = function(options) {
  //ol.proj.setProj4(proj4);

  options = options || {};

  var projections = options.projections || {};

  this.mapListeners = [];

  this.className = 'ol-unselectable ol-control projection-switcher';

  var projectionSwitcherContainer = document.createElement('div');
  projectionSwitcherContainer.className = this.className;

  var projectionCode;
  for (projectionCode in projections) {
    this._createProjectionButton(projectionCode, projections[projectionCode], projectionSwitcherContainer);
  }
  
  this.currentPrefix='eqc';

  ol.control.Control.call(this, {
    element: projectionSwitcherContainer,
    target: options.target
  });
}

ol.inherits(ol.control.ProjectionSwitcher, ol.control.Control);

ol.control.ProjectionSwitcher.prototype.switchProjection = function(buttonPrefix, layerId, startProjection, endProjection, extent, minZoom, zoom, maxZoom) {
  if (startProjection !== endProjection) {
    var projection = ol.proj.get(endProjection);
    this_=this;
    ol.control.LayerSwitcher.forEachRecursive(app.map, function(layer, idx, a) {
		if (typeof layer.getLayers === "function") {
		} else {
			if (layer.getSource() instanceof ol.source.TileWMS) {
				url=layer.getSource().getUrls()[0];
				res = url.replace(this_.currentPrefix, buttonPrefix);
				layer.getSource().setUrl(res);
			} else if (layer.getSource() instanceof ol.source.ImageWMS) {
				url=layer.getSource().getUrl();
				res = url.replace(this.currentPrefix, buttonPrefix);
				layer.getSource().setUrl(res);
			}
    	}
    	// falls nur in eqc aktiv, kein eintrag
    	if (layer.get('validsrs')) {
    		var validsrs=layer.get('validsrs');
    		if (validsrs.indexOf(buttonPrefix)>=0){
				if (layer.get('titleDisabled')) {
					layer.set('title',layer.get('titleDisabled'));
					layer.unset('titleDisabled');
				}
				if (layer.get('previouslyVisible')) {
					layer.set('visible',true);
					layer.unset('previouslyVisible');
				}
    		} else {
    			//nur in sps aktiv, muss in eqc wieder ausgeblendet werden
    			if (layer.get('title')) {
					layer.set('titleDisabled',layer.get('title'));
					layer.unset('title');
				}
				if (layer.get('visible')) {
					layer.set('previouslyVisible',true);
					layer.unset('visible');
				}
    		}
    		//console.dir(layer.get('title'));
    	} else {
    		if (buttonPrefix=='sps'){
				//alle ohne eintrag ausblenden in sps
				if (layer.get('title')) {
					layer.set('titleDisabled',layer.get('title'));
					layer.unset('title');
					if(layer.get('visible')===true){
						layer.set('previouslyVisible',true)
					} else {
						layer.set('previouslyVisible',false)
					}
					layer.set('visible',false);
				}
    		} else {
    			//alle wieder einblenden in eqc
    			if (layer.get('titleDisabled')) {
					layer.set('title',layer.get('titleDisabled'));
					layer.set('titleDisabled',null);
					if(layer.get('previouslyVisible')===true){
						layer.set('visible',true)
					} else {
						layer.set('visible',false)
					}
    			}
    		}
    	}

    });
    // Set the visible layer
    /*var layers = this.getMap().getLayers();
    layers.forEach(layer => {
      if(layer.get('id') === layerId) {
        layer.setVisible(true);
        layer.setExtent(extent);
      } else {
        layer.setVisible(false);
      }
    });*/

    // Set the view
    var newView = new ol.View({
      projection: projection,
      center: [0,0],
      extent: extent,
      //center: [-500000.000, -158475.000],
      zoom: parseInt(zoom),
      //zoom: parseInt(9),
      minZoom: parseInt(minZoom),
      maxZoom: parseInt(maxZoom)
    });
    this.getMap().setView(newView);
  }
  this.currentPrefix=buttonPrefix;

  app.currentProjection=this.currentPrefix;
  app.cgi=this.currentPrefix+'-bin/wms?';
  app.cache=this.currentPrefix+'/'

  //change specific layers
  if (this.currentPrefix=='sps') {
  	  app.layer.hrsc2NdUclWms.set('title', 'MEx HRSC (UCL)');
  	  app.layer.hrsc2NdUclWms.set('visible', true);
	  app.layer.hrscsingledtms.set('title', 'HRSC single strip DTMs (DLR)');
	  app.layer.molagray.set('title', 'MGS MOLA 128ppd gray hs');
	  app.layer.molacolor.set('visible',true);
	  app.layer.hrscsingledtms.set('visible',false);
	  app.layer.hrscuclsingledtms.set('title', "HRSC single strip DTMs (UCL)");
	  app.layer.hrscuclsingledtms.set('visible',true);
	  app.Goto.lonInput.value = Number(0.0);
   	  app.Goto.latInput.value = Number(-90.0);
	  //app.layer.molagray.set('visible',true);
  } else {
  	  app.layer.hrsc2NdUclWms.unset('title');
  	  app.layer.hrscsingledtms.set('title', 'MEx HRSC single strip DTMs');
	  app.layer.molagray.set('title', 'MGS MOLA grayscale hillshade');
	  app.Goto.lonInput.value = Number(0.0);
   	  app.Goto.latInput.value = Number(0.0);
	  
  }
  app.LayerSwitcher.renderPanel();
}

ol.control.ProjectionSwitcher.prototype._createProjectionButton = function(projectionCode, projectionConfig, parentElement) {
  var label = projectionConfig.label ? projectionConfig.label : '';
  var name = projectionConfig.name ? projectionConfig.name : '';
  var prefix = projectionConfig.prefix ? projectionConfig.prefix : '';
  //proj4.defs(projectionCode, projectionConfig.proj4def);
  //console.dir(ol.proj.get(projectionCode));
  if(projectionConfig.visible) {
    // Create element to track the selected projection
    var input = document.createElement('input');
    input.setAttribute('id', 'current-projection');
    input.setAttribute('hidden', 'hidden');
    input.setAttribute('value', projectionCode);
    input.setAttribute('prefix', prefix);
    parentElement.appendChild(input);
  }

  var button = document.createElement('button');
  button.setAttribute('id', 'projection-' + projectionConfig.layerId);
  button.setAttribute('title', 'Show ' + projectionConfig.name + ' view');
  button.setAttribute('prefix', projectionConfig.prefix);
  button.setAttribute('data-layer', projectionConfig.layerId);
  button.setAttribute('data-projection', projectionCode);
  button.setAttribute('data-extent', projectionConfig.extent);
  button.setAttribute('data-minZoom', projectionConfig.minZoom);
  button.setAttribute('data-zoom', projectionConfig.zoom);
  if (projectionConfig.disabled) {
	button.setAttribute('disabled', 'disabled');
	button.classList.add('disabled');
  }
  button.setAttribute('data-maxZoom', projectionConfig.maxZoom);
  button.innerHTML = label;
  parentElement.appendChild(button);

  this._addClickEvent(button);
}

ol.control.ProjectionSwitcher.prototype._addClickEvent = function (button) {

  var this_ = this;

  button.onclick = function (e) {
    //console.dir(this_.currentPrefix);
    e = e || window.event;
    var startProjection = document.getElementById('current-projection').value;
    var input = document.getElementById('current-projection');
    input.setAttribute('value', e.target.getAttribute('data-projection'));
    var prefix = e.target.getAttribute('prefix');
    //console.log(prefix);
    var layerId = e.target.getAttribute('data-layer');
    var endProjection = e.target.getAttribute('data-projection');
    var extent = e.target.getAttribute('data-extent').split(',');
    var minZoom = e.target.getAttribute('data-minZoom');
    var zoom = e.target.getAttribute('data-zoom');
    var maxZoom = e.target.getAttribute('data-maxZoom');

    this_.switchProjection(prefix, layerId, startProjection, endProjection, extent, minZoom, zoom, maxZoom);
    e.preventDefault();
  }
}
