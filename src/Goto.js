goog.provide('ol.control.Goto');

goog.require('ol.control');
goog.require('ol.Collection');
goog.require('ol.MapBrowserEvent');

ol.control.Goto = function(opt_options) {
    
    var options = opt_options || {};
    
    // goto Lan Lot 
    this.gotoLLBox = document.createElement('div');
    this.gotoLLBox.id='gotoLLBox';

    // latitude input
    this.latBox = document.createElement('div');
    this.latBox.id='latBox';
    this.gotoLLBox.appendChild(this.latBox);
    
    this.latVal=0;

    this.latText = document.createElement('p');
    this.latText.id='latText';
    this.latText.innerHTML='lat';
    this.latBox.appendChild(this.latText);
    
    this.latInput = document.createElement('input');
    this.latInput.id='latInput';
    this.latInput.className='latInput';
    this.latInput.setAttribute('type','number');
    this.latInput.value = '';
    this.latBox.appendChild(this.latInput);
    this.latInput.select();
    
    // longitude input
    this.lonBox = document.createElement('div');
    this.lonBox.id='lonBox';
    this.gotoLLBox.appendChild(this.lonBox);
    
    this.lonVal=0;

    this.lonText = document.createElement('p');
    this.lonText.id='lonText';
    this.lonText.innerHTML='lon';
    this.lonBox.appendChild(this.lonText);
    
    this.lonInput = document.createElement('input');
    this.lonInput.id='lonInput';
    this.lonInput.className='lonInput';
    this.lonInput.setAttribute('type','number');
    this.lonInput.value = '';
    this.lonBox.appendChild(this.lonInput);
    
    // goto LL Button
    this.gotoLLButton = document.createElement('input'); 
    this.gotoLLButton.id="gotoLLButton"; 
    this.gotoLLButton.type="button";
    this.gotoLLButton.value="goto"; 
    this.gotoLLButton.title="goto entered coordinates"; 
    this.gotoLLButton.addEventListener('click', function(e) {
        this_.handleGotoLL_(e);
    });
    this.gotoLLBox.appendChild(this.gotoLLButton);

    document.body.appendChild(this.gotoLLBox);

    var this_ = this;

    ol.control.Control.call(this, {
        element: this.gotoLLBox,
        target: options.target
    });

    // goto LL via Enter key in latInput
    this.latInput.addEventListener("keyup", function(event) {
    event.preventDefault();
    if (event.keyCode == 13) {
        this_.gotoLLButton.click();
    }
});

    // goto LL via Enter key in lonInput
    this.lonInput.addEventListener("keyup", function(event) {
    event.preventDefault();
    if (event.keyCode == 13) {
        this_.gotoLLButton.click();
    }
});
    
};

ol.inherits(ol.control.Goto, ol.control.Control);

/**
 * Handle Goto Input coordinates
 */
ol.control.Goto.prototype.handleGotoLL_ = function(event) {
    if (app.ProjectionSwitcher.currentPrefix=='eqc') {
        var newCoord=ol.proj.transform([this.lonInput.value, this.latInput.value], 'EPSG:49900', 'EPSG:49910');
        this.getMap().getView().animate({center: newCoord});
    }
    else if (app.ProjectionSwitcher.currentPrefix=='sps') {
        var newCoord=ol.proj.transform([this.lonInput.value, this.latInput.value], 'EPSG:49900', 'EPSG:49923');
        this.getMap().getView().animate({center: newCoord});
    }
};





