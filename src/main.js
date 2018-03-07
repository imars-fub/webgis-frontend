goog.provide('app');
goog.provide('app.layer');

goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.Sphere');

goog.require('ol.Collection');
goog.require('ol.layer.Tile');
goog.require('ol.control.MousePosition');
goog.require('ol.control.FullScreen');
goog.require('ol.control.ZoomToExtent');
goog.require('ol.control.ScaleLine');
goog.require('ol.control.ZoomSlider');
goog.require('ol.source.TileWMS');
goog.require('ol.source.ImageWMS');
goog.require('ol.format.GeoJSON');
goog.require('ol.style.Style');
goog.require('ol.style.Stroke');
goog.require('ol.Attribution');
goog.require('ol.layer.Vector');
goog.require('ol.source.Vector');
goog.require('ol.control');
goog.require('ol.layer.Group');
goog.require('ol.proj.Projection');
goog.require('ol.interaction.Select');
goog.require('ol.interaction.DragBox');

goog.require('ol.control.LayerSwitcher');
goog.require('ol.Overlay.Popup');
goog.require('ol.control.TimePanel');
goog.require('ol.control.Toolbar');
goog.require('ol.control.LoadingPanel');
goog.require('martianYears');
goog.require('ol.control.Goto');

goog.require('ol.control.ProjectionSwitcher');

proj4.defs('EPSG:49900', '+proj=longlat +a=3396000 +b=3396000 +no_defs ');
proj4.defs('EPSG:49910', '+proj=eqc +lat_ts=0 +lat_0=0 +lon_0=0 +x_0=0 +y_0=0 +a=3396000 +b=3396000 +units=m +no_defs ');
proj4.defs('EPSG:49923', '+proj=stere +lat_0=-90 +lon_0=0 +x_0=0 +y_0=0 +a=3396000 +b=3396000 +units=m +no_defs ');

app.MarsR = 3396000;
app.projextent49910 = [-10668848.652, -5215881.563, 10668848.652, 5215881.563];
app.projextent49923 = [-6792000, -6792000, 6792000, 6792000];

app.projection49910 = new ol.proj.Projection({
    code: 'EPSG:49910',
    extent: app.projextent49910,
    units: 'm',
    getPointResolution: function(resolution, point) {
    	var sphere = new ol.Sphere(3396000);
		var toEPSG49900 = ol.proj.getTransformFromProjections(ol.proj.get('EPSG:49910'), ol.proj.get('EPSG:49900'));
		var vertices = [
		  point[0] - resolution / 2, point[1],
		  point[0] + resolution / 2, point[1]
		];
		vertices = toEPSG49900(vertices, vertices, 2);
		var width = sphere.haversineDistance(vertices.slice(0, 2), vertices.slice(2, 4));
		return width;
	}
});
app.projection49900 = new ol.proj.Projection({
    code: 'EPSG:49900',
    extent: [-180, -90, 180, 90],
    units: 'degrees'
});
app.projection49923 = new ol.proj.Projection({
    code: 'EPSG:49923',
    extent: app.projextent49923,
    units: 'm',
    getPointResolution: function(resolution, point) {
    	var sphere = new ol.Sphere(3396000);
		var toEPSG49900 = ol.proj.getTransformFromProjections(ol.proj.get('EPSG:49923'), ol.proj.get('EPSG:49900'));
		var vertices = [
		  point[0] - resolution / 2, point[1],
		  point[0] + resolution / 2, point[1]
		];
		vertices = toEPSG49900(vertices, vertices, 2);
		var width = sphere.haversineDistance(vertices.slice(0, 2), vertices.slice(2, 4));
		return width;
	}
});
ol.proj.addProjection(app.projection49910);
ol.proj.addProjection(app.projection49900);
ol.proj.addProjection(app.projection49923);

app.ogchost='imars.planet.fu-berlin.de/';

app.currentProjection='eqc';
app.cgi=app.currentProjection+'-bin/wms?';
app.cache=app.currentProjection+'/'

var projSwitchConfig = {
  projections: {
    'EPSG:49933': {
      layerId: 'north',
      name: 'north polar',
      label: 'N',
      prefix: 'nps',
      disabled: true,
      proj4def: '+proj=stere +lat_0=90 +lon_0=0 +x_0=0 +y_0=0 +a=3396000 +b=3396000 +units=m +no_defs ',
      extent: [-6790000, -6791000, 6791000, 6790000],
      zoom: 5,
      minZoom: 2,
      maxZoom: 16
    },
    'EPSG:49910': {
      layerId: 'global',
      name: 'global equatorial',
      label: 'G',
      prefix: 'eqc',
      visible: true,
      proj4def: '+proj=eqc +lat_ts=0 +lat_0=0 +lon_0=0 +x_0=0 +y_0=0 +a=3396000 +b=3396000 +units=m +no_defs ',
      extent: app.projextent49910,
      zoom: 4,
      minZoom: 2,
      maxZoom: 16
    },
    'EPSG:49923': {
      layerId: 'south',
      label: 'S',
      name: 'south polar',
      prefix: 'sps',
      proj4def: '+proj=stere +lat_0=-90 +lon_0=0 +x_0=0 +y_0=0 +a=3396000 +b=3396000 +units=m +no_defs ',
      extent: app.projextent49923,
      zoom: 5,
      minZoom: 2,
      maxZoom: 16
    },
  }
}

app.martianYearStart=23;
app.solStart=1;
app.martianYearStop=34;
app.solStop=1;

app.startTime=ConvertMartian2Gregorian(app.martianYearStart,app.solStart);
app.stopTime=ConvertMartian2Gregorian(app.martianYearStop,app.solStop);

/**
 * @type {ol.Map}
 */
/*
 * MOLA gray hillshaded Background
 */
app.layer.molagray = new ol.layer.Tile({
	preload: 5,
	title: "MGS MOLA grayscale hillshade",
	validsrs: 'eqc sps',
	infodoc: "src/mola-gray.html",
	visible: true,
	source: new ol.source.TileWMS({
		attributions: [new ol.Attribution({
			html: 'MOLA'
		})],
		url: 'http://'+app.ogchost+app.cache,
		params: {
			LAYERS: 'MOLA-gray-hs',
			VERSION: '1.3.0',
			TILED: true
		},
		wrapX: true
	})
})
app.layer.molacolor = new ol.layer.Tile({
	preload: 5,
	titleDisabled: "MGS MOLA 512ppd colour hs",
	validsrs: 'sps',
	visible: false,
	previouslyVisible: false,
	source: new ol.source.TileWMS({
		attributions: [new ol.Attribution({
			html: 'MOLA'
		})],
		url: 'http://'+app.ogchost+app.cache,
		params: {
			LAYERS: 'MOLA-color-hs',
			VERSION: '1.3.0',
			TILED: true
		},
		wrapX: true
	})
})
/*
 * Mola DTM (for query)
 */
app.layer.DtmMola = new ol.layer.Tile({
	visible: false,
	source: new ol.source.TileWMS({
		url: 'http://'+app.ogchost+app.cgi,
		validsrs: 'eqc sps',
		params: {
			LAYERS: 'DTM-MOLA',
			VERSION: '1.3.0',
			TILED: true
		},
		wrapX: true
	})
})
/*
 * HRSC colour hillshaded DTMs
 */
app.layer.hrscsingledtms = new ol.layer.Tile({
	preload: 5,
	title: "MEx HRSC single strip DTMs",
	validsrs: 'eqc',
	visible: true,
	legenddoc: "heightLegend",
	infodoc: "src/hrsc-dtm-single.html",
	source: new ol.source.TileWMS({
		url: 'http://'+app.ogchost+app.cache,
		params: {
			LAYERS: 'HRSC-single-dtms',
			VERSION: '1.3.0',
			TILED: true
		},
		wrapX: true
	})
})
// NUR FUER SPRC
app.layer.hrscuclsingledtms = new ol.layer.Tile({
	preload: 5,
	titleDisabled: "HRSC single strip DTMs (UCL)",
	//validsrs: 'sps',
	visible: false,
	previouslyVisible: true,
	legenddoc: "heightLegend",
	infodoc: "src/hrsc-ucl-dtm-single.html",
	source: new ol.source.TileWMS({
		url: 'http://'+app.ogchost+app.cache,
		params: {
			LAYERS: 'UCL-HRSC-single-dtms',
			VERSION: '1.3.0',
			TILED: true
		},
		wrapX: true
	})
})
app.layer.hrscDtmMosaics = new ol.layer.Tile({
	preload: 5,
	title: "MEx HRSC multi-orbit DTMs",
	infodoc: "src/hrsc-dtm-multi.html",
	visible: true,
	legenddoc: "heightLegend",
	source: new ol.source.TileWMS({
		url: 'http://'+app.ogchost+app.cache,
		params: {
			LAYERS: 'HRSC-dtm-mosaics',
			VERSION: '1.3.0',
			TILED: true
		},
		wrapX: true
	})
});
/*
 * HRSC single strip DTM (for query)
 */
app.layer.DtmSingleHrsc = new ol.layer.Tile({
	visible: false,
	source: new ol.source.TileWMS({
		url: 'http://'+app.ogchost+app.cgi,
		params: {
			LAYERS: 'DTM-DAMOS',
			VERSION: '1.3.0',
			TILED: true
		},
		wrapX: true
	})
});
/*
 * HRSC single strip DTM UCL (for query)
 */
app.layer.DtmSingleHrscUcl = new ol.layer.Tile({
	visible: false,
	source: new ol.source.TileWMS({
		url: 'http://'+app.ogchost+app.cgi,
		params: {
			LAYERS: 'DTM-DAMOS-UCL',
			VERSION: '1.3.0',
			TILED: true
		},
		wrapX: true
	})
});
/*
 * HRSC mosaic quad DTM (for query)
 */
app.layer.DtmMosaicHrsc = new ol.layer.Tile({
	visible: false,
	source: new ol.source.TileWMS({
		url: 'http://'+app.ogchost+app.cgi,
		params: {
			LAYERS: 'DTM-MC',
			VERSION: '1.3.0',
			TILED: true
		},
		wrapX: true
	})
});


/*
 * Panos repeat coverage
 */
app.layer.repeatcov = new ol.layer.Tile({
    preload: Infinity,
    type: 'query',
    opacity: 0.3,
    transparent: true,
    title: "High-Res Repeat Coverage",
    infodoc: "src/repeat_coverage.html",
    visible: false,
    source: new ol.source.TileWMS({
        url: 'http://'+app.ogchost+app.cache,
        params: {
            LAYERS: 'panosall',
            VERSION: '1.3.0',
            TILED: true
        },
        wrapX: true
    })
})
/*
 * CTX MC11 MOSAIC
 */
app.layer.ctxMosaic = new ol.layer.Tile({
    preload: Infinity,
    type: 'query',
    opacity: 1,
    transparent: true,
    title: "MRO CTX ACRO mosaic",
    infodoc: "src/ctx_mosaic.html",
    visible: false,
    source: new ol.source.TileWMS({
        url: 'http://'+app.ogchost+app.cache,
        params: {
            LAYERS: 'CTXMOSAIC',
            VERSION: '1.3.0',
            TILED: true
        },
        wrapX: true
    })
})
/*
 * HRSC MC11 PAN MOSAIC
 */
app.layer.hrscPan = new ol.layer.Tile({
	preload: 5,
	title: "MEx HRSC panchromatic mosaic",
	visible: true,
	type: 'base',
	opacity: 1,
    transparent: true,
	infodoc: "src/hrsc-pan-mosaic.html",
	source: new ol.source.TileWMS({
		attributions: [new ol.Attribution({
			html: 'HRSC'
		})],
		url: 'http://'+app.ogchost+app.cache,
		params: {
			LAYERS: 'HRSCPAN16',
			VERSION: '1.1.1',
			TILED: true
		},
		wrapX: true
	})
})

/*
 * HRSC MC11 COLOUR MOSAIC
 */
app.layer.hrscCol = new ol.layer.Tile({
	preload: 5,
	title: "MEx HRSC colour mosaic",
	visible: false,
	type: 'base',
	opacity: 1,
    transparent: true,
	infodoc: "src/hrsc-col-mosaic.html",
	source: new ol.source.TileWMS({
		attributions: [new ol.Attribution({
			html: 'HRSC'
		})],
		url: 'http://'+app.ogchost+app.cache,
		params: {
			LAYERS: 'HRSCMC11COLOR',
			VERSION: '1.1.1',
			TILED: true
		},
		wrapX: true
	})
})
/* HRSC Level 4 Highlight layer*/
app.layer.HrscHighlight = new ol.layer.Vector({
	type: 'selection',
	target: 'hrsc4',
    visible: true,
    renderBuffer: 0,
    source: new ol.source.Vector(),
    style: new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: 'rgba(255,255,255, 1.0)',
            width: 1
        })
    })
});
/* HRSC Level 3 Highlight layer*/
app.layer.Hrsc3Highlight = new ol.layer.Vector({
	type: 'selection',
	target: 'hrsc3',
    visible: false,
    renderBuffer: 0,
    source: new ol.source.Vector(),
    style: new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: 'rgba(255,255,255, 1.0)',
            width: 1
        })
    })
});
/* THEMIS ACRO Highlight layer*/
app.layer.ThemisAcrHighlight = new ol.layer.Vector({
	type: 'selection',
	target: 'themisacro',
    visible: true,
    renderBuffer: 0,
    source: new ol.source.Vector(),
    style: new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: 'rgba(255, 0, 0, 1.0)',
            width: 1
        })
    })
});
/* CTX ACRO Highlight layer*/
app.layer.CtxAcrHighlight = new ol.layer.Vector({
	type: 'selection',
	target: 'ctxacro',
    visible: true,
    renderBuffer: 0,
    source: new ol.source.Vector(),
    style: new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: 'rgba(0, 0, 255, 1.0)',
            width: 1
        })
    })
});
/* MOC ACRO Highlight layer*/
app.layer.MocAcrHighlight = new ol.layer.Vector({
	type: 'selection',
	target: 'mocacro',
    visible: true,
    renderBuffer: 0,
    source: new ol.source.Vector(),
    style: new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: 'rgba(0, 255, 0, 1.0)',
            width: 1
        })
    })
});
/* THEMIS ACRO Footprints WMS */
app.layer.ThemisAcrWms = new ol.layer.Tile({
	preload: 5,
	title: "MO THEMIS VIS ACRO (UCL)",
	infodoc: 'src/acro-db-themis.html',
	visible: false,
	source: new ol.source.TileWMS({
		url: 'http://'+app.ogchost+app.cgi+'TIME=' + app.startTime.toISOString() + '/' + app.stopTime.toISOString() + '&',
		params: {
			LAYERS: 'themisacro',
			VERSION: '1.3.0',
			TILED: true
		},
		wrapX: true
	})
})
/* CTX ACRO Footprints WMS */
app.layer.CtxAcrWms = new ol.layer.Tile({
	preload: 5,
	title: "MRO CTX ACRO (UCL)",
	infodoc: 'src/acro-db-ctx.html',
	visible: false,
	source: new ol.source.TileWMS({
		url: 'http://'+app.ogchost+app.cgi+'TIME=' + app.startTime.toISOString() + '/' + app.stopTime.toISOString() + '&',
		params: {
			LAYERS: 'ctxacro',
			VERSION: '1.3.0',
			TILED: true
		},
		wrapX: true
	})
})
/* MOC ACRO Footprints WMS*/
app.layer.MocAcrWms = new ol.layer.Tile({
	preload: 5,
	title: "MGS MOC NA ACRO (UCL)",
	infodoc: 'src/acro-db-moc.html',
	visible: false,
	source: new ol.source.TileWMS({
		url: 'http://'+app.ogchost+app.cgi+'TIME='+app.startTime.toISOString()+'/'+app.stopTime.toISOString()+'&',
		params: {
			LAYERS: 'mocacro',
			VERSION: '1.3.0',
			TILED: true
		},
		wrapX: true
	})
})
/* HRSC ND4 Footprints WMS*/
app.layer.hrsc4NdWms = new ol.layer.Tile({
	preload: 5,
	title: "MEx HRSC ND4",
	infodoc: 'src/hrsc-nd4a.html',
	visible: false,
	source: new ol.source.TileWMS({
		url: 'http://'+app.ogchost+app.cgi+'TIME='+app.startTime.toISOString()+'/'+app.stopTime.toISOString()+'&',
		params: {
			LAYERS: 'hrsc4andcopy',
			VERSION: '1.1.1',
			TILED: true
		},
		wrapX: true
	})
});
/* HRSC ND2 Footprints UCL WMS*/
app.layer.hrsc2NdUclWms = new ol.layer.Tile({
	preload: 5,
	//title: "MEx HRSC (UCL)",
	infodoc: 'src/hrsc-nd4a.html',
	visible: false,
	validsrs: 'sps',
	source: new ol.source.TileWMS({
		url: 'http://'+app.ogchost+app.cgi+'TIME='+app.startTime.toISOString()+'/'+app.stopTime.toISOString()+'&',
		params: {
			LAYERS: 'hrsc2nducl',
			VERSION: '1.1.1',
			TILED: true
		},
		wrapX: true
	})
});
/* HRSC ND3 Footprints WMS*/
app.layer.hrsc3NdWms = new ol.layer.Tile({
	preload: 5,
	title: "MEx HRSC ND3",
	infodoc: 'src/hrsc-nd4a.html',
	visible: false,
	source: new ol.source.TileWMS({
		url: 'http://'+app.ogchost+app.cgi+'TIME='+app.startTime.toISOString()+'/'+app.stopTime.toISOString()+'&',
		params: {
			LAYERS: 'hrsc3nd',
			VERSION: '1.1.1',
			TILED: true
		},
		wrapX: true
	})
});
/* CTX ORI Footprints WMS*/
app.layer.ctxOriUclFoots = new ol.layer.Image({
	title: "MRO CTX footprints (UCL)",
	opacity: 1,
	infodoc: "src/ctx-ori-footprints.html",
	source: new ol.source.ImageWMS({
		serverType: 'mapserver',
		params: {
			LAYERS: 'ctxorifoot',
			VERSION: '1.3.0'
		},
		url: 'http://'+app.ogchost+app.cgi
	}),
	visible: false
});
/*
 * CTX ORI VIRTUAL MOSAIC images
 */
app.layer.ctxOriUcl = new ol.layer.Tile({
	preload: 5,
	title: "MRO CTX Images (UCL)",
	infodoc: "src/ctx-ori-footprints.html",
	visible: false,
	source: new ol.source.TileWMS({
		url: 'http://'+app.ogchost+app.cache,
		params: {
			LAYERS: 'ucl-ctx-ori',
			VERSION: '1.3.0',
			TILED: true
		},
		wrapX: true
	})
})
// Uos CTX Orthos
app.layer.ctxOriUos = new ol.layer.Tile({
	preload: 5,
	title: "MRO CTX Images (UoS)",
	infodoc: "src/ctx-ori-footprints.html",
	visible: false,
	source: new ol.source.TileWMS({
		url: 'http://'+app.ogchost+app.cache,
		params: {
			LAYERS: 'uos-ctx-ori',
			VERSION: '1.3.0',
			TILED: true
		},
		wrapX: true
	})
})
// UoS footprints
app.layer.ctxOriUosFoots = new ol.layer.Image({
	title: "MRO CTX footprints (UoS)",
	opacity: 1,
	infodoc: "src/ctx-ori-footprints.html",
	source: new ol.source.ImageWMS({
		serverType: 'mapserver',
		params: {
			LAYERS: 'ctxorthouosfoot',
			VERSION: '1.3.0'
		},
		url: 'http://'+app.ogchost+app.cgi
	}),
	visible: false
});
/*
 * CTX DTM VIRTUAL MOSAIC images
 */
app.layer.ctxDtmsUcl = new ol.layer.Tile({
	preload: 5,
	title: "MRO CTX DTMs (UCL)",
	infodoc: "src/ctx-dtms-ucl.html",
	legenddoc: "heightLegend",
	visible: true,
	source: new ol.source.TileWMS({
		url: 'http://'+app.ogchost+app.cache,
		params: {
			LAYERS: 'ucl-ctx-dtms',
			VERSION: '1.3.0',
			TILED: true
		},
		wrapX: true
	})
})
// UoS CTX DTMs
app.layer.ctxDtmsUos = new ol.layer.Tile({
	preload: 5,
	title: "MRO CTX DTMs (UoS)",
	infodoc: "src/ctx-dtms-uos.html",
	legenddoc: "heightLegend",
	visible: true,
	source: new ol.source.TileWMS({
		url: 'http://'+app.ogchost+app.cache,
		params: {
			LAYERS: 'uos-ctx-dtms',
			VERSION: '1.3.0',
			TILED: true
		},
		wrapX: true
	})
})
/* CTX Stereo Footprints WMS*/
app.layer.CtxZmorattoStereo = new ol.layer.Image({
	title: "MRO CTX ZM stereo coverage",
	opacity: 1,
	infodoc: "src/ctx-stereo-zmoratto.html",
	source: new ol.source.ImageWMS({
		serverType: 'mapserver',
		params: {
			LAYERS: 'ctxstereo',
			VERSION: '1.3.0'
		},
		url: 'http://'+app.ogchost+app.cgi
	}),
	visible: false
});
/* CTX Stereo Footprints WMS*/
app.layer.CtxPanosStereo = new ol.layer.Image({
	title: "MRO CTX PS stereo pairs",
	opacity: 1,
	infodoc: "src/ctx-stereo-panos.html",
	source: new ol.source.ImageWMS({
		serverType: 'mapserver',
		params: {
			LAYERS: 'ctxstereopanos',
			VERSION: '1.3.0'
		},
		url: 'http://'+app.ogchost+app.cgi
	}),
	visible: false
});
/*
 * Hirise DTM UA VIRTUAL MOSAIC images
 */
app.layer.HiriseDtmUa = new ol.layer.Tile({
	preload: 5,
	title: "MRO Hirise DTMs (UA)",
	legenddoc: "heightLegend",
	infodoc: "src/hirise-dtms-ua.html",
	visible: true,
	source: new ol.source.TileWMS({
		url: 'http://'+app.ogchost+app.cache,
		params: {
			LAYERS: 'ua-hirise-dtms',
			VERSION: '1.3.0',
			TILED: true
		},
		wrapX: true
	})
});
/*
 * Hirise DTM UCL VIRTUAL MOSAIC images
 */
app.layer.HiriseDtmUcl = new ol.layer.Tile({
	preload: 5,
	title: "MRO Hirise DTMs (UCL)",
	legenddoc: "heightLegend",
	infodoc: "src/hirise-dtms-ucl.html",
	visible: true,
	source: new ol.source.TileWMS({
		url: 'http://'+app.ogchost+app.cache,
		params: {
			LAYERS: 'ucl-hirise-dtms',
			VERSION: '1.3.0',
			TILED: true
		},
		wrapX: true
	})
});
/*
 * CTX DTM VIRTUAL MOSAIC values
 */
app.layer.ctxDtm = new ol.layer.Tile({
	preload: 5,
	visible: false,
	source: new ol.source.TileWMS({
		url: 'http://'+app.ogchost+app.cgi,
		params: {
			LAYERS: 'ucl-ctx-dtms-value',
			VERSION: '1.3.0',
			TILED: true
		},
		wrapX: true
	})
})
/* MOC Full ODE Catalogue */
app.layer.mocode = new ol.layer.Tile({
	preload: 5,
	title: "MGS MOC NA SDP Footprints",
	infodoc: "src/ode-db-moc.html",
	visible: false,
	validsrs: 'eqc sps',
	source: new ol.source.TileWMS({
		url: 'http://'+app.ogchost+app.cgi+'TIME=' + app.startTime.toISOString() + '/' + app.stopTime.toISOString(),
		params: {
			LAYERS: 'moc-ode',
			VERSION: '1.3.0',
			TILED: true
		},
		wrapX: true
	})
})
/* CTX Full ODE Catalogue */
app.layer.ctxode = new ol.layer.Tile({
	preload: 5,
	title: "MRO CTX EDR Footprints",
	infodoc: "src/ode-db-ctx.html",
	visible: false,
	validsrs: 'eqc sps',
	source: new ol.source.TileWMS({
		url: 'http://'+app.ogchost+app.cgi+'TIME=' + app.startTime.toISOString() + '/' + app.stopTime.toISOString(),
		params: {
			LAYERS: 'ctx-ode',
			VERSION: '1.3.0',
			TILED: true
		},
		wrapX: true
	})
})
/* Hirise Full ODE Catalogue */
app.layer.hiriseedrode = new ol.layer.Tile({
	preload: 5,
	title: "MRO HiRISE RDR Footprints",
	infodoc: "src/ode-db-hirise.html",
	visible: false,
    validsrs: 'eqc sps',
	source: new ol.source.TileWMS({
		url: 'http://'+app.ogchost+app.cgi+'TIME=' + app.startTime.toISOString() + '/' + app.stopTime.toISOString(),
		params: {
			LAYERS: 'hirise-rdr-ode',
			VERSION: '1.3.0',
			TILED: true
		},
		wrapX: true
	})
})
/* Hirise DTM ODE Catalogue */
app.layer.hirisedtmode = new ol.layer.Tile({
	preload: 5,
	title: "MRO HiRISE DTM Footprints",
	infodoc: "src/ode-db-hirise-dtm.html",
	visible: false,
    validsrs: 'eqc sps',
	source: new ol.source.TileWMS({
		url: 'http://'+app.ogchost+app.cgi,
		params: {
			LAYERS: 'hirise-dtm-ode',
			VERSION: '1.3.0',
			TILED: true
		},
		wrapX: true
	})
})
/* Hirise Stereo by Panos (JMars) */
app.layer.hiriseStereo = new ol.layer.Tile({
	preload: 5,
	title: "MRO HiRISE Stereo Pairs",
	infodoc: "src/hirise-stereo.html",
	visible: false,
	source: new ol.source.TileWMS({
		url: 'http://'+app.ogchost+app.cgi+'TIME=' + app.startTime.toISOString() + '/' + app.stopTime.toISOString(),
		params: {
			LAYERS: 'hirise-dtm-ode',
			VERSION: '1.3.0',
			TILED: true
		},
		wrapX: true
	})
})
/* THEMIS Full ODE Catalogue */
app.layer.themisode = new ol.layer.Tile({
	preload: 5,
	title: "MO THEMIS VIS EDR Footprints",
	infodoc: "src/ode-db-themis.html",
	visible: false,
    validsrs: 'eqc sps',
	source: new ol.source.TileWMS({
		url: 'http://'+app.ogchost+app.cgi+'TIME=' + app.startTime.toISOString() + '/' + app.stopTime.toISOString(),
		params: {
			LAYERS: 'themis-visedr',
			VERSION: '1.3.0',
			TILED: true
		},
		wrapX: true
	})
})
/*
 * Mars Nomenclature
 */
app.layer.nomenclature = new ol.layer.Image({
	title: "Mars nomenclature",
	opacity: 1,
	infodoc: "src/nomenclature.html",
	source: new ol.source.ImageWMS({
		serverType: 'mapserver',
		params: {
			LAYERS: 'nomenclature',
			VERSION: '1.3.0'
		},
		url: 'http://'+app.ogchost+app.cgi
	}),
	visible: false
})

/*
 * MC30 scheme
 */
app.layer.scheme = new ol.layer.Image({
	title: "Quad scheme MC30",
	opacity: 1,
	infodoc: "src/quadscheme.html",
	source: new ol.source.ImageWMS({
		serverType: 'mapserver',
		params: {
			LAYERS: 'mc30',
			VERSION: '1.3.0'
		},
		url: 'http://'+app.ogchost+app.cgi
	}),
	visible: false
})

/*
 * Landing Sites Spots
 */
app.layer.landingsites = new ol.layer.Image({
	title: "Landing sites markers",
	opacity: 1,
	infodoc: "src/landingsites.html",
	source: new ol.source.ImageWMS({
		serverType: 'mapserver',
		params: {
			LAYERS: 'landingsites',
			VERSION: '1.3.0'
		},
		url: 'http://'+app.ogchost+app.cgi
	}),
	visible: false
})
/*
 * Vector HIGHLIGHT Layer
 */
app.layer.highlight = new ol.layer.Vector({
    //title: 'Vector',
    source: new ol.source.Vector({
        wrapX: false
    }),
    visible: true
});

/*
 * CONTROLS
 */
app.MousePosition = new ol.control.MousePosition({
	coordinateFormat: ol.coordinate.createStringXY(2),
	projection: app.projection49900,
	className: 'ol-mouse-position ol-control',
	prefix: 'Mouse pos. (lon, lat):', 
	undefinedHTML: '&nbsp;',
});
app.FullScreen = new ol.control.FullScreen();
app.Attribution = new ol.control.Attribution({
	collapsible: false,
	label: '© i-Mars<br>UCL/DLR/FUB',
	collapseLabel: '©',
	})
app.ZoomToExtent = new ol.control.ZoomToExtent({
	extent: [-2813075.3281640625, -2411951.623962891, 2813075.3281640625, 2411951.623962891], //center with four quads
	label: 'O',
	tipLabel: 'Zoom to MC11E'
});
app.ScaleLine = new ol.control.ScaleLine();
app.Toolbar = new ol.control.Toolbar();
app.LayerSwitcher = new ol.control.LayerSwitcher();
app.ZoomSlider = new ol.control.ZoomSlider();
app.LoadingPanel = new ol.control.LoadingPanel({
  widget: 'progressbar',
  progressMode: 'tile'
});
app.timePanel = new ol.control.TimePanel();
app.Goto = new ol.control.Goto();

app.ProjectionSwitcher = new ol.control.ProjectionSwitcher(projSwitchConfig);

app.controls = new ol.control.defaults({
    attribution: false
}).extend([
   app.MousePosition,
   app.FullScreen,
   app.Attribution,
   app.Toolbar,
   app.ZoomToExtent,
   app.ScaleLine,
   app.LayerSwitcher,
   app.timePanel,
   app.ZoomSlider,
   app.LoadingPanel,
   app.Goto,
   app.ProjectionSwitcher
]);


/*
 * VIEW
 */
app.view = new ol.View({
    projection: app.projection49910,
    extent: app.projextent49910,
    center: ol.proj.transform([-11.25,15], 'EPSG:49900', 'EPSG:49910'),
    zoom: 4,
    maxZoom: 16,
    minZoom: 2
})

/*
 * LAYER
 */
app.AcrCatsGroup = new ol.layer.Group({
    title: 'Orthoimage footprints',
    unfolded: false,
    visible: false,
    layers: [
    	app.layer.hrsc4NdWms,
        app.layer.ThemisAcrWms,
        app.layer.CtxAcrWms,
        app.layer.MocAcrWms
    ]
});
app.OdeCatsGroup = new ol.layer.Group({
    'title': 'PDS ODE image footprints',
    unfolded: false,
    visible: false,
    validsrs: 'eqc sps',
    layers: [
        app.layer.themisode,
        app.layer.mocode,
        app.layer.ctxode,
        app.layer.hirisedtmode,
        app.layer.hiriseedrode,
    ]
});
// All into one
app.DynImageGroup = new ol.layer.Group({
    visible: true,
    type: 'dynamic',
    sortable: true,
    layers: []
});
app.DynSepGroupTitle = 'Dynamic images';
app.DynSepGroup = new ol.layer.Group({
	'type': 'separator'
});
/*
 * Map
 */
app.map = new ol.Map({
    target: 'map',
    controls: app.controls,
    layers: [
    	app.layer.molagray,
    	app.layer.molacolor,
        new ol.layer.Group({
			'title': 'HRSC Digital Terrain Models',
			legenddoc: "heightLegend",
			'unfolded': true,
			visible: true,
            validsrs: 'eqc sps',
			layers: [
				app.layer.hrscsingledtms,
				app.layer.hrscuclsingledtms,
				app.layer.hrscDtmMosaics			
			]
		}),
		new ol.layer.Group({
			'title': 'CTX/HiRISE Digital Terrain Models',
			legenddoc: "heightLegend",
			'visible': false,
            'unfolded': false,
            layers: [
            	app.layer.ctxDtmsUos,
            	app.layer.ctxDtmsUcl,
            	app.layer.HiriseDtmUa,
            	app.layer.HiriseDtmUcl
            ]
		}),
        new ol.layer.Group({
            'title': 'MEx HRSC image mosaics',
            'visible': false,
            'unfolded': false,
            layers: [
                app.layer.hrscCol,
                app.layer.hrscPan
            ]
        }),
        new ol.layer.Group({
            'title': 'CTX/HiRISE OrthoRectified Images',
            'visible': false,
            'unfolded': false,
            layers: [
            	app.layer.ctxOriUosFoots,
				app.layer.ctxOriUclFoots,
				app.layer.ctxOriUos,
				app.layer.ctxOriUcl
            ]
        }),
        app.layer.ctxMosaic,
        app.layer.repeatcov,
        new ol.layer.Group({
        	'title': 'Static raster layers',
        	'type': 'separator'
        }),
        new ol.layer.Group({
            'title': 'Vector maps',
            'visible': false,
            'unfolded': false,
            layers: [
                app.layer.nomenclature,
                app.layer.scheme,
                app.layer.landingsites
            ]
        }),
        app.OdeCatsGroup,
        app.layer.hrsc2NdUclWms,
        new ol.layer.Group({
        	'title': 'Static vector layers',
        	'type': 'separator'
        }),
		app.AcrCatsGroup,
		new ol.layer.Group({
        	'title': 'Query vector layers',
        	'type': 'separator'
        }),
		app.DynImageGroup,
		new ol.layer.Group({
			'type': 'sortpanel'
		}),
		app.DynSepGroup,
		app.layer.ThemisAcrHighlight,
		app.layer.CtxAcrHighlight,
		app.layer.MocAcrHighlight,
		app.layer.HrscHighlight,
		app.layer.Hrsc3Highlight,
		app.layer.highlight,
		app.layer.DtmMola,
		app.layer.DtmSingleHrsc,
		app.layer.ctxDtm,
		app.layer.DtmSingleHrscUcl
    ],
    view: app.view
});

app.LayerSwitcher.showPanel();

app.updateTimesonWmsLayers = function() {
	app.layer.ThemisAcrWms.getSource().setUrl('http://'+app.ogchost+app.cgi+'TIME=' + app.startTime.toISOString() + '/' + app.stopTime.toISOString() + '&');
	app.layer.CtxAcrWms.getSource().setUrl('http://'+app.ogchost+app.cgi+'TIME=' + app.startTime.toISOString() + '/' + app.stopTime.toISOString() + '&');
	app.layer.MocAcrWms.getSource().setUrl('http://'+app.ogchost+app.cgi+'TIME=' + app.startTime.toISOString() + '/' + app.stopTime.toISOString() + '&');
	app.layer.themisode.getSource().setUrl('http://'+app.ogchost+app.cgi+'TIME=' + app.startTime.toISOString() + '/' + app.stopTime.toISOString() + '&');
	app.layer.ctxode.getSource().setUrl('http://'+app.ogchost+app.cgi+'TIME=' + app.startTime.toISOString() + '/' + app.stopTime.toISOString());
	app.layer.hiriseedrode.getSource().setUrl('http://'+app.ogchost+app.cgi+'TIME=' + app.startTime.toISOString() + '/' + app.stopTime.toISOString() + '&');
	app.layer.mocode.getSource().setUrl('http://'+app.ogchost+app.cgi+'TIME=' + app.startTime.toISOString() + '/' + app.stopTime.toISOString() + '&');
	app.layer.hrsc4NdWms.getSource().setUrl('http://'+app.ogchost+app.cgi+'TIME=' + app.startTime.toISOString() + '/' + app.stopTime.toISOString() + '&');
	app.layer.hrsc3NdWms.getSource().setUrl('http://'+app.ogchost+app.cgi+'TIME=' + app.startTime.toISOString() + '/' + app.stopTime.toISOString() + '&');
	app.layer.hrsc2NdUclWms.getSource().setUrl('http://'+app.ogchost+app.cgi+'TIME=' + app.startTime.toISOString() + '/' + app.stopTime.toISOString() + '&');
}

app.timePanel.utcSlider.on('slideStop', function(e) {
	app.startTime= new Date(e[0]);
	app.stopTime= new Date(e[1]);
	app.updateTimesonWmsLayers();
});
app.timePanel.date1.onchange=function(e){
	app.timePanel.timeChanged('earth',e);
	app.updateTimesonWmsLayers();
};
app.timePanel.date2.onchange=function(e){
	app.timePanel.timeChanged('earth',e);
	app.updateTimesonWmsLayers();
};
app.timePanel.year1.onchange=function(e){
	app.timePanel.timeChanged('mars',e);
	app.updateTimesonWmsLayers();
};
app.timePanel.year2.onchange=function(e){
	app.timePanel.timeChanged('mars',e);
	app.updateTimesonWmsLayers();
};
app.timePanel.sol1.onchange=function(e){
	app.timePanel.timeChanged('mars',e);
	app.updateTimesonWmsLayers();
};
app.timePanel.sol2.onchange=function(e){
	app.timePanel.timeChanged('mars',e);
	app.updateTimesonWmsLayers();
};
/**** GOTO ****/
// fills the lat/lon input boxes with current map center coordinates
app.map.on('moveend', function() {
    var mapCenter = app.map.getView().getCenter();
    if (app.ProjectionSwitcher.currentPrefix=='eqc') {
        var nMapCenter = ol.proj.transform(mapCenter, 'EPSG:49910', 'EPSG:49900')
		app.Goto.lonInput.value = Number((nMapCenter[0]).toFixed(2));
    	app.Goto.latInput.value = Number((nMapCenter[1]).toFixed(2));
    }
    else if (app.ProjectionSwitcher.currentPrefix=='sps') {
    }
});

// unique
function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

function zoomToSelection() {
	var bounds=ol.extent.createEmpty();
	bounds = ol.extent.extend(bounds, app.layer.MocAcrHighlight.getSource().getExtent());
	bounds = ol.extent.extend(bounds, app.layer.ThemisAcrHighlight.getSource().getExtent());
	bounds = ol.extent.extend(bounds, app.layer.CtxAcrHighlight.getSource().getExtent());
	bounds = ol.extent.extend(bounds, app.layer.HrscHighlight.getSource().getExtent());
	bounds = ol.extent.extend(bounds, app.layer.Hrsc3Highlight.getSource().getExtent());
	app.map.getView().fit(bounds, app.map.getSize());
}

function toggleSelectionVisibility() {
	if (app.Toolbar.toggleSelection.getAttribute('active') != 'active' ) {
		app.layer.ThemisAcrHighlight.setVisible(false);
		app.layer.CtxAcrHighlight.setVisible(false);
		app.layer.MocAcrHighlight.setVisible(false);
		app.layer.Hrsc3Highlight.setVisible(false);
		app.layer.HrscHighlight.setVisible(false);
		app.layer.highlight.setVisible(false);
		app.Toolbar.toggleSelection.classList.add('pushed');
    	app.Toolbar.toggleSelection.setAttribute('active','active');
	} else {
		app.layer.ThemisAcrHighlight.setVisible(true);
		app.layer.CtxAcrHighlight.setVisible(true);
		app.layer.MocAcrHighlight.setVisible(true);
		app.layer.HrscHighlight.setVisible(true);
		app.layer.Hrsc3Highlight.setVisible(true);
		app.layer.highlight.setVisible(true);
		app.Toolbar.toggleSelection.classList.remove('pushed');
    	app.Toolbar.toggleSelection.removeAttribute('active');
	}
	
}

function clearSelection() {
	// Deactivating Build Layers Button
	app.LayerSwitcher.stopCycleLyrs_();
	app.Toolbar.buildLayers.setAttribute('disabled','disabled');
	app.Toolbar.buildLayers.classList.add('disabled');
	// Disable toggleSelection
	app.Toolbar.toggleSelection.setAttribute('disabled','disabled');
	app.Toolbar.toggleSelection.classList.add('disabled');
	app.Toolbar.toggleSelection.classList.remove('pushed');
	// Disable clearSelection
	app.Toolbar.clearSelection.setAttribute('disabled','disabled');
	app.Toolbar.clearSelection.classList.add('disabled');
	// Disable ZoomToSelect
	app.Toolbar.zoomToSelection.setAttribute('disabled','disabled');
	app.Toolbar.zoomToSelection.classList.add('disabled');
	app.layer.ThemisAcrHighlight.getSource().clear();
    app.layer.MocAcrHighlight.getSource().clear();
    app.layer.CtxAcrHighlight.getSource().clear();
    app.layer.HrscHighlight.getSource().clear();
    app.layer.Hrsc3Highlight.getSource().clear();

	// Disable info Button and clear highlight layer
	//app.Toolbar.info.setAttribute('disabled','disabled');
	//app.Toolbar.info.classList.add('disabled');
	app.Toolbar.info.classList.remove('pushed');
   	app.layer.highlight.getSource().clear();
    var layers = document.getElementsByClassName('layer');
    for (var j = 0; j < layers.length; j++) {
        layers[j].style.border = '';
        layers[j].style.backgroundColor = '';
    };

    //Clear Image Layer and reload Panel
    app.DynImageGroup.getLayers().clear();
    app.LayerSwitcher.sortPanelActive=false;
    app.DynImageGroup.unset('title');
    app.LayerSwitcher.renderPanel();
    app.dynamicLayersOn=null;

}

app.dynamicLayersOn = null;

function rebuildLayers(evt) {
	if ( app.layer.CtxAcrHighlight.getSource().getFeatures()==0 && app.layer.ThemisAcrHighlight.getSource().getFeatures()==0 && app.layer.MocAcrHighlight.getSource().getFeatures()==0 && app.layer.HrscHighlight.getSource().getFeatures()==0 && app.layer.Hrsc3Highlight.getSource().getFeatures()==0) {
		// Activating Build Layers Button
    	clearSelection();
    	app.dynamicLayersOn = null;
    	app.DynImageGroup.unset('title');
		app.LayerSwitcher.sortPanelActive=false;
	} else {
		app.DynImageGroup.set('title', 'Orthorectified images');
		app.LayerSwitcher.sortPanelActive=true;
	}
    	
	// collapse timePanel
	$('.time-panel').addClass('collapsed');
    $('.time-panel-button i').removeClass('fa-chevron-circle-right');
    $('.time-panel-button i').addClass('fa-chevron-circle-left');
	
	// Removing push state on selectSingle Button
    app.Toolbar.selectSingle.classList.remove('pushed');
    app.Toolbar.selectSingle.removeAttribute('active');   
	
    // Removing push state on selectBox Button
    //app.Toolbar.selectBox.classList.remove('pushed');
    //app.map.removeInteraction(app.dragBox);

    // Activating info Button
    app.Toolbar.info.removeAttribute('disabled');
	app.Toolbar.info.classList.remove('disabled');

    document.body.style.cursor = "default";

	app.dynamicLayersOn = true;
    
    app.DynImageGroup.getLayers().clear();
    app.map.getLayers().forEach(function(l, idx, a) {
    	if (l.get('type') === 'selection') {
			var features = l.getSource().getFeatures();
			for (var feature of features) {
				var tmpSource = new ol.source.TileWMS({
					url: 'http://'+app.ogchost+app.cache,
					params: {
						LAYERS: l.get('target'),
						VERSION: '1.3.0',
						TILED: true,
						PRODUCTID: feature.getProperties().file_name
            		},
					serverType: 'mapserver',
					wrapX: false
				});
				//var testtime=new Date('2001/01/31 12:00:00'); //works in firefox
				var time=feature.getProperties().start_time.substring(0,19);
				time=time.replace(/-/g,'/');
				// "2005-04-10 17:48:31.803" // doesnt work in firefox
				var date=new Date(time);
				console.dir(feature.getProperties().source_product_id);
				var tmpTile = new ol.layer.Tile({
					title: feature.getProperties().source_product_id,
					time: date,
					resolution: feature.getProperties().map_scale,
					visible: true,
					source: tmpSource,
					type: 'dynamic'
				});
        	app.DynImageGroup.getLayers().push(tmpTile);
			}
    	}
    });

	app.layer.highlight.getSource().clear();
    
	// Sort Layers
	app.LayerSwitcher.sortLayerGroup_(app.DynImageGroup);

    app.LayerSwitcher.renderPanel();

    // Activating Cycle Button
    app.Toolbar.play.removeAttribute('disabled');
    app.Toolbar.play.classList.remove('disabled');
	
    app.LoadingPanel.setup();
}

app.timePanelStatus=null;

app.dragBox = new ol.interaction.DragBox({
    //condition: ol.events.condition.platformModifierKeyOnly
});

app.selectBoxActive = null;

app.dragBox.on('boxstart', function() {
    app.layer.ThemisAcrHighlight.getSource().clear();
    app.layer.CtxAcrHighlight.getSource().clear();
    app.layer.MocAcrHighlight.getSource().clear();
    app.layer.HrscHighlight.getSource().clear();
    app.layer.Hrsc3Highlight.getSource().clear();
    //document.body.style.cursor = "default";
});

app.dragBox.on('boxend', function() {
    app.Toolbar.toggleSelection.setAttribute('active','active');
    toggleSelectionVisibility();
    var extent = app.dragBox.getGeometry().getExtent();
    app.layer.ThemisAcrHighlight.setVisible(true);
    app.layer.ThemisAcrHighlight.getSource().clear();
    if ( app.layer.ThemisAcrWms.get('visible')) {
	highlightFeaturesFromSelectBoxWMS(extent, 'themisacro', app.layer.ThemisAcrHighlight);
    }
    app.layer.MocAcrHighlight.setVisible(true);
    app.layer.MocAcrHighlight.getSource().clear();
    if ( app.layer.MocAcrWms.get('visible')) {
    	highlightFeaturesFromSelectBoxWMS(extent, 'mocacro', app.layer.MocAcrHighlight);
    }
    app.layer.CtxAcrHighlight.setVisible(true);
    app.layer.CtxAcrHighlight.getSource().clear();
    if ( app.layer.CtxAcrWms.get('visible')) {
        highlightFeaturesFromSelectBoxWMS(extent, 'ctxacro', app.layer.CtxAcrHighlight);
    }
    app.layer.HrscHighlight.setVisible(true);
    app.layer.HrscHighlight.getSource().clear();
    if ( app.layer.hrsc4NdWms.get('visible')) {
    	highlightFeaturesFromSelectBoxWMS(extent, 'hrsc4andcopy', app.layer.HrscHighlight);
    }
    app.layer.Hrsc3Highlight.setVisible(true);
    app.layer.Hrsc3Highlight.getSource().clear();
    if ( app.layer.hrsc3NdWms.get('visible')) {
    	highlightFeaturesFromSelectBoxWMS(extent, 'hrsc3nd', app.layer.Hrsc3Highlight);
    }
    app.selectBoxActive = null;
    app.map.removeInteraction(app.dragBox);

    // Removing push state on selectBox Button
    //app.Toolbar.selectBox.classList.remove('pushed');

    // Activating Build Layers Button
    app.Toolbar.buildLayers.removeAttribute('disabled');
    app.Toolbar.buildLayers.classList.remove('disabled');
    //enable toggleSelection Button
	app.Toolbar.toggleSelection.removeAttribute('disabled');
	app.Toolbar.toggleSelection.classList.remove('disabled');
	//console.dir(app.Toolbar.toogleSelection.classList);
	app.Toolbar.clearSelection.removeAttribute('disabled');
	app.Toolbar.clearSelection.classList.remove('disabled');
	//zoomToSelection Button
	app.Toolbar.zoomToSelection.removeAttribute('disabled');
	app.Toolbar.zoomToSelection.classList.remove('disabled');
});

function highlightFeaturesFromSelectBoxWMS(extent, wmsLayer, highlightLayer) {
	var format = new ol.format.GeoJSON();
    var xhr = new XMLHttpRequest();
    var url = 'http://'+app.ogchost+app.cgi +
        'service=WFS&version=1.1.0&request=GetFeature&typename=' + wmsLayer + '&' +
        'outputFormat=geojson&srsname=EPSG:49910&' +
        'bbox=' + extent.join(',') + ',EPSG:49910';
    xhr.open("GET", url);
    xhr.onload = function() {
        try {
            var json = JSON.parse(xhr.responseText);
            var features = format.readFeatures(json);
            for (var feature of features) {
                if (feature.getProperties().start_time) {
                	utcstart = feature.getProperties().start_time;
                	if (new Date(utcstart) >= app.startTime && new Date(utcstart) <= app.stopTime) {
						highlightLayer.getSource().addFeature(feature);
					}
				} else if (feature.getProperties().STARTTIME) {
					//HRSC
					utcstart = feature.getProperties().STARTTIME;
					//console.dir(utcstart);
					if (new Date(utcstart) >= app.startTime && new Date(utcstart) <= app.stopTime) {
						highlightLayer.getSource().addFeature(feature);
					}
				} else {
					highlightLayer.getSource().addFeature(feature);
				}
            }
        } catch (e) {}
    }
    xhr.send();
}

function toggleDragBox() {
	if (app.selectBoxActive === null) {
		app.map.addInteraction(app.dragBox);
        document.body.style.cursor = "crosshair";
        app.selectBoxActive = 1;
        // Removing push state on selectSingle Button
    	app.Toolbar.selectSingle.classList.remove('pushed');
    	app.Toolbar.selectSingle.removeAttribute('active');
    } else {
        app.map.removeInteraction(app.dragBox);
        document.body.style.cursor = "default";
        app.selectBoxActive = null;
    }
}

// Global Cycling Variables
app.isCycling = null;
app.cycleArray = [];

function playCycleLayers() {
    app.LayerSwitcher.playCycleLyrs_();
}

function stopCycleLayers() {
    app.LayerSwitcher.stopCycleLyrs_();
}

function toggleInfo() {
	if (app.Toolbar.info.getAttribute('active') != 'active' ) {
		app.Toolbar.info.classList.add('pushed');
		app.Toolbar.info.setAttribute('active', 'active');
	} else {
		app.Toolbar.info.classList.remove('pushed');
		app.Toolbar.info.removeAttribute('active');
		app.layer.highlight.getSource().clear();
		app.DynImageGroup.getLayers().forEach(function(lyr, idy, b) {
			lyr.set('highlight', false);
		});
    	app.LayerSwitcher.renderPanel();
	}
}

function changeProjection() {
	app.currentProjection=app.ProjectionSwitcher.currentProjection;
	app.cgi=app.currentProjection+'-bin/wms?';
	app.cache=app.currentProjection+'/'

	ol.control.LayerSwitcher.forEachRecursive(app.map, function(layer, idx, a) {
		if (typeof layer.getLayers === "function") {
		} else {
			if (layer.getSource() instanceof ol.source.TileWMS) {
				url=layer.getSource().getUrls()[0];
				res = url.replace(app.currentProjection, app.ProjectionSwitcher.currentProjection);
				layer.getSource().setUrl(res);
			} else if (layer.getSource() instanceof ol.source.ImageWMS) {
				url=layer.getSource().getUrl();
				res = url.replace(app.currentProjection, app.ProjectionSwitcher.currentProjection);
				layer.getSource().setUrl(res);
			}
    	}	
    });
}

// Toolbar buttons event listeners
ol.events.listen(app.Toolbar.selectSingle, ol.events.EventType.CLICK, goog.partial(toggleSingle, this));
//ol.events.listen(app.Toolbar.selectBox, ol.events.EventType.CLICK, goog.partial(toggleDragBox, this));
ol.events.listen(app.Toolbar.buildLayers, ol.events.EventType.CLICK, goog.partial(rebuildLayers, this));
ol.events.listen(app.Toolbar.play, ol.events.EventType.CLICK, goog.partial(playCycleLayers, this));
ol.events.listen(app.Toolbar.stop, ol.events.EventType.CLICK, goog.partial(stopCycleLayers, this));
ol.events.listen(app.Toolbar.zoomToSelection, ol.events.EventType.CLICK, goog.partial(zoomToSelection, this));
ol.events.listen(app.Toolbar.toggleSelection, ol.events.EventType.CLICK, goog.partial(toggleSelectionVisibility, this));
ol.events.listen(app.Toolbar.clearSelection, ol.events.EventType.CLICK, goog.partial(clearSelection, this));
ol.events.listen(app.Toolbar.info, ol.events.EventType.CLICK, goog.partial(toggleInfo, this));
//ol.events.listen(app.ProjectionSwitcher.select, ol.events.EventType.CLICK, goog.partial(changeProjection, this));
app.UtcDate=null;

app.popup = new ol.Overlay.Popup();
app.map.addOverlay(app.popup);

app.selectedFeatures=null;

app.map.on('singleclick', function(evt) {
	//console.dir(evt.coordinate);
	if (app.Toolbar.selectSingle.getAttribute('active') !== 'active' && app.Toolbar.info.getAttribute('active') !== 'active' ) {
		var content = '<h4>Topography info</h4><p>[heights relative to equipotential surface model <a target="new" href="http://pds-geosciences.wustl.edu/missions/mgs/megdr.html">GMM3</a>]</p>';
		if (app.map.getView().getProjection().getCode()=='EPSG:49910'){
			content += "<p>CTX single-strip DTM: <span id='ucldtmvalue'></span></p>";
		  	content += "<p>HRSC bba mosaic DTM: <span id='hrscmosaicvalue'></span></p>";
		}
		if (app.map.getView().getProjection().getCode()=='EPSG:49923'){
			content += "<p>HRSC ba single-strip DTM (UCL): <span id='hrscuclvalue'></span></p>";
		}
		content += "<p>HRSC ba single-strip DTM: <span id='hrscsinglevalue'></span></p>";
		content += "<p>MOLA DTM: <span id='molavalue'></span></p>";
		app.popup.show(evt.coordinate, content);
		getHeightvalueForSingleClickWMS(evt, app.layer.DtmMola,'molavalue');
		getHeightvalueForSingleClickWMS(evt, app.layer.DtmSingleHrsc, 'hrscsinglevalue');
		if (app.map.getView().getProjection().getCode()=='EPSG:49910'){
			getHeightvalueForSingleClickWMS(evt, app.layer.DtmMosaicHrsc, 'hrscmosaicvalue');
			getHeightvalueForSingleClickWMS(evt, app.layer.ctxDtm, 'ucldtmvalue');
		}
		if (app.map.getView().getProjection().getCode()=='EPSG:49923'){
		  getHeightvalueForSingleClickWMS(evt, app.layer.DtmSingleHrscUcl, 'hrscuclvalue');
		}
	}
	if (app.Toolbar.selectSingle.getAttribute('active') == 'active') {
    	app.Toolbar.toggleSelection.setAttribute('active','active');
    	toggleSelectionVisibility();
    	app.layer.ThemisAcrHighlight.setVisible(true);
    	app.layer.ThemisAcrHighlight.getSource().clear();
    	app.layer.CtxAcrHighlight.setVisible(true);
    	app.layer.CtxAcrHighlight.getSource().clear();
    	app.layer.MocAcrHighlight.setVisible(true);
    	app.layer.MocAcrHighlight.getSource().clear();
    	app.layer.HrscHighlight.setVisible(true);
    	app.layer.HrscHighlight.getSource().clear();
    	app.layer.Hrsc3Highlight.setVisible(true);
    	app.layer.Hrsc3Highlight.getSource().clear();
    	app.selectedFeatures=0;
    	if ( app.layer.ThemisAcrWms.get('visible')) {
    		highlightFeaturesFromSingleClickWMS(evt, app.layer.ThemisAcrWms, app.layer.ThemisAcrHighlight);
    	}
    	if ( app.layer.MocAcrWms.get('visible')) {
    		highlightFeaturesFromSingleClickWMS(evt, app.layer.MocAcrWms, app.layer.MocAcrHighlight);
    	}
    	if ( app.layer.CtxAcrWms.get('visible')) {
    		highlightFeaturesFromSingleClickWMS(evt, app.layer.CtxAcrWms, app.layer.CtxAcrHighlight);
    	}
    	if ( app.layer.hrsc4NdWms.get('visible')) {
    		highlightFeaturesFromSingleClickWMS(evt, app.layer.hrsc4NdWms, app.layer.HrscHighlight);
    	}
    	if ( app.layer.hrsc3NdWms.get('visible')) {
    		highlightFeaturesFromSingleClickWMS(evt, app.layer.hrsc3NdWms, app.layer.Hrsc3Highlight);
    	}
		// Activating Build Layers Button
		app.Toolbar.buildLayers.removeAttribute('disabled');
		app.Toolbar.buildLayers.classList.remove('disabled');
		//enable toggleSelection Button
		app.Toolbar.toggleSelection.removeAttribute('disabled');
		app.Toolbar.toggleSelection.classList.remove('disabled');
		//enable clearSelection Button
		app.Toolbar.clearSelection.removeAttribute('disabled');
		app.Toolbar.clearSelection.classList.remove('disabled');
		//zoomToSelection Button
		app.Toolbar.zoomToSelection.removeAttribute('disabled');
		app.Toolbar.zoomToSelection.classList.remove('disabled');
		//app.LayerSwitcher.toggleSortPanel_();
		app.LayerSwitcher.sortPanelActive=true;
		app.LayerSwitcher.renderPanel();
    } else if (app.Toolbar.info.getAttribute('active')=='active' && app.dynamicLayersOn) {
    	selectDynImageInLayerList (evt);
    } else if (app.Toolbar.info.getAttribute('active')=='active' && app.dynamicLayersOn===null) {
		attributePopup(evt);
    }
});
function getHeightvalueForSingleClickWMS(evt, layer, spanid) {
	var features=[];
	var height=null;
	var text='';
	var url = layer.getSource().getGetFeatureInfoUrl(
		evt.coordinate, app.map.getView().getResolution(), app.map.getView().getProjection(),
		{
			'INFO_FORMAT': 'application/json'
	});
	if (url) {
		var format = new ol.format.GeoJSON();
		var xhr = new XMLHttpRequest();
		var span=document.getElementById(spanid);
		xhr.open("GET", url);
		xhr.onload = function () {
			try {
				var json = JSON.parse(xhr.responseText);
				features = format.readFeatures(json);
				for (var feature of features) {
					height=feature.getProperties().value_list;
					height=Number((height)).toFixed(0);
					if (height<-32767) {
						text='N/A'
					} /*else if (height<0) {
						text=-height+' m below GMM3.'
					} else {
						text=height+' m above GMM3.'
					}*/
					else {text=height+' m.'};
					span.innerHTML=text;
				}
			} catch (e) {
				span.innerHTML='N/A';
			}
		}
		xhr.send();
	}
}


function toggleSingle() {
	if (app.Toolbar.selectSingle.getAttribute('active') != 'active') {
		// Disable info Button and clear highlight layer
		app.Toolbar.info.setAttribute('disabled','disabled');
		app.Toolbar.info.classList.add('disabled');
		app.Toolbar.info.classList.remove('pushed');
		//app.Toolbar.selectBox.classList.remove('pushed');
        document.body.style.cursor = "crosshair";
        app.Toolbar.selectSingle.setAttribute('active','active');
        app.map.removeInteraction(app.dragBox);
		app.selectBoxActive = null;
    } else {
    	app.Toolbar.selectSingle.removeAttribute('active');
        document.body.style.cursor = "default";
        app.Toolbar.info.removeAttribute('disabled','disabled');
		app.Toolbar.info.classList.remove('disabled');
    }
}

function highlightFeaturesFromSingleClickWMS(evt, wmsLayer, highlightLayer) {
	var features=[];
	var url = wmsLayer.getSource().getGetFeatureInfoUrl(
		evt.coordinate, app.map.getView().getResolution(), app.projection49910,
		{
			'INFO_FORMAT': 'application/json',
			'FEATURE_COUNT': '100'
	});
	if (url) {
		var format = new ol.format.GeoJSON();
		var xhr = new XMLHttpRequest();
		xhr.open("GET", url);
		xhr.onload = function () {
			try {
				var json = JSON.parse(xhr.responseText);
				features = format.readFeatures(json);
				for (var feature of features) {
					if (feature.getProperties().utcstart) {
						if (new Date(feature.getProperties().utcstart) >= app.startTime && new Date(feature.getProperties().utcstart) <= app.stopTime) {
							highlightLayer.getSource().addFeature(feature);
						}
					} else {
						highlightLayer.getSource().addFeature(feature);
						app.selectedFeatures++;
					}
				}
			} catch (e) {
			}
		}
		xhr.send();
	}
}

function selectDynImageInLayerList (evt) {
	app.layer.highlight.getSource().clear();
    var layers = document.getElementsByClassName('layer');
    for (var j = 0; j < layers.length; j++) {
        layers[j].style.border = '';
        layers[j].style.backgroundColor = '';
    }
    //All in One
    app.DynImageGroup.getLayers().forEach(function(lyr, idy, b) {
		lyr.set('highlight', false);
	});
    app.map.getLayers().forEach(function(l, idx, a) {
    	if (l.get('type') === 'selection') {
			var features = l.getSource().getFeaturesAtCoordinate(evt.coordinate);
			app.layer.highlight.getSource().addFeatures(features);
			if (features.length > 0) {
				if (!app.DynImageGroup.get('unfolded')) {
					app.DynImageGroup.set('unfolded', true);
				}
			}
			app.DynImageGroup.getLayers().forEach(function(lyr, idy, b) {
				for (var feature of features) {
					if (lyr.get('title')==feature.get('source_product_id')) {
						lyr.set('highlight',true);
					}
				}
			});
    	}			
    });
    app.LayerSwitcher.renderPanel();
}
function tableCreate(props,wanted) {
	var tbl = document.createElement('table');
	tbl.style.width = '100%';
	var tbdy = document.createElement('tbody');
	var gray=false;
	var type=null;
	Object.keys(wanted).forEach(function(key,i) {
		var tr = document.createElement('tr');
		if (i == 0) {
			var th = document.createElement('th');
			th.setAttribute('colSpan', '2');
			th.style.fontWeight = 'bold';
			th.style.paddingBottom = '2pt';
			th.style.paddingTop = '5pt';
			th.style.backgroundColor='#CCC';
			th.appendChild(document.createTextNode(wanted[key]+' '+props[key]+':'));
			tr.appendChild(th);
		} else {
			if (gray) {
				tr.style.backgroundColor='#EEE';
				gray=false;
			} else {
				gray=true;
			}
			for (var j = 0; j < 2; j++) {
					var td = document.createElement('td');
					j==0 ? td.style.width='120px' : null;
					td.style.paddingLeft = '5pt';
					if ( j == 0 ) {
						td.appendChild(document.createTextNode(wanted[key]+':'));
						td.style.fontWeight = 'bold';
					} else {
						var d = new Date(props[key]);
						if (parseInt(props[key])==props[key] && props[key].indexOf('.') === -1) {
						} else if (parseFloat(props[key])==props[key]) {
							props[key]=parseFloat(props[key]).toFixed(2);
						} else if (props[key].indexOf('http://') !== -1 || props[key].indexOf('jpip://') !== -1) {
							type='link';
						}
						var text=document.createTextNode(props[key]);
						if (type=='link') {
							var text=document.createElement('a');
							text.setAttribute('href',props[key]);
							text.setAttribute('target', 'new');
							text.appendChild(document.createTextNode('download/open'));
							type=null;
						}
						td.appendChild(text);
					}
					tr.appendChild(td);
			}
		}
		tbdy.appendChild(tr);
	});
	tbl.appendChild(tbdy);
	return tbl;
}

function attributePopup(evt) {
	app.popup.hide();
	var ortho = [ app.layer.hrsc2NdUclWms, app.layer.hrsc3NdWms, app.layer.hrsc4NdWms, app.layer.CtxAcrWms, app.layer.MocAcrWms, app.layer.ThemisAcrWms,
		app.layer.ctxode, app.layer.mocode, app.layer.themisode, app.layer.hiriseedrode, app.layer.hirisedtmode ];
	var url='';
	var xhr = [];
	var count=0;
	for (var i = 0; i < ortho.length; i++) {
		if (ortho[i].getVisible()) {
			if (count==0) {
				var header=document.createElement('h4');
				header.appendChild(document.createTextNode('Attribute query:'));
				app.popup.content.appendChild(header);
				count++;
			}
			url = ortho[i].getSource().getGetFeatureInfoUrl(
				evt.coordinate, app.map.getView().getResolution(), app.map.getView().getProjection(),
				{
					'INFO_FORMAT': 'application/json',
					'FEATURE_COUNT': '100'
			});
			if (url) {
				var format = new ol.format.GeoJSON();
				xhr[i] = new XMLHttpRequest();
				xhr[i].open("GET", url);
				xhr[i].onload = function () {
					try {
						var name='';
						var layer='';
						
						var json = JSON.parse(this.responseText);
						features = format.readFeatures(json);
						var feature=features[0];
						var prop = feature.getProperties();
						if ( prop.instid) {
							if (prop.instid=='CTX') {
								name ='MRO CTX (ODE)';
								layer='ode-ctx';
							}
							if (prop.instid=='MOC') {
								name ='MGS MOC (ODE)';
								layer='ode-moc';
							}
							if (prop.instid=='THEMIS') {
								name ='MO THEMIS (ODE)';
								layer='ode-themis';
							}
							if (prop.instid=='HIRISE') {
								if (prop.prodtype=='DTM') {
									name ='MRO HiRISE DTM (ODE)';
									layer='ode-hirise-rdr';
								}
								name ='MRO HiRISE RDR (ODE)';
								layer='ode-hirise-dtm';
							}
						} else {
							if (prop.instrument_id=='CTX') {
								name ='MRO CTX (ACRO)';
								layer='acro';
							}
							if (prop.sequence) {
								name ='MEx HRSC (ND)';
								layer='hrsc';
							}
							if (prop.uclfilename) {
								name ='MEx HRSC DTM + ORI (UCL)';
								layer='hrsc';
							}
							if (prop.instrument_id=='THEMIS') {
								name ='MO THEMIS VIS (ACRO)';
								layer='acro';
							}
							if (prop.instrument_id=='MOC-NA') {
								name ='MO MOC NA (ACRO)';
								layer='acro';
							}
						}
						var head = document.createElement('h5');
						head.style.margin='0';
						head.style.paddingTop='4pt';
						head.style.paddingBottom='4pt';
						head.style.fontWeight = 'bold';
						head.appendChild(document.createTextNode(name));
						app.popup.content.appendChild(head);
						for (var feature of features) {
							var props = feature.getProperties();
							if (name == 'MEx HRSC (ND)' ) {
								var wanted= {
									file_name: "Product ID",
									start_time: "Image time",
									orbit_number: "Orbit no.",
									map_scale: "Scale [m]",
									solinci: "Incidence [deg]",
									emission: "Emission [deg]",
									phase: "Phase [deg]",
									slrange: "Altitude [km]",
									perialt: "Periapsis alt. [km]",
									gndres: "Best gnd res. [km]"
								}
							} else if (name == 'MEx HRSC DTM + ORI (UCL)' ) {
								var wanted= {
									file_name: "Product ID",
									start_time: "Image time",
									orbit_number: "Orbit no.",
									ls: "Solar longitude",
									dtmlink: "Download DTM",
									orilink: "Download ORI"
								}
							} else if (layer=='acro') {
								var wanted= {
									source_product_id: "Product ID",
									start_time: "Image time",
									product_type_id: "Product type",
									map_scale: "Scale [m]",
									solarlongitude: "Solar longitude",
									incidence_angle: "Incidence angle",
									emission_angle: "Emission angle",
									localsolartime: "Local time",
									solardistance: "Solar distance [AU]"									
								}
							} else if (layer=='ode-ctx') {
								var wanted={
									productid: "Product ID",
									instid: "Instrument ID",
									datasetid: "Dataset ID",
									starttime: "Image time",
									prodtype: "Product type",
									emangle: "Emission angle",
									inangle: "Incidence angle",
									phangle: "Phase angle",
									sollong: "Solar longitude",
									exturl: "PDS product page",
									ext2url: "ASU product page",
									produrl: "ODE product page",
									labelurl: "PDS file download"
								}
							} else if (layer=='ode-themis') {
								var wanted={
									productid: "Product ID",
									instid: "Instrument ID",
									datasetid: "Dataset ID",
									starttime: "Image time",
									prodtype: "Product type",
									emangle: "Emission angle",
									inangle: "Incidence angle",
									phangle: "Phase angle",
									sollong: "Solar longitude",
									exturl: "ASU product page",
									produrl: "ODE product page",
									labelurl: "PDS file download"
								}
							} else if (layer=='ode-moc') {
								var wanted={
									productid: "Product ID",
									instid: "Instrument ID",
									datasetid: "Dataset ID",
									starttime: "Image time",
									prodtype: "Product type",
									labelurl: "PDS file download",
									produrl: "ODE product page"
								}
							} else if (layer=='ode-hirise-rdr') {
								var wanted={
									productid: "Product ID",
									instid: "Instrument ID",
									datasetid: "Dataset ID",
									starttime: "Image time",
									prodtype: "Product type",
									emangle: "Emission angle",
									inangle: "Incidence angle",
									phangle: "Phase angle",
									sollong: "Solar longitude",
									exturl: "ASU product page",
									ext2url: "JPIP image stream",
									produrl: "ODE product page",
								}
							} else if (layer=='ode-hirise-dtm') {
								var wanted={
									productid: "Product ID",
									instid: "Instrument ID",
									datasetid: "Dataset ID",
									prodtype: "Product type",
									exturl: "ASU product page",
									filesurl: "ODE product page",
								}
							} else {
								var wanted={
									productid: "Product ID"
								}
							}
							app.popup.content.appendChild(tableCreate(props,wanted));
						}
						app.popup.appear(evt.coordinate);
					} catch (e) {
						console.dir(e);
					}
				}
				xhr[i].send();
			}
		}
	}
}
