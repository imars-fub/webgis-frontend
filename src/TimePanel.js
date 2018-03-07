goog.provide('ol.control.TimePanel');

goog.require('ol.control');
goog.require('martianYears');

/**
 * Copyright (c) 2018 Sebastian Walter, Freie Universitaet Berlin
 *
 */

Number.prototype.pad = function(size) {
      var s = String(this);
      while (s.length < (size || 2)) {s = "0" + s;}
      return s;
    }


/**
 * OpenLayers 3 Time Slider Control.
 * @constructor
 * @extends {ol.control.Control}
 */
ol.control.TimePanel = function(opt_options) {

    var options = opt_options || {};
    
    this.startMarsTime = convertJdate2MartianDate(convertDate2Jdate(app.startTime));
    this.stopMarsTime = convertJdate2MartianDate(convertDate2Jdate(app.stopTime));

    this.shownClassName = 'ol-control ol-unselectable time-panel';
    this.hiddenClassName = this.shownClassName + ' collapsed';
    this.panelStatus=null;

    var element = document.createElement('div');
    element.id='timePanel';
    element.className = this.shownClassName;

    this.panel = document.createElement('div');
    this.panel.className = 'time-panel';
    element.appendChild(this.panel);

    button = document.createElement('div');
    button.className='time-panel-button';
    this.panel.appendChild(button);
    
    this.i=document.createElement('i');
    this.i.className='fa fa-chevron-circle-up';
    this.i.setAttribute('aria-hidden',true);
    button.appendChild(this.i);

    this.i.addEventListener('click', function(e) {
        this_.togglePanel();
    });

    title=document.createElement('span');
    title.innerHTML='Time panel';
    button.appendChild(title);
    
    slider = document.createElement('input');
    //input.id='earthTimeSlider';
    this.panel.appendChild(slider);

    this.utcSlider = new Slider(slider, {
        'id': 'earthTimeSlider',
        'tooltip': 'hide',
        'handle': 'round',
        'ticks': [app.startTime.getTime(),app.stopTime.getTime()],
        'value': [app.startTime.getTime(),app.stopTime.getTime()],
        'formatter': function(value) {
            var start, stop, val;
            if ( Array.isArray(value) ) {
                start = new Date(value[0]);
                stop = new Date(value[1]);
                val=[start.toISOString().substring(0, 10)+'\n'+stop.toISOString().substring(0, 10)];
            } else {
                start = new Date(value);
                val=start.toISOString().substring(0, 10);
            }
            return(val);
        }
    });
    
    this.inputs=document.createElement('div');

    this.panel.appendChild(this.inputs);

    var this_ = this;
    
    this_.renderPanel(app.startTime,app.stopTime);
    
    this.utcSlider.on('slide', function(e){
        startTime=new Date(e[0]);
        stopTime=new Date(e[1]);
        this_.refreshPanel(startTime,stopTime);
    });
        
    ol.control.Control.call(this, {
        element: element,
        target: options.target
    });

};

ol.inherits(ol.control.TimePanel, ol.control.Control);

/**
 * Toggle the time panel.
 */
ol.control.TimePanel.prototype.togglePanel = function() {
    if (this.element.className == this.shownClassName) {
        this.element.className = this.hiddenClassName;
        this.i.className='fa fa-chevron-circle-down';
    } else {
        this.element.className = this.shownClassName;
        this.i.className='fa fa-chevron-circle-up';
    }
};

/**
 * Draw the time panel to represent the current state of time.
 */
ol.control.TimePanel.prototype.renderPanel = function() {

    while (this.inputs.firstChild) {
        this.inputs.removeChild(this.inputs.firstChild);
    }
    this.createTimeBoxes_(app.startTime,app.stopTime);
};

/**
 * Refresh the time panel to represent the current state of time.
 */
ol.control.TimePanel.prototype.refreshPanel = function(start,stop) {

    var marsDateStart = convertJdate2MartianDate(convertDate2Jdate(start));
    var marsDateStop = convertJdate2MartianDate(convertDate2Jdate(stop));

    this.date1.value=start.toISOString().substring(0, 10);
    this.date2.value=stop.toISOString().substring(0, 10);

    this.year1.value = marsDateStart[0];
    this.year2.value = marsDateStop[0];

    this.sol1.value = marsDateStart[1];
    this.sol2.value = marsDateStop[1];

};

/**
 * Get Input times and redraw panel
 */
ol.control.TimePanel.prototype.timeChanged = function(planet,event) {
    if (planet=='mars') {
        var ma=document.getElementById('yearStart').value;
        var sol=document.getElementById('solStart').value;
        app.startTime=this.convertMarsTime2Utc(ma,sol);
        ma=document.getElementById('yearStop').value;
        sol=document.getElementById('solStop').value;
        app.stopTime=this.convertMarsTime2Utc(ma,sol);
        document.getElementById('dateStart').value=app.startTime.toISOString().substring(0, 10);
        document.getElementById('dateStop').value=app.stopTime.toISOString().substring(0, 10);
    } else if (planet=='earth') {
        app.startTime=new Date(document.getElementById('dateStart').value);
        this.startMarsTime = convertJdate2MartianDate(convertDate2Jdate(app.startTime));
        app.stopTime=new Date(document.getElementById('dateStop').value);
        this.stopMarsTime = convertJdate2MartianDate(convertDate2Jdate(app.stopTime));
    }
    this.utcSlider.setAttribute('value',[app.startTime.getTime(),app.stopTime.getTime()]);
    this.utcSlider.refresh();
    this.utcSlider.on('slide', function(e){
        startTime=new Date(e[0]);
        stopTime=new Date(e[1]);
        this_.refreshPanel(startTime,stopTime);
    });
    app.timePanel.utcSlider.on('slideStop', function(e) {
        app.startTime= new Date(e[0]);
        app.stopTime= new Date(e[1]);
        app.updateTimesonWmsLayers();
    });
    this.refreshPanel(app.startTime,app.stopTime);
};

/**
 * Convert Mars Time to UTC Time
 */
ol.control.TimePanel.prototype.convertMarsTime2Utc = function(marsyear, sol) {
    var julian=ConvertMartian2Julian(marsyear,sol);
    var date = convertJDate2Date(julian);
    return date;
}

/**
 * Create time box.
 */
ol.control.TimePanel.prototype.createTimeBoxes_ = function() {

    position=['start','stop'];
    label=['Start', 'Stop'];
    align=['left','right'];
    time=[app.startTime,app.stopTime];
    
    this_=this;
    i=0;
    var marsDate = convertJdate2MartianDate(convertDate2Jdate(time[i]));

    var box=document.createElement('div');
    box.id=position[i]+'Box';
    box.style.float=align[i];
    box.className='time-panel';
    box.style.width='240px';
    box.style.overflow='hidden';
    box.style.margin='20px';
    box.style.marginTop='30px';
    box.style.border='2px solid #222222';
    box.style.backgroundColor='#333';
    this.inputs.appendChild(box);

    var earth=document.createElement('div');
    earth.id=position[i]+'Earth';
    earth.style.float='left';
    earth.style.padding='4px';
    box.appendChild(earth);

    var pEarth=document.createElement('p');
    pEarth.style.margin='2px';
    pEarth.innerHTML=label[i]+' date';
    earth.appendChild(pEarth);

    this.date1 = document.createElement('input');
    this.date1.setAttribute('type','date');
    this.date1.style.width='110px';
    this.date1.className='dateInput';
    this.date1.id='date'+label[i];
    this.date1.min='1996-01-01';
    this.date1.max='2020-12-31';
    this.date1.value=time[i].toISOString().substring(0, 10);
    earth.appendChild(this.date1);

    var mars=document.createElement('div');
    mars.id=position[i]+'Mars';
    mars.style.overflow='hidden';
    earth.style.float='left';
    mars.style.padding='4px';
    box.appendChild(mars);

    var pMars=document.createElement('p');
    pMars.style.margin='2px';
    pMars.innerHTML='Mars year / sol';
    mars.appendChild(pMars);

    this.year1 = document.createElement('input');
    this.year1.setAttribute('type','number');
    this.year1.style.width='46px';
    this.year1.className='yearInput';
    this.year1.id='year'+label[i];
    this.year1.value = marsDate[0];
    mars.appendChild(this.year1);

    this.sol1 = document.createElement('input');
    this.sol1.setAttribute('type','number');
    this.sol1.style.width='42px';
    this.sol1.className='solInput';
    this.sol1.style.marginLeft='12px';
    this.sol1.id='sol'+label[i];
    this.sol1.value = marsDate[1];
    mars.appendChild(this.sol1);
    
    i=1;
    var marsDate = convertJdate2MartianDate(convertDate2Jdate(time[i]));

    var box2=document.createElement('div');
    box2.id=position[i]+'Box';
    box2.style.float=align[i];
    box2.className='time-panel';
    box2.style.width='240px';
    box2.style.overflow='hidden';
    box2.style.margin='20px';
    box2.style.marginTop='30px';
    box2.style.border='2px solid #222222';
    box2.style.backgroundColor='#333';
    this.inputs.appendChild(box2);

    var earth2=document.createElement('div');
    earth2.id=position[i]+'Earth';
    earth2.style.float='left';
    earth2.style.padding='4px';
    box2.appendChild(earth2);

    var pEarth2=document.createElement('p');
    pEarth2.style.margin='2px';
    pEarth2.innerHTML=label[i]+' date';
    earth2.appendChild(pEarth2);

    this.date2 = document.createElement('input');
    this.date2.setAttribute('type','date');
    this.date2.style.width='110px';
    this.date2.className='dateInput';
    this.date2.id='date'+label[i];
    this.date2.min='1996-01-01';
    this.date2.max='2020-12-31';
    this.date2.value=time[i].toISOString().substring(0, 10);
    earth2.appendChild(this.date2);

    var mars2=document.createElement('div');
    mars2.id=position[i]+'Mars';
    mars2.style.overflow='hidden';
    earth2.style.float='left';
    mars2.style.padding='4px';
    box2.appendChild(mars2);

    var pMars2=document.createElement('p');
    pMars2.style.margin='2px';
    pMars2.innerHTML='Mars year / sol';
    mars2.appendChild(pMars2);

    this.year2 = document.createElement('input');
    this.year2.setAttribute('type','number');
    this.year2.style.width='46px';
    this.year2.className='yearInput';
    this.year2.id='year'+label[i];
    this.year2.value = marsDate[0];
    mars2.appendChild(this.year2);

    this.sol2 = document.createElement('input');
    this.sol2.setAttribute('type','number');
    this.sol2.style.width='42px';
    this.sol2.className='solInput';
    this.sol2.style.marginLeft='12px';
    this.sol2.id='sol'+label[i];
    this.sol2.value = marsDate[1];
    mars2.appendChild(this.sol2);
    
};
