//download.js v4.2, by dandavis; 2008-2016. [CCBY2] see http://danml.com/download.html for tests/usage
// v1 landed a FF+Chrome compat way of downloading strings to local un-named files, upgraded to use a hidden frame and optional mime
// v2 added named files via a[download], msSaveBlob, IE (10+) support, and window.URL support for larger+faster saves than dataURLs
// v3 added dataURL and Blob Input, bind-toggle arity, and legacy dataURL fallback was improved with force-download mime and base64 support. 3.1 improved safari handling.
// v4 adds AMD/UMD, commonJS, and plain browser support
// v4.1 adds url download capability via solo URL argument (same domain/CORS only)
// v4.2 adds semantic variable names, long (over 2MB) dataURL support, and hidden by default temp anchors
// https://github.com/rndme/download

(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define([], factory);
	} else if (typeof exports === 'object') {
		// Node. Does not work with strict CommonJS, but
		// only CommonJS-like environments that support module.exports,
		// like Node.
		module.exports = factory();
	} else {
		// Browser globals (root is window)
		root.download = factory();
  }
}(this, function () {

	return function download(data, strFileName, strMimeType) {

		var self = window, // this script is only for browsers anyway...
			defaultMime = "application/octet-stream", // this default mime also triggers iframe downloads
			mimeType = strMimeType || defaultMime,
			payload = data,
			url = !strFileName && !strMimeType && payload,
			anchor = document.createElement("a"),
			toString = function(a){return String(a);},
			myBlob = (self.Blob || self.MozBlob || self.WebKitBlob || toString),
			fileName = strFileName || "download",
			blob,
			reader;
			myBlob= myBlob.call ? myBlob.bind(self) : Blob ;
	  
		if(String(this)==="true"){ //reverse arguments, allowing download.bind(true, "text/xml", "export.xml") to act as a callback
			payload=[payload, mimeType];
			mimeType=payload[0];
			payload=payload[1];
		}


		if(url && url.length< 2048){ // if no filename and no mime, assume a url was passed as the only argument
			fileName = url.split("/").pop().split("?")[0];
			anchor.href = url; // assign href prop to temp anchor
		  	if(anchor.href.indexOf(url) !== -1){ // if the browser determines that it's a potentially valid url path:
        		var ajax=new XMLHttpRequest();
        		ajax.open( "GET", url, true);
        		ajax.responseType = 'blob';
        		ajax.onload= function(e){ 
				  download(e.target.response, fileName, defaultMime);
				};
        		setTimeout(function(){ ajax.send();}, 0); // allows setting custom ajax headers using the return:
			    return ajax;
			} // end if valid url?
		} // end if url?


		//go ahead and download dataURLs right away
		if(/^data\:[\w+\-]+\/[\w+\-]+[,;]/.test(payload)){
		
			if(payload.length > (1024*1024*1.999) && myBlob !== toString ){
				payload=dataUrlToBlob(payload);
				mimeType=payload.type || defaultMime;
			}else{			
				return navigator.msSaveBlob ?  // IE10 can't do a[download], only Blobs:
					navigator.msSaveBlob(dataUrlToBlob(payload), fileName) :
					saver(payload) ; // everyone else can save dataURLs un-processed
			}
			
		}//end if dataURL passed?

		blob = payload instanceof myBlob ?
			payload :
			new myBlob([payload], {type: mimeType}) ;


		function dataUrlToBlob(strUrl) {
			var parts= strUrl.split(/[:;,]/),
			type= parts[1],
			decoder= parts[2] == "base64" ? atob : decodeURIComponent,
			binData= decoder( parts.pop() ),
			mx= binData.length,
			i= 0,
			uiArr= new Uint8Array(mx);

			for(i;i<mx;++i) uiArr[i]= binData.charCodeAt(i);

			return new myBlob([uiArr], {type: type});
		 }

		function saver(url, winMode){

			if ('download' in anchor) { //html5 A[download]
				anchor.href = url;
				anchor.setAttribute("download", fileName);
				anchor.className = "download-js-link";
				anchor.innerHTML = "downloading...";
				anchor.style.display = "none";
				document.body.appendChild(anchor);
				setTimeout(function() {
					anchor.click();
					document.body.removeChild(anchor);
					if(winMode===true){setTimeout(function(){ self.URL.revokeObjectURL(anchor.href);}, 250 );}
				}, 66);
				return true;
			}

			// handle non-a[download] safari as best we can:
			if(/(Version)\/(\d+)\.(\d+)(?:\.(\d+))?.*Safari\//.test(navigator.userAgent)) {
				url=url.replace(/^data:([\w\/\-\+]+)/, defaultMime);
				if(!window.open(url)){ // popup blocked, offer direct download:
					if(confirm("Displaying New Document\n\nUse Save As... to download, then click back to return to this page.")){ location.href=url; }
				}
				return true;
			}

			//do iframe dataURL download (old ch+FF):
			var f = document.createElement("iframe");
			document.body.appendChild(f);

			if(!winMode){ // force a mime that will download:
				url="data:"+url.replace(/^data:([\w\/\-\+]+)/, defaultMime);
			}
			f.src=url;
			setTimeout(function(){ document.body.removeChild(f); }, 333);

		}//end saver




		if (navigator.msSaveBlob) { // IE10+ : (has Blob, but not a[download] or URL)
			return navigator.msSaveBlob(blob, fileName);
		}

		if(self.URL){ // simple fast and modern way using Blob and URL:
			saver(self.URL.createObjectURL(blob), true);
		}else{
			// handle non-Blob()+non-URL browsers:
			if(typeof blob === "string" || blob.constructor===toString ){
				try{
					return saver( "data:" +  mimeType   + ";base64,"  +  self.btoa(blob)  );
				}catch(y){
					return saver( "data:" +  mimeType   + "," + encodeURIComponent(blob)  );
				}
			}

			// Blob but not URL support:
			reader=new FileReader();
			reader.onload=function(e){
				saver(this.result);
			};
			reader.readAsDataURL(blob);
		}
		return true;
	}; /* end download() */
}));

(function (global){

  "use strict";

  if(global.fabric.version == '1.6.7') {
		return;
	}

  var fabric=global.fabric||(global.fabric={}),
    extend=fabric.util.object.extend,
    clone=fabric.util.object.clone;

  if(fabric.CurvedText){
    fabric.warn('fabric.CurvedText is already defined');
    return;
  }
  var stateProperties=fabric.Text.prototype.stateProperties.concat();
  stateProperties.push(
    'radius',
    'spacing',
    'reverse',
    'effect',
    'range',
    'largeFont',
    'smallFont'
  );
  var _dimensionAffectingProps=fabric.Text.prototype._dimensionAffectingProps
    .concat(['radius','spacing','reverse','fill','effect','width','height','range','fontSize','shadow','largeFont','smallFont']);


  var letterProperties = ['backgroundColor','textBackgroundColor','textDecoration','stroke','strokeWidth','shadow','fontWeight','fontStyle','strokeWidth','textAlign'];

  /**
   * Group class
   * @class fabric.CurvedText
   * @extends fabric.Text
   * @mixes fabric.Collection
   */
  fabric.CurvedText=fabric.util.createClass(fabric.Text, fabric.Collection, /** @lends fabric.CurvedText.prototype */ {
    /**
     * Type of an object
     * @type String
     * @default
     */
    type: 'curvedText',
    /**
     * The radius of the curved Text
     * @type Number
     * @default 50
     */
    radius: 50,
    /**
     * Special Effects, Thanks to fahadnabbasi
     * https://github.com/EffEPi/fabric.curvedText/issues/9
     */
    range: 5,
    smallFont: 10,
    largeFont: 30,
    effect: 'curved',
    /**
     * Spacing between the letters
     * @type fabricNumber
     * @default 20
     */
    spacing: 20,
//		letters: null,

    /**
     * Reversing the radius (position of the original point)
     * @type Boolean
     * @default false
     */
    reverse: false,
    /**
     * List of properties to consider when checking if state of an object is changed ({@link fabric.Object#hasStateChanged})
     * as well as for history (undo/redo) purposes
     * @type Array
     */
    stateProperties: stateProperties,
    /**
     * Properties that are delegated to group objects when reading/writing
     * @param {Object} delegatedProperties
     */
    // delegatedProperties: delegatedProperties,
    /**
     * Properties which when set cause object to change dimensions
     * @type Object
     * @private
     */
    _dimensionAffectingProps: _dimensionAffectingProps,
    /**
     *
     * Rendering, is we are rendering and another rendering call is passed, then stop rendering the old and
     * rendering the new (trying to speed things up)
     */
    _isRendering: 0,
    /**
     * Added complexity
     */
    complexity: function (){
      this.callSuper('complexity');
    },
    initialize: function (text, options){
      options||(options={});
      this.__skipDimension=true;
      delete options.text;
      this.setOptions(options);
      this.__skipDimension=false;

      if(parseFloat(fabric.version) >= 2) {
        this.callSuper('initialize', text, options);
      }

      this.letters=new fabric.Group([], {
        selectable: false,
        padding: 0
      });
      this.setText(text);
      // this.render(this.ctx,true);
    },
    setText: function (text){
      if(this.letters){
        while(this.letters.size()){
          this.letters.remove(this.letters.item(0));
        }
        for(var i=0; i<text.length; i++){
          //I need to pass the options from the main options
          if(this.letters.item(i)===undefined){
            this.letters.add(new fabric.Text(text[i]));
          }else{
            this.letters.item(i).text = text[i];
          }
        }
      }
      this.text = text;

      var i = this.letters.size();
      while(i--){
        var letter = this.letters.item(i);
        letter.set({
          objectCaching: false,
          fill: this.fill,
          stroke: this.stroke,
          strokeWidth: this.strokeWidth,
          fontFamily: this.fontFamily,
          fontSize: this.fontSize,
          fontStyle: this.fontStyle,
          fontWeight: this.fontWeight,
          underline: this.underline,
          overline:  this.overline,
          linethrough: this.linethrough,
          lineHeight: this.lineHeight
        });
      }

      this._updateLetters();

      this.canvas && this.canvas.renderAll();
    },
    _initDimensions: function (ctx){
      // from fabric.Text.prototype._initDimensions
      // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
      if(this.__skipDimension){
        return;
      }
      if(!ctx){
        ctx=fabric.util.createCanvasElement().getContext('2d');
        this._setTextStyles(ctx);
      }
      this._textLines=this.text.split(this._reNewline);
      this._clearCache();
      var currentTextAlign=this.textAlign;
      this.textAlign='left';
      this.width=this.get('width');
      this.textAlign=currentTextAlign;
      this.height=this.get('height');
      // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
      this._updateLetters();
    },
    _updateLetters: function (){
      var renderingCode=fabric.util.getRandomInt(100, 999);
      this._isRendering=renderingCode;
      if(this.letters && this.text){
        var curAngle=0,
          curAngleRotation=0,
          angleRadians=0,
          align=0,
          textWidth=0,
          space=parseInt(this.spacing),
          fixedLetterAngle=0;

        //get text width
        if(this.effect==='curved'){
          for(var i=0, len=this.text.length; i<len; i++){
            textWidth+=this.letters.item(i).width+space;
          }
          textWidth-=space;
        }else if(this.effect==='arc'){
          fixedLetterAngle=((this.letters.item(0).fontSize+space)/this.radius)/(Math.PI/180);
          textWidth=((this.text.length+1)*(this.letters.item(0).fontSize+space));
        }
        // Text align
        if(this.get('textAlign')==='right'){
          curAngle=90-(((textWidth/2)/this.radius)/(Math.PI/180));
        }else if(this.get('textAlign')==='left'){
          curAngle=-90-(((textWidth/2)/this.radius)/(Math.PI/180));
        }else{
          curAngle=-(((textWidth/2)/this.radius)/(Math.PI/180));
        }
        if(this.reverse)
          curAngle=-curAngle;

        var width=0,
          multiplier=this.reverse?-1:1,
          thisLetterAngle=0,
          lastLetterAngle=0;

        for(var i=0, len=this.text.length; i<len; i++){
          if(renderingCode!==this._isRendering)
            return;

          for(var key in letterProperties){
            this.letters.item(i).set(key, this.get(key));
          }

          this.letters.item(i).set('left', (width));
          this.letters.item(i).set('top', (0));
          this.letters.item(i).set('angle',0);
          this.letters.item(i).set('padding', 0);

          if(this.effect==='curved'){
            thisLetterAngle=((this.letters.item(i).width+space)/this.radius)/(Math.PI/180);
            curAngle=multiplier*((multiplier*curAngle)+lastLetterAngle);
            angleRadians=curAngle*(Math.PI/180);
            lastLetterAngle=thisLetterAngle;

            this.letters.item(i).set('angle',curAngle);
            this.letters.item(i).set('top', multiplier*-1*(Math.cos(angleRadians)*this.radius));
            this.letters.item(i).set('left', multiplier*(Math.sin(angleRadians)*this.radius));
            this.letters.item(i).set('padding', 0);
            this.letters.item(i).set('selectable', false);

          }else if(this.effect==='arc'){//arc
            curAngle=multiplier*((multiplier*curAngle)+fixedLetterAngle);
            angleRadians=curAngle*(Math.PI/180);

            this.letters.item(i).set('top', multiplier*-1*(Math.cos(angleRadians)*this.radius));
            this.letters.item(i).set('left', multiplier*(Math.sin(angleRadians)*this.radius));
            this.letters.item(i).set('padding', 0);
            this.letters.item(i).set('selectable', false);
          }else if(this.effect==='STRAIGHT'){//STRAIGHT
            //var newfont=(i*5)+15;
            //this.letters.item(i).set('fontSize',(newfont));
            this.letters.item(i).set('left', (width));
            this.letters.item(i).set('top', (0));
            this.letters.item(i).set('angle',0);
            width+=this.letters.item(i).get('width');
            this.letters.item(i).set('padding', 0);
            this.letters.item(i).set({
              borderColor: 'red',
              cornerColor: 'green',
              cornerSize: 6,
              transparentCorners: false
            });
            this.letters.item(i).set('selectable', false);
          }else if(this.effect==='smallToLarge'){//smallToLarge
            var small=parseInt(this.smallFont);
            var large=parseInt(this.largeFont);
            //var small = 20;
            //var large = 75;
            var difference=large-small;
            var center=Math.ceil(this.text.length/2);
            var step=difference/(this.text.length);
            var newfont=small+(i*step);

            //var newfont=(i*this.smallFont)+15;

            this.letters.item(i).set('fontSize', (newfont));

            this.letters.item(i).set('left', (width));
            width+=this.letters.item(i).get('width');
            //this.letters.item(i).set('padding', 0);
            /*this.letters.item(i).set({
                         borderColor: 'red',
                         cornerColor: 'green',
                         cornerSize: 6,
                         transparentCorners: false
                         });*/
            this.letters.item(i).set('padding', 0);
            this.letters.item(i).set('selectable', false);
            this.letters.item(i).set('top', -1*this.letters.item(i).get('fontSize')+i);
            //this.letters.width=width;
            //this.letters.height=this.letters.item(i).get('height');

          }else if(this.effect==='largeToSmallTop'){//largeToSmallTop
            var small=parseInt(this.largeFont);
            var large=parseInt(this.smallFont);
            //var small = 20;
            //var large = 75;
            var difference=large-small;
            var center=Math.ceil(this.text.length/2);
            var step=difference/(this.text.length);
            var newfont=small+(i*step);
            //var newfont=((this.text.length-i)*this.smallFont)+12;
            this.letters.item(i).set('fontSize', (newfont));
            this.letters.item(i).set('left', (width));
            width+=this.letters.item(i).get('width');
            this.letters.item(i).set('padding', 0);
            this.letters.item(i).set({
              borderColor: 'red',
              cornerColor: 'green',
              cornerSize: 6,
              transparentCorners: false
            });
            this.letters.item(i).set('padding', 0);
            this.letters.item(i).set('selectable', false);
            this.letters.item(i).top=-1*this.letters.item(i).get('fontSize')+(i/this.text.length);

          }else if(this.effect==='largeToSmallBottom'){
            var small=parseInt(this.largeFont);
            var large=parseInt(this.smallFont);
            //var small = 20;
            //var large = 75;
            var difference=large-small;
            var center=Math.ceil(this.text.length/2);
            var step=difference/(this.text.length);
            var newfont=small+(i*step);
            //var newfont=((this.text.length-i)*this.smallFont)+12;
            this.letters.item(i).set('fontSize', (newfont));
            this.letters.item(i).set('left', (width));
            width+=this.letters.item(i).get('width');
            this.letters.item(i).set('padding', 0);
            this.letters.item(i).set({
              borderColor: 'red',
              cornerColor: 'green',
              cornerSize: 6,
              transparentCorners: false
            });
            this.letters.item(i).set('padding', 0);
            this.letters.item(i).set('selectable', false);
            //this.letters.item(i).top =-1* this.letters.item(i).get('fontSize')+newfont-((this.text.length-i))-((this.text.length-i));
            this.letters.item(i).top=-1*this.letters.item(i).get('fontSize')-i;

          }else if(this.effect==='bulge'){//bulge
            var small=parseInt(this.smallFont);
            var large=parseInt(this.largeFont);
            //var small = 20;
            //var large = 75;
            var difference=large-small;
            var center=Math.ceil(this.text.length/2);
            var step=difference/(this.text.length-center);
            if(i<center)
              var newfont=small+(i*step);
            else
              var newfont=large-((i-center+1)*step);
            this.letters.item(i).set('fontSize', (newfont));

            this.letters.item(i).set('left', (width));
            width+=this.letters.item(i).get('width');

            this.letters.item(i).set('padding', 0);
            this.letters.item(i).set('selectable', false);

            this.letters.item(i).set('top', -1*this.letters.item(i).get('height')/2);
          }
        }

        var scaleX=this.letters.get('scaleX');
        var scaleY=this.letters.get('scaleY');
        var angle=this.letters.get('angle');

        this.letters.set('scaleX', 1);
        this.letters.set('scaleY', 1);
        this.letters.set('angle', 0);

        // Update group coords
        this.letters._calcBounds();
        this.letters._updateObjectsCoords();
        //this.letters.saveCoords();
        // this.letters.render(ctx);

        this.letters.set('scaleX', scaleX);
        this.letters.set('scaleY', scaleY);
        this.letters.set('angle', angle);

        this.width=this.letters.width;
        this.height=this.letters.height;
        this.letters.left= -(this.letters.width/2);
        this.letters.top= -(this.letters.height/2);
      }
    },
    render: function (ctx){
      // do not render if object is not visible
      if(!this.visible)
        return;
      if(!this.letters)
        return;


      ctx.save();

      // if(noTransform){
      this.transform(ctx);
      // }

      var groupScaleFactor=Math.max(this.scaleX, this.scaleY);

      this.clipTo&&fabric.util.clipContext(this, ctx);

      //The array is now sorted in order of highest first, so start from end.
      for(var i=0, len=this.letters.size(); i<len; i++){
        var object=this.letters.item(i),
          originalScaleFactor=object.borderScaleFactor,
          originalHasRotatingPoint=object.hasRotatingPoint;

        // do not render if object is not visible
        if(!object.visible)
          continue;

//				object.borderScaleFactor=groupScaleFactor;
//				object.hasRotatingPoint=false;

        object.render(ctx);
//				object.borderScaleFactor=originalScaleFactor;
//				object.hasRotatingPoint=originalHasRotatingPoint;
      }
      this.clipTo&&ctx.restore();

      //Those lines causes double borders.. not sure why
//			if(!noTransform&&this.active){
//				this.drawBorders(ctx);
//				this.drawControls(ctx);
//			}
      ctx.restore();
      this.setCoords();
    },
    /**
     * @private
     */
    _set: function (key, value){
      if(key === "text"){
        this.setText(value);

        return;
      }
      this.callSuper('_set', key, value);
      if(this.text && this.letters){
        if(["angle","left","top","scaleX","scaleY","width","height"].indexOf(key) === -1){
          var i = this.letters.size();
          while(i--){
            this.letters.item(i).set(key, value);
          }
        }
        //Properties are delegated with the object is rendered
//				if (key in this.delegatedProperties) {
//					var i = this.letters.size();
//					while (i--) {
//						this.letters.item(i).set(key, value);
//					}
//				}
        if(this._dimensionAffectingProps.indexOf(key) !== -1){
          this._updateLetters();
          //this._initDimensions();
          this.setCoords();
        }
      }
    },
    initDimensions: function() {

    },
    toObject: function (propertiesToInclude){
      var object = extend(this.callSuper('toObject', propertiesToInclude), {
        radius: this.radius,
        spacing: this.spacing,
        reverse: this.reverse,
        effect: this.effect,
        range: this.range,
        smallFont: this.smallFont,
        largeFont: this.largeFont
        //letters: this.letters	//No need to pass this, the letters are recreated on the fly every time when initiated
      });

      if(!this.includeDefaultValues){
        this._removeDefaultValues(object);
      }
      return object;
    },
    /**
     * Returns string represenation of a group
     * @return {String}
     */
    toString: function (){
      return '#<fabric.CurvedText ('+this.complexity()+'): { "text": "'+this.text+'", "fontFamily": "'+this.fontFamily+'", "radius": "'+this.radius+'", "spacing": "'+this.spacing+'", "reverse": "'+this.reverse+'" }>';
    },
    /* _TO_SVG_START_ */
    /**
     * Returns svg representation of an instance
     * @param {Function} [reviver] Method for further parsing of svg representation.
     * @return {String} svg representation of an instance
     */
    toSVG: function (reviver){
      var markup=[
        '<g ',
        'transform="', this.getSvgTransform(),
        '">'
      ];
      if(this.letters){
        for(var i=0, len=this.letters.size(); i<len; i++){
          markup.push(this.letters.item(i).toSVG(reviver));
        }
      }
      markup.push('</g>');
      return reviver?reviver(markup.join('')):markup.join('');
    }
    /* _TO_SVG_END_ */
  });

  /**
   * Returns {@link fabric.CurvedText} instance from an object representation
   * @static
   * @memberOf fabric.CurvedText
   * @param {Object} object Object to create a group from
   * @param {Object} [options] Options object
   * @return {fabric.CurvedText} An instance of fabric.CurvedText
   */
  // fabric.CurvedText.fromObject=function (object){
  //   var obj =  new fabric.CurvedText(object.text, clone(object));
  //   return obj;
  // };

  fabric.CurvedText.fromObject = function(object, callback) {
    return fabric.Object._fromObject("CurvedText", object, callback,"text");
  };

  // fabric.util.createAccessors(fabric.CurvedText);

  /**
   * Indicates that instances of this type are async
   * @static
   * @memberOf fabric.CurvedText
   * @type Boolean
   * @default
   */
  fabric.CurvedText.async=false;

})(typeof exports!=='undefined'?exports:this);










(function (global){

	"use strict";

	if(global.fabric.version !== '1.6.7') {
		return;
	}

	var fabric=global.fabric||(global.fabric={}),
			extend=fabric.util.object.extend,
			clone=fabric.util.object.clone;

	if(fabric.CurvedText){
		fabric.warn('fabric.CurvedText is already defined');
		return;
	}
	var stateProperties=fabric.Text.prototype.stateProperties.concat();
	stateProperties.push(
			'radius',
			'spacing',
			'reverse',
			'effect',
			'range',
			'largeFont',
			'smallFont'
			);
	var _dimensionAffectingProps=fabric.Text.prototype._dimensionAffectingProps;
	_dimensionAffectingProps['radius']=true;
	_dimensionAffectingProps['spacing']=true;
	_dimensionAffectingProps['reverse']=true;
	_dimensionAffectingProps['fill']=true;
	_dimensionAffectingProps['effect']=true;
	_dimensionAffectingProps['width']=true;
	_dimensionAffectingProps['height']=true;
	_dimensionAffectingProps['range']=true;
	_dimensionAffectingProps['fontSize']=true;
	_dimensionAffectingProps['shadow']=true;
	_dimensionAffectingProps['largeFont']=true;
	_dimensionAffectingProps['smallFont']=true;


	var delegatedProperties=fabric.Group.prototype.delegatedProperties;
	delegatedProperties['backgroundColor']=true;
	delegatedProperties['textBackgroundColor']=true;
	delegatedProperties['textDecoration']=true;
	delegatedProperties['stroke']=true;
	delegatedProperties['strokeWidth']=true;
	delegatedProperties['shadow']=true;
	delegatedProperties['fontWeight']=true;
	delegatedProperties['fontStyle']=true;
	delegatedProperties['strokeWidth']=true;
	delegatedProperties['textAlign']=true;

	/**
	 * Group class
	 * @class fabric.CurvedText
	 * @extends fabric.Text
	 * @mixes fabric.Collection
	 */
	fabric.CurvedText=fabric.util.createClass(fabric.Text, fabric.Collection, /** @lends fabric.CurvedText.prototype */ {
		/**
		 * Type of an object
		 * @type String
		 * @default
		 */
		type: 'curvedText',
		/**
		 * The radius of the curved Text
		 * @type Number
		 * @default 50
		 */
		radius: 50,
		/**
		 * Special Effects, Thanks to fahadnabbasi
		 * https://github.com/EffEPi/fabric.curvedText/issues/9
		 */
		range: 5,
		smallFont: 10,
		largeFont: 30,
		effect: 'curved',
		/**
		 * Spacing between the letters
		 * @type fabricNumber
		 * @default 20
		 */
		spacing: 20,
//		letters: null,

		/**
		 * Reversing the radius (position of the original point)
		 * @type Boolean
		 * @default false
		 */
		reverse: false,
		/**
		 * List of properties to consider when checking if state of an object is changed ({@link fabric.Object#hasStateChanged})
		 * as well as for history (undo/redo) purposes
		 * @type Array
		 */
		stateProperties: stateProperties,
		/**
		 * Properties that are delegated to group objects when reading/writing
		 * @param {Object} delegatedProperties
		 */
		delegatedProperties: delegatedProperties,
		/**
		 * Properties which when set cause object to change dimensions
		 * @type Object
		 * @private
		 */
		_dimensionAffectingProps: _dimensionAffectingProps,
		/**
		 *
		 * Rendering, is we are rendering and another rendering call is passed, then stop rendering the old and
		 * rendering the new (trying to speed things up)
		 */
		_isRendering: 0,
		/**
		 * Added complexity
		 */
		complexity: function (){
			this.callSuper('complexity');
		},
		initialize: function (text, options){
			options||(options={});
			this.letters=new fabric.Group([], {
				selectable: false,
				padding: 0
			});
			this.__skipDimension=true;
			this.setOptions(options);
			this.__skipDimension=false;

			if(parseFloat(fabric.version) >= 2) {
				this.callSuper('initialize', text, options);
			}

			this.setText(text);
			this._render();
		},
		setText: function (text){
			if(this.letters){
				while(text.length!==0&&this.letters.size()>=text.length){
					this.letters.remove(this.letters.item(this.letters.size()-1));
				}
				for(var i=0; i<text.length; i++){
					//I need to pass the options from the main options
					if(this.letters.item(i)===undefined){
						this.letters.add(new fabric.Text(text[i]));
					}else{
						this.letters.item(i).setText(text[i]);
					}
				}
			}
			this.callSuper('setText', text);
			this._render();
		},
		_initDimensions: function (ctx){
			// from fabric.Text.prototype._initDimensions
			// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
			if(this.__skipDimension){
				return;
			}
			if(!ctx){
				ctx=fabric.util.createCanvasElement().getContext('2d');
				this._setTextStyles(ctx);
			}
			this._textLines=this.text.split(this._reNewline);
			this._clearCache();
			var currentTextAlign=this.textAlign;
			this.textAlign='left';
			this.width=this.getWidth();
			this.textAlign=currentTextAlign;
			this.height=this.getHeight();
			// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
			this._render(ctx);
		},
		_render: function (ctx){
			var renderingCode=fabric.util.getRandomInt(100, 999);
			this._isRendering=renderingCode;
			if(this.letters){
				var curAngle=0,
						curAngleRotation=0,
						angleRadians=0,
						align=0,
						textWidth=0,
						space=parseInt(this.spacing),
						fixedLetterAngle=0;

				//get text width
				if(this.effect==='curved'){
					for(var i=0, len=this.text.length; i<len; i++){
						textWidth+=this.letters.item(i).width+space;
					}
					textWidth-=space;
				}else if(this.effect==='arc'){
					fixedLetterAngle=((this.letters.item(0).fontSize+space)/this.radius)/(Math.PI/180);
					textWidth=((this.text.length+1)*(this.letters.item(0).fontSize+space));
				}
				// Text align
				if(this.get('textAlign')==='right'){
					curAngle=90-(((textWidth/2)/this.radius)/(Math.PI/180));
				}else if(this.get('textAlign')==='left'){
					curAngle=-90-(((textWidth/2)/this.radius)/(Math.PI/180));
				}else{
					curAngle=-(((textWidth/2)/this.radius)/(Math.PI/180));
				}
				if(this.reverse)
					curAngle=-curAngle;

				var width=0,
						multiplier=this.reverse?-1:1,
						thisLetterAngle=0,
						lastLetterAngle=0;

				for(var i=0, len=this.text.length; i<len; i++){
					if(renderingCode!==this._isRendering)
						return;

					for(var key in this.delegatedProperties){
						this.letters.item(i).set(key, this.get(key));
					}

					this.letters.item(i).set('left', (width));
					this.letters.item(i).set('top', (0));
					this.letters.item(i).setAngle(0);
					this.letters.item(i).set('padding', 0);

					if(this.effect==='curved'){
						thisLetterAngle=((this.letters.item(i).width+space)/this.radius)/(Math.PI/180);
						curAngle=multiplier*((multiplier*curAngle)+lastLetterAngle);
						angleRadians=curAngle*(Math.PI/180);
						lastLetterAngle=thisLetterAngle;

						this.letters.item(i).setAngle(curAngle);
						this.letters.item(i).set('top', multiplier*-1*(Math.cos(angleRadians)*this.radius));
						this.letters.item(i).set('left', multiplier*(Math.sin(angleRadians)*this.radius));
						this.letters.item(i).set('padding', 0);
						this.letters.item(i).set('selectable', false);

					}else if(this.effect==='arc'){//arc
						curAngle=multiplier*((multiplier*curAngle)+fixedLetterAngle);
						angleRadians=curAngle*(Math.PI/180);

						this.letters.item(i).set('top', multiplier*-1*(Math.cos(angleRadians)*this.radius));
						this.letters.item(i).set('left', multiplier*(Math.sin(angleRadians)*this.radius));
						this.letters.item(i).set('padding', 0);
						this.letters.item(i).set('selectable', false);
					}else if(this.effect==='STRAIGHT'){//STRAIGHT
						//var newfont=(i*5)+15;
						//this.letters.item(i).set('fontSize',(newfont));
						this.letters.item(i).set('left', (width));
						this.letters.item(i).set('top', (0));
						this.letters.item(i).setAngle(0);
						width+=this.letters.item(i).get('width');
						this.letters.item(i).set('padding', 0);
						this.letters.item(i).set({
							borderColor: 'red',
							cornerColor: 'green',
							cornerSize: 6,
							transparentCorners: false
						});
						this.letters.item(i).set('selectable', false);
					}else if(this.effect==='smallToLarge'){//smallToLarge
						var small=parseInt(this.smallFont);
						var large=parseInt(this.largeFont);
						//var small = 20;
						//var large = 75;
						var difference=large-small;
						var center=Math.ceil(this.text.length/2);
						var step=difference/(this.text.length);
						var newfont=small+(i*step);

						//var newfont=(i*this.smallFont)+15;

						this.letters.item(i).set('fontSize', (newfont));

						this.letters.item(i).set('left', (width));
						width+=this.letters.item(i).get('width');
						//this.letters.item(i).set('padding', 0);
						/*this.letters.item(i).set({
						 borderColor: 'red',
						 cornerColor: 'green',
						 cornerSize: 6,
						 transparentCorners: false
						 });*/
						this.letters.item(i).set('padding', 0);
						this.letters.item(i).set('selectable', false);
						this.letters.item(i).set('top', -1*this.letters.item(i).get('fontSize')+i);
						//this.letters.width=width;
						//this.letters.height=this.letters.item(i).get('height');

					}else if(this.effect==='largeToSmallTop'){//largeToSmallTop
						var small=parseInt(this.largeFont);
						var large=parseInt(this.smallFont);
						//var small = 20;
						//var large = 75;
						var difference=large-small;
						var center=Math.ceil(this.text.length/2);
						var step=difference/(this.text.length);
						var newfont=small+(i*step);
						//var newfont=((this.text.length-i)*this.smallFont)+12;
						this.letters.item(i).set('fontSize', (newfont));
						this.letters.item(i).set('left', (width));
						width+=this.letters.item(i).get('width');
						this.letters.item(i).set('padding', 0);
						this.letters.item(i).set({
							borderColor: 'red',
							cornerColor: 'green',
							cornerSize: 6,
							transparentCorners: false
						});
						this.letters.item(i).set('padding', 0);
						this.letters.item(i).set('selectable', false);
						this.letters.item(i).top=-1*this.letters.item(i).get('fontSize')+(i/this.text.length);

					}else if(this.effect==='largeToSmallBottom'){
						var small=parseInt(this.largeFont);
						var large=parseInt(this.smallFont);
						//var small = 20;
						//var large = 75;
						var difference=large-small;
						var center=Math.ceil(this.text.length/2);
						var step=difference/(this.text.length);
						var newfont=small+(i*step);
						//var newfont=((this.text.length-i)*this.smallFont)+12;
						this.letters.item(i).set('fontSize', (newfont));
						this.letters.item(i).set('left', (width));
						width+=this.letters.item(i).get('width');
						this.letters.item(i).set('padding', 0);
						this.letters.item(i).set({
							borderColor: 'red',
							cornerColor: 'green',
							cornerSize: 6,
							transparentCorners: false
						});
						this.letters.item(i).set('padding', 0);
						this.letters.item(i).set('selectable', false);
						//this.letters.item(i).top =-1* this.letters.item(i).get('fontSize')+newfont-((this.text.length-i))-((this.text.length-i));
						this.letters.item(i).top=-1*this.letters.item(i).get('fontSize')-i;

					}else if(this.effect==='bulge'){//bulge
						var small=parseInt(this.smallFont);
						var large=parseInt(this.largeFont);
						//var small = 20;
						//var large = 75;
						var difference=large-small;
						var center=Math.ceil(this.text.length/2);
						var step=difference/(this.text.length-center);
						if(i<center)
							var newfont=small+(i*step);
						else
							var newfont=large-((i-center+1)*step);
						this.letters.item(i).set('fontSize', (newfont));

						this.letters.item(i).set('left', (width));
						width+=this.letters.item(i).get('width');

						this.letters.item(i).set('padding', 0);
						this.letters.item(i).set('selectable', false);

						this.letters.item(i).set('top', -1*this.letters.item(i).get('height')/2);
					}
				}

				var scaleX=this.letters.get('scaleX');
				var scaleY=this.letters.get('scaleY');
				var angle=this.letters.get('angle');

				this.letters.set('scaleX', 1);
				this.letters.set('scaleY', 1);
				this.letters.set('angle', 0);

				// Update group coords
				this.letters._calcBounds();
				this.letters._updateObjectsCoords();
				//this.letters.saveCoords();
				// this.letters.render(ctx);

				this.letters.set('scaleX', scaleX);
				this.letters.set('scaleY', scaleY);
				this.letters.set('angle', angle);

				this.width=this.letters.width;
				this.height=this.letters.height;
				this.letters.left=-(this.letters.width/2);
				this.letters.top=-(this.letters.height/2);
			}
		},
		_renderOld: function (ctx){
			if(this.letters){
				var curAngle=0,
						angleRadians=0,
						align=0;
				// Text align
				var rev=0;
				if(this.reverse){
					rev=0.5;
				}
				if(this.get('textAlign')==='center'||this.get('textAlign')==='justify'){
					align=(this.spacing/2)*(this.text.length-rev);	// Remove '-1' after this.text.length for proper angle rendering
				}else if(this.get('textAlign')==='right'){
					align=(this.spacing)*(this.text.length-rev);	// Remove '-1' after this.text.length for proper angle rendering
				}
				var multiplier=this.reverse?1:-1;
				for(var i=0, len=this.text.length; i<len; i++){
					// Find coords of each letters (radians : angle*(Math.PI / 180)
					curAngle=multiplier*(-i*parseInt(this.spacing, 10)+align);
					angleRadians=curAngle*(Math.PI/180);

					for(var key in this.delegatedProperties){
						this.letters.item(i).set(key, this.get(key));
					}
					this.letters.item(i).set('top', (multiplier-Math.cos(angleRadians)*this.radius));
					this.letters.item(i).set('left', (multiplier+Math.sin(angleRadians)*this.radius));
					this.letters.item(i).setAngle(curAngle);
					this.letters.item(i).set('padding', 0);
					this.letters.item(i).set('selectable', false);
				}
				// Update group coords
				this.letters._calcBounds();
				if(this.reverse){
					this.letters.top=this.letters.top-this.height*2.5;
				}else{
					this.letters.top=0;
				}
				this.letters.left=this.letters.left-this.width/2; // Change here, for proper group display
				//this.letters._updateObjectsCoords();					// Commented off this line for group misplacement
				this.letters.saveCoords();
//				this.letters.render(ctx);
				this.width=this.letters.width;
				this.height=this.letters.height;
				this.letters.left=-(this.letters.width/2);
				this.letters.top=-(this.letters.height/2);
			}
		},
		render: function (ctx, noTransform){
			// do not render if object is not visible
			if(!this.visible)
				return;
			if(!this.letters)
				return;

			ctx.save();
			this.transform(ctx);

			var groupScaleFactor=Math.max(this.scaleX, this.scaleY);

			this.clipTo&&fabric.util.clipContext(this, ctx);

			//The array is now sorted in order of highest first, so start from end.
			for(var i=0, len=this.letters.size(); i<len; i++){
				var object=this.letters.item(i),
						originalScaleFactor=object.borderScaleFactor,
						originalHasRotatingPoint=object.hasRotatingPoint;

				// do not render if object is not visible
				if(!object.visible)
					continue;

//				object.borderScaleFactor=groupScaleFactor;
//				object.hasRotatingPoint=false;

				object.render(ctx);

//				object.borderScaleFactor=originalScaleFactor;
//				object.hasRotatingPoint=originalHasRotatingPoint;
			}
			this.clipTo&&ctx.restore();

			//Those lines causes double borders.. not sure why
//			if(!noTransform&&this.active){
//				this.drawBorders(ctx);
//				this.drawControls(ctx);
//			}
			ctx.restore();
			this.setCoords();
		},
		/**
		 * @private
		 */
		_set: function (key, value){
			this.callSuper('_set', key, value);
			if(this.letters){
				this.letters.set(key, value);
				//Properties are delegated with the object is rendered
//				if (key in this.delegatedProperties) {
//					var i = this.letters.size();
//					while (i--) {
//						this.letters.item(i).set(key, value);
//					}
//				}
				if(key in this._dimensionAffectingProps){
					this._initDimensions();
					this.setCoords();
				}
			}
		},
		toObject: function (propertiesToInclude){
			var object = extend(this.callSuper('toObject', propertiesToInclude), {
				radius: this.radius,
				spacing: this.spacing,
				reverse: this.reverse,
				effect: this.effect,
				range: this.range,
				smallFont: this.smallFont,
				largeFont: this.largeFont
				//letters: this.letters	//No need to pass this, the letters are recreated on the fly every time when initiated
			});

			if(!this.includeDefaultValues){
				this._removeDefaultValues(object);
			}
			return object;
		},
		/**
		 * Returns string represenation of a group
		 * @return {String}
		 */
		toString: function (){
			return '#<fabric.CurvedText ('+this.complexity()+'): { "text": "'+this.text+'", "fontFamily": "'+this.fontFamily+'", "radius": "'+this.radius+'", "spacing": "'+this.spacing+'", "reverse": "'+this.reverse+'" }>';
		},
		/* _TO_SVG_START_ */
		/**
		 * Returns svg representation of an instance
		 * @param {Function} [reviver] Method for further parsing of svg representation.
		 * @return {String} svg representation of an instance
		 */
		toSVG: function (reviver){
			var markup=[
				'<g ',
				'transform="', this.getSvgTransform(),
				'">'
			];
			if(this.letters){
				for(var i=0, len=this.letters.size(); i<len; i++){
					markup.push(this.letters.item(i).toSVG(reviver));
				}
			}
			markup.push('</g>');
			return reviver?reviver(markup.join('')):markup.join('');
		}
		/* _TO_SVG_END_ */
	});

	/**
	 * Returns {@link fabric.CurvedText} instance from an object representation
	 * @static
	 * @memberOf fabric.CurvedText
	 * @param {Object} object Object to create a group from
	 * @param {Object} [options] Options object
	 * @return {fabric.CurvedText} An instance of fabric.CurvedText
	 */
	fabric.CurvedText.fromObject=function (object){
		return new fabric.CurvedText(object.text, clone(object));
	};

	fabric.util.createAccessors(fabric.CurvedText);

	/**
	 * Indicates that instances of this type are async
	 * @static
	 * @memberOf fabric.CurvedText
	 * @type Boolean
	 * @default
	 */
	fabric.CurvedText.async=false;

})(typeof exports!=='undefined'?exports:this);











/*
Copyright (c) 2009 Ben Leslie

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

/*
 This JavaScript library is used to parse meta-data from files
 with mime-type image/jpeg.

 Include it with something like:

   <script type="text/javascript" src="jpegmeta.js"></script>

 This adds a single 'module' object called 'JpegMeta' to the global
 namespace.

 Public Functions
 ----------------
 JpegMeta.parseNum - parse unsigned integers from binary data
 JpegMeta.parseSnum - parse signed integers from binary data

 Public Classes
 --------------
 JpegMeta.Rational - A rational number class
 JpegMeta.JfifSegment
 JpegMeta.ExifSegment
 JpegMeta.JpegFile - Primary class for Javascript parsing
*/

if (this.JpegMeta) {
    throw Error("Library included multiple times");
}

var JpegMeta = {};

JpegMeta.stringIsClean = function stringIsClean(str) {
    for (var i = 0; i < str.length; i++) {
	if (str.charCodeAt(i) < 0x20) {
	    return false;
	}
    }
    return true;
}

/*
   parse an unsigned number of size bytes at offset in some binary string data.
   If endian
   is "<" parse the data as little endian, if endian
   is ">" parse as big-endian.
*/
JpegMeta.parseNum = function parseNum(endian, data, offset, size) {
    var i;
    var ret;
    var big_endian = (endian === ">");
    if (offset === undefined) offset = 0;
    if (size === undefined) size = data.length - offset;
    for (big_endian ? i = offset : i = offset + size - 1;
	 big_endian ? i < offset + size : i >= offset;
	 big_endian ? i++ : i--) {
	ret <<= 8;
	ret += data.charCodeAt(i);
    }
    return ret;
};

/*
   parse an signed number of size bytes at offset in some binary string data.
   If endian
   is "<" parse the data as little endian, if endian
   is ">" parse as big-endian.
*/
JpegMeta.parseSnum = function parseSnum(endian, data, offset, size) {
    var i;
    var ret;
    var neg;
    var big_endian = (endian === ">");
    if (offset === undefined) offset = 0;
    if (size === undefined) size = data.length - offset;
    for (big_endian ? i = offset : i = offset + size - 1;
	 big_endian ? i < offset + size : i >= offset;
	 big_endian ? i++ : i--) {
	if (neg === undefined) {
	    /* Negative if top bit is set */
	    neg = (data.charCodeAt(i) & 0x80) === 0x80;
	}
	ret <<= 8;
	/* If it is negative we invert the bits */
	ret += neg ? ~data.charCodeAt(i) & 0xff: data.charCodeAt(i);
    }
    if (neg) {
	/* If it is negative we do two's complement */
	ret += 1;
	ret *= -1;
    }
    return ret;
};

/* Rational number class */
JpegMeta.Rational = function Rational(num, den)
{
    this.num = num;
    this.den = den || 1;
    return this;
};

/* Rational number methods */
JpegMeta.Rational.prototype.toString = function toString() {
    if (this.num === 0) {
	return "" + this.num;
    }
    if (this.den === 1) {
	return "" + this.num;
    }
    if (this.num === 1) {
	return this.num + " / " + this.den;
    }
    return this.num / this.den; // + "/" + this.den;
};

JpegMeta.Rational.prototype.asFloat = function asFloat() {
    return this.num / this.den;
};


/* MetaGroup class */
JpegMeta.MetaGroup = function MetaGroup(fieldName, description) {
    this.fieldName = fieldName;
    this.description = description;
    this.metaProps = {};
    return this;
};

JpegMeta.MetaGroup.prototype._addProperty = function _addProperty(fieldName, description, value) {
    var property = new JpegMeta.MetaProp(fieldName, description, value);
    this[property.fieldName] = property;
    this.metaProps[property.fieldName] = property;
};

JpegMeta.MetaGroup.prototype.toString = function toString() {
    return "[MetaGroup " + this.description + "]";
};


/* MetaProp class */
JpegMeta.MetaProp = function MetaProp(fieldName, description, value) {
    this.fieldName = fieldName;
    this.description = description;
    this.value = value;
    return this;
};

JpegMeta.MetaProp.prototype.toString = function toString() {
    return "" + this.value;
};



/* JpegFile class */
this.JpegMeta.JpegFile = function JpegFile(binary_data, filename) {
    /* Change this to EOI if we want to parse. */
    var break_segment = this._SOS;

    this.metaGroups = {};
    this._binary_data = binary_data;
    this.filename = filename;

    /* Go through and parse. */
    var pos = 0;
    var pos_start_of_segment = 0;
    var delim;
    var mark;
    var _mark;
    var segsize;
    var headersize;
    var mark_code;
    var mark_fn;

    /* Check to see if this looks like a JPEG file */
    if (this._binary_data.slice(0, 2) !== this._SOI_MARKER) {
	throw new Error("Doesn't look like a JPEG file. First two bytes are " +
			this._binary_data.charCodeAt(0) + "," +
			this._binary_data.charCodeAt(1) + ".");
    }

    pos += 2;

    while (pos < this._binary_data.length) {
	delim = this._binary_data.charCodeAt(pos++);
	mark = this._binary_data.charCodeAt(pos++);

	pos_start_of_segment = pos;

	if (delim != this._DELIM) {
	    break;
	}

	if (mark === break_segment) {
	    break;
	}

	headersize = JpegMeta.parseNum(">", this._binary_data, pos, 2);

	/* Find the end */
	pos += headersize;
	while (pos < this._binary_data.length) {
	    delim = this._binary_data.charCodeAt(pos++);
	    if (delim == this._DELIM) {
		_mark = this._binary_data.charCodeAt(pos++);
		if (_mark != 0x0) {
		    pos -= 2;
		    break;
		}
	    }
	}

	segsize = pos - pos_start_of_segment;

	if (this._markers[mark]) {
	    mark_code = this._markers[mark][0];
	    mark_fn = this._markers[mark][1];
	} else {
	    mark_code = "UNKN";
	    mark_fn = undefined;
	}

	if (mark_fn) {
	    this[mark_fn](mark, pos_start_of_segment + 2, segsize - 2);
	}

    }

    if (this.general === undefined) {
	throw Error("Invalid JPEG file.");
    }

    return this;
};

this.JpegMeta.JpegFile.prototype.toString = function () {
    return "[JpegFile " + this.filename + " " +
	this.general.type + " " +
	this.general.pixelWidth + "x" +
	this.general.pixelHeight +
	" Depth: " + this.general.depth + "]";
};

/* Some useful constants */
this.JpegMeta.JpegFile.prototype._SOI_MARKER = '\xff\xd8';
this.JpegMeta.JpegFile.prototype._DELIM = 0xff;
this.JpegMeta.JpegFile.prototype._EOI = 0xd9;
this.JpegMeta.JpegFile.prototype._SOS = 0xda;

this.JpegMeta.JpegFile.prototype._sofHandler = function _sofHandler (mark, pos) {
    if (this.general !== undefined) {
	throw Error("Unexpected multiple-frame image");
    }

    this._addMetaGroup("general", "General");
    this.general._addProperty("depth", "Depth", JpegMeta.parseNum(">", this._binary_data, pos, 1));
    this.general._addProperty("pixelHeight", "Pixel Height", JpegMeta.parseNum(">", this._binary_data, pos + 1, 2));
    this.general._addProperty("pixelWidth", "Pixel Width",JpegMeta.parseNum(">", this._binary_data, pos + 3, 2));
    this.general._addProperty("type", "Type", this._markers[mark][2]);
};

this.JpegMeta.JpegFile.prototype._commentHandler = function _commentHandler (mark, pos, size) {

    var _pos, result;
    pos++;
    size--;
    _pos = pos;
    result = "";

    while(_pos < pos+size) {
        result += String.fromCharCode(this._binary_data.charCodeAt(_pos));
        _pos++;
    }

    this._addMetaGroup("comment", "Comment");
    this.comment._addProperty("comment", "Comment", result);
};


/* JFIF idents */
this.JpegMeta.JpegFile.prototype._JFIF_IDENT = "JFIF\x00";
this.JpegMeta.JpegFile.prototype._JFXX_IDENT = "JFXX\x00";

/* EXIF idents */
this.JpegMeta.JpegFile.prototype._EXIF_IDENT = "Exif\x00";

/* TIFF types */
this.JpegMeta.JpegFile.prototype._types = {
    /* The format is identifier : ["type name", type_size_in_bytes ] */
    1 : ["BYTE", 1],
    2 : ["ASCII", 1],
    3 : ["SHORT", 2],
    4 : ["LONG", 4],
    5 : ["RATIONAL", 8],
    6 : ["SBYTE", 1],
    7 : ["UNDEFINED", 1],
    8 : ["SSHORT", 2],
    9 : ["SLONG", 4],
    10 : ["SRATIONAL", 8],
    11 : ["FLOAT", 4],
    12 : ["DOUBLE", 8]
};

this.JpegMeta.JpegFile.prototype._tifftags = {
    /* A. Tags relating to image data structure */
    256 : ["Image width", "ImageWidth"],
    257 : ["Image height", "ImageLength"],
    258 : ["Number of bits per component", "BitsPerSample"],
    259 : ["Compression scheme", "Compression",
	   {1 : "uncompressed", 6 : "JPEG compression" }],
    262 : ["Pixel composition", "PhotmetricInerpretation",
	   {2 : "RGB", 6 : "YCbCr"}],
    274 : ["Orientation of image", "Orientation",
	   /* FIXME: Check the mirror-image / reverse encoding and rotation */
	   {1 : "Normal", 2 : "Reverse?",
	    3 : "Upside-down", 4 : "Upside-down Reverse",
	    5 : "90 degree CW", 6 : "90 degree CW reverse",
	    7 : "90 degree CCW", 8 : "90 degree CCW reverse"}],
    277 : ["Number of components", "SamplesPerPixel"],
    284 : ["Image data arrangement", "PlanarConfiguration",
	   {1 : "chunky format", 2 : "planar format"}],
    530 : ["Subsampling ratio of Y to C", "YCbCrSubSampling"],
    531 : ["Y and C positioning", "YCbCrPositioning",
	   {1 : "centered", 2 : "co-sited"}],
    282 : ["X Resolution", "XResolution"],
    283 : ["Y Resolution", "YResolution"],
    296 : ["Resolution Unit", "ResolutionUnit",
	   {2 : "inches", 3 : "centimeters"}],
    /* B. Tags realting to recording offset */
    273 : ["Image data location", "StripOffsets"],
    278 : ["Number of rows per strip", "RowsPerStrip"],
    279 : ["Bytes per compressed strip", "StripByteCounts"],
    513 : ["Offset to JPEG SOI", "JPEGInterchangeFormat"],
    514 : ["Bytes of JPEG Data", "JPEGInterchangeFormatLength"],
    /* C. Tags relating to image data characteristics */
    301 : ["Transfer function", "TransferFunction"],
    318 : ["White point chromaticity", "WhitePoint"],
    319 : ["Chromaticities of primaries", "PrimaryChromaticities"],
    529 : ["Color space transformation matrix coefficients", "YCbCrCoefficients"],
    532 : ["Pair of black and white reference values", "ReferenceBlackWhite"],
    /* D. Other tags */
    306 : ["Date and time", "DateTime"],
    270 : ["Image title", "ImageDescription"],
    271 : ["Make", "Make"],
    272 : ["Model", "Model"],
    305 : ["Software", "Software"],
    315 : ["Person who created the image", "Artist"],
    316 : ["Host Computer", "HostComputer"],
    33432 : ["Copyright holder", "Copyright"],

    34665 : ["Exif tag", "ExifIfdPointer"],
    34853 : ["GPS tag", "GPSInfoIfdPointer"]
};

this.JpegMeta.JpegFile.prototype._exiftags = {
    /* Tag Support Levels (2) - 0th IFX Exif Private Tags */
    /* A. Tags Relating to Version */
    36864 : ["Exif Version", "ExifVersion"],
    40960 : ["FlashPix Version", "FlashpixVersion"],

    /* B. Tag Relating to Image Data Characteristics */
    40961 : ["Color Space", "ColorSpace"],

    /* C. Tags Relating to Image Configuration */
    37121 : ["Meaning of each component", "ComponentsConfiguration"],
    37122 : ["Compressed Bits Per Pixel", "CompressedBitsPerPixel"],
    40962 : ["Pixel X Dimension", "PixelXDimension"],
    40963 : ["Pixel Y Dimension", "PixelYDimension"],

    /* D. Tags Relating to User Information */
    37500 : ["Manufacturer notes", "MakerNote"],
    37510 : ["User comments", "UserComment"],

    /* E. Tag Relating to Related File Information */
    40964 : ["Related audio file", "RelatedSoundFile"],

    /* F. Tags Relating to Date and Time */
    36867 : ["Date Time Original", "DateTimeOriginal"],
    36868 : ["Date Time Digitized", "DateTimeDigitized"],
    37520 : ["DateTime subseconds", "SubSecTime"],
    37521 : ["DateTimeOriginal subseconds", "SubSecTimeOriginal"],
    37522 : ["DateTimeDigitized subseconds", "SubSecTimeDigitized"],

    /* G. Tags Relating to Picture-Taking Conditions */
    33434 : ["Exposure time", "ExposureTime"],
    33437 : ["FNumber", "FNumber"],
    34850 : ["Exposure program", "ExposureProgram"],
    34852 : ["Spectral sensitivity", "SpectralSensitivity"],
    34855 : ["ISO Speed Ratings", "ISOSpeedRatings"],
    34856 : ["Optoelectric coefficient", "OECF"],
    37377 : ["Shutter Speed",  "ShutterSpeedValue"],
    37378 : ["Aperture Value", "ApertureValue"],
    37379 : ["Brightness", "BrightnessValue"],
    37380 : ["Exposure Bias Value", "ExposureBiasValue"],
    37381 : ["Max Aperture Value", "MaxApertureValue"],
    37382 : ["Subject Distance", "SubjectDistance"],
    37383 : ["Metering Mode", "MeteringMode"],
    37384 : ["Light Source", "LightSource"],
    37385 : ["Flash", "Flash"],
    37386 : ["Focal Length", "FocalLength"],
    37396 : ["Subject Area", "SubjectArea"],
    41483 : ["Flash Energy", "FlashEnergy"],
    41484 : ["Spatial Frequency Response", "SpatialFrequencyResponse"],
    41486 : ["Focal Plane X Resolution", "FocalPlaneXResolution"],
    41487 : ["Focal Plane Y Resolution", "FocalPlaneYResolution"],
    41488 : ["Focal Plane Resolution Unit", "FocalPlaneResolutionUnit"],
    41492 : ["Subject Location", "SubjectLocation"],
    41493 : ["Exposure Index", "ExposureIndex"],
    41495 : ["Sensing Method", "SensingMethod"],
    41728 : ["File Source", "FileSource"],
    41729 : ["Scene Type", "SceneType"],
    41730 : ["CFA Pattern", "CFAPattern"],
    41985 : ["Custom Rendered", "CustomRendered"],
    41986 : ["Exposure Mode", "Exposure Mode"],
    41987 : ["White Balance", "WhiteBalance"],
    41988 : ["Digital Zoom Ratio", "DigitalZoomRatio"],
    41989 : ["Focal length in 35 mm film", "FocalLengthIn35mmFilm"],
    41990 : ["Scene Capture Type", "SceneCaptureType"],
    41991 : ["Gain Control", "GainControl"],
    41992 : ["Contrast", "Contrast"],
    41993 : ["Saturation", "Saturation"],
    41994 : ["Sharpness", "Sharpness"],
    41995 : ["Device settings description", "DeviceSettingDescription"],
    41996 : ["Subject distance range", "SubjectDistanceRange"],

    /* H. Other Tags */
    42016 : ["Unique image ID", "ImageUniqueID"],

    40965 : ["Interoperability tag", "InteroperabilityIFDPointer"]
};

this.JpegMeta.JpegFile.prototype._gpstags = {
    /* A. Tags Relating to GPS */
    0 : ["GPS tag version", "GPSVersionID"],
    1 : ["North or South Latitude", "GPSLatitudeRef"],
    2 : ["Latitude", "GPSLatitude"],
    3 : ["East or West Longitude", "GPSLongitudeRef"],
    4 : ["Longitude", "GPSLongitude"],
    5 : ["Altitude reference", "GPSAltitudeRef"],
    6 : ["Altitude", "GPSAltitude"],
    7 : ["GPS time (atomic clock)", "GPSTimeStamp"],
    8 : ["GPS satellites usedd for measurement", "GPSSatellites"],
    9 : ["GPS receiver status", "GPSStatus"],
    10 : ["GPS mesaurement mode", "GPSMeasureMode"],
    11 : ["Measurement precision", "GPSDOP"],
    12 : ["Speed unit", "GPSSpeedRef"],
    13 : ["Speed of GPS receiver", "GPSSpeed"],
    14 : ["Reference for direction of movement", "GPSTrackRef"],
    15 : ["Direction of movement", "GPSTrack"],
    16 : ["Reference for direction of image", "GPSImgDirectionRef"],
    17 : ["Direction of image", "GPSImgDirection"],
    18 : ["Geodetic survey data used", "GPSMapDatum"],
    19 : ["Reference for latitude of destination", "GPSDestLatitudeRef"],
    20 : ["Latitude of destination", "GPSDestLatitude"],
    21 : ["Reference for longitude of destination", "GPSDestLongitudeRef"],
    22 : ["Longitude of destination", "GPSDestLongitude"],
    23 : ["Reference for bearing of destination", "GPSDestBearingRef"],
    24 : ["Bearing of destination", "GPSDestBearing"],
    25 : ["Reference for distance to destination", "GPSDestDistanceRef"],
    26 : ["Distance to destination", "GPSDestDistance"],
    27 : ["Name of GPS processing method", "GPSProcessingMethod"],
    28 : ["Name of GPS area", "GPSAreaInformation"],
    29 : ["GPS Date", "GPSDateStamp"],
    30 : ["GPS differential correction", "GPSDifferential"]
};

this.JpegMeta.JpegFile.prototype._iptctags = {
    0 : ['Record Version', 'recordVersion'],
    3 : ['Object Type Reference', 'objectType'],
    4 : ['Object Attribute Reference', 'objectAttribute'],
    5 : ['Object Name', 'objectName'],
    7 : ['Edit Status', 'editStatus'],
    8 : ['Editorial Update', 'editorialUpdate'],
    10 : ['Urgency', 'urgency'],
    12 : ['Subject Reference', 'subjectRef'],
    15 : ['Category', 'category'],
    20 : ['Supplemental Category', 'supplCategory'],
    22 : ['Fixture Identifier', 'fixtureID'],
    25 : ['Keywords', 'keywords'],
    26 : ['Content Location Code', 'contentLocCode'],
    27 : ['Content Location Name', 'contentLocName'],
    30 : ['Release Date', 'releaseDate'],
    35 : ['Release Time', 'releaseTime'],
    37 : ['Expiration Date', 'expirationDate'],
    38 : ['Expiration Time', 'expirationTime'],
    40 : ['Special Instructions', 'specialInstructions'],
    42 : ['Action Advised', 'actionAdvised'],
    45 : ['Reference Service', 'refService'],
    47 : ['Reference Date', 'refDate'],
    50 : ['Reference Number', 'refNumber'],
    55 : ['Date Created', 'dateCreated'],
    60 : ['Time Created', 'timeCreated'],
    62 : ['Digital Creation Date', 'digitalCreationDate'],
    63 : ['Digital Creation Time', 'digitalCreationTime'],
    65 : ['Originating Program', 'originatingProgram'],
    70 : ['Program Version', 'programVersion'],
    75 : ['Object Cycle', 'objectCycle'],
    80 : ['By-line', 'byline'],
    85 : ['By-line Title', 'bylineTitle'],
    90 : ['City', 'city'],
    92 : ['Sub-location', 'sublocation'],
    95 : ['Province/State', 'state'],
    100 : ['Country Code', 'countryCode'],
    101 : ['Country Name', 'countryName'],
    103 : ['Original Transmission Reference', 'origTransRef'],
    105 : ['Headline', 'headline'],
    110 : ['Credit', 'credit'],
    115 : ['Source', 'source'],
    116 : ['Copyright Notice', 'copyrightNotice'],
    118 : ['Contact', 'contact'],
    120 : ['Caption/Abstract', 'caption'],
    122 : ['Writer/Editor', 'writerEditor'],
    125 : ['Rasterized Caption', 'rasterizedCaption'],
    130 : ['Image Type', 'imageType'],
    131 : ['Image Orientation', 'imageOrientation'],
    135 : ['Language Identifier', 'languageID'],
    150 : ['Audio Type', 'audioType'],
    151 : ['Audio Sampling Rate', 'audioSamplingRate'],
    152 : ['Audio Sampling Resolution', 'audioSamplingRes'],
    153 : ['Audio Duration', 'audioDuration'],
    154 : ['Audio Outcue', 'audioOutcue'],
    200 : ['Preview File Format', 'previewFileFormat'],
    201 : ['Preview File Format Version', 'previewFileFormatVer'],
    202 : ['Preview Data', 'previewData']
};

this.JpegMeta.JpegFile.prototype._markers = {
    /* Start Of Frame markers, non-differential, Huffman coding */
    0xc0: ["SOF0", "_sofHandler", "Baseline DCT"],
    0xc1: ["SOF1", "_sofHandler", "Extended sequential DCT"],
    0xc2: ["SOF2", "_sofHandler", "Progressive DCT"],
    0xc3: ["SOF3", "_sofHandler", "Lossless (sequential)"],

    /* Start Of Frame markers, differential, Huffman coding */
    0xc5: ["SOF5", "_sofHandler", "Differential sequential DCT"],
    0xc6: ["SOF6", "_sofHandler", "Differential progressive DCT"],
    0xc7: ["SOF7", "_sofHandler", "Differential lossless (sequential)"],

    /* Start Of Frame markers, non-differential, arithmetic coding */
    0xc8: ["JPG", null, "Reserved for JPEG extensions"],
    0xc9: ["SOF9", "_sofHandler", "Extended sequential DCT"],
    0xca: ["SOF10", "_sofHandler", "Progressive DCT"],
    0xcb: ["SOF11", "_sofHandler", "Lossless (sequential)"],

    /* Start Of Frame markers, differential, arithmetic coding */
    0xcd: ["SOF13", "_sofHandler", "Differential sequential DCT"],
    0xce: ["SOF14", "_sofHandler", "Differential progressive DCT"],
    0xcf: ["SOF15", "_sofHandler", "Differential lossless (sequential)"],

    /* Huffman table specification */
    0xc4: ["DHT", null, "Define Huffman table(s)"],
    0xcc: ["DAC", null, "Define arithmetic coding conditioning(s)"],

    /* Restart interval termination" */
    0xd0: ["RST0", null, "Restart with modulo 8 count �0�"],
    0xd1: ["RST1", null, "Restart with modulo 8 count �1�"],
    0xd2: ["RST2", null, "Restart with modulo 8 count �2�"],
    0xd3: ["RST3", null, "Restart with modulo 8 count �3�"],
    0xd4: ["RST4", null, "Restart with modulo 8 count �4�"],
    0xd5: ["RST5", null, "Restart with modulo 8 count �5�"],
    0xd6: ["RST6", null, "Restart with modulo 8 count �6�"],
    0xd7: ["RST7", null, "Restart with modulo 8 count �7�"],

    /* Other markers */
    0xd8: ["SOI", null, "Start of image"],
    0xd9: ["EOI", null, "End of image"],
    0xda: ["SOS", null, "Start of scan"],
    0xdb: ["DQT", null, "Define quantization table(s)"],
    0xdc: ["DNL", null, "Define number of lines"],
    0xdd: ["DRI", null, "Define restart interval"],
    0xde: ["DHP", null, "Define hierarchical progression"],
    0xdf: ["EXP", null, "Expand reference component(s)"],
    0xe0: ["APP0", "_app0Handler", "Reserved for application segments"],
    0xe1: ["APP1", "_app1Handler"],
    0xe2: ["APP2", null],
    0xe3: ["APP3", null],
    0xe4: ["APP4", null],
    0xe5: ["APP5", null],
    0xe6: ["APP6", null],
    0xe7: ["APP7", null],
    0xe8: ["APP8", null],
    0xe9: ["APP9", null],
    0xea: ["APP10", null],
    0xeb: ["APP11", null],
    0xec: ["APP12", null],
    0xed: ["IPTC", "_iptcHandler", "IPTC Photo Metadata"],
    0xee: ["APP14", null],
    0xef: ["APP15", null],
    0xf0: ["JPG0", null], /* Reserved for JPEG extensions */
    0xf1: ["JPG1", null],
    0xf2: ["JPG2", null],
    0xf3: ["JPG3", null],
    0xf4: ["JPG4", null],
    0xf5: ["JPG5", null],
    0xf6: ["JPG6", null],
    0xf7: ["JPG7", null],
    0xf8: ["JPG8", null],
    0xf9: ["JPG9", null],
    0xfa: ["JPG10", null],
    0xfb: ["JPG11", null],
    0xfc: ["JPG12", null],
    0xfd: ["JPG13", null],
    0xfe: ["COM", "_commentHandler", "Comment"], /* Comment */

    /* Reserved markers */
    0x01: ["JPG13", null] /* For temporary private use in arithmetic coding */
    /* 02 -> bf are reserverd */
};

/* Private methods */
this.JpegMeta.JpegFile.prototype._addMetaGroup = function _addMetaGroup(name, description) {
    var group = new JpegMeta.MetaGroup(name, description);
    this[group.fieldName] = group;
    this.metaGroups[group.fieldName] = group;
    return group;
};

this.JpegMeta.JpegFile.prototype._parseIfd = function _parseIfd(endian, _binary_data, base, ifd_offset, tags, name, description) {
    var num_fields = JpegMeta.parseNum(endian, _binary_data, base + ifd_offset, 2);
    /* Per tag variables */
    var tag_base;
    var tag_field;
    var type, type_field, type_size;
    var num_values;
    var value_offset;
    var value;
    var _val;
    var num;
    var den;

    var group;

    group = this._addMetaGroup(name, description);

    for (var i = 0; i < num_fields; i++) {
	/* parse the field */
	tag_base = base + ifd_offset + 2 + (i * 12);
	tag_field = JpegMeta.parseNum(endian, _binary_data, tag_base, 2);
	type_field = JpegMeta.parseNum(endian, _binary_data, tag_base + 2, 2);
	num_values = JpegMeta.parseNum(endian, _binary_data, tag_base + 4, 4);
	value_offset = JpegMeta.parseNum(endian, _binary_data, tag_base + 8, 4);
	if (this._types[type_field] === undefined) {
	    continue;
	}
	type = this._types[type_field][0];
	type_size = this._types[type_field][1];

	if (type_size * num_values <= 4) {
	    /* Data is in-line */
	    value_offset = tag_base + 8;
	} else {
	    value_offset = base + value_offset;
	}

	/* Read the value */
	if (type == "UNDEFINED") {
	    /* FIXME: This should be done better */
	    /*value = _binary_data.slice(value_offset, value_offset + num_values); */
	    value = undefined;
	} else if (type == "ASCII") {
	    value = _binary_data.slice(value_offset, value_offset + num_values);
	    value = value.split('\x00')[0];
	    if (!JpegMeta.stringIsClean(value)) {
		value = "";
	    }
	    /* strip trail nul */
	} else {
	    value = new Array();
	    for (var j = 0; j < num_values; j++, value_offset += type_size) {
		if (type == "BYTE" || type == "SHORT" || type == "LONG") {
		    value.push(JpegMeta.parseNum(endian, _binary_data, value_offset, type_size));
		}
		if (type == "SBYTE" || type == "SSHORT" || type == "SLONG") {
		    value.push(JpegMeta.parseSnum(endian, _binary_data, value_offset, type_size));
		}
		if (type == "RATIONAL") {
		    num = JpegMeta.parseNum(endian, _binary_data, value_offset, 4);
		    den = JpegMeta.parseNum(endian, _binary_data, value_offset + 4, 4);
		    value.push(new JpegMeta.Rational(num, den));
		}
		if (type == "SRATIONAL") {
		    num = JpegMeta.parseSnum(endian, _binary_data, value_offset, 4);
		    den = JpegMeta.parseSnum(endian, _binary_data, value_offset + 4, 4);
		    value.push(new JpegMeta.Rational(num, den));
		}
		value.push();
	    }
	    if (num_values === 1) {
		value = value[0];
	    }
	}
        if (tags.hasOwnProperty(tag_field)) {
	    group._addProperty(tags[tag_field][1], tags[tag_field][0], value);
        } else {
            console.log("WARNING(jpegmeta.js): Unknown tag: ", tag_field);
        }
    }
};

this.JpegMeta.JpegFile.prototype._jfifHandler = function _jfifHandler(mark, pos) {
    if (this.jfif !== undefined) {
	throw Error("Multiple JFIF segments found");
    }
    this._addMetaGroup("jfif", "JFIF");
    this.jfif._addProperty("version_major", "Version Major", this._binary_data.charCodeAt(pos + 5));
    this.jfif._addProperty("version_minor", "Version Minor", this._binary_data.charCodeAt(pos + 6));
    this.jfif._addProperty("version", "JFIF Version", this.jfif.version_major.value + "." + this.jfif.version_minor.value);
    this.jfif._addProperty("units", "Density Unit", this._binary_data.charCodeAt(pos + 7));
    this.jfif._addProperty("Xdensity", "X density", JpegMeta.parseNum(">", this._binary_data, pos + 8, 2));
    this.jfif._addProperty("Ydensity", "Y Density", JpegMeta.parseNum(">", this._binary_data, pos + 10, 2));
    this.jfif._addProperty("Xthumbnail", "X Thumbnail", JpegMeta.parseNum(">", this._binary_data, pos + 12, 1));
    this.jfif._addProperty("Ythumbnail", "Y Thumbnail", JpegMeta.parseNum(">", this._binary_data, pos + 13, 1));
};


/* Handle app0 segments */
this.JpegMeta.JpegFile.prototype._app0Handler = function app0Handler(mark, pos) {
    var ident = this._binary_data.slice(pos, pos + 5);
    if (ident == this._JFIF_IDENT) {
	this._jfifHandler(mark, pos);
    } else if (ident == this._JFXX_IDENT) {
	/* Don't handle JFXX Ident yet */
    } else {
	/* Don't know about other idents */
    }
};


/* Handle app1 segments */
this.JpegMeta.JpegFile.prototype._app1Handler = function _app1Handler(mark, pos) {
    var ident = this._binary_data.slice(pos, pos + 5);
    if (ident == this._EXIF_IDENT) {
	this._exifHandler(mark, pos + 6);
    } else {
	/* Don't know about other idents */
    }
};

/* Handle exif segments */
JpegMeta.JpegFile.prototype._exifHandler = function _exifHandler(mark, pos) {
    if (this.exif !== undefined) {
	throw new Error("Multiple JFIF segments found");
    }

    /* Parse this TIFF header */
    var endian;
    var magic_field;
    var ifd_offset;
    var primary_ifd, exif_ifd, gps_ifd;
    var endian_field = this._binary_data.slice(pos, pos + 2);

    /* Trivia: This 'I' is for Intel, the 'M' is for Motorola */
    if (endian_field === "II") {
	endian = "<";
    } else if (endian_field === "MM") {
	endian = ">";
    } else {
	throw new Error("Malformed TIFF meta-data. Unknown endianess: " + endian_field);
    }

    magic_field = JpegMeta.parseNum(endian, this._binary_data, pos + 2, 2);

    if (magic_field !== 42) {
	throw new Error("Malformed TIFF meta-data. Bad magic: " + magic_field);
    }

    ifd_offset = JpegMeta.parseNum(endian, this._binary_data, pos + 4, 4);

    /* Parse 0th IFD */
    this._parseIfd(endian, this._binary_data, pos, ifd_offset, this._tifftags, "tiff", "TIFF");

    if (this.tiff.ExifIfdPointer) {
	this._parseIfd(endian, this._binary_data, pos, this.tiff.ExifIfdPointer.value, this._exiftags, "exif", "Exif");
    }

    if (this.tiff.GPSInfoIfdPointer) {
	this._parseIfd(endian, this._binary_data, pos, this.tiff.GPSInfoIfdPointer.value, this._gpstags, "gps", "GPS");
	if (this.gps.GPSLatitude) {
	    var latitude;
	    latitude = this.gps.GPSLatitude.value[0].asFloat() +
		(1 / 60) * this.gps.GPSLatitude.value[1].asFloat() +
		(1 / 3600) * this.gps.GPSLatitude.value[2].asFloat();
	    if (this.gps.GPSLatitudeRef.value === "S") {
		latitude = -latitude;
	    }
	    this.gps._addProperty("latitude", "Dec. Latitude", latitude);
	}
	if (this.gps.GPSLongitude) {
	    var longitude;
	    longitude = this.gps.GPSLongitude.value[0].asFloat() +
		(1 / 60) * this.gps.GPSLongitude.value[1].asFloat() +
		(1 / 3600) * this.gps.GPSLongitude.value[2].asFloat();
	    if (this.gps.GPSLongitudeRef.value === "W") {
		longitude = -longitude;
	    }
	    this.gps._addProperty("longitude", "Dec. Longitude", longitude);
	}
    }
};

this.JpegMeta.JpegFile.prototype._iptcHandler = function _iptcHandler(mark, pos, segsize) {
    this._addMetaGroup("iptc", "IPTC");

    var endian = '<';
    var offset, fieldStart, title, value, tag;
    var length = JpegMeta.parseNum(endian, this._binary_data, pos + 4, 1);
    var FILE_SEPARATOR_CHAR = 28,
        START_OF_TEXT_CHAR = 2;

    for (var i = 0; i < segsize; i++) {
        fieldStart = pos + i;
        if (JpegMeta.parseNum(endian, this._binary_data, fieldStart, 1) == START_OF_TEXT_CHAR) {
            tag = JpegMeta.parseNum(endian, this._binary_data, fieldStart + 1, 1);
            tag_desc = this._iptctags[tag];

            if (!tag_desc) continue;
            length = 0;
            offset = 2;

            while (
                offset < segsize &&
                JpegMeta.parseNum(endian, this._binary_data, fieldStart + offset, 1) != FILE_SEPARATOR_CHAR &&
                JpegMeta.parseNum(endian, this._binary_data, fieldStart + offset + 1, 1) != START_OF_TEXT_CHAR) {
                offset++;
                length++;
            }

            if (!length) continue;

            value = this._binary_data.slice(pos + i + 2, pos + i + 2 + length);
            value = value.replace('\000', '').trim();

            this.iptc._addProperty(tag_desc[1], tag_desc[0], value);
            i += length - 1;
        }
    }
};

"function"!=typeof Object.create&&(Object.create=function(o){function e(){}return e.prototype=o,new e}),function($,o,e,i){var t={init:function(o,e){var i=this;i.elem=e,i.$elem=$(e),i.imageSrc=i.$elem.data("zoom-image")?i.$elem.data("zoom-image"):i.$elem.attr("src"),i.options=$.extend({},$.fn.elevateZoom.options,o),i.options.tint&&(i.options.lensColour="none",i.options.lensOpacity="1"),"inner"==i.options.zoomType&&(i.options.showLens=!1),i.$elem.parent().removeAttr("title").removeAttr("alt"),i.zoomImage=i.imageSrc,i.refresh(1),$("#"+i.options.gallery+" a").click(function(o){return i.options.galleryActiveClass&&($("#"+i.options.gallery+" a").removeClass(i.options.galleryActiveClass),$(this).addClass(i.options.galleryActiveClass)),o.preventDefault(),$(this).data("zoom-image")?i.zoomImagePre=$(this).data("zoom-image"):i.zoomImagePre=$(this).data("image"),i.swaptheimage($(this).data("image"),i.zoomImagePre),!1})},refresh:function(o){var e=this;setTimeout(function(){e.fetch(e.imageSrc)},o||e.options.refresh)},fetch:function(o){var e=this,i=new Image;i.onload=function(){e.largeWidth=i.width,e.largeHeight=i.height,e.startZoom(),e.currentImage=e.imageSrc,e.options.onZoomedImageLoaded(e.$elem)},i.src=o},startZoom:function(){var o=this;if(o.nzWidth=o.$elem.width(),o.nzHeight=o.$elem.height(),o.isWindowActive=!1,o.isLensActive=!1,o.isTintActive=!1,o.overWindow=!1,o.options.imageCrossfade&&(o.zoomWrap=o.$elem.wrap('<div style="height:'+o.nzHeight+"px;width:"+o.nzWidth+'px;" class="zoomWrapper" />'),o.$elem.css("position","absolute")),o.zoomLock=1,o.scrollingLock=!1,o.changeBgSize=!1,o.currentZoomLevel=o.options.zoomLevel,o.nzOffset=o.$elem.offset(),o.widthRatio=o.largeWidth/o.currentZoomLevel/o.nzWidth,o.heightRatio=o.largeHeight/o.currentZoomLevel/o.nzHeight,"window"==o.options.zoomType&&(o.zoomWindowStyle="overflow: hidden;background-position: 0px 0px;text-align:center;background-color: "+String(o.options.zoomWindowBgColour)+";width: "+String(o.options.zoomWindowWidth)+"px;height: "+String(o.options.zoomWindowHeight)+"px;float: left;background-size: "+o.largeWidth/o.currentZoomLevel+"px "+o.largeHeight/o.currentZoomLevel+"px;display: none;z-index:100;border: "+String(o.options.borderSize)+"px solid "+o.options.borderColour+";background-repeat: no-repeat;position: absolute;"),"inner"==o.options.zoomType){var e=o.$elem.css("border-left-width");o.zoomWindowStyle="overflow: hidden;margin-left: "+String(e)+";margin-top: "+String(e)+";background-position: 0px 0px;width: "+String(o.nzWidth)+"px;height: "+String(o.nzHeight)+"px;px;float: left;display: none;cursor:"+o.options.cursor+";px solid "+o.options.borderColour+";background-repeat: no-repeat;position: absolute;"}"window"==o.options.zoomType&&(o.nzHeight<o.options.zoomWindowWidth/o.widthRatio?lensHeight=o.nzHeight:lensHeight=String(o.options.zoomWindowHeight/o.heightRatio),o.largeWidth<o.options.zoomWindowWidth?lensWidth=o.nzWidth:lensWidth=o.options.zoomWindowWidth/o.widthRatio,o.lensStyle="background-position: 0px 0px;width: "+String(o.options.zoomWindowWidth/o.widthRatio)+"px;height: "+String(o.options.zoomWindowHeight/o.heightRatio)+"px;float: right;display: none;overflow: hidden;z-index: 999;-webkit-transform: translateZ(0);opacity:"+o.options.lensOpacity+";filter: alpha(opacity = "+100*o.options.lensOpacity+"); zoom:1;width:"+lensWidth+"px;height:"+lensHeight+"px;background-color:"+o.options.lensColour+";cursor:"+o.options.cursor+";border: "+o.options.lensBorderSize+"px solid "+o.options.lensBorderColour+";background-repeat: no-repeat;position: absolute;"),o.tintStyle="display: block;position: absolute;background-color: "+o.options.tintColour+";filter:alpha(opacity=0);opacity: 0;width: "+o.nzWidth+"px;height: "+o.nzHeight+"px;",o.lensRound="","lens"==o.options.zoomType&&(o.lensStyle="background-position: 0px 0px;float: left;display: none;border: "+String(o.options.borderSize)+"px solid "+o.options.borderColour+";width:"+String(o.options.lensSize)+"px;height:"+String(o.options.lensSize)+"px;background-repeat: no-repeat;position: absolute;"),"round"==o.options.lensShape&&(o.lensRound="border-top-left-radius: "+String(o.options.lensSize/2+o.options.borderSize)+"px;border-top-right-radius: "+String(o.options.lensSize/2+o.options.borderSize)+"px;border-bottom-left-radius: "+String(o.options.lensSize/2+o.options.borderSize)+"px;border-bottom-right-radius: "+String(o.options.lensSize/2+o.options.borderSize)+"px;"),o.zoomContainer=$('<div class="zoomContainer" style="-webkit-transform: translateZ(0);position:absolute;left:'+o.nzOffset.left+"px;top:"+o.nzOffset.top+"px;height:"+o.nzHeight+"px;width:"+o.nzWidth+'px;"></div>'),$("body").append(o.zoomContainer),o.options.containLensZoom&&"lens"==o.options.zoomType&&o.zoomContainer.css("overflow","hidden"),"inner"!=o.options.zoomType&&(o.zoomLens=$("<div class='zoomLens' style='"+o.lensStyle+o.lensRound+"'>&nbsp;</div>").appendTo(o.zoomContainer).click(function(){o.$elem.trigger("click")}),o.options.tint&&(o.tintContainer=$("<div/>").addClass("tintContainer"),o.zoomTint=$("<div class='zoomTint' style='"+o.tintStyle+"'></div>"),o.zoomLens.wrap(o.tintContainer),o.zoomTintcss=o.zoomLens.after(o.zoomTint),o.zoomTintImage=$('<img style="position: absolute; left: 0px; top: 0px; max-width: none; width: '+o.nzWidth+"px; height: "+o.nzHeight+'px;" src="'+o.imageSrc+'">').appendTo(o.zoomLens).click(function(){o.$elem.trigger("click")}))),isNaN(o.options.zoomWindowPosition)?o.zoomWindow=$("<div style='z-index:999;left:"+o.windowOffsetLeft+"px;top:"+o.windowOffsetTop+"px;"+o.zoomWindowStyle+"' class='zoomWindow'>&nbsp;</div>").appendTo("body").click(function(){o.$elem.trigger("click")}):o.zoomWindow=$("<div style='z-index:999;left:"+o.windowOffsetLeft+"px;top:"+o.windowOffsetTop+"px;"+o.zoomWindowStyle+"' class='zoomWindow'>&nbsp;</div>").appendTo(o.zoomContainer).click(function(){o.$elem.trigger("click")}),o.zoomWindowContainer=$("<div/>").addClass("zoomWindowContainer").css("width",o.options.zoomWindowWidth),o.zoomWindow.wrap(o.zoomWindowContainer),"lens"==o.options.zoomType&&o.zoomLens.css({backgroundImage:"url('"+o.imageSrc+"')"}),"window"==o.options.zoomType&&o.zoomWindow.css({backgroundImage:"url('"+o.imageSrc+"')"}),"inner"==o.options.zoomType&&o.zoomWindow.css({backgroundImage:"url('"+o.imageSrc+"')"}),o.$elem.bind("touchmove",function(e){e.preventDefault();var i=e.originalEvent.touches[0]||e.originalEvent.changedTouches[0];o.setPosition(i)}),o.zoomContainer.bind("touchmove",function(e){"inner"==o.options.zoomType&&o.showHideWindow("show"),e.preventDefault();var i=e.originalEvent.touches[0]||e.originalEvent.changedTouches[0];o.setPosition(i)}),o.zoomContainer.bind("touchend",function(e){o.showHideWindow("hide"),o.options.showLens&&o.showHideLens("hide"),o.options.tint&&"inner"!=o.options.zoomType&&o.showHideTint("hide")}),o.$elem.bind("touchend",function(e){o.showHideWindow("hide"),o.options.showLens&&o.showHideLens("hide"),o.options.tint&&"inner"!=o.options.zoomType&&o.showHideTint("hide")}),o.options.showLens&&(o.zoomLens.bind("touchmove",function(e){e.preventDefault();var i=e.originalEvent.touches[0]||e.originalEvent.changedTouches[0];o.setPosition(i)}),o.zoomLens.bind("touchend",function(e){o.showHideWindow("hide"),o.options.showLens&&o.showHideLens("hide"),o.options.tint&&"inner"!=o.options.zoomType&&o.showHideTint("hide")})),o.$elem.bind("mousemove",function(e){0==o.overWindow&&o.setElements("show"),(o.lastX!==e.clientX||o.lastY!==e.clientY)&&(o.setPosition(e),o.currentLoc=e),o.lastX=e.clientX,o.lastY=e.clientY}),o.zoomContainer.bind("mousemove",function(e){0==o.overWindow&&o.setElements("show"),(o.lastX!==e.clientX||o.lastY!==e.clientY)&&(o.setPosition(e),o.currentLoc=e),o.lastX=e.clientX,o.lastY=e.clientY}),"inner"!=o.options.zoomType&&o.zoomLens.bind("mousemove",function(e){(o.lastX!==e.clientX||o.lastY!==e.clientY)&&(o.setPosition(e),o.currentLoc=e),o.lastX=e.clientX,o.lastY=e.clientY}),o.options.tint&&"inner"!=o.options.zoomType&&o.zoomTint.bind("mousemove",function(e){(o.lastX!==e.clientX||o.lastY!==e.clientY)&&(o.setPosition(e),o.currentLoc=e),o.lastX=e.clientX,o.lastY=e.clientY}),"inner"==o.options.zoomType&&o.zoomWindow.bind("mousemove",function(e){(o.lastX!==e.clientX||o.lastY!==e.clientY)&&(o.setPosition(e),o.currentLoc=e),o.lastX=e.clientX,o.lastY=e.clientY}),o.zoomContainer.add(o.$elem).mouseenter(function(){0==o.overWindow&&o.setElements("show")}).mouseleave(function(){o.scrollLock||(o.setElements("hide"),o.options.onDestroy(o.$elem))}),"inner"!=o.options.zoomType&&o.zoomWindow.mouseenter(function(){o.overWindow=!0,o.setElements("hide")}).mouseleave(function(){o.overWindow=!1}),1!=o.options.zoomLevel,o.options.minZoomLevel?o.minZoomLevel=o.options.minZoomLevel:o.minZoomLevel=2*o.options.scrollZoomIncrement,o.options.scrollZoom&&o.zoomContainer.add(o.$elem).bind("mousewheel DOMMouseScroll MozMousePixelScroll",function(e){o.scrollLock=!0,clearTimeout($.data(this,"timer")),$.data(this,"timer",setTimeout(function(){o.scrollLock=!1},250));var i=e.originalEvent.wheelDelta||-1*e.originalEvent.detail;return e.stopImmediatePropagation(),e.stopPropagation(),e.preventDefault(),i/120>0?o.currentZoomLevel>=o.minZoomLevel&&o.changeZoomLevel(o.currentZoomLevel-o.options.scrollZoomIncrement):o.options.maxZoomLevel?o.currentZoomLevel<=o.options.maxZoomLevel&&o.changeZoomLevel(parseFloat(o.currentZoomLevel)+o.options.scrollZoomIncrement):o.changeZoomLevel(parseFloat(o.currentZoomLevel)+o.options.scrollZoomIncrement),!1})},setElements:function(o){var e=this;return e.options.zoomEnabled?("show"==o&&e.isWindowSet&&("inner"==e.options.zoomType&&e.showHideWindow("show"),"window"==e.options.zoomType&&e.showHideWindow("show"),e.options.showLens&&e.showHideLens("show"),e.options.tint&&"inner"!=e.options.zoomType&&e.showHideTint("show")),void("hide"==o&&("window"==e.options.zoomType&&e.showHideWindow("hide"),e.options.tint||e.showHideWindow("hide"),e.options.showLens&&e.showHideLens("hide"),e.options.tint&&e.showHideTint("hide")))):!1},setPosition:function(o){var e=this;return e.options.zoomEnabled?(e.nzHeight=e.$elem.height(),e.nzWidth=e.$elem.width(),e.nzOffset=e.$elem.offset(),e.options.tint&&"inner"!=e.options.zoomType&&(e.zoomTint.css({top:0}),e.zoomTint.css({left:0})),e.options.responsive&&!e.options.scrollZoom&&e.options.showLens&&(e.nzHeight<e.options.zoomWindowWidth/e.widthRatio?lensHeight=e.nzHeight:lensHeight=String(e.options.zoomWindowHeight/e.heightRatio),e.largeWidth<e.options.zoomWindowWidth?lensWidth=e.nzWidth:lensWidth=e.options.zoomWindowWidth/e.widthRatio,e.widthRatio=e.largeWidth/e.nzWidth,e.heightRatio=e.largeHeight/e.nzHeight,"lens"!=e.options.zoomType&&(e.nzHeight<e.options.zoomWindowWidth/e.widthRatio?lensHeight=e.nzHeight:lensHeight=String(e.options.zoomWindowHeight/e.heightRatio),e.nzWidth<e.options.zoomWindowHeight/e.heightRatio?lensWidth=e.nzWidth:lensWidth=String(e.options.zoomWindowWidth/e.widthRatio),e.zoomLens.css("width",lensWidth),e.zoomLens.css("height",lensHeight),e.options.tint&&(e.zoomTintImage.css("width",e.nzWidth),e.zoomTintImage.css("height",e.nzHeight))),"lens"==e.options.zoomType&&e.zoomLens.css({width:String(e.options.lensSize)+"px",height:String(e.options.lensSize)+"px"})),e.zoomContainer.css({top:e.nzOffset.top}),e.zoomContainer.css({left:e.nzOffset.left}),e.mouseLeft=parseInt(o.pageX-e.nzOffset.left),e.mouseTop=parseInt(o.pageY-e.nzOffset.top),"window"==e.options.zoomType&&(e.Etoppos=e.mouseTop<e.zoomLens.height()/2,e.Eboppos=e.mouseTop>e.nzHeight-e.zoomLens.height()/2-2*e.options.lensBorderSize,e.Eloppos=e.mouseLeft<0+e.zoomLens.width()/2,e.Eroppos=e.mouseLeft>e.nzWidth-e.zoomLens.width()/2-2*e.options.lensBorderSize),"inner"==e.options.zoomType&&(e.Etoppos=e.mouseTop<e.nzHeight/2/e.heightRatio,e.Eboppos=e.mouseTop>e.nzHeight-e.nzHeight/2/e.heightRatio,e.Eloppos=e.mouseLeft<0+e.nzWidth/2/e.widthRatio,e.Eroppos=e.mouseLeft>e.nzWidth-e.nzWidth/2/e.widthRatio-2*e.options.lensBorderSize),e.mouseLeft<0||e.mouseTop<0||e.mouseLeft>e.nzWidth||e.mouseTop>e.nzHeight?void e.setElements("hide"):(e.options.showLens&&(e.lensLeftPos=String(Math.floor(e.mouseLeft-e.zoomLens.width()/2)),e.lensTopPos=String(Math.floor(e.mouseTop-e.zoomLens.height()/2))),e.Etoppos&&(e.lensTopPos=0),e.Eloppos&&(e.windowLeftPos=0,e.lensLeftPos=0,e.tintpos=0),"window"==e.options.zoomType&&(e.Eboppos&&(e.lensTopPos=Math.max(e.nzHeight-e.zoomLens.height()-2*e.options.lensBorderSize,0)),e.Eroppos&&(e.lensLeftPos=e.nzWidth-e.zoomLens.width()-2*e.options.lensBorderSize)),"inner"==e.options.zoomType&&(e.Eboppos&&(e.lensTopPos=Math.max(e.nzHeight-2*e.options.lensBorderSize,0)),e.Eroppos&&(e.lensLeftPos=e.nzWidth-e.nzWidth-2*e.options.lensBorderSize)),"lens"==e.options.zoomType&&(e.windowLeftPos=String(-1*((o.pageX-e.nzOffset.left)*e.widthRatio-e.zoomLens.width()/2)),e.windowTopPos=String(-1*((o.pageY-e.nzOffset.top)*e.heightRatio-e.zoomLens.height()/2)),e.zoomLens.css({backgroundPosition:e.windowLeftPos+"px "+e.windowTopPos+"px"}),e.changeBgSize&&(e.nzHeight>e.nzWidth?("lens"==e.options.zoomType&&e.zoomLens.css({"background-size":e.largeWidth/e.newvalueheight+"px "+e.largeHeight/e.newvalueheight+"px"}),e.zoomWindow.css({"background-size":e.largeWidth/e.newvalueheight+"px "+e.largeHeight/e.newvalueheight+"px"})):("lens"==e.options.zoomType&&e.zoomLens.css({"background-size":e.largeWidth/e.newvaluewidth+"px "+e.largeHeight/e.newvaluewidth+"px"}),e.zoomWindow.css({"background-size":e.largeWidth/e.newvaluewidth+"px "+e.largeHeight/e.newvaluewidth+"px"})),e.changeBgSize=!1),e.setWindowPostition(o)),e.options.tint&&"inner"!=e.options.zoomType&&e.setTintPosition(o),"window"==e.options.zoomType&&e.setWindowPostition(o),"inner"==e.options.zoomType&&e.setWindowPostition(o),e.options.showLens&&(e.fullwidth&&"lens"!=e.options.zoomType&&(e.lensLeftPos=0),e.zoomLens.css({left:e.lensLeftPos+"px",top:e.lensTopPos+"px"})),void 0)):!1},showHideWindow:function(o){var e=this;"show"==o&&(e.isWindowActive||(e.options.zoomWindowFadeIn?e.zoomWindow.stop(!0,!0,!1).fadeIn(e.options.zoomWindowFadeIn):e.zoomWindow.show(),e.isWindowActive=!0)),"hide"==o&&e.isWindowActive&&(e.options.zoomWindowFadeOut?e.zoomWindow.stop(!0,!0).fadeOut(e.options.zoomWindowFadeOut,function(){e.loop&&(clearInterval(e.loop),e.loop=!1)}):e.zoomWindow.hide(),e.isWindowActive=!1)},showHideLens:function(o){var e=this;"show"==o&&(e.isLensActive||(e.options.lensFadeIn?e.zoomLens.stop(!0,!0,!1).fadeIn(e.options.lensFadeIn):e.zoomLens.show(),e.isLensActive=!0)),"hide"==o&&e.isLensActive&&(e.options.lensFadeOut?e.zoomLens.stop(!0,!0).fadeOut(e.options.lensFadeOut):e.zoomLens.hide(),e.isLensActive=!1)},showHideTint:function(o){var e=this;"show"==o&&(e.isTintActive||(e.options.zoomTintFadeIn?e.zoomTint.css({opacity:e.options.tintOpacity}).animate().stop(!0,!0).fadeIn("slow"):(e.zoomTint.css({opacity:e.options.tintOpacity}).animate(),e.zoomTint.show()),e.isTintActive=!0)),"hide"==o&&e.isTintActive&&(e.options.zoomTintFadeOut?e.zoomTint.stop(!0,!0).fadeOut(e.options.zoomTintFadeOut):e.zoomTint.hide(),e.isTintActive=!1)},setLensPostition:function(o){},setWindowPostition:function(o){var e=this;if(isNaN(e.options.zoomWindowPosition))e.externalContainer=$("#"+e.options.zoomWindowPosition),e.externalContainerWidth=e.externalContainer.width(),e.externalContainerHeight=e.externalContainer.height(),e.externalContainerOffset=e.externalContainer.offset(),e.windowOffsetTop=e.externalContainerOffset.top,e.windowOffsetLeft=e.externalContainerOffset.left;else switch(e.options.zoomWindowPosition){case 1:e.windowOffsetTop=e.options.zoomWindowOffety,e.windowOffsetLeft=+e.nzWidth;break;case 2:e.options.zoomWindowHeight>e.nzHeight&&(e.windowOffsetTop=-1*(e.options.zoomWindowHeight/2-e.nzHeight/2),e.windowOffsetLeft=e.nzWidth);break;case 3:e.windowOffsetTop=e.nzHeight-e.zoomWindow.height()-2*e.options.borderSize,e.windowOffsetLeft=e.nzWidth;break;case 4:e.windowOffsetTop=e.nzHeight,e.windowOffsetLeft=e.nzWidth;break;case 5:e.windowOffsetTop=e.nzHeight,e.windowOffsetLeft=e.nzWidth-e.zoomWindow.width()-2*e.options.borderSize;break;case 6:e.options.zoomWindowHeight>e.nzHeight&&(e.windowOffsetTop=e.nzHeight,e.windowOffsetLeft=-1*(e.options.zoomWindowWidth/2-e.nzWidth/2+2*e.options.borderSize));break;case 7:e.windowOffsetTop=e.nzHeight,e.windowOffsetLeft=0;break;case 8:e.windowOffsetTop=e.nzHeight,e.windowOffsetLeft=-1*(e.zoomWindow.width()+2*e.options.borderSize);break;case 9:e.windowOffsetTop=e.nzHeight-e.zoomWindow.height()-2*e.options.borderSize,e.windowOffsetLeft=-1*(e.zoomWindow.width()+2*e.options.borderSize);break;case 10:e.options.zoomWindowHeight>e.nzHeight&&(e.windowOffsetTop=-1*(e.options.zoomWindowHeight/2-e.nzHeight/2),e.windowOffsetLeft=-1*(e.zoomWindow.width()+2*e.options.borderSize));break;case 11:e.windowOffsetTop=e.options.zoomWindowOffety,e.windowOffsetLeft=-1*(e.zoomWindow.width()+2*e.options.borderSize);break;case 12:e.windowOffsetTop=-1*(e.zoomWindow.height()+2*e.options.borderSize),e.windowOffsetLeft=-1*(e.zoomWindow.width()+2*e.options.borderSize);break;case 13:e.windowOffsetTop=-1*(e.zoomWindow.height()+2*e.options.borderSize),e.windowOffsetLeft=0;break;case 14:e.options.zoomWindowHeight>e.nzHeight&&(e.windowOffsetTop=-1*(e.zoomWindow.height()+2*e.options.borderSize),e.windowOffsetLeft=-1*(e.options.zoomWindowWidth/2-e.nzWidth/2+2*e.options.borderSize));break;case 15:e.windowOffsetTop=-1*(e.zoomWindow.height()+2*e.options.borderSize),e.windowOffsetLeft=e.nzWidth-e.zoomWindow.width()-2*e.options.borderSize;break;case 16:e.windowOffsetTop=-1*(e.zoomWindow.height()+2*e.options.borderSize),e.windowOffsetLeft=e.nzWidth;break;default:e.windowOffsetTop=e.options.zoomWindowOffety,e.windowOffsetLeft=e.nzWidth}e.isWindowSet=!0,e.windowOffsetTop=e.windowOffsetTop+e.options.zoomWindowOffety,e.windowOffsetLeft=e.windowOffsetLeft+e.options.zoomWindowOffetx,e.zoomWindow.css({top:e.windowOffsetTop}),e.zoomWindow.css({left:e.windowOffsetLeft}),"inner"==e.options.zoomType&&(e.zoomWindow.css({top:0}),e.zoomWindow.css({left:0})),e.windowLeftPos=String(-1*((o.pageX-e.nzOffset.left)*e.widthRatio-e.zoomWindow.width()/2)),e.windowTopPos=String(-1*((o.pageY-e.nzOffset.top)*e.heightRatio-e.zoomWindow.height()/2)),e.Etoppos&&(e.windowTopPos=0),e.Eloppos&&(e.windowLeftPos=0),e.Eboppos&&(e.windowTopPos=-1*(e.largeHeight/e.currentZoomLevel-e.zoomWindow.height())),e.Eroppos&&(e.windowLeftPos=-1*(e.largeWidth/e.currentZoomLevel-e.zoomWindow.width())),e.fullheight&&(e.windowTopPos=0),e.fullwidth&&(e.windowLeftPos=0),("window"==e.options.zoomType||"inner"==e.options.zoomType)&&(1==e.zoomLock&&(e.widthRatio<=1&&(e.windowLeftPos=0),e.heightRatio<=1&&(e.windowTopPos=0)),"window"==e.options.zoomType&&(e.largeHeight<e.options.zoomWindowHeight&&(e.windowTopPos=0),e.largeWidth<e.options.zoomWindowWidth&&(e.windowLeftPos=0)),e.options.easing?(e.xp||(e.xp=0),e.yp||(e.yp=0),e.loop||(e.loop=setInterval(function(){e.xp+=(e.windowLeftPos-e.xp)/e.options.easingAmount,e.yp+=(e.windowTopPos-e.yp)/e.options.easingAmount,e.scrollingLock?(clearInterval(e.loop),e.xp=e.windowLeftPos,e.yp=e.windowTopPos,e.xp=-1*((o.pageX-e.nzOffset.left)*e.widthRatio-e.zoomWindow.width()/2),e.yp=-1*((o.pageY-e.nzOffset.top)*e.heightRatio-e.zoomWindow.height()/2),e.changeBgSize&&(e.nzHeight>e.nzWidth?("lens"==e.options.zoomType&&e.zoomLens.css({"background-size":e.largeWidth/e.newvalueheight+"px "+e.largeHeight/e.newvalueheight+"px"}),e.zoomWindow.css({"background-size":e.largeWidth/e.newvalueheight+"px "+e.largeHeight/e.newvalueheight+"px"})):("lens"!=e.options.zoomType&&e.zoomLens.css({"background-size":e.largeWidth/e.newvaluewidth+"px "+e.largeHeight/e.newvalueheight+"px"}),e.zoomWindow.css({"background-size":e.largeWidth/e.newvaluewidth+"px "+e.largeHeight/e.newvaluewidth+"px"})),e.changeBgSize=!1),e.zoomWindow.css({backgroundPosition:e.windowLeftPos+"px "+e.windowTopPos+"px"}),e.scrollingLock=!1,e.loop=!1):Math.round(Math.abs(e.xp-e.windowLeftPos)+Math.abs(e.yp-e.windowTopPos))<1?(clearInterval(e.loop),e.zoomWindow.css({backgroundPosition:e.windowLeftPos+"px "+e.windowTopPos+"px"}),e.loop=!1):(e.changeBgSize&&(e.nzHeight>e.nzWidth?("lens"==e.options.zoomType&&e.zoomLens.css({"background-size":e.largeWidth/e.newvalueheight+"px "+e.largeHeight/e.newvalueheight+"px"}),e.zoomWindow.css({"background-size":e.largeWidth/e.newvalueheight+"px "+e.largeHeight/e.newvalueheight+"px"})):("lens"!=e.options.zoomType&&e.zoomLens.css({"background-size":e.largeWidth/e.newvaluewidth+"px "+e.largeHeight/e.newvaluewidth+"px"}),e.zoomWindow.css({"background-size":e.largeWidth/e.newvaluewidth+"px "+e.largeHeight/e.newvaluewidth+"px"})),e.changeBgSize=!1),e.zoomWindow.css({backgroundPosition:e.xp+"px "+e.yp+"px"}))},16))):(e.changeBgSize&&(e.nzHeight>e.nzWidth?("lens"==e.options.zoomType&&e.zoomLens.css({"background-size":e.largeWidth/e.newvalueheight+"px "+e.largeHeight/e.newvalueheight+"px"}),e.zoomWindow.css({"background-size":e.largeWidth/e.newvalueheight+"px "+e.largeHeight/e.newvalueheight+"px"})):("lens"==e.options.zoomType&&e.zoomLens.css({"background-size":e.largeWidth/e.newvaluewidth+"px "+e.largeHeight/e.newvaluewidth+"px"}),e.largeHeight/e.newvaluewidth<e.options.zoomWindowHeight?e.zoomWindow.css({"background-size":e.largeWidth/e.newvaluewidth+"px "+e.largeHeight/e.newvaluewidth+"px"}):e.zoomWindow.css({"background-size":e.largeWidth/e.newvalueheight+"px "+e.largeHeight/e.newvalueheight+"px"})),e.changeBgSize=!1),e.zoomWindow.css({backgroundPosition:e.windowLeftPos+"px "+e.windowTopPos+"px"})))},setTintPosition:function(o){var e=this;e.nzOffset=e.$elem.offset(),e.tintpos=String(-1*(o.pageX-e.nzOffset.left-e.zoomLens.width()/2)),e.tintposy=String(-1*(o.pageY-e.nzOffset.top-e.zoomLens.height()/2)),e.Etoppos&&(e.tintposy=0),e.Eloppos&&(e.tintpos=0),e.Eboppos&&(e.tintposy=-1*(e.nzHeight-e.zoomLens.height()-2*e.options.lensBorderSize)),e.Eroppos&&(e.tintpos=-1*(e.nzWidth-e.zoomLens.width()-2*e.options.lensBorderSize)),e.options.tint&&(e.fullheight&&(e.tintposy=0),e.fullwidth&&(e.tintpos=0),e.zoomTintImage.css({left:e.tintpos+"px"}),e.zoomTintImage.css({top:e.tintposy+"px"}))},swaptheimage:function(o,e){var i=this,t=new Image;i.options.loadingIcon&&(i.spinner=$("<div style=\"background: url('"+i.options.loadingIcon+"') no-repeat center;height:"+i.nzHeight+"px;width:"+i.nzWidth+'px;z-index: 2000;position: absolute; background-position: center center;"></div>'),i.$elem.after(i.spinner)),i.options.onImageSwap(i.$elem),t.onload=function(){i.largeWidth=t.width,i.largeHeight=t.height,i.zoomImage=e,i.zoomWindow.css({"background-size":i.largeWidth+"px "+i.largeHeight+"px"}),i.swapAction(o,e)},t.src=e},swapAction:function(o,e){var i=this,t=new Image;if(t.onload=function(){i.nzHeight=t.height,i.nzWidth=t.width,i.options.onImageSwapComplete(i.$elem),i.doneCallback()},t.src=o,i.currentZoomLevel=i.options.zoomLevel,i.options.maxZoomLevel=!1,"lens"==i.options.zoomType&&i.zoomLens.css({backgroundImage:"url('"+e+"')"}),"window"==i.options.zoomType&&i.zoomWindow.css({backgroundImage:"url('"+e+"')"}),"inner"==i.options.zoomType&&i.zoomWindow.css({backgroundImage:"url('"+e+"')"}),i.currentImage=e,i.options.imageCrossfade){var n=i.$elem,s=n.clone();if(i.$elem.attr("src",o),i.$elem.after(s),s.stop(!0).fadeOut(i.options.imageCrossfade,function(){$(this).remove()}),i.$elem.width("auto").removeAttr("width"),i.$elem.height("auto").removeAttr("height"),n.fadeIn(i.options.imageCrossfade),i.options.tint&&"inner"!=i.options.zoomType){var h=i.zoomTintImage,a=h.clone();i.zoomTintImage.attr("src",e),i.zoomTintImage.after(a),a.stop(!0).fadeOut(i.options.imageCrossfade,function(){$(this).remove()}),h.fadeIn(i.options.imageCrossfade),i.zoomTint.css({height:i.$elem.height()}),i.zoomTint.css({width:i.$elem.width()})}i.zoomContainer.css("height",i.$elem.height()),i.zoomContainer.css("width",i.$elem.width()),"inner"==i.options.zoomType&&(i.options.constrainType||(i.zoomWrap.parent().css("height",i.$elem.height()),i.zoomWrap.parent().css("width",i.$elem.width()),i.zoomWindow.css("height",i.$elem.height()),i.zoomWindow.css("width",i.$elem.width()))),i.options.imageCrossfade&&(i.zoomWrap.css("height",i.$elem.height()),i.zoomWrap.css("width",i.$elem.width()))}else i.$elem.attr("src",o),i.options.tint&&(i.zoomTintImage.attr("src",e),i.zoomTintImage.attr("height",i.$elem.height()),i.zoomTintImage.css({height:i.$elem.height()}),i.zoomTint.css({height:i.$elem.height()})),i.zoomContainer.css("height",i.$elem.height()),i.zoomContainer.css("width",i.$elem.width()),i.options.imageCrossfade&&(i.zoomWrap.css("height",i.$elem.height()),i.zoomWrap.css("width",i.$elem.width()));i.options.constrainType&&("height"==i.options.constrainType&&(i.zoomContainer.css("height",i.options.constrainSize),i.zoomContainer.css("width","auto"),i.options.imageCrossfade?(i.zoomWrap.css("height",i.options.constrainSize),i.zoomWrap.css("width","auto"),i.constwidth=i.zoomWrap.width()):(i.$elem.css("height",i.options.constrainSize),i.$elem.css("width","auto"),i.constwidth=i.$elem.width()),"inner"==i.options.zoomType&&(i.zoomWrap.parent().css("height",i.options.constrainSize),i.zoomWrap.parent().css("width",i.constwidth),i.zoomWindow.css("height",i.options.constrainSize),i.zoomWindow.css("width",i.constwidth)),i.options.tint&&(i.tintContainer.css("height",i.options.constrainSize),i.tintContainer.css("width",i.constwidth),i.zoomTint.css("height",i.options.constrainSize),i.zoomTint.css("width",i.constwidth),i.zoomTintImage.css("height",i.options.constrainSize),i.zoomTintImage.css("width",i.constwidth))),"width"==i.options.constrainType&&(i.zoomContainer.css("height","auto"),i.zoomContainer.css("width",i.options.constrainSize),i.options.imageCrossfade?(i.zoomWrap.css("height","auto"),i.zoomWrap.css("width",i.options.constrainSize),i.constheight=i.zoomWrap.height()):(i.$elem.css("height","auto"),i.$elem.css("width",i.options.constrainSize),i.constheight=i.$elem.height()),"inner"==i.options.zoomType&&(i.zoomWrap.parent().css("height",i.constheight),i.zoomWrap.parent().css("width",i.options.constrainSize),i.zoomWindow.css("height",i.constheight),i.zoomWindow.css("width",i.options.constrainSize)),i.options.tint&&(i.tintContainer.css("height",i.constheight),i.tintContainer.css("width",i.options.constrainSize),i.zoomTint.css("height",i.constheight),i.zoomTint.css("width",i.options.constrainSize),i.zoomTintImage.css("height",i.constheight),i.zoomTintImage.css("width",i.options.constrainSize))))},doneCallback:function(){var o=this;o.options.loadingIcon&&o.spinner.hide(),o.nzOffset=o.$elem.offset(),o.nzWidth=o.$elem.width(),o.nzHeight=o.$elem.height(),o.currentZoomLevel=o.options.zoomLevel,o.widthRatio=o.largeWidth/o.nzWidth,o.heightRatio=o.largeHeight/o.nzHeight,"window"==o.options.zoomType&&(o.nzHeight<o.options.zoomWindowWidth/o.widthRatio?lensHeight=o.nzHeight:lensHeight=String(o.options.zoomWindowHeight/o.heightRatio),o.options.zoomWindowWidth<o.options.zoomWindowWidth?lensWidth=o.nzWidth:lensWidth=o.options.zoomWindowWidth/o.widthRatio,o.zoomLens&&(o.zoomLens.css("width",lensWidth),o.zoomLens.css("height",lensHeight)))},getCurrentImage:function(){var o=this;return o.zoomImage},getGalleryList:function(){var o=this;return o.gallerylist=[],o.options.gallery?$("#"+o.options.gallery+" a").each(function(){var e="";$(this).data("zoom-image")?e=$(this).data("zoom-image"):$(this).data("image")&&(e=$(this).data("image")),e==o.zoomImage?o.gallerylist.unshift({href:""+e,title:$(this).find("img").attr("title")}):o.gallerylist.push({href:""+e,title:$(this).find("img").attr("title")})}):o.gallerylist.push({href:""+o.zoomImage,title:$(this).find("img").attr("title")}),o.gallerylist},changeZoomLevel:function(o){var e=this;e.scrollingLock=!0,e.newvalue=parseFloat(o).toFixed(2),newvalue=parseFloat(o).toFixed(2),maxheightnewvalue=e.largeHeight/(e.options.zoomWindowHeight/e.nzHeight*e.nzHeight),maxwidthtnewvalue=e.largeWidth/(e.options.zoomWindowWidth/e.nzWidth*e.nzWidth),"inner"!=e.options.zoomType&&(maxheightnewvalue<=newvalue?(e.heightRatio=e.largeHeight/maxheightnewvalue/e.nzHeight,e.newvalueheight=maxheightnewvalue,e.fullheight=!0):(e.heightRatio=e.largeHeight/newvalue/e.nzHeight,e.newvalueheight=newvalue,e.fullheight=!1),maxwidthtnewvalue<=newvalue?(e.widthRatio=e.largeWidth/maxwidthtnewvalue/e.nzWidth,e.newvaluewidth=maxwidthtnewvalue,e.fullwidth=!0):(e.widthRatio=e.largeWidth/newvalue/e.nzWidth,e.newvaluewidth=newvalue,e.fullwidth=!1),"lens"==e.options.zoomType&&(maxheightnewvalue<=newvalue?(e.fullwidth=!0,e.newvaluewidth=maxheightnewvalue):(e.widthRatio=e.largeWidth/newvalue/e.nzWidth,e.newvaluewidth=newvalue,e.fullwidth=!1))),"inner"==e.options.zoomType&&(maxheightnewvalue=parseFloat(e.largeHeight/e.nzHeight).toFixed(2),maxwidthtnewvalue=parseFloat(e.largeWidth/e.nzWidth).toFixed(2),newvalue>maxheightnewvalue&&(newvalue=maxheightnewvalue),newvalue>maxwidthtnewvalue&&(newvalue=maxwidthtnewvalue),maxheightnewvalue<=newvalue?(e.heightRatio=e.largeHeight/newvalue/e.nzHeight,newvalue>maxheightnewvalue?e.newvalueheight=maxheightnewvalue:e.newvalueheight=newvalue,e.fullheight=!0):(e.heightRatio=e.largeHeight/newvalue/e.nzHeight,newvalue>maxheightnewvalue?e.newvalueheight=maxheightnewvalue:e.newvalueheight=newvalue,e.fullheight=!1),maxwidthtnewvalue<=newvalue?(e.widthRatio=e.largeWidth/newvalue/e.nzWidth,newvalue>maxwidthtnewvalue?e.newvaluewidth=maxwidthtnewvalue:e.newvaluewidth=newvalue,e.fullwidth=!0):(e.widthRatio=e.largeWidth/newvalue/e.nzWidth,e.newvaluewidth=newvalue,e.fullwidth=!1)),scrcontinue=!1,"inner"==e.options.zoomType&&(e.nzWidth>=e.nzHeight&&(e.newvaluewidth<=maxwidthtnewvalue?scrcontinue=!0:(scrcontinue=!1,e.fullheight=!0,e.fullwidth=!0)),e.nzHeight>e.nzWidth&&(e.newvaluewidth<=maxwidthtnewvalue?scrcontinue=!0:(scrcontinue=!1,e.fullheight=!0,e.fullwidth=!0))),"inner"!=e.options.zoomType&&(scrcontinue=!0),scrcontinue&&(e.zoomLock=0,e.changeZoom=!0,e.options.zoomWindowHeight/e.heightRatio<=e.nzHeight&&(e.currentZoomLevel=e.newvalueheight,"lens"!=e.options.zoomType&&"inner"!=e.options.zoomType&&(e.changeBgSize=!0,e.zoomLens.css({height:String(e.options.zoomWindowHeight/e.heightRatio)+"px"})),("lens"==e.options.zoomType||"inner"==e.options.zoomType)&&(e.changeBgSize=!0)),e.options.zoomWindowWidth/e.widthRatio<=e.nzWidth&&("inner"!=e.options.zoomType&&e.newvaluewidth>e.newvalueheight&&(e.currentZoomLevel=e.newvaluewidth),"lens"!=e.options.zoomType&&"inner"!=e.options.zoomType&&(e.changeBgSize=!0,e.zoomLens.css({width:String(e.options.zoomWindowWidth/e.widthRatio)+"px"})),("lens"==e.options.zoomType||"inner"==e.options.zoomType)&&(e.changeBgSize=!0)),"inner"==e.options.zoomType&&(e.changeBgSize=!0,e.nzWidth>e.nzHeight&&(e.currentZoomLevel=e.newvaluewidth),e.nzHeight>e.nzWidth&&(e.currentZoomLevel=e.newvaluewidth))),e.setPosition(e.currentLoc)},closeAll:function(){self.zoomWindow&&self.zoomWindow.hide(),self.zoomLens&&self.zoomLens.hide(),self.zoomTint&&self.zoomTint.hide()},changeState:function(o){var e=this;"enable"==o&&(e.options.zoomEnabled=!0),"disable"==o&&(e.options.zoomEnabled=!1)}};$.fn.elevateZoom=function(o){return this.each(function(){var e=Object.create(t);e.init(o,this),$.data(this,"elevateZoom",e)})},$.fn.elevateZoom.options={zoomActivation:"hover",zoomEnabled:!0,preloading:1,zoomLevel:1,scrollZoom:!1,scrollZoomIncrement:.1,minZoomLevel:!1,maxZoomLevel:!1,easing:!1,easingAmount:12,lensSize:200,zoomWindowWidth:400,zoomWindowHeight:400,zoomWindowOffetx:0,zoomWindowOffety:0,zoomWindowPosition:1,zoomWindowBgColour:"#fff",lensFadeIn:!1,lensFadeOut:!1,debug:!1,zoomWindowFadeIn:!1,zoomWindowFadeOut:!1,zoomWindowAlwaysShow:!1,zoomTintFadeIn:!1,zoomTintFadeOut:!1,borderSize:4,showLens:!0,borderColour:"#888",lensBorderSize:1,lensBorderColour:"#000",lensShape:"square",zoomType:"window",containLensZoom:!1,lensColour:"white",lensOpacity:.4,lenszoom:!1,tint:!1,tintColour:"#333",tintOpacity:.4,gallery:!1,galleryActiveClass:"zoomGalleryActive",imageCrossfade:!1,constrainType:!1,constrainSize:!1,loadingIcon:!1,cursor:"default",responsive:!0,onComplete:$.noop,onDestroy:function(){},onZoomedImageLoaded:function(){},onImageSwap:$.noop,onImageSwapComplete:$.noop
}}(jQuery,window,document);

/*
== malihu jquery custom scrollbar plugin == 
Version: 3.1.5 
Plugin URI: http://manos.malihu.gr/jquery-custom-content-scroller 
Author: malihu
Author URI: http://manos.malihu.gr
License: MIT License (MIT)
*/

/*
Copyright Manos Malihutsakis (email: manos@malihu.gr)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

/*
The code below is fairly long, fully commented and should be normally used in development. 
For production, use either the minified jquery.mCustomScrollbar.min.js script or 
the production-ready jquery.mCustomScrollbar.concat.min.js which contains the plugin 
and dependencies (minified). 
*/

(function(factory){
	if(typeof define==="function" && define.amd){
		define(["jquery"],factory);
	}else if(typeof module!=="undefined" && module.exports){
		module.exports=factory;
	}else{
		factory(jQuery,window,document);
	}
}(function($){
(function(init){
	var _rjs=typeof define==="function" && define.amd, /* RequireJS */
		_njs=typeof module !== "undefined" && module.exports, /* NodeJS */
		_dlp=("https:"==document.location.protocol) ? "https:" : "http:", /* location protocol */
		_url="cdnjs.cloudflare.com/ajax/libs/jquery-mousewheel/3.1.13/jquery.mousewheel.min.js";
	if(!_rjs){
		if(_njs){
			require("jquery-mousewheel")($);
		}else{
			/* load jquery-mousewheel plugin (via CDN) if it's not present or not loaded via RequireJS 
			(works when mCustomScrollbar fn is called on window load) */
			$.event.special.mousewheel || $("head").append(decodeURI("%3Cscript src="+_dlp+"//"+_url+"%3E%3C/script%3E"));
		}
	}
	init();
}(function(){
	
	/* 
	----------------------------------------
	PLUGIN NAMESPACE, PREFIX, DEFAULT SELECTOR(S) 
	----------------------------------------
	*/
	
	var pluginNS="mCustomScrollbar",
		pluginPfx="mCS",
		defaultSelector=".mCustomScrollbar",
	
	
		
	
	
	/* 
	----------------------------------------
	DEFAULT OPTIONS 
	----------------------------------------
	*/
	
		defaults={
			/*
			set element/content width/height programmatically 
			values: boolean, pixels, percentage 
				option						default
				-------------------------------------
				setWidth					false
				setHeight					false
			*/
			/*
			set the initial css top property of content  
			values: string (e.g. "-100px", "10%" etc.)
			*/
			setTop:0,
			/*
			set the initial css left property of content  
			values: string (e.g. "-100px", "10%" etc.)
			*/
			setLeft:0,
			/* 
			scrollbar axis (vertical and/or horizontal scrollbars) 
			values (string): "y", "x", "yx"
			*/
			axis:"y",
			/*
			position of scrollbar relative to content  
			values (string): "inside", "outside" ("outside" requires elements with position:relative)
			*/
			scrollbarPosition:"inside",
			/*
			scrolling inertia
			values: integer (milliseconds)
			*/
			scrollInertia:950,
			/* 
			auto-adjust scrollbar dragger length
			values: boolean
			*/
			autoDraggerLength:true,
			/*
			auto-hide scrollbar when idle 
			values: boolean
				option						default
				-------------------------------------
				autoHideScrollbar			false
			*/
			/*
			auto-expands scrollbar on mouse-over and dragging
			values: boolean
				option						default
				-------------------------------------
				autoExpandScrollbar			false
			*/
			/*
			always show scrollbar, even when there's nothing to scroll 
			values: integer (0=disable, 1=always show dragger rail and buttons, 2=always show dragger rail, dragger and buttons), boolean
			*/
			alwaysShowScrollbar:0,
			/*
			scrolling always snaps to a multiple of this number in pixels
			values: integer, array ([y,x])
				option						default
				-------------------------------------
				snapAmount					null
			*/
			/*
			when snapping, snap with this number in pixels as an offset 
			values: integer
			*/
			snapOffset:0,
			/* 
			mouse-wheel scrolling
			*/
			mouseWheel:{
				/* 
				enable mouse-wheel scrolling
				values: boolean
				*/
				enable:true,
				/* 
				scrolling amount in pixels
				values: "auto", integer 
				*/
				scrollAmount:"auto",
				/* 
				mouse-wheel scrolling axis 
				the default scrolling direction when both vertical and horizontal scrollbars are present 
				values (string): "y", "x" 
				*/
				axis:"y",
				/* 
				prevent the default behaviour which automatically scrolls the parent element(s) when end of scrolling is reached 
				values: boolean
					option						default
					-------------------------------------
					preventDefault				null
				*/
				/*
				the reported mouse-wheel delta value. The number of lines (translated to pixels) one wheel notch scrolls.  
				values: "auto", integer 
				"auto" uses the default OS/browser value 
				*/
				deltaFactor:"auto",
				/*
				normalize mouse-wheel delta to -1 or 1 (disables mouse-wheel acceleration) 
				values: boolean
					option						default
					-------------------------------------
					normalizeDelta				null
				*/
				/*
				invert mouse-wheel scrolling direction 
				values: boolean
					option						default
					-------------------------------------
					invert						null
				*/
				/*
				the tags that disable mouse-wheel when cursor is over them
				*/
				disableOver:["select","option","keygen","datalist","textarea"]
			},
			/* 
			scrollbar buttons
			*/
			scrollButtons:{ 
				/*
				enable scrollbar buttons
				values: boolean
					option						default
					-------------------------------------
					enable						null
				*/
				/*
				scrollbar buttons scrolling type 
				values (string): "stepless", "stepped"
				*/
				scrollType:"stepless",
				/*
				scrolling amount in pixels
				values: "auto", integer 
				*/
				scrollAmount:"auto"
				/*
				tabindex of the scrollbar buttons
				values: false, integer
					option						default
					-------------------------------------
					tabindex					null
				*/
			},
			/* 
			keyboard scrolling
			*/
			keyboard:{ 
				/*
				enable scrolling via keyboard
				values: boolean
				*/
				enable:true,
				/*
				keyboard scrolling type 
				values (string): "stepless", "stepped"
				*/
				scrollType:"stepless",
				/*
				scrolling amount in pixels
				values: "auto", integer 
				*/
				scrollAmount:"auto"
			},
			/*
			enable content touch-swipe scrolling 
			values: boolean, integer, string (number)
			integer values define the axis-specific minimum amount required for scrolling momentum
			*/
			contentTouchScroll:25,
			/*
			enable/disable document (default) touch-swipe scrolling 
			*/
			documentTouchScroll:true,
			/*
			advanced option parameters
			*/
			advanced:{
				/*
				auto-expand content horizontally (for "x" or "yx" axis) 
				values: boolean, integer (the value 2 forces the non scrollHeight/scrollWidth method, the value 3 forces the scrollHeight/scrollWidth method)
					option						default
					-------------------------------------
					autoExpandHorizontalScroll	null
				*/
				/*
				auto-scroll to elements with focus
				*/
				autoScrollOnFocus:"input,textarea,select,button,datalist,keygen,a[tabindex],area,object,[contenteditable='true']",
				/*
				auto-update scrollbars on content, element or viewport resize 
				should be true for fluid layouts/elements, adding/removing content dynamically, hiding/showing elements, content with images etc. 
				values: boolean
				*/
				updateOnContentResize:true,
				/*
				auto-update scrollbars each time each image inside the element is fully loaded 
				values: "auto", boolean
				*/
				updateOnImageLoad:"auto",
				/*
				auto-update scrollbars based on the amount and size changes of specific selectors 
				useful when you need to update the scrollbar(s) automatically, each time a type of element is added, removed or changes its size 
				values: boolean, string (e.g. "ul li" will auto-update scrollbars each time list-items inside the element are changed) 
				a value of true (boolean) will auto-update scrollbars each time any element is changed
					option						default
					-------------------------------------
					updateOnSelectorChange		null
				*/
				/*
				extra selectors that'll allow scrollbar dragging upon mousemove/up, pointermove/up, touchend etc. (e.g. "selector-1, selector-2")
					option						default
					-------------------------------------
					extraDraggableSelectors		null
				*/
				/*
				extra selectors that'll release scrollbar dragging upon mouseup, pointerup, touchend etc. (e.g. "selector-1, selector-2")
					option						default
					-------------------------------------
					releaseDraggableSelectors	null
				*/
				/*
				auto-update timeout 
				values: integer (milliseconds)
				*/
				autoUpdateTimeout:60
			},
			/* 
			scrollbar theme 
			values: string (see CSS/plugin URI for a list of ready-to-use themes)
			*/
			theme:"light",
			/*
			user defined callback functions
			*/
			callbacks:{
				/*
				Available callbacks: 
					callback					default
					-------------------------------------
					onCreate					null
					onInit						null
					onScrollStart				null
					onScroll					null
					onTotalScroll				null
					onTotalScrollBack			null
					whileScrolling				null
					onOverflowY					null
					onOverflowX					null
					onOverflowYNone				null
					onOverflowXNone				null
					onImageLoad					null
					onSelectorChange			null
					onBeforeUpdate				null
					onUpdate					null
				*/
				onTotalScrollOffset:0,
				onTotalScrollBackOffset:0,
				alwaysTriggerOffsets:true
			}
			/*
			add scrollbar(s) on all elements matching the current selector, now and in the future 
			values: boolean, string 
			string values: "on" (enable), "once" (disable after first invocation), "off" (disable)
			liveSelector values: string (selector)
				option						default
				-------------------------------------
				live						false
				liveSelector				null
			*/
		},
	
	
	
	
	
	/* 
	----------------------------------------
	VARS, CONSTANTS 
	----------------------------------------
	*/
	
		totalInstances=0, /* plugin instances amount */
		liveTimers={}, /* live option timers */
		oldIE=(window.attachEvent && !window.addEventListener) ? 1 : 0, /* detect IE < 9 */
		touchActive=false,touchable, /* global touch vars (for touch and pointer events) */
		/* general plugin classes */
		classes=[
			"mCSB_dragger_onDrag","mCSB_scrollTools_onDrag","mCS_img_loaded","mCS_disabled","mCS_destroyed","mCS_no_scrollbar",
			"mCS-autoHide","mCS-dir-rtl","mCS_no_scrollbar_y","mCS_no_scrollbar_x","mCS_y_hidden","mCS_x_hidden","mCSB_draggerContainer",
			"mCSB_buttonUp","mCSB_buttonDown","mCSB_buttonLeft","mCSB_buttonRight"
		],
		
	
	
	
	
	/* 
	----------------------------------------
	METHODS 
	----------------------------------------
	*/
	
		methods={
			
			/* 
			plugin initialization method 
			creates the scrollbar(s), plugin data object and options
			----------------------------------------
			*/
			
			init:function(options){
				
				var options=$.extend(true,{},defaults,options),
					selector=_selector.call(this); /* validate selector */
				
				/* 
				if live option is enabled, monitor for elements matching the current selector and 
				apply scrollbar(s) when found (now and in the future) 
				*/
				if(options.live){
					var liveSelector=options.liveSelector || this.selector || defaultSelector, /* live selector(s) */
						$liveSelector=$(liveSelector); /* live selector(s) as jquery object */
					if(options.live==="off"){
						/* 
						disable live if requested 
						usage: $(selector).mCustomScrollbar({live:"off"}); 
						*/
						removeLiveTimers(liveSelector);
						return;
					}
					liveTimers[liveSelector]=setTimeout(function(){
						/* call mCustomScrollbar fn on live selector(s) every half-second */
						$liveSelector.mCustomScrollbar(options);
						if(options.live==="once" && $liveSelector.length){
							/* disable live after first invocation */
							removeLiveTimers(liveSelector);
						}
					},500);
				}else{
					removeLiveTimers(liveSelector);
				}
				
				/* options backward compatibility (for versions < 3.0.0) and normalization */
				options.setWidth=(options.set_width) ? options.set_width : options.setWidth;
				options.setHeight=(options.set_height) ? options.set_height : options.setHeight;
				options.axis=(options.horizontalScroll) ? "x" : _findAxis(options.axis);
				options.scrollInertia=options.scrollInertia>0 && options.scrollInertia<17 ? 17 : options.scrollInertia;
				if(typeof options.mouseWheel!=="object" &&  options.mouseWheel==true){ /* old school mouseWheel option (non-object) */
					options.mouseWheel={enable:true,scrollAmount:"auto",axis:"y",preventDefault:false,deltaFactor:"auto",normalizeDelta:false,invert:false}
				}
				options.mouseWheel.scrollAmount=!options.mouseWheelPixels ? options.mouseWheel.scrollAmount : options.mouseWheelPixels;
				options.mouseWheel.normalizeDelta=!options.advanced.normalizeMouseWheelDelta ? options.mouseWheel.normalizeDelta : options.advanced.normalizeMouseWheelDelta;
				options.scrollButtons.scrollType=_findScrollButtonsType(options.scrollButtons.scrollType); 
				
				_theme(options); /* theme-specific options */
				
				/* plugin constructor */
				return $(selector).each(function(){
					
					var $this=$(this);
					
					if(!$this.data(pluginPfx)){ /* prevent multiple instantiations */
					
						/* store options and create objects in jquery data */
						$this.data(pluginPfx,{
							idx:++totalInstances, /* instance index */
							opt:options, /* options */
							scrollRatio:{y:null,x:null}, /* scrollbar to content ratio */
							overflowed:null, /* overflowed axis */
							contentReset:{y:null,x:null}, /* object to check when content resets */
							bindEvents:false, /* object to check if events are bound */
							tweenRunning:false, /* object to check if tween is running */
							sequential:{}, /* sequential scrolling object */
							langDir:$this.css("direction"), /* detect/store direction (ltr or rtl) */
							cbOffsets:null, /* object to check whether callback offsets always trigger */
							/* 
							object to check how scrolling events where last triggered 
							"internal" (default - triggered by this script), "external" (triggered by other scripts, e.g. via scrollTo method) 
							usage: object.data("mCS").trigger
							*/
							trigger:null,
							/* 
							object to check for changes in elements in order to call the update method automatically 
							*/
							poll:{size:{o:0,n:0},img:{o:0,n:0},change:{o:0,n:0}}
						});
						
						var d=$this.data(pluginPfx),o=d.opt,
							/* HTML data attributes */
							htmlDataAxis=$this.data("mcs-axis"),htmlDataSbPos=$this.data("mcs-scrollbar-position"),htmlDataTheme=$this.data("mcs-theme");
						 
						if(htmlDataAxis){o.axis=htmlDataAxis;} /* usage example: data-mcs-axis="y" */
						if(htmlDataSbPos){o.scrollbarPosition=htmlDataSbPos;} /* usage example: data-mcs-scrollbar-position="outside" */
						if(htmlDataTheme){ /* usage example: data-mcs-theme="minimal" */
							o.theme=htmlDataTheme;
							_theme(o); /* theme-specific options */
						}
						
						_pluginMarkup.call(this); /* add plugin markup */
						
						if(d && o.callbacks.onCreate && typeof o.callbacks.onCreate==="function"){o.callbacks.onCreate.call(this);} /* callbacks: onCreate */
						
						$("#mCSB_"+d.idx+"_container img:not(."+classes[2]+")").addClass(classes[2]); /* flag loaded images */
						
						methods.update.call(null,$this); /* call the update method */
					
					}
					
				});
				
			},
			/* ---------------------------------------- */
			
			
			
			/* 
			plugin update method 
			updates content and scrollbar(s) values, events and status 
			----------------------------------------
			usage: $(selector).mCustomScrollbar("update");
			*/
			
			update:function(el,cb){
				
				var selector=el || _selector.call(this); /* validate selector */
				
				return $(selector).each(function(){
					
					var $this=$(this);
					
					if($this.data(pluginPfx)){ /* check if plugin has initialized */
						
						var d=$this.data(pluginPfx),o=d.opt,
							mCSB_container=$("#mCSB_"+d.idx+"_container"),
							mCustomScrollBox=$("#mCSB_"+d.idx),
							mCSB_dragger=[$("#mCSB_"+d.idx+"_dragger_vertical"),$("#mCSB_"+d.idx+"_dragger_horizontal")];
						
						if(!mCSB_container.length){return;}
						
						if(d.tweenRunning){_stop($this);} /* stop any running tweens while updating */
						
						if(cb && d && o.callbacks.onBeforeUpdate && typeof o.callbacks.onBeforeUpdate==="function"){o.callbacks.onBeforeUpdate.call(this);} /* callbacks: onBeforeUpdate */
						
						/* if element was disabled or destroyed, remove class(es) */
						if($this.hasClass(classes[3])){$this.removeClass(classes[3]);}
						if($this.hasClass(classes[4])){$this.removeClass(classes[4]);}
						
						/* css flexbox fix, detect/set max-height */
						mCustomScrollBox.css("max-height","none");
						if(mCustomScrollBox.height()!==$this.height()){mCustomScrollBox.css("max-height",$this.height());}
						
						_expandContentHorizontally.call(this); /* expand content horizontally */
						
						if(o.axis!=="y" && !o.advanced.autoExpandHorizontalScroll){
							mCSB_container.css("width",_contentWidth(mCSB_container));
						}
						
						d.overflowed=_overflowed.call(this); /* determine if scrolling is required */
						
						_scrollbarVisibility.call(this); /* show/hide scrollbar(s) */
						
						/* auto-adjust scrollbar dragger length analogous to content */
						if(o.autoDraggerLength){_setDraggerLength.call(this);}
						
						_scrollRatio.call(this); /* calculate and store scrollbar to content ratio */
						
						_bindEvents.call(this); /* bind scrollbar events */
						
						/* reset scrolling position and/or events */
						var to=[Math.abs(mCSB_container[0].offsetTop),Math.abs(mCSB_container[0].offsetLeft)];
						if(o.axis!=="x"){ /* y/yx axis */
							if(!d.overflowed[0]){ /* y scrolling is not required */
								_resetContentPosition.call(this); /* reset content position */
								if(o.axis==="y"){
									_unbindEvents.call(this);
								}else if(o.axis==="yx" && d.overflowed[1]){
									_scrollTo($this,to[1].toString(),{dir:"x",dur:0,overwrite:"none"});
								}
							}else if(mCSB_dragger[0].height()>mCSB_dragger[0].parent().height()){
								_resetContentPosition.call(this); /* reset content position */
							}else{ /* y scrolling is required */
								_scrollTo($this,to[0].toString(),{dir:"y",dur:0,overwrite:"none"});
								d.contentReset.y=null;
							}
						}
						if(o.axis!=="y"){ /* x/yx axis */
							if(!d.overflowed[1]){ /* x scrolling is not required */
								_resetContentPosition.call(this); /* reset content position */
								if(o.axis==="x"){
									_unbindEvents.call(this);
								}else if(o.axis==="yx" && d.overflowed[0]){
									_scrollTo($this,to[0].toString(),{dir:"y",dur:0,overwrite:"none"});
								}
							}else if(mCSB_dragger[1].width()>mCSB_dragger[1].parent().width()){
								_resetContentPosition.call(this); /* reset content position */
							}else{ /* x scrolling is required */
								_scrollTo($this,to[1].toString(),{dir:"x",dur:0,overwrite:"none"});
								d.contentReset.x=null;
							}
						}
						
						/* callbacks: onImageLoad, onSelectorChange, onUpdate */
						if(cb && d){
							if(cb===2 && o.callbacks.onImageLoad && typeof o.callbacks.onImageLoad==="function"){
								o.callbacks.onImageLoad.call(this);
							}else if(cb===3 && o.callbacks.onSelectorChange && typeof o.callbacks.onSelectorChange==="function"){
								o.callbacks.onSelectorChange.call(this);
							}else if(o.callbacks.onUpdate && typeof o.callbacks.onUpdate==="function"){
								o.callbacks.onUpdate.call(this);
							}
						}
						
						_autoUpdate.call(this); /* initialize automatic updating (for dynamic content, fluid layouts etc.) */
						
					}
					
				});
				
			},
			/* ---------------------------------------- */
			
			
			
			/* 
			plugin scrollTo method 
			triggers a scrolling event to a specific value
			----------------------------------------
			usage: $(selector).mCustomScrollbar("scrollTo",value,options);
			*/
		
			scrollTo:function(val,options){
				
				/* prevent silly things like $(selector).mCustomScrollbar("scrollTo",undefined); */
				if(typeof val=="undefined" || val==null){return;}
				
				var selector=_selector.call(this); /* validate selector */
				
				return $(selector).each(function(){
					
					var $this=$(this);
					
					if($this.data(pluginPfx)){ /* check if plugin has initialized */
					
						var d=$this.data(pluginPfx),o=d.opt,
							/* method default options */
							methodDefaults={
								trigger:"external", /* method is by default triggered externally (e.g. from other scripts) */
								scrollInertia:o.scrollInertia, /* scrolling inertia (animation duration) */
								scrollEasing:"mcsEaseInOut", /* animation easing */
								moveDragger:false, /* move dragger instead of content */
								timeout:60, /* scroll-to delay */
								callbacks:true, /* enable/disable callbacks */
								onStart:true,
								onUpdate:true,
								onComplete:true
							},
							methodOptions=$.extend(true,{},methodDefaults,options),
							to=_arr.call(this,val),dur=methodOptions.scrollInertia>0 && methodOptions.scrollInertia<17 ? 17 : methodOptions.scrollInertia;
						
						/* translate yx values to actual scroll-to positions */
						to[0]=_to.call(this,to[0],"y");
						to[1]=_to.call(this,to[1],"x");
						
						/* 
						check if scroll-to value moves the dragger instead of content. 
						Only pixel values apply on dragger (e.g. 100, "100px", "-=100" etc.) 
						*/
						if(methodOptions.moveDragger){
							to[0]*=d.scrollRatio.y;
							to[1]*=d.scrollRatio.x;
						}
						
						methodOptions.dur=_isTabHidden() ? 0 : dur; //skip animations if browser tab is hidden
						
						setTimeout(function(){ 
							/* do the scrolling */
							if(to[0]!==null && typeof to[0]!=="undefined" && o.axis!=="x" && d.overflowed[0]){ /* scroll y */
								methodOptions.dir="y";
								methodOptions.overwrite="all";
								_scrollTo($this,to[0].toString(),methodOptions);
							}
							if(to[1]!==null && typeof to[1]!=="undefined" && o.axis!=="y" && d.overflowed[1]){ /* scroll x */
								methodOptions.dir="x";
								methodOptions.overwrite="none";
								_scrollTo($this,to[1].toString(),methodOptions);
							}
						},methodOptions.timeout);
						
					}
					
				});
				
			},
			/* ---------------------------------------- */
			
			
			
			/*
			plugin stop method 
			stops scrolling animation
			----------------------------------------
			usage: $(selector).mCustomScrollbar("stop");
			*/
			stop:function(){
				
				var selector=_selector.call(this); /* validate selector */
				
				return $(selector).each(function(){
					
					var $this=$(this);
					
					if($this.data(pluginPfx)){ /* check if plugin has initialized */
										
						_stop($this);
					
					}
					
				});
				
			},
			/* ---------------------------------------- */
			
			
			
			/*
			plugin disable method 
			temporarily disables the scrollbar(s) 
			----------------------------------------
			usage: $(selector).mCustomScrollbar("disable",reset); 
			reset (boolean): resets content position to 0 
			*/
			disable:function(r){
				
				var selector=_selector.call(this); /* validate selector */
				
				return $(selector).each(function(){
					
					var $this=$(this);
					
					if($this.data(pluginPfx)){ /* check if plugin has initialized */
						
						var d=$this.data(pluginPfx);
						
						_autoUpdate.call(this,"remove"); /* remove automatic updating */
						
						_unbindEvents.call(this); /* unbind events */
						
						if(r){_resetContentPosition.call(this);} /* reset content position */
						
						_scrollbarVisibility.call(this,true); /* show/hide scrollbar(s) */
						
						$this.addClass(classes[3]); /* add disable class */
					
					}
					
				});
				
			},
			/* ---------------------------------------- */
			
			
			
			/*
			plugin destroy method 
			completely removes the scrollbar(s) and returns the element to its original state
			----------------------------------------
			usage: $(selector).mCustomScrollbar("destroy"); 
			*/
			destroy:function(){
				
				var selector=_selector.call(this); /* validate selector */
				
				return $(selector).each(function(){
					
					var $this=$(this);
					
					if($this.data(pluginPfx)){ /* check if plugin has initialized */
					
						var d=$this.data(pluginPfx),o=d.opt,
							mCustomScrollBox=$("#mCSB_"+d.idx),
							mCSB_container=$("#mCSB_"+d.idx+"_container"),
							scrollbar=$(".mCSB_"+d.idx+"_scrollbar");
					
						if(o.live){removeLiveTimers(o.liveSelector || $(selector).selector);} /* remove live timers */
						
						_autoUpdate.call(this,"remove"); /* remove automatic updating */
						
						_unbindEvents.call(this); /* unbind events */
						
						_resetContentPosition.call(this); /* reset content position */
						
						$this.removeData(pluginPfx); /* remove plugin data object */
						
						_delete(this,"mcs"); /* delete callbacks object */
						
						/* remove plugin markup */
						scrollbar.remove(); /* remove scrollbar(s) first (those can be either inside or outside plugin's inner wrapper) */
						mCSB_container.find("img."+classes[2]).removeClass(classes[2]); /* remove loaded images flag */
						mCustomScrollBox.replaceWith(mCSB_container.contents()); /* replace plugin's inner wrapper with the original content */
						/* remove plugin classes from the element and add destroy class */
						$this.removeClass(pluginNS+" _"+pluginPfx+"_"+d.idx+" "+classes[6]+" "+classes[7]+" "+classes[5]+" "+classes[3]).addClass(classes[4]);
					
					}
					
				});
				
			}
			/* ---------------------------------------- */
			
		},
	
	
	
	
		
	/* 
	----------------------------------------
	FUNCTIONS
	----------------------------------------
	*/
	
		/* validates selector (if selector is invalid or undefined uses the default one) */
		_selector=function(){
			return (typeof $(this)!=="object" || $(this).length<1) ? defaultSelector : this;
		},
		/* -------------------- */
		
		
		/* changes options according to theme */
		_theme=function(obj){
			var fixedSizeScrollbarThemes=["rounded","rounded-dark","rounded-dots","rounded-dots-dark"],
				nonExpandedScrollbarThemes=["rounded-dots","rounded-dots-dark","3d","3d-dark","3d-thick","3d-thick-dark","inset","inset-dark","inset-2","inset-2-dark","inset-3","inset-3-dark"],
				disabledScrollButtonsThemes=["minimal","minimal-dark"],
				enabledAutoHideScrollbarThemes=["minimal","minimal-dark"],
				scrollbarPositionOutsideThemes=["minimal","minimal-dark"];
			obj.autoDraggerLength=$.inArray(obj.theme,fixedSizeScrollbarThemes) > -1 ? false : obj.autoDraggerLength;
			obj.autoExpandScrollbar=$.inArray(obj.theme,nonExpandedScrollbarThemes) > -1 ? false : obj.autoExpandScrollbar;
			obj.scrollButtons.enable=$.inArray(obj.theme,disabledScrollButtonsThemes) > -1 ? false : obj.scrollButtons.enable;
			obj.autoHideScrollbar=$.inArray(obj.theme,enabledAutoHideScrollbarThemes) > -1 ? true : obj.autoHideScrollbar;
			obj.scrollbarPosition=$.inArray(obj.theme,scrollbarPositionOutsideThemes) > -1 ? "outside" : obj.scrollbarPosition;
		},
		/* -------------------- */
		
		
		/* live option timers removal */
		removeLiveTimers=function(selector){
			if(liveTimers[selector]){
				clearTimeout(liveTimers[selector]);
				_delete(liveTimers,selector);
			}
		},
		/* -------------------- */
		
		
		/* normalizes axis option to valid values: "y", "x", "yx" */
		_findAxis=function(val){
			return (val==="yx" || val==="xy" || val==="auto") ? "yx" : (val==="x" || val==="horizontal") ? "x" : "y";
		},
		/* -------------------- */
		
		
		/* normalizes scrollButtons.scrollType option to valid values: "stepless", "stepped" */
		_findScrollButtonsType=function(val){
			return (val==="stepped" || val==="pixels" || val==="step" || val==="click") ? "stepped" : "stepless";
		},
		/* -------------------- */
		
		
		/* generates plugin markup */
		_pluginMarkup=function(){
			var $this=$(this),d=$this.data(pluginPfx),o=d.opt,
				expandClass=o.autoExpandScrollbar ? " "+classes[1]+"_expand" : "",
				scrollbar=["<div id='mCSB_"+d.idx+"_scrollbar_vertical' class='mCSB_scrollTools mCSB_"+d.idx+"_scrollbar mCS-"+o.theme+" mCSB_scrollTools_vertical"+expandClass+"'><div class='"+classes[12]+"'><div id='mCSB_"+d.idx+"_dragger_vertical' class='mCSB_dragger' style='position:absolute;'><div class='mCSB_dragger_bar' /></div><div class='mCSB_draggerRail' /></div></div>","<div id='mCSB_"+d.idx+"_scrollbar_horizontal' class='mCSB_scrollTools mCSB_"+d.idx+"_scrollbar mCS-"+o.theme+" mCSB_scrollTools_horizontal"+expandClass+"'><div class='"+classes[12]+"'><div id='mCSB_"+d.idx+"_dragger_horizontal' class='mCSB_dragger' style='position:absolute;'><div class='mCSB_dragger_bar' /></div><div class='mCSB_draggerRail' /></div></div>"],
				wrapperClass=o.axis==="yx" ? "mCSB_vertical_horizontal" : o.axis==="x" ? "mCSB_horizontal" : "mCSB_vertical",
				scrollbars=o.axis==="yx" ? scrollbar[0]+scrollbar[1] : o.axis==="x" ? scrollbar[1] : scrollbar[0],
				contentWrapper=o.axis==="yx" ? "<div id='mCSB_"+d.idx+"_container_wrapper' class='mCSB_container_wrapper' />" : "",
				autoHideClass=o.autoHideScrollbar ? " "+classes[6] : "",
				scrollbarDirClass=(o.axis!=="x" && d.langDir==="rtl") ? " "+classes[7] : "";
			if(o.setWidth){$this.css("width",o.setWidth);} /* set element width */
			if(o.setHeight){$this.css("height",o.setHeight);} /* set element height */
			o.setLeft=(o.axis!=="y" && d.langDir==="rtl") ? "989999px" : o.setLeft; /* adjust left position for rtl direction */
			$this.addClass(pluginNS+" _"+pluginPfx+"_"+d.idx+autoHideClass+scrollbarDirClass).wrapInner("<div id='mCSB_"+d.idx+"' class='mCustomScrollBox mCS-"+o.theme+" "+wrapperClass+"'><div id='mCSB_"+d.idx+"_container' class='mCSB_container' style='position:relative; top:"+o.setTop+"; left:"+o.setLeft+";' dir='"+d.langDir+"' /></div>");
			var mCustomScrollBox=$("#mCSB_"+d.idx),
				mCSB_container=$("#mCSB_"+d.idx+"_container");
			if(o.axis!=="y" && !o.advanced.autoExpandHorizontalScroll){
				mCSB_container.css("width",_contentWidth(mCSB_container));
			}
			if(o.scrollbarPosition==="outside"){
				if($this.css("position")==="static"){ /* requires elements with non-static position */
					$this.css("position","relative");
				}
				$this.css("overflow","visible");
				mCustomScrollBox.addClass("mCSB_outside").after(scrollbars);
			}else{
				mCustomScrollBox.addClass("mCSB_inside").append(scrollbars);
				mCSB_container.wrap(contentWrapper);
			}
			_scrollButtons.call(this); /* add scrollbar buttons */
			/* minimum dragger length */
			var mCSB_dragger=[$("#mCSB_"+d.idx+"_dragger_vertical"),$("#mCSB_"+d.idx+"_dragger_horizontal")];
			mCSB_dragger[0].css("min-height",mCSB_dragger[0].height());
			mCSB_dragger[1].css("min-width",mCSB_dragger[1].width());
		},
		/* -------------------- */
		
		
		/* calculates content width */
		_contentWidth=function(el){
			var val=[el[0].scrollWidth,Math.max.apply(Math,el.children().map(function(){return $(this).outerWidth(true);}).get())],w=el.parent().width();
			return val[0]>w ? val[0] : val[1]>w ? val[1] : "100%";
		},
		/* -------------------- */
		
		
		/* expands content horizontally */
		_expandContentHorizontally=function(){
			var $this=$(this),d=$this.data(pluginPfx),o=d.opt,
				mCSB_container=$("#mCSB_"+d.idx+"_container");
			if(o.advanced.autoExpandHorizontalScroll && o.axis!=="y"){
				/* calculate scrollWidth */
				mCSB_container.css({"width":"auto","min-width":0,"overflow-x":"scroll"});
				var w=Math.ceil(mCSB_container[0].scrollWidth);
				if(o.advanced.autoExpandHorizontalScroll===3 || (o.advanced.autoExpandHorizontalScroll!==2 && w>mCSB_container.parent().width())){
					mCSB_container.css({"width":w,"min-width":"100%","overflow-x":"inherit"});
				}else{
					/* 
					wrap content with an infinite width div and set its position to absolute and width to auto. 
					Setting width to auto before calculating the actual width is important! 
					We must let the browser set the width as browser zoom values are impossible to calculate.
					*/
					mCSB_container.css({"overflow-x":"inherit","position":"absolute"})
						.wrap("<div class='mCSB_h_wrapper' style='position:relative; left:0; width:999999px;' />")
						.css({ /* set actual width, original position and un-wrap */
							/* 
							get the exact width (with decimals) and then round-up. 
							Using jquery outerWidth() will round the width value which will mess up with inner elements that have non-integer width
							*/
							"width":(Math.ceil(mCSB_container[0].getBoundingClientRect().right+0.4)-Math.floor(mCSB_container[0].getBoundingClientRect().left)),
							"min-width":"100%",
							"position":"relative"
						}).unwrap();
				}
			}
		},
		/* -------------------- */
		
		
		/* adds scrollbar buttons */
		_scrollButtons=function(){
			var $this=$(this),d=$this.data(pluginPfx),o=d.opt,
				mCSB_scrollTools=$(".mCSB_"+d.idx+"_scrollbar:first"),
				tabindex=!_isNumeric(o.scrollButtons.tabindex) ? "" : "tabindex='"+o.scrollButtons.tabindex+"'",
				btnHTML=[
					"<a href='#' class='"+classes[13]+"' "+tabindex+" />",
					"<a href='#' class='"+classes[14]+"' "+tabindex+" />",
					"<a href='#' class='"+classes[15]+"' "+tabindex+" />",
					"<a href='#' class='"+classes[16]+"' "+tabindex+" />"
				],
				btn=[(o.axis==="x" ? btnHTML[2] : btnHTML[0]),(o.axis==="x" ? btnHTML[3] : btnHTML[1]),btnHTML[2],btnHTML[3]];
			if(o.scrollButtons.enable){
				mCSB_scrollTools.prepend(btn[0]).append(btn[1]).next(".mCSB_scrollTools").prepend(btn[2]).append(btn[3]);
			}
		},
		/* -------------------- */
		
		
		/* auto-adjusts scrollbar dragger length */
		_setDraggerLength=function(){
			var $this=$(this),d=$this.data(pluginPfx),
				mCustomScrollBox=$("#mCSB_"+d.idx),
				mCSB_container=$("#mCSB_"+d.idx+"_container"),
				mCSB_dragger=[$("#mCSB_"+d.idx+"_dragger_vertical"),$("#mCSB_"+d.idx+"_dragger_horizontal")],
				ratio=[mCustomScrollBox.height()/mCSB_container.outerHeight(false),mCustomScrollBox.width()/mCSB_container.outerWidth(false)],
				l=[
					parseInt(mCSB_dragger[0].css("min-height")),Math.round(ratio[0]*mCSB_dragger[0].parent().height()),
					parseInt(mCSB_dragger[1].css("min-width")),Math.round(ratio[1]*mCSB_dragger[1].parent().width())
				],
				h=oldIE && (l[1]<l[0]) ? l[0] : l[1],w=oldIE && (l[3]<l[2]) ? l[2] : l[3];
			mCSB_dragger[0].css({
				"height":h,"max-height":(mCSB_dragger[0].parent().height()-10)
			}).find(".mCSB_dragger_bar").css({"line-height":l[0]+"px"});
			mCSB_dragger[1].css({
				"width":w,"max-width":(mCSB_dragger[1].parent().width()-10)
			});
		},
		/* -------------------- */
		
		
		/* calculates scrollbar to content ratio */
		_scrollRatio=function(){
			var $this=$(this),d=$this.data(pluginPfx),
				mCustomScrollBox=$("#mCSB_"+d.idx),
				mCSB_container=$("#mCSB_"+d.idx+"_container"),
				mCSB_dragger=[$("#mCSB_"+d.idx+"_dragger_vertical"),$("#mCSB_"+d.idx+"_dragger_horizontal")],
				scrollAmount=[mCSB_container.outerHeight(false)-mCustomScrollBox.height(),mCSB_container.outerWidth(false)-mCustomScrollBox.width()],
				ratio=[
					scrollAmount[0]/(mCSB_dragger[0].parent().height()-mCSB_dragger[0].height()),
					scrollAmount[1]/(mCSB_dragger[1].parent().width()-mCSB_dragger[1].width())
				];
			d.scrollRatio={y:ratio[0],x:ratio[1]};
		},
		/* -------------------- */
		
		
		/* toggles scrolling classes */
		_onDragClasses=function(el,action,xpnd){
			var expandClass=xpnd ? classes[0]+"_expanded" : "",
				scrollbar=el.closest(".mCSB_scrollTools");
			if(action==="active"){
				el.toggleClass(classes[0]+" "+expandClass); scrollbar.toggleClass(classes[1]); 
				el[0]._draggable=el[0]._draggable ? 0 : 1;
			}else{
				if(!el[0]._draggable){
					if(action==="hide"){
						el.removeClass(classes[0]); scrollbar.removeClass(classes[1]);
					}else{
						el.addClass(classes[0]); scrollbar.addClass(classes[1]);
					}
				}
			}
		},
		/* -------------------- */
		
		
		/* checks if content overflows its container to determine if scrolling is required */
		_overflowed=function(){
			var $this=$(this),d=$this.data(pluginPfx),
				mCustomScrollBox=$("#mCSB_"+d.idx),
				mCSB_container=$("#mCSB_"+d.idx+"_container"),
				contentHeight=d.overflowed==null ? mCSB_container.height() : mCSB_container.outerHeight(false),
				contentWidth=d.overflowed==null ? mCSB_container.width() : mCSB_container.outerWidth(false),
				h=mCSB_container[0].scrollHeight,w=mCSB_container[0].scrollWidth;
			if(h>contentHeight){contentHeight=h;}
			if(w>contentWidth){contentWidth=w;}
			return [contentHeight>mCustomScrollBox.height(),contentWidth>mCustomScrollBox.width()];
		},
		/* -------------------- */
		
		
		/* resets content position to 0 */
		_resetContentPosition=function(){
			var $this=$(this),d=$this.data(pluginPfx),o=d.opt,
				mCustomScrollBox=$("#mCSB_"+d.idx),
				mCSB_container=$("#mCSB_"+d.idx+"_container"),
				mCSB_dragger=[$("#mCSB_"+d.idx+"_dragger_vertical"),$("#mCSB_"+d.idx+"_dragger_horizontal")];
			_stop($this); /* stop any current scrolling before resetting */
			if((o.axis!=="x" && !d.overflowed[0]) || (o.axis==="y" && d.overflowed[0])){ /* reset y */
				mCSB_dragger[0].add(mCSB_container).css("top",0);
				_scrollTo($this,"_resetY");
			}
			if((o.axis!=="y" && !d.overflowed[1]) || (o.axis==="x" && d.overflowed[1])){ /* reset x */
				var cx=dx=0;
				if(d.langDir==="rtl"){ /* adjust left position for rtl direction */
					cx=mCustomScrollBox.width()-mCSB_container.outerWidth(false);
					dx=Math.abs(cx/d.scrollRatio.x);
				}
				mCSB_container.css("left",cx);
				mCSB_dragger[1].css("left",dx);
				_scrollTo($this,"_resetX");
			}
		},
		/* -------------------- */
		
		
		/* binds scrollbar events */
		_bindEvents=function(){
			var $this=$(this),d=$this.data(pluginPfx),o=d.opt;
			if(!d.bindEvents){ /* check if events are already bound */
				_draggable.call(this);
				if(o.contentTouchScroll){_contentDraggable.call(this);}
				_selectable.call(this);
				if(o.mouseWheel.enable){ /* bind mousewheel fn when plugin is available */
					function _mwt(){
						mousewheelTimeout=setTimeout(function(){
							if(!$.event.special.mousewheel){
								_mwt();
							}else{
								clearTimeout(mousewheelTimeout);
								_mousewheel.call($this[0]);
							}
						},100);
					}
					var mousewheelTimeout;
					_mwt();
				}
				_draggerRail.call(this);
				_wrapperScroll.call(this);
				if(o.advanced.autoScrollOnFocus){_focus.call(this);}
				if(o.scrollButtons.enable){_buttons.call(this);}
				if(o.keyboard.enable){_keyboard.call(this);}
				d.bindEvents=true;
			}
		},
		/* -------------------- */
		
		
		/* unbinds scrollbar events */
		_unbindEvents=function(){
			var $this=$(this),d=$this.data(pluginPfx),o=d.opt,
				namespace=pluginPfx+"_"+d.idx,
				sb=".mCSB_"+d.idx+"_scrollbar",
				sel=$("#mCSB_"+d.idx+",#mCSB_"+d.idx+"_container,#mCSB_"+d.idx+"_container_wrapper,"+sb+" ."+classes[12]+",#mCSB_"+d.idx+"_dragger_vertical,#mCSB_"+d.idx+"_dragger_horizontal,"+sb+">a"),
				mCSB_container=$("#mCSB_"+d.idx+"_container");
			if(o.advanced.releaseDraggableSelectors){sel.add($(o.advanced.releaseDraggableSelectors));}
			if(o.advanced.extraDraggableSelectors){sel.add($(o.advanced.extraDraggableSelectors));}
			if(d.bindEvents){ /* check if events are bound */
				/* unbind namespaced events from document/selectors */
				$(document).add($(!_canAccessIFrame() || top.document)).unbind("."+namespace);
				sel.each(function(){
					$(this).unbind("."+namespace);
				});
				/* clear and delete timeouts/objects */
				clearTimeout($this[0]._focusTimeout); _delete($this[0],"_focusTimeout");
				clearTimeout(d.sequential.step); _delete(d.sequential,"step");
				clearTimeout(mCSB_container[0].onCompleteTimeout); _delete(mCSB_container[0],"onCompleteTimeout");
				d.bindEvents=false;
			}
		},
		/* -------------------- */
		
		
		/* toggles scrollbar visibility */
		_scrollbarVisibility=function(disabled){
			var $this=$(this),d=$this.data(pluginPfx),o=d.opt,
				contentWrapper=$("#mCSB_"+d.idx+"_container_wrapper"),
				content=contentWrapper.length ? contentWrapper : $("#mCSB_"+d.idx+"_container"),
				scrollbar=[$("#mCSB_"+d.idx+"_scrollbar_vertical"),$("#mCSB_"+d.idx+"_scrollbar_horizontal")],
				mCSB_dragger=[scrollbar[0].find(".mCSB_dragger"),scrollbar[1].find(".mCSB_dragger")];
			if(o.axis!=="x"){
				if(d.overflowed[0] && !disabled){
					scrollbar[0].add(mCSB_dragger[0]).add(scrollbar[0].children("a")).css("display","block");
					content.removeClass(classes[8]+" "+classes[10]);
				}else{
					if(o.alwaysShowScrollbar){
						if(o.alwaysShowScrollbar!==2){mCSB_dragger[0].css("display","none");}
						content.removeClass(classes[10]);
					}else{
						scrollbar[0].css("display","none");
						content.addClass(classes[10]);
					}
					content.addClass(classes[8]);
				}
			}
			if(o.axis!=="y"){
				if(d.overflowed[1] && !disabled){
					scrollbar[1].add(mCSB_dragger[1]).add(scrollbar[1].children("a")).css("display","block");
					content.removeClass(classes[9]+" "+classes[11]);
				}else{
					if(o.alwaysShowScrollbar){
						if(o.alwaysShowScrollbar!==2){mCSB_dragger[1].css("display","none");}
						content.removeClass(classes[11]);
					}else{
						scrollbar[1].css("display","none");
						content.addClass(classes[11]);
					}
					content.addClass(classes[9]);
				}
			}
			if(!d.overflowed[0] && !d.overflowed[1]){
				$this.addClass(classes[5]);
			}else{
				$this.removeClass(classes[5]);
			}
		},
		/* -------------------- */
		
		
		/* returns input coordinates of pointer, touch and mouse events (relative to document) */
		_coordinates=function(e){
			var t=e.type,o=e.target.ownerDocument!==document && frameElement!==null ? [$(frameElement).offset().top,$(frameElement).offset().left] : null,
				io=_canAccessIFrame() && e.target.ownerDocument!==top.document && frameElement!==null ? [$(e.view.frameElement).offset().top,$(e.view.frameElement).offset().left] : [0,0];
			switch(t){
				case "pointerdown": case "MSPointerDown": case "pointermove": case "MSPointerMove": case "pointerup": case "MSPointerUp":
					return o ? [e.originalEvent.pageY-o[0]+io[0],e.originalEvent.pageX-o[1]+io[1],false] : [e.originalEvent.pageY,e.originalEvent.pageX,false];
					break;
				case "touchstart": case "touchmove": case "touchend":
					var touch=e.originalEvent.touches[0] || e.originalEvent.changedTouches[0],
						touches=e.originalEvent.touches.length || e.originalEvent.changedTouches.length;
					return e.target.ownerDocument!==document ? [touch.screenY,touch.screenX,touches>1] : [touch.pageY,touch.pageX,touches>1];
					break;
				default:
					return o ? [e.pageY-o[0]+io[0],e.pageX-o[1]+io[1],false] : [e.pageY,e.pageX,false];
			}
		},
		/* -------------------- */
		
		
		/* 
		SCROLLBAR DRAG EVENTS
		scrolls content via scrollbar dragging 
		*/
		_draggable=function(){
			var $this=$(this),d=$this.data(pluginPfx),o=d.opt,
				namespace=pluginPfx+"_"+d.idx,
				draggerId=["mCSB_"+d.idx+"_dragger_vertical","mCSB_"+d.idx+"_dragger_horizontal"],
				mCSB_container=$("#mCSB_"+d.idx+"_container"),
				mCSB_dragger=$("#"+draggerId[0]+",#"+draggerId[1]),
				draggable,dragY,dragX,
				rds=o.advanced.releaseDraggableSelectors ? mCSB_dragger.add($(o.advanced.releaseDraggableSelectors)) : mCSB_dragger,
				eds=o.advanced.extraDraggableSelectors ? $(!_canAccessIFrame() || top.document).add($(o.advanced.extraDraggableSelectors)) : $(!_canAccessIFrame() || top.document);
			mCSB_dragger.bind("contextmenu."+namespace,function(e){
				e.preventDefault(); //prevent right click
			}).bind("mousedown."+namespace+" touchstart."+namespace+" pointerdown."+namespace+" MSPointerDown."+namespace,function(e){
				e.stopImmediatePropagation();
				e.preventDefault();
				if(!_mouseBtnLeft(e)){return;} /* left mouse button only */
				touchActive=true;
				if(oldIE){document.onselectstart=function(){return false;}} /* disable text selection for IE < 9 */
				_iframe.call(mCSB_container,false); /* enable scrollbar dragging over iframes by disabling their events */
				_stop($this);
				draggable=$(this);
				var offset=draggable.offset(),y=_coordinates(e)[0]-offset.top,x=_coordinates(e)[1]-offset.left,
					h=draggable.height()+offset.top,w=draggable.width()+offset.left;
				if(y<h && y>0 && x<w && x>0){
					dragY=y; 
					dragX=x;
				}
				_onDragClasses(draggable,"active",o.autoExpandScrollbar); 
			}).bind("touchmove."+namespace,function(e){
				e.stopImmediatePropagation();
				e.preventDefault();
				var offset=draggable.offset(),y=_coordinates(e)[0]-offset.top,x=_coordinates(e)[1]-offset.left;
				_drag(dragY,dragX,y,x);
			});
			$(document).add(eds).bind("mousemove."+namespace+" pointermove."+namespace+" MSPointerMove."+namespace,function(e){
				if(draggable){
					var offset=draggable.offset(),y=_coordinates(e)[0]-offset.top,x=_coordinates(e)[1]-offset.left;
					if(dragY===y && dragX===x){return;} /* has it really moved? */
					_drag(dragY,dragX,y,x);
				}
			}).add(rds).bind("mouseup."+namespace+" touchend."+namespace+" pointerup."+namespace+" MSPointerUp."+namespace,function(e){
				if(draggable){
					_onDragClasses(draggable,"active",o.autoExpandScrollbar); 
					draggable=null;
				}
				touchActive=false;
				if(oldIE){document.onselectstart=null;} /* enable text selection for IE < 9 */
				_iframe.call(mCSB_container,true); /* enable iframes events */
			});
			function _drag(dragY,dragX,y,x){
				mCSB_container[0].idleTimer=o.scrollInertia<233 ? 250 : 0;
				if(draggable.attr("id")===draggerId[1]){
					var dir="x",to=((draggable[0].offsetLeft-dragX)+x)*d.scrollRatio.x;
				}else{
					var dir="y",to=((draggable[0].offsetTop-dragY)+y)*d.scrollRatio.y;
				}
				_scrollTo($this,to.toString(),{dir:dir,drag:true});
			}
		},
		/* -------------------- */
		
		
		/* 
		TOUCH SWIPE EVENTS
		scrolls content via touch swipe 
		Emulates the native touch-swipe scrolling with momentum found in iOS, Android and WP devices 
		*/
		_contentDraggable=function(){
			var $this=$(this),d=$this.data(pluginPfx),o=d.opt,
				namespace=pluginPfx+"_"+d.idx,
				mCustomScrollBox=$("#mCSB_"+d.idx),
				mCSB_container=$("#mCSB_"+d.idx+"_container"),
				mCSB_dragger=[$("#mCSB_"+d.idx+"_dragger_vertical"),$("#mCSB_"+d.idx+"_dragger_horizontal")],
				draggable,dragY,dragX,touchStartY,touchStartX,touchMoveY=[],touchMoveX=[],startTime,runningTime,endTime,distance,speed,amount,
				durA=0,durB,overwrite=o.axis==="yx" ? "none" : "all",touchIntent=[],touchDrag,docDrag,
				iframe=mCSB_container.find("iframe"),
				events=[
					"touchstart."+namespace+" pointerdown."+namespace+" MSPointerDown."+namespace, //start
					"touchmove."+namespace+" pointermove."+namespace+" MSPointerMove."+namespace, //move
					"touchend."+namespace+" pointerup."+namespace+" MSPointerUp."+namespace //end
				],
				touchAction=document.body.style.touchAction!==undefined && document.body.style.touchAction!=="";
			mCSB_container.bind(events[0],function(e){
				_onTouchstart(e);
			}).bind(events[1],function(e){
				_onTouchmove(e);
			});
			mCustomScrollBox.bind(events[0],function(e){
				_onTouchstart2(e);
			}).bind(events[2],function(e){
				_onTouchend(e);
			});
			if(iframe.length){
				iframe.each(function(){
					$(this).bind("load",function(){
						/* bind events on accessible iframes */
						if(_canAccessIFrame(this)){
							$(this.contentDocument || this.contentWindow.document).bind(events[0],function(e){
								_onTouchstart(e);
								_onTouchstart2(e);
							}).bind(events[1],function(e){
								_onTouchmove(e);
							}).bind(events[2],function(e){
								_onTouchend(e);
							});
						}
					});
				});
			}
			function _onTouchstart(e){
				if(!_pointerTouch(e) || touchActive || _coordinates(e)[2]){touchable=0; return;}
				touchable=1; touchDrag=0; docDrag=0; draggable=1;
				$this.removeClass("mCS_touch_action");
				var offset=mCSB_container.offset();
				dragY=_coordinates(e)[0]-offset.top;
				dragX=_coordinates(e)[1]-offset.left;
				touchIntent=[_coordinates(e)[0],_coordinates(e)[1]];
			}
			function _onTouchmove(e){
				if(!_pointerTouch(e) || touchActive || _coordinates(e)[2]){return;}
				if(!o.documentTouchScroll){e.preventDefault();} 
				e.stopImmediatePropagation();
				if(docDrag && !touchDrag){return;}
				if(draggable){
					runningTime=_getTime();
					var offset=mCustomScrollBox.offset(),y=_coordinates(e)[0]-offset.top,x=_coordinates(e)[1]-offset.left,
						easing="mcsLinearOut";
					touchMoveY.push(y);
					touchMoveX.push(x);
					touchIntent[2]=Math.abs(_coordinates(e)[0]-touchIntent[0]); touchIntent[3]=Math.abs(_coordinates(e)[1]-touchIntent[1]);
					if(d.overflowed[0]){
						var limit=mCSB_dragger[0].parent().height()-mCSB_dragger[0].height(),
							prevent=((dragY-y)>0 && (y-dragY)>-(limit*d.scrollRatio.y) && (touchIntent[3]*2<touchIntent[2] || o.axis==="yx"));
					}
					if(d.overflowed[1]){
						var limitX=mCSB_dragger[1].parent().width()-mCSB_dragger[1].width(),
							preventX=((dragX-x)>0 && (x-dragX)>-(limitX*d.scrollRatio.x) && (touchIntent[2]*2<touchIntent[3] || o.axis==="yx"));
					}
					if(prevent || preventX){ /* prevent native document scrolling */
						if(!touchAction){e.preventDefault();} 
						touchDrag=1;
					}else{
						docDrag=1;
						$this.addClass("mCS_touch_action");
					}
					if(touchAction){e.preventDefault();} 
					amount=o.axis==="yx" ? [(dragY-y),(dragX-x)] : o.axis==="x" ? [null,(dragX-x)] : [(dragY-y),null];
					mCSB_container[0].idleTimer=250;
					if(d.overflowed[0]){_drag(amount[0],durA,easing,"y","all",true);}
					if(d.overflowed[1]){_drag(amount[1],durA,easing,"x",overwrite,true);}
				}
			}
			function _onTouchstart2(e){
				if(!_pointerTouch(e) || touchActive || _coordinates(e)[2]){touchable=0; return;}
				touchable=1;
				e.stopImmediatePropagation();
				_stop($this);
				startTime=_getTime();
				var offset=mCustomScrollBox.offset();
				touchStartY=_coordinates(e)[0]-offset.top;
				touchStartX=_coordinates(e)[1]-offset.left;
				touchMoveY=[]; touchMoveX=[];
			}
			function _onTouchend(e){
				if(!_pointerTouch(e) || touchActive || _coordinates(e)[2]){return;}
				draggable=0;
				e.stopImmediatePropagation();
				touchDrag=0; docDrag=0;
				endTime=_getTime();
				var offset=mCustomScrollBox.offset(),y=_coordinates(e)[0]-offset.top,x=_coordinates(e)[1]-offset.left;
				if((endTime-runningTime)>30){return;}
				speed=1000/(endTime-startTime);
				var easing="mcsEaseOut",slow=speed<2.5,
					diff=slow ? [touchMoveY[touchMoveY.length-2],touchMoveX[touchMoveX.length-2]] : [0,0];
				distance=slow ? [(y-diff[0]),(x-diff[1])] : [y-touchStartY,x-touchStartX];
				var absDistance=[Math.abs(distance[0]),Math.abs(distance[1])];
				speed=slow ? [Math.abs(distance[0]/4),Math.abs(distance[1]/4)] : [speed,speed];
				var a=[
					Math.abs(mCSB_container[0].offsetTop)-(distance[0]*_m((absDistance[0]/speed[0]),speed[0])),
					Math.abs(mCSB_container[0].offsetLeft)-(distance[1]*_m((absDistance[1]/speed[1]),speed[1]))
				];
				amount=o.axis==="yx" ? [a[0],a[1]] : o.axis==="x" ? [null,a[1]] : [a[0],null];
				durB=[(absDistance[0]*4)+o.scrollInertia,(absDistance[1]*4)+o.scrollInertia];
				var md=parseInt(o.contentTouchScroll) || 0; /* absolute minimum distance required */
				amount[0]=absDistance[0]>md ? amount[0] : 0;
				amount[1]=absDistance[1]>md ? amount[1] : 0;
				if(d.overflowed[0]){_drag(amount[0],durB[0],easing,"y",overwrite,false);}
				if(d.overflowed[1]){_drag(amount[1],durB[1],easing,"x",overwrite,false);}
			}
			function _m(ds,s){
				var r=[s*1.5,s*2,s/1.5,s/2];
				if(ds>90){
					return s>4 ? r[0] : r[3];
				}else if(ds>60){
					return s>3 ? r[3] : r[2];
				}else if(ds>30){
					return s>8 ? r[1] : s>6 ? r[0] : s>4 ? s : r[2];
				}else{
					return s>8 ? s : r[3];
				}
			}
			function _drag(amount,dur,easing,dir,overwrite,drag){
				if(!amount){return;}
				_scrollTo($this,amount.toString(),{dur:dur,scrollEasing:easing,dir:dir,overwrite:overwrite,drag:drag});
			}
		},
		/* -------------------- */
		
		
		/* 
		SELECT TEXT EVENTS 
		scrolls content when text is selected 
		*/
		_selectable=function(){
			var $this=$(this),d=$this.data(pluginPfx),o=d.opt,seq=d.sequential,
				namespace=pluginPfx+"_"+d.idx,
				mCSB_container=$("#mCSB_"+d.idx+"_container"),
				wrapper=mCSB_container.parent(),
				action;
			mCSB_container.bind("mousedown."+namespace,function(e){
				if(touchable){return;}
				if(!action){action=1; touchActive=true;}
			}).add(document).bind("mousemove."+namespace,function(e){
				if(!touchable && action && _sel()){
					var offset=mCSB_container.offset(),
						y=_coordinates(e)[0]-offset.top+mCSB_container[0].offsetTop,x=_coordinates(e)[1]-offset.left+mCSB_container[0].offsetLeft;
					if(y>0 && y<wrapper.height() && x>0 && x<wrapper.width()){
						if(seq.step){_seq("off",null,"stepped");}
					}else{
						if(o.axis!=="x" && d.overflowed[0]){
							if(y<0){
								_seq("on",38);
							}else if(y>wrapper.height()){
								_seq("on",40);
							}
						}
						if(o.axis!=="y" && d.overflowed[1]){
							if(x<0){
								_seq("on",37);
							}else if(x>wrapper.width()){
								_seq("on",39);
							}
						}
					}
				}
			}).bind("mouseup."+namespace+" dragend."+namespace,function(e){
				if(touchable){return;}
				if(action){action=0; _seq("off",null);}
				touchActive=false;
			});
			function _sel(){
				return 	window.getSelection ? window.getSelection().toString() : 
						document.selection && document.selection.type!="Control" ? document.selection.createRange().text : 0;
			}
			function _seq(a,c,s){
				seq.type=s && action ? "stepped" : "stepless";
				seq.scrollAmount=10;
				_sequentialScroll($this,a,c,"mcsLinearOut",s ? 60 : null);
			}
		},
		/* -------------------- */
		
		
		/* 
		MOUSE WHEEL EVENT
		scrolls content via mouse-wheel 
		via mouse-wheel plugin (https://github.com/brandonaaron/jquery-mousewheel)
		*/
		_mousewheel=function(){
			if(!$(this).data(pluginPfx)){return;} /* Check if the scrollbar is ready to use mousewheel events (issue: #185) */
			var $this=$(this),d=$this.data(pluginPfx),o=d.opt,
				namespace=pluginPfx+"_"+d.idx,
				mCustomScrollBox=$("#mCSB_"+d.idx),
				mCSB_dragger=[$("#mCSB_"+d.idx+"_dragger_vertical"),$("#mCSB_"+d.idx+"_dragger_horizontal")],
				iframe=$("#mCSB_"+d.idx+"_container").find("iframe");
			if(iframe.length){
				iframe.each(function(){
					$(this).bind("load",function(){
						/* bind events on accessible iframes */
						if(_canAccessIFrame(this)){
							$(this.contentDocument || this.contentWindow.document).bind("mousewheel."+namespace,function(e,delta){
								_onMousewheel(e,delta);
							});
						}
					});
				});
			}
			mCustomScrollBox.bind("mousewheel."+namespace,function(e,delta){
				_onMousewheel(e,delta);
			});
			function _onMousewheel(e,delta){
				_stop($this);
				if(_disableMousewheel($this,e.target)){return;} /* disables mouse-wheel when hovering specific elements */
				var deltaFactor=o.mouseWheel.deltaFactor!=="auto" ? parseInt(o.mouseWheel.deltaFactor) : (oldIE && e.deltaFactor<100) ? 100 : e.deltaFactor || 100,
					dur=o.scrollInertia;
				if(o.axis==="x" || o.mouseWheel.axis==="x"){
					var dir="x",
						px=[Math.round(deltaFactor*d.scrollRatio.x),parseInt(o.mouseWheel.scrollAmount)],
						amount=o.mouseWheel.scrollAmount!=="auto" ? px[1] : px[0]>=mCustomScrollBox.width() ? mCustomScrollBox.width()*0.9 : px[0],
						contentPos=Math.abs($("#mCSB_"+d.idx+"_container")[0].offsetLeft),
						draggerPos=mCSB_dragger[1][0].offsetLeft,
						limit=mCSB_dragger[1].parent().width()-mCSB_dragger[1].width(),
						dlt=o.mouseWheel.axis==="y" ? (e.deltaY || delta) : e.deltaX;
				}else{
					var dir="y",
						px=[Math.round(deltaFactor*d.scrollRatio.y),parseInt(o.mouseWheel.scrollAmount)],
						amount=o.mouseWheel.scrollAmount!=="auto" ? px[1] : px[0]>=mCustomScrollBox.height() ? mCustomScrollBox.height()*0.9 : px[0],
						contentPos=Math.abs($("#mCSB_"+d.idx+"_container")[0].offsetTop),
						draggerPos=mCSB_dragger[0][0].offsetTop,
						limit=mCSB_dragger[0].parent().height()-mCSB_dragger[0].height(),
						dlt=e.deltaY || delta;
				}
				if((dir==="y" && !d.overflowed[0]) || (dir==="x" && !d.overflowed[1])){return;}
				if(o.mouseWheel.invert || e.webkitDirectionInvertedFromDevice){dlt=-dlt;}
				if(o.mouseWheel.normalizeDelta){dlt=dlt<0 ? -1 : 1;}
				if((dlt>0 && draggerPos!==0) || (dlt<0 && draggerPos!==limit) || o.mouseWheel.preventDefault){
					e.stopImmediatePropagation();
					e.preventDefault();
				}
				if(e.deltaFactor<5 && !o.mouseWheel.normalizeDelta){
					//very low deltaFactor values mean some kind of delta acceleration (e.g. osx trackpad), so adjusting scrolling accordingly
					amount=e.deltaFactor; dur=17;
				}
				_scrollTo($this,(contentPos-(dlt*amount)).toString(),{dir:dir,dur:dur});
			}
		},
		/* -------------------- */
		
		
		/* checks if iframe can be accessed */
		_canAccessIFrameCache=new Object(),
		_canAccessIFrame=function(iframe){
		    var result=false,cacheKey=false,html=null;
		    if(iframe===undefined){
				cacheKey="#empty";
		    }else if($(iframe).attr("id")!==undefined){
				cacheKey=$(iframe).attr("id");
		    }
			if(cacheKey!==false && _canAccessIFrameCache[cacheKey]!==undefined){
				return _canAccessIFrameCache[cacheKey];
			}
			if(!iframe){
				try{
					var doc=top.document;
					html=doc.body.innerHTML;
				}catch(err){/* do nothing */}
				result=(html!==null);
			}else{
				try{
					var doc=iframe.contentDocument || iframe.contentWindow.document;
					html=doc.body.innerHTML;
				}catch(err){/* do nothing */}
				result=(html!==null);
			}
			if(cacheKey!==false){_canAccessIFrameCache[cacheKey]=result;}
			return result;
		},
		/* -------------------- */
		
		
		/* switches iframe's pointer-events property (drag, mousewheel etc. over cross-domain iframes) */
		_iframe=function(evt){
			var el=this.find("iframe");
			if(!el.length){return;} /* check if content contains iframes */
			var val=!evt ? "none" : "auto";
			el.css("pointer-events",val); /* for IE11, iframe's display property should not be "block" */
		},
		/* -------------------- */
		
		
		/* disables mouse-wheel when hovering specific elements like select, datalist etc. */
		_disableMousewheel=function(el,target){
			var tag=target.nodeName.toLowerCase(),
				tags=el.data(pluginPfx).opt.mouseWheel.disableOver,
				/* elements that require focus */
				focusTags=["select","textarea"];
			return $.inArray(tag,tags) > -1 && !($.inArray(tag,focusTags) > -1 && !$(target).is(":focus"));
		},
		/* -------------------- */
		
		
		/* 
		DRAGGER RAIL CLICK EVENT
		scrolls content via dragger rail 
		*/
		_draggerRail=function(){
			var $this=$(this),d=$this.data(pluginPfx),
				namespace=pluginPfx+"_"+d.idx,
				mCSB_container=$("#mCSB_"+d.idx+"_container"),
				wrapper=mCSB_container.parent(),
				mCSB_draggerContainer=$(".mCSB_"+d.idx+"_scrollbar ."+classes[12]),
				clickable;
			mCSB_draggerContainer.bind("mousedown."+namespace+" touchstart."+namespace+" pointerdown."+namespace+" MSPointerDown."+namespace,function(e){
				touchActive=true;
				if(!$(e.target).hasClass("mCSB_dragger")){clickable=1;}
			}).bind("touchend."+namespace+" pointerup."+namespace+" MSPointerUp."+namespace,function(e){
				touchActive=false;
			}).bind("click."+namespace,function(e){
				if(!clickable){return;}
				clickable=0;
				if($(e.target).hasClass(classes[12]) || $(e.target).hasClass("mCSB_draggerRail")){
					_stop($this);
					var el=$(this),mCSB_dragger=el.find(".mCSB_dragger");
					if(el.parent(".mCSB_scrollTools_horizontal").length>0){
						if(!d.overflowed[1]){return;}
						var dir="x",
							clickDir=e.pageX>mCSB_dragger.offset().left ? -1 : 1,
							to=Math.abs(mCSB_container[0].offsetLeft)-(clickDir*(wrapper.width()*0.9));
					}else{
						if(!d.overflowed[0]){return;}
						var dir="y",
							clickDir=e.pageY>mCSB_dragger.offset().top ? -1 : 1,
							to=Math.abs(mCSB_container[0].offsetTop)-(clickDir*(wrapper.height()*0.9));
					}
					_scrollTo($this,to.toString(),{dir:dir,scrollEasing:"mcsEaseInOut"});
				}
			});
		},
		/* -------------------- */
		
		
		/* 
		FOCUS EVENT
		scrolls content via element focus (e.g. clicking an input, pressing TAB key etc.)
		*/
		_focus=function(){
			var $this=$(this),d=$this.data(pluginPfx),o=d.opt,
				namespace=pluginPfx+"_"+d.idx,
				mCSB_container=$("#mCSB_"+d.idx+"_container"),
				wrapper=mCSB_container.parent();
			mCSB_container.bind("focusin."+namespace,function(e){
				var el=$(document.activeElement),
					nested=mCSB_container.find(".mCustomScrollBox").length,
					dur=0;
				if(!el.is(o.advanced.autoScrollOnFocus)){return;}
				_stop($this);
				clearTimeout($this[0]._focusTimeout);
				$this[0]._focusTimer=nested ? (dur+17)*nested : 0;
				$this[0]._focusTimeout=setTimeout(function(){
					var	to=[_childPos(el)[0],_childPos(el)[1]],
						contentPos=[mCSB_container[0].offsetTop,mCSB_container[0].offsetLeft],
						isVisible=[
							(contentPos[0]+to[0]>=0 && contentPos[0]+to[0]<wrapper.height()-el.outerHeight(false)),
							(contentPos[1]+to[1]>=0 && contentPos[0]+to[1]<wrapper.width()-el.outerWidth(false))
						],
						overwrite=(o.axis==="yx" && !isVisible[0] && !isVisible[1]) ? "none" : "all";
					if(o.axis!=="x" && !isVisible[0]){
						_scrollTo($this,to[0].toString(),{dir:"y",scrollEasing:"mcsEaseInOut",overwrite:overwrite,dur:dur});
					}
					if(o.axis!=="y" && !isVisible[1]){
						_scrollTo($this,to[1].toString(),{dir:"x",scrollEasing:"mcsEaseInOut",overwrite:overwrite,dur:dur});
					}
				},$this[0]._focusTimer);
			});
		},
		/* -------------------- */
		
		
		/* sets content wrapper scrollTop/scrollLeft always to 0 */
		_wrapperScroll=function(){
			var $this=$(this),d=$this.data(pluginPfx),
				namespace=pluginPfx+"_"+d.idx,
				wrapper=$("#mCSB_"+d.idx+"_container").parent();
			wrapper.bind("scroll."+namespace,function(e){
				if(wrapper.scrollTop()!==0 || wrapper.scrollLeft()!==0){
					$(".mCSB_"+d.idx+"_scrollbar").css("visibility","hidden"); /* hide scrollbar(s) */
				}
			});
		},
		/* -------------------- */
		
		
		/* 
		BUTTONS EVENTS
		scrolls content via up, down, left and right buttons 
		*/
		_buttons=function(){
			var $this=$(this),d=$this.data(pluginPfx),o=d.opt,seq=d.sequential,
				namespace=pluginPfx+"_"+d.idx,
				sel=".mCSB_"+d.idx+"_scrollbar",
				btn=$(sel+">a");
			btn.bind("contextmenu."+namespace,function(e){
				e.preventDefault(); //prevent right click
			}).bind("mousedown."+namespace+" touchstart."+namespace+" pointerdown."+namespace+" MSPointerDown."+namespace+" mouseup."+namespace+" touchend."+namespace+" pointerup."+namespace+" MSPointerUp."+namespace+" mouseout."+namespace+" pointerout."+namespace+" MSPointerOut."+namespace+" click."+namespace,function(e){
				e.preventDefault();
				if(!_mouseBtnLeft(e)){return;} /* left mouse button only */
				var btnClass=$(this).attr("class");
				seq.type=o.scrollButtons.scrollType;
				switch(e.type){
					case "mousedown": case "touchstart": case "pointerdown": case "MSPointerDown":
						if(seq.type==="stepped"){return;}
						touchActive=true;
						d.tweenRunning=false;
						_seq("on",btnClass);
						break;
					case "mouseup": case "touchend": case "pointerup": case "MSPointerUp":
					case "mouseout": case "pointerout": case "MSPointerOut":
						if(seq.type==="stepped"){return;}
						touchActive=false;
						if(seq.dir){_seq("off",btnClass);}
						break;
					case "click":
						if(seq.type!=="stepped" || d.tweenRunning){return;}
						_seq("on",btnClass);
						break;
				}
				function _seq(a,c){
					seq.scrollAmount=o.scrollButtons.scrollAmount;
					_sequentialScroll($this,a,c);
				}
			});
		},
		/* -------------------- */
		
		
		/* 
		KEYBOARD EVENTS
		scrolls content via keyboard 
		Keys: up arrow, down arrow, left arrow, right arrow, PgUp, PgDn, Home, End
		*/
		_keyboard=function(){
			var $this=$(this),d=$this.data(pluginPfx),o=d.opt,seq=d.sequential,
				namespace=pluginPfx+"_"+d.idx,
				mCustomScrollBox=$("#mCSB_"+d.idx),
				mCSB_container=$("#mCSB_"+d.idx+"_container"),
				wrapper=mCSB_container.parent(),
				editables="input,textarea,select,datalist,keygen,[contenteditable='true']",
				iframe=mCSB_container.find("iframe"),
				events=["blur."+namespace+" keydown."+namespace+" keyup."+namespace];
			if(iframe.length){
				iframe.each(function(){
					$(this).bind("load",function(){
						/* bind events on accessible iframes */
						if(_canAccessIFrame(this)){
							$(this.contentDocument || this.contentWindow.document).bind(events[0],function(e){
								_onKeyboard(e);
							});
						}
					});
				});
			}
			mCustomScrollBox.attr("tabindex","0").bind(events[0],function(e){
				_onKeyboard(e);
			});
			function _onKeyboard(e){
				switch(e.type){
					case "blur":
						if(d.tweenRunning && seq.dir){_seq("off",null);}
						break;
					case "keydown": case "keyup":
						var code=e.keyCode ? e.keyCode : e.which,action="on";
						if((o.axis!=="x" && (code===38 || code===40)) || (o.axis!=="y" && (code===37 || code===39))){
							/* up (38), down (40), left (37), right (39) arrows */
							if(((code===38 || code===40) && !d.overflowed[0]) || ((code===37 || code===39) && !d.overflowed[1])){return;}
							if(e.type==="keyup"){action="off";}
							if(!$(document.activeElement).is(editables)){
								e.preventDefault();
								e.stopImmediatePropagation();
								_seq(action,code);
							}
						}else if(code===33 || code===34){
							/* PgUp (33), PgDn (34) */
							if(d.overflowed[0] || d.overflowed[1]){
								e.preventDefault();
								e.stopImmediatePropagation();
							}
							if(e.type==="keyup"){
								_stop($this);
								var keyboardDir=code===34 ? -1 : 1;
								if(o.axis==="x" || (o.axis==="yx" && d.overflowed[1] && !d.overflowed[0])){
									var dir="x",to=Math.abs(mCSB_container[0].offsetLeft)-(keyboardDir*(wrapper.width()*0.9));
								}else{
									var dir="y",to=Math.abs(mCSB_container[0].offsetTop)-(keyboardDir*(wrapper.height()*0.9));
								}
								_scrollTo($this,to.toString(),{dir:dir,scrollEasing:"mcsEaseInOut"});
							}
						}else if(code===35 || code===36){
							/* End (35), Home (36) */
							if(!$(document.activeElement).is(editables)){
								if(d.overflowed[0] || d.overflowed[1]){
									e.preventDefault();
									e.stopImmediatePropagation();
								}
								if(e.type==="keyup"){
									if(o.axis==="x" || (o.axis==="yx" && d.overflowed[1] && !d.overflowed[0])){
										var dir="x",to=code===35 ? Math.abs(wrapper.width()-mCSB_container.outerWidth(false)) : 0;
									}else{
										var dir="y",to=code===35 ? Math.abs(wrapper.height()-mCSB_container.outerHeight(false)) : 0;
									}
									_scrollTo($this,to.toString(),{dir:dir,scrollEasing:"mcsEaseInOut"});
								}
							}
						}
						break;
				}
				function _seq(a,c){
					seq.type=o.keyboard.scrollType;
					seq.scrollAmount=o.keyboard.scrollAmount;
					if(seq.type==="stepped" && d.tweenRunning){return;}
					_sequentialScroll($this,a,c);
				}
			}
		},
		/* -------------------- */
		
		
		/* scrolls content sequentially (used when scrolling via buttons, keyboard arrows etc.) */
		_sequentialScroll=function(el,action,trigger,e,s){
			var d=el.data(pluginPfx),o=d.opt,seq=d.sequential,
				mCSB_container=$("#mCSB_"+d.idx+"_container"),
				once=seq.type==="stepped" ? true : false,
				steplessSpeed=o.scrollInertia < 26 ? 26 : o.scrollInertia, /* 26/1.5=17 */
				steppedSpeed=o.scrollInertia < 1 ? 17 : o.scrollInertia;
			switch(action){
				case "on":
					seq.dir=[
						(trigger===classes[16] || trigger===classes[15] || trigger===39 || trigger===37 ? "x" : "y"),
						(trigger===classes[13] || trigger===classes[15] || trigger===38 || trigger===37 ? -1 : 1)
					];
					_stop(el);
					if(_isNumeric(trigger) && seq.type==="stepped"){return;}
					_on(once);
					break;
				case "off":
					_off();
					if(once || (d.tweenRunning && seq.dir)){
						_on(true);
					}
					break;
			}
			
			/* starts sequence */
			function _on(once){
				if(o.snapAmount){seq.scrollAmount=!(o.snapAmount instanceof Array) ? o.snapAmount : seq.dir[0]==="x" ? o.snapAmount[1] : o.snapAmount[0];} /* scrolling snapping */
				var c=seq.type!=="stepped", /* continuous scrolling */
					t=s ? s : !once ? 1000/60 : c ? steplessSpeed/1.5 : steppedSpeed, /* timer */
					m=!once ? 2.5 : c ? 7.5 : 40, /* multiplier */
					contentPos=[Math.abs(mCSB_container[0].offsetTop),Math.abs(mCSB_container[0].offsetLeft)],
					ratio=[d.scrollRatio.y>10 ? 10 : d.scrollRatio.y,d.scrollRatio.x>10 ? 10 : d.scrollRatio.x],
					amount=seq.dir[0]==="x" ? contentPos[1]+(seq.dir[1]*(ratio[1]*m)) : contentPos[0]+(seq.dir[1]*(ratio[0]*m)),
					px=seq.dir[0]==="x" ? contentPos[1]+(seq.dir[1]*parseInt(seq.scrollAmount)) : contentPos[0]+(seq.dir[1]*parseInt(seq.scrollAmount)),
					to=seq.scrollAmount!=="auto" ? px : amount,
					easing=e ? e : !once ? "mcsLinear" : c ? "mcsLinearOut" : "mcsEaseInOut",
					onComplete=!once ? false : true;
				if(once && t<17){
					to=seq.dir[0]==="x" ? contentPos[1] : contentPos[0];
				}
				_scrollTo(el,to.toString(),{dir:seq.dir[0],scrollEasing:easing,dur:t,onComplete:onComplete});
				if(once){
					seq.dir=false;
					return;
				}
				clearTimeout(seq.step);
				seq.step=setTimeout(function(){
					_on();
				},t);
			}
			/* stops sequence */
			function _off(){
				clearTimeout(seq.step);
				_delete(seq,"step");
				_stop(el);
			}
		},
		/* -------------------- */
		
		
		/* returns a yx array from value */
		_arr=function(val){
			var o=$(this).data(pluginPfx).opt,vals=[];
			if(typeof val==="function"){val=val();} /* check if the value is a single anonymous function */
			/* check if value is object or array, its length and create an array with yx values */
			if(!(val instanceof Array)){ /* object value (e.g. {y:"100",x:"100"}, 100 etc.) */
				vals[0]=val.y ? val.y : val.x || o.axis==="x" ? null : val;
				vals[1]=val.x ? val.x : val.y || o.axis==="y" ? null : val;
			}else{ /* array value (e.g. [100,100]) */
				vals=val.length>1 ? [val[0],val[1]] : o.axis==="x" ? [null,val[0]] : [val[0],null];
			}
			/* check if array values are anonymous functions */
			if(typeof vals[0]==="function"){vals[0]=vals[0]();}
			if(typeof vals[1]==="function"){vals[1]=vals[1]();}
			return vals;
		},
		/* -------------------- */
		
		
		/* translates values (e.g. "top", 100, "100px", "#id") to actual scroll-to positions */
		_to=function(val,dir){
			if(val==null || typeof val=="undefined"){return;}
			var $this=$(this),d=$this.data(pluginPfx),o=d.opt,
				mCSB_container=$("#mCSB_"+d.idx+"_container"),
				wrapper=mCSB_container.parent(),
				t=typeof val;
			if(!dir){dir=o.axis==="x" ? "x" : "y";}
			var contentLength=dir==="x" ? mCSB_container.outerWidth(false)-wrapper.width() : mCSB_container.outerHeight(false)-wrapper.height(),
				contentPos=dir==="x" ? mCSB_container[0].offsetLeft : mCSB_container[0].offsetTop,
				cssProp=dir==="x" ? "left" : "top";
			switch(t){
				case "function": /* this currently is not used. Consider removing it */
					return val();
					break;
				case "object": /* js/jquery object */
					var obj=val.jquery ? val : $(val);
					if(!obj.length){return;}
					return dir==="x" ? _childPos(obj)[1] : _childPos(obj)[0];
					break;
				case "string": case "number":
					if(_isNumeric(val)){ /* numeric value */
						return Math.abs(val);
					}else if(val.indexOf("%")!==-1){ /* percentage value */
						return Math.abs(contentLength*parseInt(val)/100);
					}else if(val.indexOf("-=")!==-1){ /* decrease value */
						return Math.abs(contentPos-parseInt(val.split("-=")[1]));
					}else if(val.indexOf("+=")!==-1){ /* inrease value */
						var p=(contentPos+parseInt(val.split("+=")[1]));
						return p>=0 ? 0 : Math.abs(p);
					}else if(val.indexOf("px")!==-1 && _isNumeric(val.split("px")[0])){ /* pixels string value (e.g. "100px") */
						return Math.abs(val.split("px")[0]);
					}else{
						if(val==="top" || val==="left"){ /* special strings */
							return 0;
						}else if(val==="bottom"){
							return Math.abs(wrapper.height()-mCSB_container.outerHeight(false));
						}else if(val==="right"){
							return Math.abs(wrapper.width()-mCSB_container.outerWidth(false));
						}else if(val==="first" || val==="last"){
							var obj=mCSB_container.find(":"+val);
							return dir==="x" ? _childPos(obj)[1] : _childPos(obj)[0];
						}else{
							if($(val).length){ /* jquery selector */
								return dir==="x" ? _childPos($(val))[1] : _childPos($(val))[0];
							}else{ /* other values (e.g. "100em") */
								mCSB_container.css(cssProp,val);
								methods.update.call(null,$this[0]);
								return;
							}
						}
					}
					break;
			}
		},
		/* -------------------- */
		
		
		/* calls the update method automatically */
		_autoUpdate=function(rem){
			var $this=$(this),d=$this.data(pluginPfx),o=d.opt,
				mCSB_container=$("#mCSB_"+d.idx+"_container");
			if(rem){
				/* 
				removes autoUpdate timer 
				usage: _autoUpdate.call(this,"remove");
				*/
				clearTimeout(mCSB_container[0].autoUpdate);
				_delete(mCSB_container[0],"autoUpdate");
				return;
			}
			upd();
			function upd(){
				clearTimeout(mCSB_container[0].autoUpdate);
				if($this.parents("html").length===0){
					/* check element in dom tree */
					$this=null;
					return;
				}
				mCSB_container[0].autoUpdate=setTimeout(function(){
					/* update on specific selector(s) length and size change */
					if(o.advanced.updateOnSelectorChange){
						d.poll.change.n=sizesSum();
						if(d.poll.change.n!==d.poll.change.o){
							d.poll.change.o=d.poll.change.n;
							doUpd(3);
							return;
						}
					}
					/* update on main element and scrollbar size changes */
					if(o.advanced.updateOnContentResize){
						d.poll.size.n=$this[0].scrollHeight+$this[0].scrollWidth+mCSB_container[0].offsetHeight+$this[0].offsetHeight+$this[0].offsetWidth;
						if(d.poll.size.n!==d.poll.size.o){
							d.poll.size.o=d.poll.size.n;
							doUpd(1);
							return;
						}
					}
					/* update on image load */
					if(o.advanced.updateOnImageLoad){
						if(!(o.advanced.updateOnImageLoad==="auto" && o.axis==="y")){ //by default, it doesn't run on vertical content
							d.poll.img.n=mCSB_container.find("img").length;
							if(d.poll.img.n!==d.poll.img.o){
								d.poll.img.o=d.poll.img.n;
								mCSB_container.find("img").each(function(){
									imgLoader(this);
								});
								return;
							}
						}
					}
					if(o.advanced.updateOnSelectorChange || o.advanced.updateOnContentResize || o.advanced.updateOnImageLoad){upd();}
				},o.advanced.autoUpdateTimeout);
			}
			/* a tiny image loader */
			function imgLoader(el){
				if($(el).hasClass(classes[2])){doUpd(); return;}
				var img=new Image();
				function createDelegate(contextObject,delegateMethod){
					return function(){return delegateMethod.apply(contextObject,arguments);}
				}
				function imgOnLoad(){
					this.onload=null;
					$(el).addClass(classes[2]);
					doUpd(2);
				}
				img.onload=createDelegate(img,imgOnLoad);
				img.src=el.src;
			}
			/* returns the total height and width sum of all elements matching the selector */
			function sizesSum(){
				if(o.advanced.updateOnSelectorChange===true){o.advanced.updateOnSelectorChange="*";}
				var total=0,sel=mCSB_container.find(o.advanced.updateOnSelectorChange);
				if(o.advanced.updateOnSelectorChange && sel.length>0){sel.each(function(){total+=this.offsetHeight+this.offsetWidth;});}
				return total;
			}
			/* calls the update method */
			function doUpd(cb){
				clearTimeout(mCSB_container[0].autoUpdate);
				methods.update.call(null,$this[0],cb);
			}
		},
		/* -------------------- */
		
		
		/* snaps scrolling to a multiple of a pixels number */
		_snapAmount=function(to,amount,offset){
			return (Math.round(to/amount)*amount-offset); 
		},
		/* -------------------- */
		
		
		/* stops content and scrollbar animations */
		_stop=function(el){
			var d=el.data(pluginPfx),
				sel=$("#mCSB_"+d.idx+"_container,#mCSB_"+d.idx+"_container_wrapper,#mCSB_"+d.idx+"_dragger_vertical,#mCSB_"+d.idx+"_dragger_horizontal");
			sel.each(function(){
				_stopTween.call(this);
			});
		},
		/* -------------------- */
		
		
		/* 
		ANIMATES CONTENT 
		This is where the actual scrolling happens
		*/
		_scrollTo=function(el,to,options){
			var d=el.data(pluginPfx),o=d.opt,
				defaults={
					trigger:"internal",
					dir:"y",
					scrollEasing:"mcsEaseOut",
					drag:false,
					dur:o.scrollInertia,
					overwrite:"all",
					callbacks:true,
					onStart:true,
					onUpdate:true,
					onComplete:true
				},
				options=$.extend(defaults,options),
				dur=[options.dur,(options.drag ? 0 : options.dur)],
				mCustomScrollBox=$("#mCSB_"+d.idx),
				mCSB_container=$("#mCSB_"+d.idx+"_container"),
				wrapper=mCSB_container.parent(),
				totalScrollOffsets=o.callbacks.onTotalScrollOffset ? _arr.call(el,o.callbacks.onTotalScrollOffset) : [0,0],
				totalScrollBackOffsets=o.callbacks.onTotalScrollBackOffset ? _arr.call(el,o.callbacks.onTotalScrollBackOffset) : [0,0];
			d.trigger=options.trigger;
			if(wrapper.scrollTop()!==0 || wrapper.scrollLeft()!==0){ /* always reset scrollTop/Left */
				$(".mCSB_"+d.idx+"_scrollbar").css("visibility","visible");
				wrapper.scrollTop(0).scrollLeft(0);
			}
			if(to==="_resetY" && !d.contentReset.y){
				/* callbacks: onOverflowYNone */
				if(_cb("onOverflowYNone")){o.callbacks.onOverflowYNone.call(el[0]);}
				d.contentReset.y=1;
			}
			if(to==="_resetX" && !d.contentReset.x){
				/* callbacks: onOverflowXNone */
				if(_cb("onOverflowXNone")){o.callbacks.onOverflowXNone.call(el[0]);}
				d.contentReset.x=1;
			}
			if(to==="_resetY" || to==="_resetX"){return;}
			if((d.contentReset.y || !el[0].mcs) && d.overflowed[0]){
				/* callbacks: onOverflowY */
				if(_cb("onOverflowY")){o.callbacks.onOverflowY.call(el[0]);}
				d.contentReset.x=null;
			}
			if((d.contentReset.x || !el[0].mcs) && d.overflowed[1]){
				/* callbacks: onOverflowX */
				if(_cb("onOverflowX")){o.callbacks.onOverflowX.call(el[0]);}
				d.contentReset.x=null;
			}
			if(o.snapAmount){ /* scrolling snapping */
				var snapAmount=!(o.snapAmount instanceof Array) ? o.snapAmount : options.dir==="x" ? o.snapAmount[1] : o.snapAmount[0];
				to=_snapAmount(to,snapAmount,o.snapOffset);
			}
			switch(options.dir){
				case "x":
					var mCSB_dragger=$("#mCSB_"+d.idx+"_dragger_horizontal"),
						property="left",
						contentPos=mCSB_container[0].offsetLeft,
						limit=[
							mCustomScrollBox.width()-mCSB_container.outerWidth(false),
							mCSB_dragger.parent().width()-mCSB_dragger.width()
						],
						scrollTo=[to,to===0 ? 0 : (to/d.scrollRatio.x)],
						tso=totalScrollOffsets[1],
						tsbo=totalScrollBackOffsets[1],
						totalScrollOffset=tso>0 ? tso/d.scrollRatio.x : 0,
						totalScrollBackOffset=tsbo>0 ? tsbo/d.scrollRatio.x : 0;
					break;
				case "y":
					var mCSB_dragger=$("#mCSB_"+d.idx+"_dragger_vertical"),
						property="top",
						contentPos=mCSB_container[0].offsetTop,
						limit=[
							mCustomScrollBox.height()-mCSB_container.outerHeight(false),
							mCSB_dragger.parent().height()-mCSB_dragger.height()
						],
						scrollTo=[to,to===0 ? 0 : (to/d.scrollRatio.y)],
						tso=totalScrollOffsets[0],
						tsbo=totalScrollBackOffsets[0],
						totalScrollOffset=tso>0 ? tso/d.scrollRatio.y : 0,
						totalScrollBackOffset=tsbo>0 ? tsbo/d.scrollRatio.y : 0;
					break;
			}
			if(scrollTo[1]<0 || (scrollTo[0]===0 && scrollTo[1]===0)){
				scrollTo=[0,0];
			}else if(scrollTo[1]>=limit[1]){
				scrollTo=[limit[0],limit[1]];
			}else{
				scrollTo[0]=-scrollTo[0];
			}
			if(!el[0].mcs){
				_mcs();  /* init mcs object (once) to make it available before callbacks */
				if(_cb("onInit")){o.callbacks.onInit.call(el[0]);} /* callbacks: onInit */
			}
			clearTimeout(mCSB_container[0].onCompleteTimeout);
			_tweenTo(mCSB_dragger[0],property,Math.round(scrollTo[1]),dur[1],options.scrollEasing);
			if(!d.tweenRunning && ((contentPos===0 && scrollTo[0]>=0) || (contentPos===limit[0] && scrollTo[0]<=limit[0]))){return;}
			_tweenTo(mCSB_container[0],property,Math.round(scrollTo[0]),dur[0],options.scrollEasing,options.overwrite,{
				onStart:function(){
					if(options.callbacks && options.onStart && !d.tweenRunning){
						/* callbacks: onScrollStart */
						if(_cb("onScrollStart")){_mcs(); o.callbacks.onScrollStart.call(el[0]);}
						d.tweenRunning=true;
						_onDragClasses(mCSB_dragger);
						d.cbOffsets=_cbOffsets();
					}
				},onUpdate:function(){
					if(options.callbacks && options.onUpdate){
						/* callbacks: whileScrolling */
						if(_cb("whileScrolling")){_mcs(); o.callbacks.whileScrolling.call(el[0]);}
					}
				},onComplete:function(){
					if(options.callbacks && options.onComplete){
						if(o.axis==="yx"){clearTimeout(mCSB_container[0].onCompleteTimeout);}
						var t=mCSB_container[0].idleTimer || 0;
						mCSB_container[0].onCompleteTimeout=setTimeout(function(){
							/* callbacks: onScroll, onTotalScroll, onTotalScrollBack */
							if(_cb("onScroll")){_mcs(); o.callbacks.onScroll.call(el[0]);}
							if(_cb("onTotalScroll") && scrollTo[1]>=limit[1]-totalScrollOffset && d.cbOffsets[0]){_mcs(); o.callbacks.onTotalScroll.call(el[0]);}
							if(_cb("onTotalScrollBack") && scrollTo[1]<=totalScrollBackOffset && d.cbOffsets[1]){_mcs(); o.callbacks.onTotalScrollBack.call(el[0]);}
							d.tweenRunning=false;
							mCSB_container[0].idleTimer=0;
							_onDragClasses(mCSB_dragger,"hide");
						},t);
					}
				}
			});
			/* checks if callback function exists */
			function _cb(cb){
				return d && o.callbacks[cb] && typeof o.callbacks[cb]==="function";
			}
			/* checks whether callback offsets always trigger */
			function _cbOffsets(){
				return [o.callbacks.alwaysTriggerOffsets || contentPos>=limit[0]+tso,o.callbacks.alwaysTriggerOffsets || contentPos<=-tsbo];
			}
			/* 
			populates object with useful values for the user 
			values: 
				content: this.mcs.content
				content top position: this.mcs.top 
				content left position: this.mcs.left 
				dragger top position: this.mcs.draggerTop 
				dragger left position: this.mcs.draggerLeft 
				scrolling y percentage: this.mcs.topPct 
				scrolling x percentage: this.mcs.leftPct 
				scrolling direction: this.mcs.direction
			*/
			function _mcs(){
				var cp=[mCSB_container[0].offsetTop,mCSB_container[0].offsetLeft], /* content position */
					dp=[mCSB_dragger[0].offsetTop,mCSB_dragger[0].offsetLeft], /* dragger position */
					cl=[mCSB_container.outerHeight(false),mCSB_container.outerWidth(false)], /* content length */
					pl=[mCustomScrollBox.height(),mCustomScrollBox.width()]; /* content parent length */
				el[0].mcs={
					content:mCSB_container, /* original content wrapper as jquery object */
					top:cp[0],left:cp[1],draggerTop:dp[0],draggerLeft:dp[1],
					topPct:Math.round((100*Math.abs(cp[0]))/(Math.abs(cl[0])-pl[0])),leftPct:Math.round((100*Math.abs(cp[1]))/(Math.abs(cl[1])-pl[1])),
					direction:options.dir
				};
				/* 
				this refers to the original element containing the scrollbar(s)
				usage: this.mcs.top, this.mcs.leftPct etc. 
				*/
			}
		},
		/* -------------------- */
		
		
		/* 
		CUSTOM JAVASCRIPT ANIMATION TWEEN 
		Lighter and faster than jquery animate() and css transitions 
		Animates top/left properties and includes easings 
		*/
		_tweenTo=function(el,prop,to,duration,easing,overwrite,callbacks){
			if(!el._mTween){el._mTween={top:{},left:{}};}
			var callbacks=callbacks || {},
				onStart=callbacks.onStart || function(){},onUpdate=callbacks.onUpdate || function(){},onComplete=callbacks.onComplete || function(){},
				startTime=_getTime(),_delay,progress=0,from=el.offsetTop,elStyle=el.style,_request,tobj=el._mTween[prop];
			if(prop==="left"){from=el.offsetLeft;}
			var diff=to-from;
			tobj.stop=0;
			if(overwrite!=="none"){_cancelTween();}
			_startTween();
			function _step(){
				if(tobj.stop){return;}
				if(!progress){onStart.call();}
				progress=_getTime()-startTime;
				_tween();
				if(progress>=tobj.time){
					tobj.time=(progress>tobj.time) ? progress+_delay-(progress-tobj.time) : progress+_delay-1;
					if(tobj.time<progress+1){tobj.time=progress+1;}
				}
				if(tobj.time<duration){tobj.id=_request(_step);}else{onComplete.call();}
			}
			function _tween(){
				if(duration>0){
					tobj.currVal=_ease(tobj.time,from,diff,duration,easing);
					elStyle[prop]=Math.round(tobj.currVal)+"px";
				}else{
					elStyle[prop]=to+"px";
				}
				onUpdate.call();
			}
			function _startTween(){
				_delay=1000/60;
				tobj.time=progress+_delay;
				_request=(!window.requestAnimationFrame) ? function(f){_tween(); return setTimeout(f,0.01);} : window.requestAnimationFrame;
				tobj.id=_request(_step);
			}
			function _cancelTween(){
				if(tobj.id==null){return;}
				if(!window.requestAnimationFrame){clearTimeout(tobj.id);
				}else{window.cancelAnimationFrame(tobj.id);}
				tobj.id=null;
			}
			function _ease(t,b,c,d,type){
				switch(type){
					case "linear": case "mcsLinear":
						return c*t/d + b;
						break;
					case "mcsLinearOut":
						t/=d; t--; return c * Math.sqrt(1 - t*t) + b;
						break;
					case "easeInOutSmooth":
						t/=d/2;
						if(t<1) return c/2*t*t + b;
						t--;
						return -c/2 * (t*(t-2) - 1) + b;
						break;
					case "easeInOutStrong":
						t/=d/2;
						if(t<1) return c/2 * Math.pow( 2, 10 * (t - 1) ) + b;
						t--;
						return c/2 * ( -Math.pow( 2, -10 * t) + 2 ) + b;
						break;
					case "easeInOut": case "mcsEaseInOut":
						t/=d/2;
						if(t<1) return c/2*t*t*t + b;
						t-=2;
						return c/2*(t*t*t + 2) + b;
						break;
					case "easeOutSmooth":
						t/=d; t--;
						return -c * (t*t*t*t - 1) + b;
						break;
					case "easeOutStrong":
						return c * ( -Math.pow( 2, -10 * t/d ) + 1 ) + b;
						break;
					case "easeOut": case "mcsEaseOut": default:
						var ts=(t/=d)*t,tc=ts*t;
						return b+c*(0.499999999999997*tc*ts + -2.5*ts*ts + 5.5*tc + -6.5*ts + 4*t);
				}
			}
		},
		/* -------------------- */
		
		
		/* returns current time */
		_getTime=function(){
			if(window.performance && window.performance.now){
				return window.performance.now();
			}else{
				if(window.performance && window.performance.webkitNow){
					return window.performance.webkitNow();
				}else{
					if(Date.now){return Date.now();}else{return new Date().getTime();}
				}
			}
		},
		/* -------------------- */
		
		
		/* stops a tween */
		_stopTween=function(){
			var el=this;
			if(!el._mTween){el._mTween={top:{},left:{}};}
			var props=["top","left"];
			for(var i=0; i<props.length; i++){
				var prop=props[i];
				if(el._mTween[prop].id){
					if(!window.requestAnimationFrame){clearTimeout(el._mTween[prop].id);
					}else{window.cancelAnimationFrame(el._mTween[prop].id);}
					el._mTween[prop].id=null;
					el._mTween[prop].stop=1;
				}
			}
		},
		/* -------------------- */
		
		
		/* deletes a property (avoiding the exception thrown by IE) */
		_delete=function(c,m){
			try{delete c[m];}catch(e){c[m]=null;}
		},
		/* -------------------- */
		
		
		/* detects left mouse button */
		_mouseBtnLeft=function(e){
			return !(e.which && e.which!==1);
		},
		/* -------------------- */
		
		
		/* detects if pointer type event is touch */
		_pointerTouch=function(e){
			var t=e.originalEvent.pointerType;
			return !(t && t!=="touch" && t!==2);
		},
		/* -------------------- */
		
		
		/* checks if value is numeric */
		_isNumeric=function(val){
			return !isNaN(parseFloat(val)) && isFinite(val);
		},
		/* -------------------- */
		
		
		/* returns element position according to content */
		_childPos=function(el){
			var p=el.parents(".mCSB_container");
			return [el.offset().top-p.offset().top,el.offset().left-p.offset().left];
		},
		/* -------------------- */
		
		
		/* checks if browser tab is hidden/inactive via Page Visibility API */
		_isTabHidden=function(){
			var prop=_getHiddenProp();
			if(!prop) return false;
			return document[prop];
			function _getHiddenProp(){
				var pfx=["webkit","moz","ms","o"];
				if("hidden" in document) return "hidden"; //natively supported
				for(var i=0; i<pfx.length; i++){ //prefixed
				    if((pfx[i]+"Hidden") in document) 
				        return pfx[i]+"Hidden";
				}
				return null; //not supported
			}
		};
		/* -------------------- */
		
	
	
	
	
	/* 
	----------------------------------------
	PLUGIN SETUP 
	----------------------------------------
	*/
	
	/* plugin constructor functions */
	$.fn[pluginNS]=function(method){ /* usage: $(selector).mCustomScrollbar(); */
		if(methods[method]){
			return methods[method].apply(this,Array.prototype.slice.call(arguments,1));
		}else if(typeof method==="object" || !method){
			return methods.init.apply(this,arguments);
		}else{
			$.error("Method "+method+" does not exist");
		}
	};
	$[pluginNS]=function(method){ /* usage: $.mCustomScrollbar(); */
		if(methods[method]){
			return methods[method].apply(this,Array.prototype.slice.call(arguments,1));
		}else if(typeof method==="object" || !method){
			return methods.init.apply(this,arguments);
		}else{
			$.error("Method "+method+" does not exist");
		}
	};
	
	/* 
	allow setting plugin default options. 
	usage: $.mCustomScrollbar.defaults.scrollInertia=500; 
	to apply any changed default options on default selectors (below), use inside document ready fn 
	e.g.: $(document).ready(function(){ $.mCustomScrollbar.defaults.scrollInertia=500; });
	*/
	$[pluginNS].defaults=defaults;
	
	/* 
	add window object (window.mCustomScrollbar) 
	usage: if(window.mCustomScrollbar){console.log("custom scrollbar plugin loaded");}
	*/
	window[pluginNS]=true;
	
	$(window).bind("load",function(){
		
		$(defaultSelector)[pluginNS](); /* add scrollbars automatically on default selector */
		
		/* extend jQuery expressions */
		$.extend($.expr[":"],{
			/* checks if element is within scrollable viewport */
			mcsInView:$.expr[":"].mcsInView || function(el){
				var $el=$(el),content=$el.parents(".mCSB_container"),wrapper,cPos;
				if(!content.length){return;}
				wrapper=content.parent();
				cPos=[content[0].offsetTop,content[0].offsetLeft];
				return 	cPos[0]+_childPos($el)[0]>=0 && cPos[0]+_childPos($el)[0]<wrapper.height()-$el.outerHeight(false) && 
						cPos[1]+_childPos($el)[1]>=0 && cPos[1]+_childPos($el)[1]<wrapper.width()-$el.outerWidth(false);
			},
			/* checks if element or part of element is in view of scrollable viewport */
			mcsInSight:$.expr[":"].mcsInSight || function(el,i,m){
				var $el=$(el),elD,content=$el.parents(".mCSB_container"),wrapperView,pos,wrapperViewPct,
					pctVals=m[3]==="exact" ? [[1,0],[1,0]] : [[0.9,0.1],[0.6,0.4]];
				if(!content.length){return;}
				elD=[$el.outerHeight(false),$el.outerWidth(false)];
				pos=[content[0].offsetTop+_childPos($el)[0],content[0].offsetLeft+_childPos($el)[1]];
				wrapperView=[content.parent()[0].offsetHeight,content.parent()[0].offsetWidth];
				wrapperViewPct=[elD[0]<wrapperView[0] ? pctVals[0] : pctVals[1],elD[1]<wrapperView[1] ? pctVals[0] : pctVals[1]];
				return 	pos[0]-(wrapperView[0]*wrapperViewPct[0][0])<0 && pos[0]+elD[0]-(wrapperView[0]*wrapperViewPct[0][1])>=0 && 
						pos[1]-(wrapperView[1]*wrapperViewPct[1][0])<0 && pos[1]+elD[1]-(wrapperView[1]*wrapperViewPct[1][1])>=0;
			},
			/* checks if element is overflowed having visible scrollbar(s) */
			mcsOverflow:$.expr[":"].mcsOverflow || function(el){
				var d=$(el).data(pluginPfx);
				if(!d){return;}
				return d.overflowed[0] || d.overflowed[1];
			}
		});
	
	});

}))}));

!function(t,o,e){function i(o,e){this.bodyOverflowX,this.callbacks={hide:[],show:[]},this.checkInterval=null,this.Content,this.$el=t(o),this.$elProxy,this.elProxyPosition,this.enabled=!0,this.options=t.extend({},l,e),this.mouseIsOverProxy=!1,this.namespace="tooltipster-"+Math.round(1e5*Math.random()),this.Status="hidden",this.timerHide=null,this.timerShow=null,this.$tooltip,this.options.iconTheme=this.options.iconTheme.replace(".",""),this.options.theme=this.options.theme.replace(".",""),this._init()}function n(o,e){var i=!0;return t.each(o,function(t,n){return"undefined"==typeof e[t]||o[t]!==e[t]?(i=!1,!1):void 0}),i}function s(){return!f&&p}function r(){var t=e.body||e.documentElement,o=t.style,i="transition";if("string"==typeof o[i])return!0;v=["Moz","Webkit","Khtml","O","ms"],i=i.charAt(0).toUpperCase()+i.substr(1);for(var n=0;n<v.length;n++)if("string"==typeof o[v[n]+i])return!0;return!1}var a="tooltipster",l={animation:"fade",arrow:!0,arrowColor:"",autoClose:!0,content:null,contentAsHTML:!1,contentCloning:!0,debug:!0,delay:200,minWidth:0,maxWidth:null,functionInit:function(t,o){},functionBefore:function(t,o){o()},functionReady:function(t,o){},functionAfter:function(t){},hideOnClick:!1,icon:"(?)",iconCloning:!0,iconDesktop:!1,iconTouch:!1,iconTheme:"tooltipster-icon",interactive:!1,interactiveTolerance:350,multiple:!1,offsetX:0,offsetY:0,onlyOne:!1,position:"top",positionTracker:!1,positionTrackerCallback:function(t){"hover"==this.option("trigger")&&this.option("autoClose")&&this.hide()},restoration:"current",speed:350,timer:0,theme:"tooltipster-default",touchDevices:!0,trigger:"hover",updateAnimation:!0};i.prototype={_init:function(){var o=this;if(e.querySelector){var i=null;void 0===o.$el.data("tooltipster-initialTitle")&&(i=o.$el.attr("title"),void 0===i&&(i=null),o.$el.data("tooltipster-initialTitle",i)),null!==o.options.content?o._content_set(o.options.content):o._content_set(i);var n=o.options.functionInit.call(o.$el,o.$el,o.Content);"undefined"!=typeof n&&o._content_set(n),o.$el.removeAttr("title").addClass("tooltipstered"),!p&&o.options.iconDesktop||p&&o.options.iconTouch?("string"==typeof o.options.icon?(o.$elProxy=t('<span class="'+o.options.iconTheme+'"></span>'),o.$elProxy.text(o.options.icon)):o.options.iconCloning?o.$elProxy=o.options.icon.clone(!0):o.$elProxy=o.options.icon,o.$elProxy.insertAfter(o.$el)):o.$elProxy=o.$el,"hover"==o.options.trigger?(o.$elProxy.on("mouseenter."+o.namespace,function(){(!s()||o.options.touchDevices)&&(o.mouseIsOverProxy=!0,o._show())}).on("mouseleave."+o.namespace,function(){(!s()||o.options.touchDevices)&&(o.mouseIsOverProxy=!1)}),p&&o.options.touchDevices&&o.$elProxy.on("touchstart."+o.namespace,function(){o._showNow()})):"click"==o.options.trigger&&o.$elProxy.on("click."+o.namespace,function(){(!s()||o.options.touchDevices)&&o._show()})}},_show:function(){var t=this;"shown"!=t.Status&&"appearing"!=t.Status&&(t.options.delay?t.timerShow=setTimeout(function(){("click"==t.options.trigger||"hover"==t.options.trigger&&t.mouseIsOverProxy)&&t._showNow()},t.options.delay):t._showNow())},_showNow:function(e){var i=this;i.options.functionBefore.call(i.$el,i.$el,function(){if(i.enabled&&null!==i.Content){e&&i.callbacks.show.push(e),i.callbacks.hide=[],clearTimeout(i.timerShow),i.timerShow=null,clearTimeout(i.timerHide),i.timerHide=null,i.options.onlyOne&&t(".tooltipstered").not(i.$el).each(function(o,e){var i=t(e),n=i.data("tooltipster-ns");t.each(n,function(t,o){var e=i.data(o),n=e.status(),s=e.option("autoClose");"hidden"!==n&&"disappearing"!==n&&s&&e.hide()})});var n=function(){i.Status="shown",t.each(i.callbacks.show,function(t,o){o.call(i.$el)}),i.callbacks.show=[]};if("hidden"!==i.Status){var s=0;"disappearing"===i.Status?(i.Status="appearing",r()?(i.$tooltip.clearQueue().removeClass("tooltipster-dying").addClass("tooltipster-"+i.options.animation+"-show"),i.options.speed>0&&i.$tooltip.delay(i.options.speed),i.$tooltip.queue(n)):i.$tooltip.stop().fadeIn(n)):"shown"===i.Status&&n()}else{i.Status="appearing";var s=i.options.speed;i.bodyOverflowX=t("body").css("overflow-x"),t("body").css("overflow-x","hidden");var a="tooltipster-"+i.options.animation,l="-webkit-transition-duration: "+i.options.speed+"ms; -webkit-animation-duration: "+i.options.speed+"ms; -moz-transition-duration: "+i.options.speed+"ms; -moz-animation-duration: "+i.options.speed+"ms; -o-transition-duration: "+i.options.speed+"ms; -o-animation-duration: "+i.options.speed+"ms; -ms-transition-duration: "+i.options.speed+"ms; -ms-animation-duration: "+i.options.speed+"ms; transition-duration: "+i.options.speed+"ms; animation-duration: "+i.options.speed+"ms;",f=i.options.minWidth?"min-width:"+Math.round(i.options.minWidth)+"px;":"",d=i.options.maxWidth?"max-width:"+Math.round(i.options.maxWidth)+"px;":"",c=i.options.interactive?"pointer-events: auto;":"";if(i.$tooltip=t('<div class="tooltipster-base '+i.options.theme+'" style="'+f+" "+d+" "+c+" "+l+'"><div class="tooltipster-content"></div></div>'),r()&&i.$tooltip.addClass(a),i._content_insert(),i.$tooltip.appendTo("body"),i.reposition(),i.options.functionReady.call(i.$el,i.$el,i.$tooltip),r()?(i.$tooltip.addClass(a+"-show"),i.options.speed>0&&i.$tooltip.delay(i.options.speed),i.$tooltip.queue(n)):i.$tooltip.css("display","none").fadeIn(i.options.speed,n),i._interval_set(),t(o).on("scroll."+i.namespace+" resize."+i.namespace,function(){i.reposition()}),i.options.autoClose)if(t("body").off("."+i.namespace),"hover"==i.options.trigger){if(p&&setTimeout(function(){t("body").on("touchstart."+i.namespace,function(){i.hide()})},0),i.options.interactive){p&&i.$tooltip.on("touchstart."+i.namespace,function(t){t.stopPropagation()});var h=null;i.$elProxy.add(i.$tooltip).on("mouseleave."+i.namespace+"-autoClose",function(){clearTimeout(h),h=setTimeout(function(){i.hide()},i.options.interactiveTolerance)}).on("mouseenter."+i.namespace+"-autoClose",function(){clearTimeout(h)})}else i.$elProxy.on("mouseleave."+i.namespace+"-autoClose",function(){i.hide()});i.options.hideOnClick&&i.$elProxy.on("click."+i.namespace+"-autoClose",function(){i.hide()})}else"click"==i.options.trigger&&(setTimeout(function(){t("body").on("click."+i.namespace+" touchstart."+i.namespace,function(){i.hide()})},0),i.options.interactive&&i.$tooltip.on("click."+i.namespace+" touchstart."+i.namespace,function(t){t.stopPropagation()}))}i.options.timer>0&&(i.timerHide=setTimeout(function(){i.timerHide=null,i.hide()},i.options.timer+s))}})},_interval_set:function(){var o=this;o.checkInterval=setInterval(function(){if(0===t("body").find(o.$el).length||0===t("body").find(o.$elProxy).length||"hidden"==o.Status||0===t("body").find(o.$tooltip).length)("shown"==o.Status||"appearing"==o.Status)&&o.hide(),o._interval_cancel();else if(o.options.positionTracker){var e=o._repositionInfo(o.$elProxy),i=!1;n(e.dimension,o.elProxyPosition.dimension)&&("fixed"===o.$elProxy.css("position")?n(e.position,o.elProxyPosition.position)&&(i=!0):n(e.offset,o.elProxyPosition.offset)&&(i=!0)),i||(o.reposition(),o.options.positionTrackerCallback.call(o,o.$el))}},200)},_interval_cancel:function(){clearInterval(this.checkInterval),this.checkInterval=null},_content_set:function(t){"object"==typeof t&&null!==t&&this.options.contentCloning&&(t=t.clone(!0)),this.Content=t},_content_insert:function(){var t=this,o=this.$tooltip.find(".tooltipster-content");"string"!=typeof t.Content||t.options.contentAsHTML?o.empty().append(t.Content):o.text(t.Content)},_update:function(t){var o=this;o._content_set(t),null!==o.Content?"hidden"!==o.Status&&(o._content_insert(),o.reposition(),o.options.updateAnimation&&(r()?(o.$tooltip.css({width:"","-webkit-transition":"all "+o.options.speed+"ms, width 0ms, height 0ms, left 0ms, top 0ms","-moz-transition":"all "+o.options.speed+"ms, width 0ms, height 0ms, left 0ms, top 0ms","-o-transition":"all "+o.options.speed+"ms, width 0ms, height 0ms, left 0ms, top 0ms","-ms-transition":"all "+o.options.speed+"ms, width 0ms, height 0ms, left 0ms, top 0ms",transition:"all "+o.options.speed+"ms, width 0ms, height 0ms, left 0ms, top 0ms"}).addClass("tooltipster-content-changing"),setTimeout(function(){"hidden"!=o.Status&&(o.$tooltip.removeClass("tooltipster-content-changing"),setTimeout(function(){"hidden"!==o.Status&&o.$tooltip.css({"-webkit-transition":o.options.speed+"ms","-moz-transition":o.options.speed+"ms","-o-transition":o.options.speed+"ms","-ms-transition":o.options.speed+"ms",transition:o.options.speed+"ms"})},o.options.speed))},o.options.speed)):o.$tooltip.fadeTo(o.options.speed,.5,function(){"hidden"!=o.Status&&o.$tooltip.fadeTo(o.options.speed,1)}))):o.hide()},_repositionInfo:function(t){return{dimension:{height:t.outerHeight(!1),width:t.outerWidth(!1)},offset:t.offset(),position:{left:parseInt(t.css("left")),top:parseInt(t.css("top"))}}},hide:function(e){var i=this;e&&i.callbacks.hide.push(e),i.callbacks.show=[],clearTimeout(i.timerShow),i.timerShow=null,clearTimeout(i.timerHide),i.timerHide=null;var n=function(){t.each(i.callbacks.hide,function(t,o){o.call(i.$el)}),i.callbacks.hide=[]};if("shown"==i.Status||"appearing"==i.Status){i.Status="disappearing";var s=function(){i.Status="hidden","object"==typeof i.Content&&null!==i.Content&&i.Content.detach(),i.$tooltip.remove(),i.$tooltip=null,t(o).off("."+i.namespace),t("body").off("."+i.namespace).css("overflow-x",i.bodyOverflowX),t("body").off("."+i.namespace),i.$elProxy.off("."+i.namespace+"-autoClose"),i.options.functionAfter.call(i.$el,i.$el),n()};r()?(i.$tooltip.clearQueue().removeClass("tooltipster-"+i.options.animation+"-show").addClass("tooltipster-dying"),i.options.speed>0&&i.$tooltip.delay(i.options.speed),i.$tooltip.queue(s)):i.$tooltip.stop().fadeOut(i.options.speed,s)}else"hidden"==i.Status&&n();return i},show:function(t){return this._showNow(t),this},update:function(t){return this.content(t)},content:function(t){return"undefined"==typeof t?this.Content:(this._update(t),this)},reposition:function(){function e(){var e=t(o).scrollLeft();0>M-e&&(s=M-e,M=e),M+l-e>r&&(s=M-(r+e-l),M=r+e-l)}function i(e,i){a.offset.top-t(o).scrollTop()-f-A-12<0&&i.indexOf("top")>-1&&(F=e),a.offset.top+a.dimension.height+f+12+A>t(o).scrollTop()+t(o).height()&&i.indexOf("bottom")>-1&&(F=e,W=a.offset.top-f-A-12)}var n=this;if(0!==t("body").find(n.$tooltip).length){n.$tooltip.css("width",""),n.elProxyPosition=n._repositionInfo(n.$elProxy);var s=null,r=t(o).width(),a=n.elProxyPosition,l=n.$tooltip.outerWidth(!1),p=n.$tooltip.innerWidth()+1,f=n.$tooltip.outerHeight(!1);if(n.$elProxy.is("area")){var d=n.$elProxy.attr("shape"),c=n.$elProxy.parent().attr("name"),h=t('img[usemap="#'+c+'"]'),u=h.offset().left,m=h.offset().top,v=void 0!==n.$elProxy.attr("coords")?n.$elProxy.attr("coords").split(","):void 0;if("circle"==d){var g=parseInt(v[0]),y=parseInt(v[1]),w=parseInt(v[2]);a.dimension.height=2*w,a.dimension.width=2*w,a.offset.top=m+y-w,a.offset.left=u+g-w}else if("rect"==d){var g=parseInt(v[0]),y=parseInt(v[1]),b=parseInt(v[2]),x=parseInt(v[3]);a.dimension.height=x-y,a.dimension.width=b-g,a.offset.top=m+y,a.offset.left=u+g}else if("poly"==d){for(var C=[],P=[],T=0,_=0,k=0,I=0,S="even",O=0;O<v.length;O++){var H=parseInt(v[O]);"even"==S?(H>k&&(k=H,0===O&&(T=k)),T>H&&(T=H),S="odd"):(H>I&&(I=H,1==O&&(_=I)),_>H&&(_=H),S="even")}a.dimension.height=I-_,a.dimension.width=k-T,a.offset.top=m+_,a.offset.left=u+T}else a.dimension.height=h.outerHeight(!1),a.dimension.width=h.outerWidth(!1),a.offset.top=m,a.offset.left=u}var M=0,D=0,W=0,A=parseInt(n.options.offsetY),z=parseInt(n.options.offsetX),F=n.options.position;if("top"==F){var N=a.offset.left+l-(a.offset.left+a.dimension.width);M=a.offset.left+z-N/2,W=a.offset.top-f-A-12,e(),i("bottom","top")}if("top-left"==F&&(M=a.offset.left+z,W=a.offset.top-f-A-12,e(),i("bottom-left","top-left")),"top-right"==F&&(M=a.offset.left+a.dimension.width+z-l,W=a.offset.top-f-A-12,e(),i("bottom-right","top-right")),"bottom"==F){var N=a.offset.left+l-(a.offset.left+a.dimension.width);M=a.offset.left-N/2+z,W=a.offset.top+a.dimension.height+A+12,e(),i("top","bottom")}if("bottom-left"==F&&(M=a.offset.left+z,W=a.offset.top+a.dimension.height+A+12,e(),i("top-left","bottom-left")),"bottom-right"==F&&(M=a.offset.left+a.dimension.width+z-l,W=a.offset.top+a.dimension.height+A+12,e(),i("top-right","bottom-right")),"left"==F){M=a.offset.left-z-l-12,D=a.offset.left+z+a.dimension.width+12;var X=a.offset.top+f-(a.offset.top+a.dimension.height);if(W=a.offset.top-X/2-A,0>M&&D+l>r){var q=2*parseFloat(n.$tooltip.css("border-width")),j=l+M-q;n.$tooltip.css("width",j+"px"),f=n.$tooltip.outerHeight(!1),M=a.offset.left-z-j-12-q,X=a.offset.top+f-(a.offset.top+a.dimension.height),W=a.offset.top-X/2-A}else 0>M&&(M=a.offset.left+z+a.dimension.width+12,s="left")}if("right"==F){M=a.offset.left+z+a.dimension.width+12,D=a.offset.left-z-l-12;var X=a.offset.top+f-(a.offset.top+a.dimension.height);if(W=a.offset.top-X/2-A,M+l>r&&0>D){var q=2*parseFloat(n.$tooltip.css("border-width")),j=r-M-q;n.$tooltip.css("width",j+"px"),f=n.$tooltip.outerHeight(!1),X=a.offset.top+f-(a.offset.top+a.dimension.height),W=a.offset.top-X/2-A}else M+l>r&&(M=a.offset.left-z-l-12,s="right")}if(n.options.arrow){var E="tooltipster-arrow-"+F;if(n.options.arrowColor.length<1)var L=n.$tooltip.css("background-color");else var L=n.options.arrowColor;if(s?"left"==s?(E="tooltipster-arrow-right",s=""):"right"==s?(E="tooltipster-arrow-left",s=""):s="left:"+Math.round(s)+"px;":s="","top"==F||"top-left"==F||"top-right"==F)var Q=parseFloat(n.$tooltip.css("border-bottom-width")),U=n.$tooltip.css("border-bottom-color");else if("bottom"==F||"bottom-left"==F||"bottom-right"==F)var Q=parseFloat(n.$tooltip.css("border-top-width")),U=n.$tooltip.css("border-top-color");else if("left"==F)var Q=parseFloat(n.$tooltip.css("border-right-width")),U=n.$tooltip.css("border-right-color");else if("right"==F)var Q=parseFloat(n.$tooltip.css("border-left-width")),U=n.$tooltip.css("border-left-color");else var Q=parseFloat(n.$tooltip.css("border-bottom-width")),U=n.$tooltip.css("border-bottom-color");Q>1&&Q++;var Y="";if(0!==Q){var B="",R="border-color: "+U+";";-1!==E.indexOf("bottom")?B="margin-top: -"+Math.round(Q)+"px;":-1!==E.indexOf("top")?B="margin-bottom: -"+Math.round(Q)+"px;":-1!==E.indexOf("left")?B="margin-right: -"+Math.round(Q)+"px;":-1!==E.indexOf("right")&&(B="margin-left: -"+Math.round(Q)+"px;"),Y='<span class="tooltipster-arrow-border" style="'+B+" "+R+';"></span>'}n.$tooltip.find(".tooltipster-arrow").remove();var K='<div class="'+E+' tooltipster-arrow" style="'+s+'">'+Y+'<span style="border-color:'+L+';"></span></div>';n.$tooltip.append(K)}n.$tooltip.css({top:Math.round(W)+"px",left:Math.round(M)+"px"})}return n},enable:function(){return this.enabled=!0,this},disable:function(){return this.hide(),this.enabled=!1,this},destroy:function(){var o=this;o.hide(),o.$el[0]!==o.$elProxy[0]&&o.$elProxy.remove(),o.$el.removeData(o.namespace).off("."+o.namespace);var e=o.$el.data("tooltipster-ns");if(1===e.length){var i=null;"previous"===o.options.restoration?i=o.$el.data("tooltipster-initialTitle"):"current"===o.options.restoration&&(i="string"==typeof o.Content?o.Content:t("<div></div>").append(o.Content).html()),i&&o.$el.attr("title",i),o.$el.removeClass("tooltipstered").removeData("tooltipster-ns").removeData("tooltipster-initialTitle")}else e=t.grep(e,function(t,e){return t!==o.namespace}),o.$el.data("tooltipster-ns",e);return o},elementIcon:function(){return this.$el[0]!==this.$elProxy[0]?this.$elProxy[0]:void 0},elementTooltip:function(){return this.$tooltip?this.$tooltip[0]:void 0},option:function(t,o){return"undefined"==typeof o?this.options[t]:(this.options[t]=o,this)},status:function(){return this.Status}},t.fn[a]=function(){var o=arguments;if(0===this.length){if("string"==typeof o[0]){var e=!0;switch(o[0]){case"setDefaults":t.extend(l,o[1]);break;default:e=!1}return e?!0:this}return this}if("string"==typeof o[0]){var n="#*$~&";return this.each(function(){var e=t(this).data("tooltipster-ns"),i=e?t(this).data(e[0]):null;if(!i)throw new Error("You called Tooltipster's \""+o[0]+'" method on an uninitialized element');if("function"!=typeof i[o[0]])throw new Error('Unknown method .tooltipster("'+o[0]+'")');var s=i[o[0]](o[1],o[2]);return s!==i?(n=s,!1):void 0}),"#*$~&"!==n?n:this}var s=[],r=o[0]&&"undefined"!=typeof o[0].multiple,a=r&&o[0].multiple||!r&&l.multiple,p=o[0]&&"undefined"!=typeof o[0].debug,f=p&&o[0].debug||!p&&l.debug;return this.each(function(){var e=!1,n=t(this).data("tooltipster-ns"),r=null;n?a?e=!0:f&&console.log('Tooltipster: one or more tooltips are already attached to this element: ignoring. Use the "multiple" option to attach more tooltips.'):e=!0,e&&(r=new i(this,o[0]),n||(n=[]),n.push(r.namespace),t(this).data("tooltipster-ns",n),t(this).data(r.namespace,r)),s.push(r)}),a?s:this};var p=!!("ontouchstart"in o),f=!1;t("body").one("mousemove",function(){f=!0})}(jQuery,window,document);

/*!
 * jQuery UI Touch Punch 0.2.3
 *
 * Copyright 2011�2014, Dave Furfero
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * Depends:
 *  jquery.ui.widget.js
 *  jquery.ui.mouse.js
 */
(function ($) {

  // Detect touch support
  $.support.touch = 'ontouchend' in document;

  // Ignore browsers without touch support
  if (!$.support.touch) {
    return;
  }

  var mouseProto = $.ui.mouse.prototype,
      _mouseInit = mouseProto._mouseInit,
      _mouseDestroy = mouseProto._mouseDestroy,
      touchHandled;

  /**
   * Simulate a mouse event based on a corresponding touch event
   * @param {Object} event A touch event
   * @param {String} simulatedType The corresponding mouse event
   */
  function simulateMouseEvent (event, simulatedType) {

    // Ignore multi-touch events
    if (event.originalEvent.touches.length > 1) {
      return;
    }

    event.preventDefault();

    var touch = event.originalEvent.changedTouches[0],
        simulatedEvent = document.createEvent('MouseEvents');

    // Initialize the simulated mouse event using the touch event's coordinates
    simulatedEvent.initMouseEvent(
      simulatedType,    // type
      true,             // bubbles
      true,             // cancelable
      window,           // view
      1,                // detail
      touch.screenX,    // screenX
      touch.screenY,    // screenY
      touch.clientX,    // clientX
      touch.clientY,    // clientY
      false,            // ctrlKey
      false,            // altKey
      false,            // shiftKey
      false,            // metaKey
      0,                // button
      null              // relatedTarget
    );

    // Dispatch the simulated event to the target element
    event.target.dispatchEvent(simulatedEvent);
  }

  /**
   * Handle the jQuery UI widget's touchstart events
   * @param {Object} event The widget element's touchstart event
   */
  mouseProto._touchStart = function (event) {

    var self = this;

    // Ignore the event if another widget is already being handled
    if (touchHandled || !self._mouseCapture(event.originalEvent.changedTouches[0])) {
      return;
    }

    // Set the flag to prevent other widgets from inheriting the touch event
    touchHandled = true;

    // Track movement to determine if interaction was a click
    self._touchMoved = false;

    // Simulate the mouseover event
    simulateMouseEvent(event, 'mouseover');

    // Simulate the mousemove event
    simulateMouseEvent(event, 'mousemove');

    // Simulate the mousedown event
    simulateMouseEvent(event, 'mousedown');
  };

  /**
   * Handle the jQuery UI widget's touchmove events
   * @param {Object} event The document's touchmove event
   */
  mouseProto._touchMove = function (event) {

    // Ignore event if not handled
    if (!touchHandled) {
      return;
    }

    // Interaction was not a click
    this._touchMoved = true;

    // Simulate the mousemove event
    simulateMouseEvent(event, 'mousemove');
  };

  /**
   * Handle the jQuery UI widget's touchend events
   * @param {Object} event The document's touchend event
   */
  mouseProto._touchEnd = function (event) {

    // Ignore event if not handled
    if (!touchHandled) {
      return;
    }

    // Simulate the mouseup event
    simulateMouseEvent(event, 'mouseup');

    // Simulate the mouseout event
    simulateMouseEvent(event, 'mouseout');

    // If the touch interaction did not move, it should trigger a click
    if (!this._touchMoved) {

      // Simulate the click event
      simulateMouseEvent(event, 'click');
    }

    // Unset the flag to allow other widgets to inherit the touch event
    touchHandled = false;
  };

  /**
   * A duck punch of the $.ui.mouse _mouseInit method to support touch events.
   * This method extends the widget with bound touch event handlers that
   * translate touch events to mouse events and pass them to the widget's
   * original mouse event handling methods.
   */
  mouseProto._mouseInit = function () {

    var self = this;

    // Delegate the touch handlers to the widget's element
    self.element.bind({
      touchstart: $.proxy(self, '_touchStart'),
      touchmove: $.proxy(self, '_touchMove'),
      touchend: $.proxy(self, '_touchEnd')
    });

    // Call the original $.ui.mouse init method
    _mouseInit.call(self);
  };

  /**
   * Remove the touch event handlers
   */
  mouseProto._mouseDestroy = function () {

    var self = this;

    // Delegate the touch handlers to the widget's element
    self.element.unbind({
      touchstart: $.proxy(self, '_touchStart'),
      touchmove: $.proxy(self, '_touchMove'),
      touchend: $.proxy(self, '_touchEnd')
    });

    // Call the original $.ui.mouse destroy method
    _mouseDestroy.call(self);
  };

})(jQuery);

function Tree(){var t=this;t.build_tree=function(e){var s=t.dyn_tree,r=t.stat_desc.static_tree,n=t.stat_desc.elems,o,i=-1,a;for(e.heap_len=0,e.heap_max=HEAP_SIZE,o=0;n>o;o++)0!==s[2*o]?(e.heap[++e.heap_len]=i=o,e.depth[o]=0):s[2*o+1]=0;for(;2>e.heap_len;)a=e.heap[++e.heap_len]=2>i?++i:0,s[2*a]=1,e.depth[a]=0,e.opt_len--,r&&(e.static_len-=r[2*a+1]);for(t.max_code=i,o=Math.floor(e.heap_len/2);o>=1;o--)e.pqdownheap(s,o);a=n;do o=e.heap[1],e.heap[1]=e.heap[e.heap_len--],e.pqdownheap(s,1),r=e.heap[1],e.heap[--e.heap_max]=o,e.heap[--e.heap_max]=r,s[2*a]=s[2*o]+s[2*r],e.depth[a]=Math.max(e.depth[o],e.depth[r])+1,s[2*o+1]=s[2*r+1]=a,e.heap[1]=a++,e.pqdownheap(s,1);while(2<=e.heap_len);e.heap[--e.heap_max]=e.heap[1],o=t.dyn_tree;for(var i=t.stat_desc.static_tree,u=t.stat_desc.extra_bits,c=t.stat_desc.extra_base,l=t.stat_desc.max_length,f,d,w=0,n=0;MAX_BITS>=n;n++)e.bl_count[n]=0;for(o[2*e.heap[e.heap_max]+1]=0,a=e.heap_max+1;HEAP_SIZE>a;a++)r=e.heap[a],n=o[2*o[2*r+1]+1]+1,n>l&&(n=l,w++),o[2*r+1]=n,r>t.max_code||(e.bl_count[n]++,f=0,r>=c&&(f=u[r-c]),d=o[2*r],e.opt_len+=d*(n+f),i&&(e.static_len+=d*(i[2*r+1]+f)));if(0!==w){do{for(n=l-1;0===e.bl_count[n];)n--;e.bl_count[n]--,e.bl_count[n+1]+=2,e.bl_count[l]--,w-=2}while(w>0);for(n=l;0!==n;n--)for(r=e.bl_count[n];0!==r;)i=e.heap[--a],i>t.max_code||(o[2*i+1]!=n&&(e.opt_len+=(n-o[2*i+1])*o[2*i],o[2*i+1]=n),r--)}for(o=t.max_code,a=e.bl_count,e=[],r=0,n=1;MAX_BITS>=n;n++)e[n]=r=r+a[n-1]<<1;for(a=0;o>=a;a++)if(u=s[2*a+1],0!==u){r=s,n=2*a,i=e[u]++,c=0;do c|=1&i,i>>>=1,c<<=1;while(0<--u);r[n]=c>>>1}}}function StaticTree(t,e,s,r,n){this.static_tree=t,this.extra_bits=e,this.extra_base=s,this.elems=r,this.max_length=n}function Config(t,e,s,r,n){this.good_length=t,this.max_lazy=e,this.nice_length=s,this.max_chain=r,this.func=n}function smaller(t,e,s,r){var n=t[2*e];return t=t[2*s],t>n||n==t&&r[e]<=r[s]}function Deflate(){function t(){var t;for(t=0;L_CODES>t;t++)G[2*t]=0;for(t=0;D_CODES>t;t++)Y[2*t]=0;for(t=0;BL_CODES>t;t++)J[2*t]=0;G[2*END_BLOCK]=1,rt=ot=y.opt_len=y.static_len=0}function e(t,e){var s,r=-1,n,o=t[1],i=0,a=7,u=4;for(0===o&&(a=138,u=3),t[2*(e+1)+1]=65535,s=0;e>=s;s++)n=o,o=t[2*(s+1)+1],++i<a&&n==o||(u>i?J[2*n]+=i:0!==n?(n!=r&&J[2*n]++,J[2*REP_3_6]++):10>=i?J[2*REPZ_3_10]++:J[2*REPZ_11_138]++,i=0,r=n,0===o?(a=138,u=3):n==o?(a=6,u=3):(a=7,u=4))}function s(t){y.pending_buf[y.pending++]=t}function r(t){s(255&t),s(t>>>8&255)}function n(t,e){ut>Buf_size-e?(at|=t<<ut&65535,r(at),at=t>>>Buf_size-ut,ut+=e-Buf_size):(at|=t<<ut&65535,ut+=e)}function o(t,e){var s=2*t;n(65535&e[s],65535&e[s+1])}function i(t,e){var s,r=-1,i,a=t[1],u=0,c=7,l=4;for(0===a&&(c=138,l=3),s=0;e>=s;s++)if(i=a,a=t[2*(s+1)+1],!(++u<c&&i==a)){if(l>u){do o(i,J);while(0!==--u)}else 0!==i?(i!=r&&(o(i,J),u--),o(REP_3_6,J),n(u-3,2)):10>=u?(o(REPZ_3_10,J),n(u-3,3)):(o(REPZ_11_138,J),n(u-11,7));u=0,r=i,0===a?(c=138,l=3):i==a?(c=6,l=3):(c=7,l=4)}}function a(){16==ut?(r(at),ut=at=0):ut>=8&&(s(255&at),at>>>=8,ut-=8)}function u(t,e){var s,r,n;if(y.pending_buf[nt+2*rt]=t>>>8&255,y.pending_buf[nt+2*rt+1]=255&t,y.pending_buf[et+rt]=255&e,rt++,0===t?G[2*e]++:(ot++,t--,G[2*(Tree._length_code[e]+LITERALS+1)]++,Y[2*Tree.d_code(t)]++),0===(8191&rt)&&Z>2){for(s=8*rt,r=L-z,n=0;D_CODES>n;n++)s+=Y[2*n]*(5+Tree.extra_dbits[n]);if(ot<Math.floor(rt/2)&&s>>>3<Math.floor(r/2))return!0}return rt==st-1}function c(t,e){var s,r,i=0,a,u;if(0!==rt)do s=y.pending_buf[nt+2*i]<<8&65280|255&y.pending_buf[nt+2*i+1],r=255&y.pending_buf[et+i],i++,0===s?o(r,t):(a=Tree._length_code[r],o(a+LITERALS+1,t),u=Tree.extra_lbits[a],0!==u&&(r-=Tree.base_length[a],n(r,u)),s--,a=Tree.d_code(s),o(a,e),u=Tree.extra_dbits[a],0!==u&&(s-=Tree.base_dist[a],n(s,u)));while(rt>i);o(END_BLOCK,t),it=t[2*END_BLOCK+1]}function l(){ut>8?r(at):ut>0&&s(255&at),ut=at=0}function f(t,e,s){n((STORED_BLOCK<<1)+(s?1:0),3),l(),it=8,r(e),r(~e),y.pending_buf.set(S.subarray(t,t+e),y.pending),y.pending+=e}function d(s){var r=z>=0?z:-1,o=L-z,a,u,d=0;if(Z>0){for(V.build_tree(y),Q.build_tree(y),e(G,V.max_code),e(Y,Q.max_code),tt.build_tree(y),d=BL_CODES-1;d>=3&&0===J[2*Tree.bl_order[d]+1];d--);y.opt_len+=3*(d+1)+14,a=y.opt_len+3+7>>>3,u=y.static_len+3+7>>>3,a>=u&&(a=u)}else a=u=o+5;if(a>=o+4&&-1!=r)f(r,o,s);else if(u==a)n((STATIC_TREES<<1)+(s?1:0),3),c(StaticTree.static_ltree,StaticTree.static_dtree);else{for(n((DYN_TREES<<1)+(s?1:0),3),r=V.max_code+1,o=Q.max_code+1,d+=1,n(r-257,5),n(o-1,5),n(d-4,4),a=0;d>a;a++)n(J[2*Tree.bl_order[a]+1],3);i(G,r-1),i(Y,o-1),c(G,Y)}t(),s&&l(),z=L,v.flush_pending()}function w(){var t,e,s,r;do{if(r=T-B-L,0===r&&0===L&&0===B)r=x;else if(-1==r)r--;else if(L>=x+x-MIN_LOOKAHEAD){S.set(S.subarray(x,x+x),0),H-=x,L-=x,z-=x,s=t=F;do e=65535&E[--s],E[s]=e>=x?e-x:0;while(0!==--t);s=t=x;do e=65535&A[--s],A[s]=e>=x?e-x:0;while(0!==--t);r+=x}if(0===v.avail_in)break;t=v.read_buf(S,L+B,r),B+=t,B>=MIN_MATCH&&(R=255&S[L],R=(R<<O^255&S[L+1])&C)}while(MIN_LOOKAHEAD>B&&0!==v.avail_in)}function m(t){var e=65535,s;for(e>g-5&&(e=g-5);;){if(1>=B){if(w(),0===B&&t==Z_NO_FLUSH)return NeedMore;if(0===B)break}if(L+=B,B=0,s=z+e,(0===L||L>=s)&&(B=L-s,L=s,d(!1),0===v.avail_out))return NeedMore;if(L-z>=x-MIN_LOOKAHEAD&&(d(!1),0===v.avail_out))return NeedMore}return d(t==Z_FINISH),0===v.avail_out?t==Z_FINISH?FinishStarted:NeedMore:t==Z_FINISH?FinishDone:BlockDone}function h(t){var e=P,s=L,r,n=U,o=L>x-MIN_LOOKAHEAD?L-(x-MIN_LOOKAHEAD):0,i=X,a=k,u=L+MAX_MATCH,c=S[s+n-1],l=S[s+n];U>=W&&(e>>=2),i>B&&(i=B);do if(r=t,S[r+n]==l&&S[r+n-1]==c&&S[r]==S[s]&&S[++r]==S[s+1]){s+=2,r++;do;while(S[++s]==S[++r]&&S[++s]==S[++r]&&S[++s]==S[++r]&&S[++s]==S[++r]&&S[++s]==S[++r]&&S[++s]==S[++r]&&S[++s]==S[++r]&&S[++s]==S[++r]&&u>s);if(r=MAX_MATCH-(u-s),s=u-MAX_MATCH,r>n){if(H=t,n=r,r>=i)break;c=S[s+n-1],l=S[s+n]}}while((t=65535&A[t&a])>o&&0!==--e);return B>=n?n:B}function p(t){for(var e=0,s,r;;){if(MIN_LOOKAHEAD>B){if(w(),MIN_LOOKAHEAD>B&&t==Z_NO_FLUSH)return NeedMore;if(0===B)break}if(B>=MIN_MATCH&&(R=(R<<O^255&S[L+(MIN_MATCH-1)])&C,e=65535&E[R],A[L&k]=E[R],E[R]=L),U=N,M=H,N=MIN_MATCH-1,0!==e&&j>U&&x-MIN_LOOKAHEAD>=(L-e&65535)&&(K!=Z_HUFFMAN_ONLY&&(N=h(e)),5>=N&&(K==Z_FILTERED||N==MIN_MATCH&&L-H>4096)&&(N=MIN_MATCH-1)),U>=MIN_MATCH&&U>=N){r=L+B-MIN_MATCH,s=u(L-1-M,U-MIN_MATCH),B-=U-1,U-=2;do++L<=r&&(R=(R<<O^255&S[L+(MIN_MATCH-1)])&C,e=65535&E[R],A[L&k]=E[R],E[R]=L);while(0!==--U);if(D=0,N=MIN_MATCH-1,L++,s&&(d(!1),0===v.avail_out))return NeedMore}else if(0!==D){if((s=u(0,255&S[L-1]))&&d(!1),L++,B--,0===v.avail_out)return NeedMore}else D=1,L++,B--}return 0!==D&&(u(0,255&S[L-1]),D=0),d(t==Z_FINISH),0===v.avail_out?t==Z_FINISH?FinishStarted:NeedMore:t==Z_FINISH?FinishDone:BlockDone}var y=this,v,_,g,q,x,b,k,S,T,A,E,R,F,I,C,O,z,N,M,D,L,H,B,U,P,j,Z,K,W,X,G,Y,J,V=new Tree,Q=new Tree,tt=new Tree;y.depth=[];var et,st,rt,nt,ot,it,at,ut;y.bl_count=[],y.heap=[],G=[],Y=[],J=[],y.pqdownheap=function(t,e){for(var s=y.heap,r=s[e],n=e<<1;n<=y.heap_len&&(n<y.heap_len&&smaller(t,s[n+1],s[n],y.depth)&&n++,!smaller(t,r,s[n],y.depth));)s[e]=s[n],e=n,n<<=1;s[e]=r},y.deflateInit=function(e,s,r,n,o,i){if(n||(n=Z_DEFLATED),o||(o=DEF_MEM_LEVEL),i||(i=Z_DEFAULT_STRATEGY),e.msg=null,s==Z_DEFAULT_COMPRESSION&&(s=6),1>o||o>MAX_MEM_LEVEL||n!=Z_DEFLATED||9>r||r>15||0>s||s>9||0>i||i>Z_HUFFMAN_ONLY)return Z_STREAM_ERROR;for(e.dstate=y,b=r,x=1<<b,k=x-1,I=o+7,F=1<<I,C=F-1,O=Math.floor((I+MIN_MATCH-1)/MIN_MATCH),S=new Uint8Array(2*x),A=[],E=[],st=1<<o+6,y.pending_buf=new Uint8Array(4*st),g=4*st,nt=Math.floor(st/2),et=3*st,Z=s,K=i,e.total_in=e.total_out=0,e.msg=null,y.pending=0,y.pending_out=0,_=BUSY_STATE,q=Z_NO_FLUSH,V.dyn_tree=G,V.stat_desc=StaticTree.static_l_desc,Q.dyn_tree=Y,Q.stat_desc=StaticTree.static_d_desc,tt.dyn_tree=J,tt.stat_desc=StaticTree.static_bl_desc,ut=at=0,it=8,t(),T=2*x,e=E[F-1]=0;F-1>e;e++)E[e]=0;return j=config_table[Z].max_lazy,W=config_table[Z].good_length,X=config_table[Z].nice_length,P=config_table[Z].max_chain,B=z=L=0,N=U=MIN_MATCH-1,R=D=0,Z_OK},y.deflateEnd=function(){return _!=INIT_STATE&&_!=BUSY_STATE&&_!=FINISH_STATE?Z_STREAM_ERROR:(S=A=E=y.pending_buf=null,y.dstate=null,_==BUSY_STATE?Z_DATA_ERROR:Z_OK)},y.deflateParams=function(t,e,s){var r=Z_OK;return e==Z_DEFAULT_COMPRESSION&&(e=6),0>e||e>9||0>s||s>Z_HUFFMAN_ONLY?Z_STREAM_ERROR:(config_table[Z].func!=config_table[e].func&&0!==t.total_in&&(r=t.deflate(Z_PARTIAL_FLUSH)),Z!=e&&(Z=e,j=config_table[Z].max_lazy,W=config_table[Z].good_length,X=config_table[Z].nice_length,P=config_table[Z].max_chain),K=s,r)},y.deflateSetDictionary=function(t,e,s){t=s;var r=0;if(!e||_!=INIT_STATE)return Z_STREAM_ERROR;if(MIN_MATCH>t)return Z_OK;for(t>x-MIN_LOOKAHEAD&&(t=x-MIN_LOOKAHEAD,r=s-t),S.set(e.subarray(r,r+t),0),z=L=t,R=255&S[0],R=(R<<O^255&S[1])&C,e=0;t-MIN_MATCH>=e;e++)R=(R<<O^255&S[e+(MIN_MATCH-1)])&C,A[e&k]=E[R],E[R]=e;return Z_OK},y.deflate=function(t,e){var r,i,c;if(e>Z_FINISH||0>e)return Z_STREAM_ERROR;if(!t.next_out||!t.next_in&&0!==t.avail_in||_==FINISH_STATE&&e!=Z_FINISH)return t.msg=z_errmsg[Z_NEED_DICT-Z_STREAM_ERROR],Z_STREAM_ERROR;if(0===t.avail_out)return t.msg=z_errmsg[Z_NEED_DICT-Z_BUF_ERROR],Z_BUF_ERROR;if(v=t,r=q,q=e,_==INIT_STATE&&(i=Z_DEFLATED+(b-8<<4)<<8,c=(Z-1&255)>>1,c>3&&(c=3),i|=c<<6,0!==L&&(i|=PRESET_DICT),_=BUSY_STATE,i+=31-i%31,s(i>>8&255),s(255&i)),0!==y.pending){if(v.flush_pending(),0===v.avail_out)return q=-1,Z_OK}else if(0===v.avail_in&&r>=e&&e!=Z_FINISH)return v.msg=z_errmsg[Z_NEED_DICT-Z_BUF_ERROR],Z_BUF_ERROR;if(_==FINISH_STATE&&0!==v.avail_in)return t.msg=z_errmsg[Z_NEED_DICT-Z_BUF_ERROR],Z_BUF_ERROR;if(0!==v.avail_in||0!==B||e!=Z_NO_FLUSH&&_!=FINISH_STATE){switch(r=-1,config_table[Z].func){case STORED:r=m(e);break;case FAST:t:{for(r=0;;){if(MIN_LOOKAHEAD>B){if(w(),MIN_LOOKAHEAD>B&&e==Z_NO_FLUSH){r=NeedMore;break t}if(0===B)break}if(B>=MIN_MATCH&&(R=(R<<O^255&S[L+(MIN_MATCH-1)])&C,r=65535&E[R],A[L&k]=E[R],E[R]=L),0!==r&&x-MIN_LOOKAHEAD>=(L-r&65535)&&K!=Z_HUFFMAN_ONLY&&(N=h(r)),N>=MIN_MATCH)if(i=u(L-H,N-MIN_MATCH),B-=N,j>=N&&B>=MIN_MATCH){N--;do L++,R=(R<<O^255&S[L+(MIN_MATCH-1)])&C,r=65535&E[R],A[L&k]=E[R],E[R]=L;while(0!==--N);L++}else L+=N,N=0,R=255&S[L],R=(R<<O^255&S[L+1])&C;else i=u(0,255&S[L]),B--,L++;if(i&&(d(!1),0===v.avail_out)){r=NeedMore;break t}}d(e==Z_FINISH),r=0===v.avail_out?e==Z_FINISH?FinishStarted:NeedMore:e==Z_FINISH?FinishDone:BlockDone}break;case SLOW:r=p(e)}if((r==FinishStarted||r==FinishDone)&&(_=FINISH_STATE),r==NeedMore||r==FinishStarted)return 0===v.avail_out&&(q=-1),Z_OK;if(r==BlockDone){if(e==Z_PARTIAL_FLUSH)n(STATIC_TREES<<1,3),o(END_BLOCK,StaticTree.static_ltree),a(),9>1+it+10-ut&&(n(STATIC_TREES<<1,3),o(END_BLOCK,StaticTree.static_ltree),a()),it=7;else if(f(0,0,!1),e==Z_FULL_FLUSH)for(r=0;F>r;r++)E[r]=0;if(v.flush_pending(),0===v.avail_out)return q=-1,Z_OK}}return e!=Z_FINISH?Z_OK:Z_STREAM_END}}function ZStream(){this.total_out=this.avail_out=this.total_in=this.avail_in=this.next_out_index=this.next_in_index=0}function Deflater(t){var e=new ZStream,s=Z_NO_FLUSH,r=new Uint8Array(512);"undefined"==typeof t&&(t=Z_DEFAULT_COMPRESSION),e.deflateInit(t),e.next_out=r,this.append=function(t,n){var o,i=[],a=0,u=0,c=0,l;if(t.length){e.next_in_index=0,e.next_in=t,e.avail_in=t.length;do{if(e.next_out_index=0,e.avail_out=512,o=e.deflate(s),o!=Z_OK)throw"deflating: "+e.msg;e.next_out_index&&(512==e.next_out_index?i.push(new Uint8Array(r)):i.push(new Uint8Array(r.subarray(0,e.next_out_index)))),c+=e.next_out_index,n&&0<e.next_in_index&&e.next_in_index!=a&&(n(e.next_in_index),a=e.next_in_index)}while(0<e.avail_in||0===e.avail_out);return l=new Uint8Array(c),i.forEach(function(t){l.set(t,u),u+=t.length}),l}},this.flush=function(){var t,s=[],n=0,o=0,i;do{if(e.next_out_index=0,e.avail_out=512,t=e.deflate(Z_FINISH),t!=Z_STREAM_END&&t!=Z_OK)throw"deflating: "+e.msg;0<512-e.avail_out&&s.push(new Uint8Array(r.subarray(0,e.next_out_index))),o+=e.next_out_index}while(0<e.avail_in||0===e.avail_out);return e.deflateEnd(),i=new Uint8Array(o),s.forEach(function(t){i.set(t,n),n+=t.length}),i}}var jsPDF=function(){function t(r,n,o,i){r="undefined"==typeof r?"p":r.toString().toLowerCase(),"undefined"==typeof n&&(n="mm"),"undefined"==typeof o&&(o="a4"),"undefined"==typeof i&&"undefined"==typeof zpipe&&(i=!1);var a=o.toString().toLowerCase(),u=[],c=0,l=i;i={a0:[2383.94,3370.39],a1:[1683.78,2383.94],a2:[1190.55,1683.78],a3:[841.89,1190.55],a4:[595.28,841.89],a5:[419.53,595.28],a6:[297.64,419.53],a7:[209.76,297.64],a8:[147.4,209.76],a9:[104.88,147.4],a10:[73.7,104.88],b0:[2834.65,4008.19],b1:[2004.09,2834.65],b2:[1417.32,2004.09],b3:[1000.63,1417.32],b4:[708.66,1000.63],b5:[498.9,708.66],b6:[354.33,498.9],b7:[249.45,354.33],b8:[175.75,249.45],b9:[124.72,175.75],b10:[87.87,124.72],c0:[2599.37,3676.54],c1:[1836.85,2599.37],c2:[1298.27,1836.85],c3:[918.43,1298.27],c4:[649.13,918.43],c5:[459.21,649.13],c6:[323.15,459.21],c7:[229.61,323.15],c8:[161.57,229.61],c9:[113.39,161.57],c10:[79.37,113.39],letter:[612,792],"government-letter":[576,756],legal:[612,1008],"junior-legal":[576,360],ledger:[1224,792],tabloid:[792,1224]};var f="0 g",d=0,w=[],m=2,h=!1,p=[],y={},v={},_=16,g,q,x,b,k={title:"",subject:"",author:"",keywords:"",creator:""},S=0,T=0,A={},E=new s(A),R,F=function(t){return t.toFixed(2)},I=function(t){var e=t.toFixed(0);return 10>t?"0"+e:e},C=function(t){h?w[d].push(t):(u.push(t),c+=t.length+1)},O=function(){return m++,p[m]=c,C(m+" 0 obj"),m},z=function(t){C("stream"),C(t),C("endstream")},N,M,D,L=function(t,e){var s;s=t;var r=e,n,o,i,a,u,c;if(void 0===r&&(r={}),n=r.sourceEncoding?n:"Unicode",i=r.outputEncoding,(r.autoencode||i)&&y[g].metadata&&y[g].metadata[n]&&y[g].metadata[n].encoding&&(n=y[g].metadata[n].encoding,!i&&y[g].encoding&&(i=y[g].encoding),!i&&n.codePages&&(i=n.codePages[0]),"string"==typeof i&&(i=n[i]),i)){for(u=!1,a=[],n=0,o=s.length;o>n;n++)(c=i[s.charCodeAt(n)])?a.push(String.fromCharCode(c)):a.push(s[n]),a[n].charCodeAt(0)>>8&&(u=!0);s=a.join("")}for(n=s.length;void 0===u&&0!==n;)s.charCodeAt(n-1)>>8&&(u=!0),n--;if(u){for(a=r.noBOM?[]:[254,255],n=0,o=s.length;o>n;n++){if(c=s.charCodeAt(n),r=c>>8,r>>8)throw Error("Character at position "+n.toString(10)+" of string '"+s+"' exceeds 16bits. Cannot be encoded into UCS-2 BE");a.push(r),a.push(c-(r<<8))}s=String.fromCharCode.apply(void 0,a)}return s.replace(/\\/g,"\\\\").replace(/\(/g,"\\(").replace(/\)/g,"\\)")},H=function(){d++,h=!0,w[d]=[],C(F(.200025*b)+" w"),C("0 G"),0!==S&&C(S.toString(10)+" J"),0!==T&&C(T.toString(10)+" j"),E.publish("addPage",{pageNumber:d})},B=function(t,e){var s;void 0===t&&(t=y[g].fontName),void 0===e&&(e=y[g].fontStyle);try{s=v[t][e]}catch(r){s=void 0}if(!s)throw Error("Unable to look up font label for font '"+t+"', '"+e+"'. Refer to getFontList() for available fonts.");return s},U=function(){h=!1,u=[],p=[],C("%PDF-1.3"),N=x*b,M=q*b;var t,e,s,r,n;for(t=1;d>=t;t++){if(O(),C("<</Type /Page"),C("/Parent 1 0 R"),C("/Resources 2 0 R"),C("/Contents "+(m+1)+" 0 R>>"),C("endobj"),e=w[t].join("\n"),O(),l){for(s=[],r=0;r<e.length;++r)s[r]=e.charCodeAt(r);n=adler32cs.from(e),e=new Deflater(6),e.append(new Uint8Array(s)),e=e.flush(),s=[new Uint8Array([120,156]),new Uint8Array(e),new Uint8Array([255&n,n>>8&255,n>>16&255,n>>24&255])],e="";for(r in s)s.hasOwnProperty(r)&&(e+=String.fromCharCode.apply(null,s[r]));C("<</Length "+e.length+" /Filter [/FlateDecode]>>")}else C("<</Length "+e.length+">>");z(e),C("endobj")}for(p[1]=c,C("1 0 obj"),C("<</Type /Pages"),D="/Kids [",r=0;d>r;r++)D+=3+2*r+" 0 R ";C(D+"]"),C("/Count "+d),C("/MediaBox [0 0 "+F(N)+" "+F(M)+"]"),C(">>"),C("endobj");for(var o in y)y.hasOwnProperty(o)&&(t=y[o],t.objectNumber=O(),C("<</BaseFont/"+t.PostScriptName+"/Type/Font"),"string"==typeof t.encoding&&C("/Encoding/"+t.encoding),C("/Subtype/Type1>>"),C("endobj"));E.publish("putResources"),p[2]=c,C("2 0 obj"),C("<<"),C("/ProcSet [/PDF /Text /ImageB /ImageC /ImageI]"),C("/Font <<");for(var i in y)y.hasOwnProperty(i)&&C("/"+i+" "+y[i].objectNumber+" 0 R");for(C(">>"),C("/XObject <<"),E.publish("putXobjectDict"),C(">>"),C(">>"),C("endobj"),E.publish("postPutResources"),O(),C("<<"),C("/Producer (jsPDF 0.9.0rc2)"),k.title&&C("/Title ("+L(k.title)+")"),k.subject&&C("/Subject ("+L(k.subject)+")"),k.author&&C("/Author ("+L(k.author)+")"),k.keywords&&C("/Keywords ("+L(k.keywords)+")"),k.creator&&C("/Creator ("+L(k.creator)+")"),o=new Date,C("/CreationDate (D:"+[o.getFullYear(),I(o.getMonth()+1),I(o.getDate()),I(o.getHours()),I(o.getMinutes()),I(o.getSeconds())].join("")+")"),C(">>"),C("endobj"),O(),C("<<"),C("/Type /Catalog"),C("/Pages 1 0 R"),C("/OpenAction [3 0 R /FitH null]"),C("/PageLayout /OneColumn"),E.publish("putCatalog"),C(">>"),C("endobj"),o=c,C("xref"),C("0 "+(m+1)),C("0000000000 65535 f "),i=1;m>=i;i++)t=p[i].toFixed(0),t=10>t.length?Array(11-t.length).join("0")+t:t,C(t+" 00000 n ");return C("trailer"),C("<<"),C("/Size "+(m+1)),C("/Root "+m+" 0 R"),C("/Info "+(m-1)+" 0 R"),C(">>"),C("startxref"),C(o),C("%%EOF"),h=!0,u.join("\n")},P=function(t){var e="S";return"F"===t?e="f":("FD"===t||"DF"===t)&&(e="B"),e},j=function(t,e){var s,r,n,o;switch(t){case void 0:return U();case"save":if(navigator.getUserMedia&&(void 0===window.URL||void 0===window.URL.createObjectURL))return A.output("dataurlnewwindow");for(s=U(),r=s.length,n=new Uint8Array(new ArrayBuffer(r)),o=0;r>o;o++)n[o]=s.charCodeAt(o);s=new Blob([n],{type:"application/pdf"}),saveAs(s,e);break;case"datauristring":case"dataurlstring":return"data:application/pdf;base64,"+btoa(U());case"datauri":case"dataurl":document.location.href="data:application/pdf;base64,"+btoa(U());break;case"dataurlnewwindow":window.open("data:application/pdf;base64,"+btoa(U()));break;default:throw Error('Output type "'+t+'" is not supported.')}};if("pt"===n)b=1;else if("mm"===n)b=72/25.4;else if("cm"===n)b=72/2.54;else{if("in"!==n)throw"Invalid unit: "+n;b=72}if(i.hasOwnProperty(a))q=i[a][1]/b,x=i[a][0]/b;else try{q=o[1],x=o[0]}catch(Z){throw"Invalid format: "+o}if("p"===r||"portrait"===r)r="p",x>q&&(r=x,x=q,q=r);else{if("l"!==r&&"landscape"!==r)throw"Invalid orientation: "+r;r="l",q>x&&(r=x,x=q,q=r)}A.internal={pdfEscape:L,getStyle:P,getFont:function(){return y[B.apply(A,arguments)]},getFontSize:function(){return _},getLineHeight:function(){return 1.15*_},btoa:btoa,write:function(t,e,s,r){C(1===arguments.length?t:Array.prototype.join.call(arguments," "))},getCoordinateString:function(t){return F(t*b)},getVerticalCoordinateString:function(t){return F((q-t)*b)},collections:{},newObject:O,putStream:z,events:E,scaleFactor:b,pageSize:{width:x,height:q},output:function(t,e){return j(t,e)},getNumberOfPages:function(){return w.length-1},pages:w},A.addPage=function(){return H(),this},A.text=function(t,e,s,r){var n,o;if("number"==typeof t&&(n=t,o=e,t=s,e=n,s=o),"string"==typeof t&&t.match(/[\n\r]/)&&(t=t.split(/\r\n|\r|\n/g)),"undefined"==typeof r?r={noBOM:!0,autoencode:!0}:(void 0===r.noBOM&&(r.noBOM=!0),void 0===r.autoencode&&(r.autoencode=!0)),"string"==typeof t)r=L(t,r);else{if(!(t instanceof Array))throw Error('Type of text must be string or Array. "'+t+'" is not recognized.');for(t=t.concat(),n=t.length-1;-1!==n;n--)t[n]=L(t[n],r);r=t.join(") Tj\nT* (")}return C("BT\n/"+g+" "+_+" Tf\n"+1.15*_+" TL\n"+f+"\n"+F(e*b)+" "+F((q-s)*b)+" Td\n("+r+") Tj\nET"),this},A.line=function(t,e,s,r){return C(F(t*b)+" "+F((q-e)*b)+" m "+F(s*b)+" "+F((q-r)*b)+" l S"),this},A.lines=function(t,e,s,r,n,o){var i,a,u,c,l,f,d,w;for("number"==typeof t&&(i=t,a=e,t=s,e=i,s=a),n=P(n),r=void 0===r?[1,1]:r,C((e*b).toFixed(3)+" "+((q-s)*b).toFixed(3)+" m "),i=r[0],r=r[1],a=t.length,w=s,s=0;a>s;s++)u=t[s],2===u.length?(e=u[0]*i+e,w=u[1]*r+w,C((e*b).toFixed(3)+" "+((q-w)*b).toFixed(3)+" l")):(c=u[0]*i+e,l=u[1]*r+w,f=u[2]*i+e,d=u[3]*r+w,e=u[4]*i+e,w=u[5]*r+w,C((c*b).toFixed(3)+" "+((q-l)*b).toFixed(3)+" "+(f*b).toFixed(3)+" "+((q-d)*b).toFixed(3)+" "+(e*b).toFixed(3)+" "+((q-w)*b).toFixed(3)+" c"));return 1==o&&C(" h"),C(n),this},A.rect=function(t,e,s,r,n){return n=P(n),C([F(t*b),F((q-e)*b),F(s*b),F(-r*b),"re",n].join(" ")),this},A.triangle=function(t,e,s,r,n,o,i){return this.lines([[s-t,r-e],[n-s,o-r],[t-n,e-o]],t,e,[1,1],i,!0),this},A.roundedRect=function(t,e,s,r,n,o,i){var a=4/3*(Math.SQRT2-1);return this.lines([[s-2*n,0],[n*a,0,n,o-o*a,n,o],[0,r-2*o],[0,o*a,-(n*a),o,-n,o],[-s+2*n,0],[-(n*a),0,-n,-(o*a),-n,-o],[0,-r+2*o],[0,-(o*a),n*a,-o,n,-o]],t+n,e,[1,1],i),this},A.ellipse=function(t,e,s,r,n){n=P(n);var o=4/3*(Math.SQRT2-1)*s,i=4/3*(Math.SQRT2-1)*r;return C([F((t+s)*b),F((q-e)*b),"m",F((t+s)*b),F((q-(e-i))*b),F((t+o)*b),F((q-(e-r))*b),F(t*b),F((q-(e-r))*b),"c"].join(" ")),C([F((t-o)*b),F((q-(e-r))*b),F((t-s)*b),F((q-(e-i))*b),F((t-s)*b),F((q-e)*b),"c"].join(" ")),C([F((t-s)*b),F((q-(e+i))*b),F((t-o)*b),F((q-(e+r))*b),F(t*b),F((q-(e+r))*b),"c"].join(" ")),C([F((t+o)*b),F((q-(e+r))*b),F((t+s)*b),F((q-(e+i))*b),F((t+s)*b),F((q-e)*b),"c",n].join(" ")),this},A.circle=function(t,e,s,r){return this.ellipse(t,e,s,s,r)},A.setProperties=function(t){for(var e in k)k.hasOwnProperty(e)&&t[e]&&(k[e]=t[e]);return this},A.setFontSize=function(t){return _=t,this},A.setFont=function(t,e){return g=B(t,e),this},A.setFontStyle=A.setFontType=function(t){return g=B(void 0,t),this},A.getFontList=function(){var t={},e,s,r;for(e in v)if(v.hasOwnProperty(e))for(s in t[e]=r=[],v[e])v[e].hasOwnProperty(s)&&r.push(s);return t},A.setLineWidth=function(t){return C((t*b).toFixed(2)+" w"),this},A.setDrawColor=function(t,e,s,r){return t=void 0===e||void 0===r&&t===e===s?"string"==typeof t?t+" G":F(t/255)+" G":void 0===r?"string"==typeof t?[t,e,s,"RG"].join(" "):[F(t/255),F(e/255),F(s/255),"RG"].join(" "):"string"==typeof t?[t,e,s,r,"K"].join(" "):[F(t),F(e),F(s),F(r),"K"].join(" "),C(t),this},A.setFillColor=function(t,e,s,r){return t=void 0===e||void 0===r&&t===e===s?"string"==typeof t?t+" g":F(t/255)+" g":void 0===r?"string"==typeof t?[t,e,s,"rg"].join(" "):[F(t/255),F(e/255),F(s/255),"rg"].join(" "):"string"==typeof t?[t,e,s,r,"k"].join(" "):[F(t),F(e),F(s),F(r),"k"].join(" "),C(t),this},A.setTextColor=function(t,e,s){return f=0===t&&0===e&&0===s||"undefined"==typeof e?(t/255).toFixed(3)+" g":[(t/255).toFixed(3),(e/255).toFixed(3),(s/255).toFixed(3),"rg"].join(" "),this},A.CapJoinStyles={0:0,butt:0,but:0,miter:0,1:1,round:1,rounded:1,circle:1,2:2,projecting:2,project:2,square:2,bevel:2},A.setLineCap=function(t){var e=this.CapJoinStyles[t];if(void 0===e)throw Error("Line cap style of '"+t+"' is not recognized. See or extend .CapJoinStyles property for valid styles");return S=e,C(e.toString(10)+" J"),this},A.setLineJoin=function(t){var e=this.CapJoinStyles[t];if(void 0===e)throw Error("Line join style of '"+t+"' is not recognized. See or extend .CapJoinStyles property for valid styles");return T=e,C(e.toString(10)+" j"),this},A.output=j,A.save=function(t){A.output("save",t)};for(R in t.API)t.API.hasOwnProperty(R)&&("events"===R&&t.API.events.length?function(t,e){var s,r,n;for(n=e.length-1;-1!==n;n--)s=e[n][0],r=e[n][1],t.subscribe.apply(t,[s].concat("function"==typeof r?[r]:r))}(E,t.API.events):A[R]=t.API[R]);return function(){var t=[["Helvetica","helvetica","normal"],["Helvetica-Bold","helvetica","bold"],["Helvetica-Oblique","helvetica","italic"],["Helvetica-BoldOblique","helvetica","bolditalic"],["Courier","courier","normal"],["Courier-Bold","courier","bold"],["Courier-Oblique","courier","italic"],["Courier-BoldOblique","courier","bolditalic"],["Times-Roman","times","normal"],["Times-Bold","times","bold"],["Times-Italic","times","italic"],["Times-BoldItalic","times","bolditalic"]],s,r,n,o;for(s=0,r=t.length;r>s;s++){var i=t[s][0],a=t[s][1];n=t[s][2],o="F"+(e(y)+1).toString(10);var i=y[o]={id:o,PostScriptName:i,fontName:a,fontStyle:n,encoding:"StandardEncoding",metadata:{}},u=o;void 0===v[a]&&(v[a]={}),v[a][n]=u,E.publish("addFont",i),n=o,o=t[s][0].split("-"),i=o[0],o=o[1]||"",void 0===v[i]&&(v[i]={}),v[i][o]=n}E.publish("addFonts",{fonts:y,dictionary:v})}(),g="F1",H(),E.publish("initialized"),A}"undefined"==typeof btoa&&(window.btoa=function(t){var e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".split(""),s,r,n,o,i=0,a=0,u="",u=[];do s=t.charCodeAt(i++),r=t.charCodeAt(i++),n=t.charCodeAt(i++),o=s<<16|r<<8|n,s=o>>18&63,r=o>>12&63,n=o>>6&63,o&=63,u[a++]=e[s]+e[r]+e[n]+e[o];while(i<t.length);return u=u.join(""),t=t.length%3,(t?u.slice(0,t-3):u)+"===".slice(t||3)}),"undefined"==typeof atob&&(window.atob=function(t){var e,s,r,n,o,i=0,a=0;n="";var u=[];if(!t)return t;t+="";do e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".indexOf(t.charAt(i++)),s="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".indexOf(t.charAt(i++)),n="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".indexOf(t.charAt(i++)),o="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".indexOf(t.charAt(i++)),r=e<<18|s<<12|n<<6|o,e=r>>16&255,s=r>>8&255,r&=255,64===n?u[a++]=String.fromCharCode(e):64===o?u[a++]=String.fromCharCode(e,s):u[a++]=String.fromCharCode(e,s,r);while(i<t.length);return n=u.join("")});var e="function"==typeof Object.keys?function(t){return Object.keys(t).length}:function(t){var e=0,s;for(s in t)t.hasOwnProperty(s)&&e++;return e},s=function(t){this.topics={},this.context=t,this.publish=function(t,e){if(this.topics[t]){var s=this.topics[t],r=[],n,o,i,a,u=function(){};for(e=Array.prototype.slice.call(arguments,1),o=0,i=s.length;i>o;o++)a=s[o],n=a[0],a[1]&&(a[0]=u,r.push(o)),n.apply(this.context,e);for(o=0,i=r.length;i>o;o++)s.splice(r[o],1)}},this.subscribe=function(t,e,s){return this.topics[t]?this.topics[t].push([e,s]):this.topics[t]=[[e,s]],{topic:t,callback:e}},this.unsubscribe=function(t){if(this.topics[t.topic]){var e=this.topics[t.topic],s,r;for(s=0,r=e.length;r>s;s++)e[s][0]===t.callback&&e.splice(s,1)}}};return t.API={events:[]},t}();!function(t){var e=function(){var t=this.internal.collections.addImage_images,e;for(e in t){var s=t[e],r=this.internal.newObject(),n=this.internal.write,o=this.internal.putStream;if(s.n=r,n("<</Type /XObject"),n("/Subtype /Image"),n("/Width "+s.w),n("/Height "+s.h),"Indexed"===s.cs?n("/ColorSpace [/Indexed /DeviceRGB "+(s.pal.length/3-1)+" "+(r+1)+" 0 R]"):(n("/ColorSpace /"+s.cs),"DeviceCMYK"===s.cs&&n("/Decode [1 0 1 0 1 0 1 0]")),n("/BitsPerComponent "+s.bpc),"f"in s&&n("/Filter /"+s.f),"dp"in s&&n("/DecodeParms <<"+s.dp+">>"),"trns"in s&&s.trns.constructor==Array)for(var i="",a=0;a<s.trns.length;a++)i+=s[i][a]+" "+s.trns[a]+" ",n("/Mask ["+i+"]");"smask"in s&&n("/SMask "+(r+1)+" 0 R"),n("/Length "+s.data.length+">>"),o(s.data),n("endobj")}},s=function(){var t=this.internal.collections.addImage_images,e=this.internal.write,s,r;for(r in t)s=t[r],e("/I"+s.i,s.n,"0","R")};t.addImage=function(t,r,n,o,i,a){if("object"==typeof t&&1===t.nodeType){r=document.createElement("canvas"),r.width=t.clientWidth,r.height=t.clientHeight;var u=r.getContext("2d");if(!u)throw"addImage requires canvas to be supported by browser.";u.drawImage(t,0,0,r.width,r.height),t=r.toDataURL("image/jpeg"),r="JPEG"}if("JPEG"!==r.toUpperCase())throw Error("addImage currently only supports format 'JPEG', not '"+r+"'");var c;r=this.internal.collections.addImage_images;var u=this.internal.getCoordinateString,l=this.internal.getVerticalCoordinateString;if("data:image/jpeg;base64,"===t.substring(0,23)&&(t=atob(t.replace("data:image/jpeg;base64,",""))),r)if(Object.keys)c=Object.keys(r).length;else{var f=r,d=0;for(c in f)f.hasOwnProperty(c)&&d++;c=d}else c=0,this.internal.collections.addImage_images=r={},this.internal.events.subscribe("putResources",e),this.internal.events.subscribe("putXobjectDict",s);t:{var f=t,w;if(255===!f.charCodeAt(0)||216===!f.charCodeAt(1)||255===!f.charCodeAt(2)||224===!f.charCodeAt(3)||74===!f.charCodeAt(6)||70===!f.charCodeAt(7)||73===!f.charCodeAt(8)||70===!f.charCodeAt(9)||0===!f.charCodeAt(10))throw Error("getJpegSize requires a binary jpeg file");w=256*f.charCodeAt(4)+f.charCodeAt(5);for(var d=4,m=f.length;m>d;){if(d+=w,255!==f.charCodeAt(d))throw Error("getJpegSize could not find the size of the image");if(192===f.charCodeAt(d+1)||193===f.charCodeAt(d+1)||194===f.charCodeAt(d+1)||195===f.charCodeAt(d+1)||196===f.charCodeAt(d+1)||197===f.charCodeAt(d+1)||198===f.charCodeAt(d+1)||199===f.charCodeAt(d+1)){w=256*f.charCodeAt(d+5)+f.charCodeAt(d+6),f=256*f.charCodeAt(d+7)+f.charCodeAt(d+8),f=[f,w];break t}d+=2,w=256*f.charCodeAt(d)+f.charCodeAt(d+1)}f=void 0}return t={w:f[0],h:f[1],cs:"DeviceRGB",bpc:8,f:"DCTDecode",i:c,data:t},r[c]=t,i||a||(a=i=-96),0>i&&(i=-72*t.w/i/this.internal.scaleFactor),0>a&&(a=-72*t.h/a/this.internal.scaleFactor),0===i&&(i=a*t.w/t.h),0===a&&(a=i*t.h/t.w),this.internal.write("q",u(i),"0 0",u(a),u(n),l(o+a),"cm /I"+t.i,"Do Q"),this}}(jsPDF.API),function(t){function e(t,e,s,r){return this.pdf=t,this.x=e,this.y=s,this.settings=r,this.init(),this}function s(t){var e=a[t];return e?e:(e={"xx-small":9,"x-small":11,small:13,medium:16,large:19,"x-large":23,"xx-large":28,auto:0}[t],void 0!==e||(e=parseFloat(t))?a[t]=e/16:(e=t.match(/([\d\.]+)(px)/),3===e.length?a[t]=parseFloat(e[1])/16:a[t]=1))}function r(t,e,a){var u=t.childNodes,c;c=$(t),t={};for(var l,f=c.css("font-family").split(","),d=f.shift();!l&&d;)l=n[d.trim().toLowerCase()],d=f.shift();for(t["font-family"]=l||"times",t["font-style"]=i[c.css("font-style")]||"normal",l=o[c.css("font-weight")]||"normal","bold"===l&&(t["font-style"]="normal"===t["font-style"]?l:l+t["font-style"]),t["font-size"]=s(c.css("font-size"))||1,t["line-height"]=s(c.css("line-height"))||1,t.display="inline"===c.css("display")?"inline":"block","block"===t.display&&(t["margin-top"]=s(c.css("margin-top"))||0,t["margin-bottom"]=s(c.css("margin-bottom"))||0,t["padding-top"]=s(c.css("padding-top"))||0,t["padding-bottom"]=s(c.css("padding-bottom"))||0),(l="block"===t.display)&&(e.setBlockBoundary(),e.setBlockStyle(t)),f=0,d=u.length;d>f;f++)if(c=u[f],"object"==typeof c)if(1===c.nodeType&&"SCRIPT"!=c.nodeName){var w=c,m=e,h=a,p=!1,y=void 0,v=void 0,_=h["#"+w.id];if(_)if("function"==typeof _)p=_(w,m);else for(y=0,v=_.length;!p&&y!==v;)p=_[y](w,m),y++;if(_=h[w.nodeName],!p&&_)if("function"==typeof _)p=_(w,m);else for(y=0,v=_.length;!p&&y!==v;)p=_[y](w,m),y++;p||r(c,e,a)}else 3===c.nodeType&&e.addText(c.nodeValue,t);else"string"==typeof c&&e.addText(c,t);l&&e.setBlockBoundary()}String.prototype.trim||(String.prototype.trim=function(){return this.replace(/^\s+|\s+$/g,"")}),String.prototype.trimLeft||(String.prototype.trimLeft=function(){return this.replace(/^\s+/g,"")}),String.prototype.trimRight||(String.prototype.trimRight=function(){return this.replace(/\s+$/g,"")}),e.prototype.init=function(){this.paragraph={text:[],style:[]},this.pdf.internal.write("q")},e.prototype.dispose=function(){return this.pdf.internal.write("Q"),{x:this.x,y:this.y}},e.prototype.splitFragmentsIntoLines=function(t,e){for(var s=this.pdf.internal.scaleFactor,r={},n,o,i,a,u,c=[],l=[c],f=0,d=this.settings.width;t.length;)if(a=t.shift(),u=e.shift(),a)if(n=u["font-family"],o=u["font-style"],i=r[n+o],i||(i=this.pdf.internal.getFont(n,o).metadata.Unicode,r[n+o]=i),n={widths:i.widths,kerning:i.kerning,fontSize:12*u["font-size"],textIndent:f},o=this.pdf.getStringUnitWidth(a,n)*n.fontSize/s,f+o>d){for(a=this.pdf.splitTextToSize(a,d,n),c.push([a.shift(),u]);a.length;)c=[[a.shift(),u]],l.push(c);f=this.pdf.getStringUnitWidth(c[0][0],n)*n.fontSize/s}else c.push([a,u]),f+=o;return l},e.prototype.RenderTextFragment=function(t,e){var s=this.pdf.internal.getFont(e["font-family"],e["font-style"]);this.pdf.internal.write("/"+s.id,(12*e["font-size"]).toFixed(2),"Tf","("+this.pdf.internal.pdfEscape(t)+") Tj")},e.prototype.renderParagraph=function(){for(var t=this.paragraph.text,e=0,s=t.length,r,n=!1,o=!1;!n&&e!==s;)(r=t[e]=t[e].trimLeft())&&(n=!0),e++;for(e=s-1;s&&!o&&-1!==e;)(r=t[e]=t[e].trimRight())&&(o=!0),e--;for(n=/\s+$/g,o=!0,e=0;e!==s;e++)r=t[e].replace(/\s+/g," "),o&&(r=r.trimLeft()),r&&(o=n.test(r)),t[e]=r;if(e=this.paragraph.style,r=(s=this.paragraph.blockstyle)||{},this.paragraph={text:[],style:[],blockstyle:{},priorblockstyle:s},t.join("").trim()){t=this.splitFragmentsIntoLines(t,e),e=12/this.pdf.internal.scaleFactor,n=(Math.max((s["margin-top"]||0)-(r["margin-bottom"]||0),0)+(s["padding-top"]||0))*e,
s=((s["margin-bottom"]||0)+(s["padding-bottom"]||0))*e,r=this.pdf.internal.write;var i,a;for(this.y+=n,r("q","BT",this.pdf.internal.getCoordinateString(this.x),this.pdf.internal.getVerticalCoordinateString(this.y),"Td");t.length;){for(n=t.shift(),i=o=0,a=n.length;i!==a;i++)n[i][0].trim()&&(o=Math.max(o,n[i][1]["line-height"],n[i][1]["font-size"]));for(r(0,(-12*o).toFixed(2),"Td"),i=0,a=n.length;i!==a;i++)n[i][0]&&this.RenderTextFragment(n[i][0],n[i][1]);this.y+=o*e}r("ET","Q"),this.y+=s}},e.prototype.setBlockBoundary=function(){this.renderParagraph()},e.prototype.setBlockStyle=function(t){this.paragraph.blockstyle=t},e.prototype.addText=function(t,e){this.paragraph.text.push(t),this.paragraph.style.push(e)};var n={helvetica:"helvetica","sans-serif":"helvetica",serif:"times",times:"times","times new roman":"times",monospace:"courier",courier:"courier"},o={100:"normal",200:"normal",300:"normal",400:"normal",500:"bold",600:"bold",700:"bold",800:"bold",900:"bold",normal:"normal",bold:"bold",bolder:"bold",lighter:"normal"},i={normal:"normal",italic:"italic",oblique:"italic"},a={normal:1};t.fromHTML=function(t,s,n,o){if("string"==typeof t){var i="jsPDFhtmlText"+Date.now().toString()+(1e3*Math.random()).toFixed(0);$('<div style="position: absolute !important;clip: rect(1px 1px 1px 1px); /* IE6, IE7 */clip: rect(1px, 1px, 1px, 1px);padding:0 !important;border:0 !important;height: 1px !important;width: 1px !important; top:auto;left:-100px;overflow: hidden;"><iframe style="height:1px;width:1px" name="'+i+'" /></div>').appendTo(document.body),t=$(window.frames[i].document.body).html(t)[0]}return s=new e(this,s,n,o),r(t,s,o.elementHandlers),s.dispose()}}(jsPDF.API),function(t){t.addSVG=function(t,e,s,r,n){function o(t){for(var e=parseFloat(t[1]),s=parseFloat(t[2]),r=[],n=3,o=t.length;o>n;)"c"===t[n]?(r.push([parseFloat(t[n+1]),parseFloat(t[n+2]),parseFloat(t[n+3]),parseFloat(t[n+4]),parseFloat(t[n+5]),parseFloat(t[n+6])]),n+=7):"l"===t[n]?(r.push([parseFloat(t[n+1]),parseFloat(t[n+2])]),n+=3):n+=1;return[e,s,r]}if(void 0===e||void 0===e)throw Error("addSVG needs values for 'x' and 'y'");var i=function(t){var e=t.createElement("iframe"),s=t.createElement("style");return s.type="text/css",s.styleSheet?s.styleSheet.cssText=".jsPDF_sillysvg_iframe {display:none;position:absolute;}":s.appendChild(t.createTextNode(".jsPDF_sillysvg_iframe {display:none;position:absolute;}")),t.getElementsByTagName("head")[0].appendChild(s),e.name="childframe",e.setAttribute("width",0),e.setAttribute("height",0),e.setAttribute("frameborder","0"),e.setAttribute("scrolling","no"),e.setAttribute("seamless","seamless"),e.setAttribute("class","jsPDF_sillysvg_iframe"),t.body.appendChild(e),e}(document),i=function(t,e){var s=(e.contentWindow||e.contentDocument).document;return s.write(t),s.close(),s.getElementsByTagName("svg")[0]}(t,i);t=[1,1];var a=parseFloat(i.getAttribute("width")),u=parseFloat(i.getAttribute("height"));for(a&&u&&(r&&n?t=[r/a,n/u]:r?t=[r/a,r/a]:n&&(t=[n/u,n/u])),i=i.childNodes,r=0,n=i.length;n>r;r++)a=i[r],a.tagName&&"PATH"===a.tagName.toUpperCase()&&(a=o(a.getAttribute("d").split(" ")),a[0]=a[0]*t[0]+e,a[1]=a[1]*t[1]+s,this.lines.call(this,a[2],a[0],a[1],t));return this}}(jsPDF.API),function(t){var e=t.getCharWidthsArray=function(t,e){e||(e={});var s=e.widths?e.widths:this.internal.getFont().metadata.Unicode.widths,r=s.fof?s.fof:1,n=e.kerning?e.kerning:this.internal.getFont().metadata.Unicode.kerning,o=n.fof?n.fof:1,i,a,u,c=0,l=s[0]||r,f=[];for(i=0,a=t.length;a>i;i++)u=t.charCodeAt(i),f.push((s[u]||l)/r+(n[u]&&n[u][c]||0)/o),c=u;return f},s=function(t){for(var e=t.length,s=0;e;)e--,s+=t[e];return s};t.getStringUnitWidth=function(t,r){return s(e.call(this,t,r))};var r=function(t,r,n){n||(n={});var o=e(" ",n)[0],i=t.split(" "),a=[];t=[a];var u=n.textIndent||0,c=0,l=0,f,d,w,m;for(w=0,m=i.length;m>w;w++){if(f=i[w],d=e(f,n),l=s(d),u+c+l>r){if(l>r){for(var l=f,h=d,p=r,y=[],v=0,_=l.length,g=0;v!==_&&g+h[v]<r-(u+c);)g+=h[v],v++;for(y.push(l.slice(0,v)),u=v,g=0;v!==_;)g+h[v]>p&&(y.push(l.slice(u,v)),g=0,u=v),g+=h[v],v++;for(u!==v&&y.push(l.slice(u,v)),u=y,a.push(u.shift()),a=[u.pop()];u.length;)t.push([u.shift()]);l=s(d.slice(f.length-a[0].length))}else a=[f];t.push(a),u=l}else a.push(f),u+=c+l;c=o}for(r=[],w=0,m=t.length;m>w;w++)r.push(t[w].join(" "));return r};t.splitTextToSize=function(t,e,s){s||(s={});var n=s.fontSize||this.internal.getFontSize(),o,i=s;o={0:1};var a={};for(i.widths&&i.kerning?o={widths:i.widths,kerning:i.kerning}:(i=this.internal.getFont(i.fontName,i.fontStyle),o=i.metadata.Unicode?{widths:i.metadata.Unicode.widths||o,kerning:i.metadata.Unicode.kerning||a}:{widths:o,kerning:a}),t=t.match(/[\n\r]/)?t.split(/\r\n|\r|\n/g):[t],e=1*this.internal.scaleFactor*e/n,o.textIndent=s.textIndent?1*s.textIndent*this.internal.scaleFactor/n:0,a=[],s=0,n=t.length;n>s;s++)a=a.concat(r(t[s],e,o));return a}}(jsPDF.API),function(t){var e=function(t){for(var e={},s=0;16>s;s++)e["klmnopqrstuvwxyz"[s]]="0123456789abcdef"[s];for(var r={},n=1,o,i=r,a=[],u,c="",l="",f,d=t.length-1,s=1;s!=d;)u=t[s],s+=1,"'"==u?o?(f=o.join(""),o=void 0):o=[]:o?o.push(u):"{"==u?(a.push([i,f]),i={},f=void 0):"}"==u?(u=a.pop(),u[0][u[1]]=i,f=void 0,i=u[0]):"-"==u?n=-1:void 0===f?e.hasOwnProperty(u)?(c+=e[u],f=parseInt(c,16)*n,n=1,c=""):c+=u:e.hasOwnProperty(u)?(l+=e[u],i[f]=parseInt(l,16)*n,n=1,f=void 0,l=""):l+=u;return r},s={codePages:["WinAnsiEncoding"],WinAnsiEncoding:e("{19m8n201n9q201o9r201s9l201t9m201u8m201w9n201x9o201y8o202k8q202l8r202m9p202q8p20aw8k203k8t203t8v203u9v2cq8s212m9t15m8w15n9w2dw9s16k8u16l9u17s9z17x8y17y9y}")},r={Unicode:{Courier:s,"Courier-Bold":s,"Courier-BoldOblique":s,"Courier-Oblique":s,Helvetica:s,"Helvetica-Bold":s,"Helvetica-BoldOblique":s,"Helvetica-Oblique":s,"Times-Roman":s,"Times-Bold":s,"Times-BoldItalic":s,"Times-Italic":s}},n={Unicode:{"Courier-Oblique":e("{'widths'{k3w'fof'6o}'kerning'{'fof'-6o}}"),"Times-BoldItalic":e("{'widths'{k3o2q4ycx2r201n3m201o6o201s2l201t2l201u2l201w3m201x3m201y3m2k1t2l2r202m2n2n3m2o3m2p5n202q6o2r1w2s2l2t2l2u3m2v3t2w1t2x2l2y1t2z1w3k3m3l3m3m3m3n3m3o3m3p3m3q3m3r3m3s3m203t2l203u2l3v2l3w3t3x3t3y3t3z3m4k5n4l4m4m4m4n4m4o4s4p4m4q4m4r4s4s4y4t2r4u3m4v4m4w3x4x5t4y4s4z4s5k3x5l4s5m4m5n3r5o3x5p4s5q4m5r5t5s4m5t3x5u3x5v2l5w1w5x2l5y3t5z3m6k2l6l3m6m3m6n2w6o3m6p2w6q2l6r3m6s3r6t1w6u1w6v3m6w1w6x4y6y3r6z3m7k3m7l3m7m2r7n2r7o1w7p3r7q2w7r4m7s3m7t2w7u2r7v2n7w1q7x2n7y3t202l3mcl4mal2ram3man3mao3map3mar3mas2lat4uau1uav3maw3way4uaz2lbk2sbl3t'fof'6obo2lbp3tbq3mbr1tbs2lbu1ybv3mbz3mck4m202k3mcm4mcn4mco4mcp4mcq5ycr4mcs4mct4mcu4mcv4mcw2r2m3rcy2rcz2rdl4sdm4sdn4sdo4sdp4sdq4sds4sdt4sdu4sdv4sdw4sdz3mek3mel3mem3men3meo3mep3meq4ser2wes2wet2weu2wev2wew1wex1wey1wez1wfl3rfm3mfn3mfo3mfp3mfq3mfr3tfs3mft3rfu3rfv3rfw3rfz2w203k6o212m6o2dw2l2cq2l3t3m3u2l17s3x19m3m}'kerning'{cl{4qu5kt5qt5rs17ss5ts}201s{201ss}201t{cks4lscmscnscoscpscls2wu2yu201ts}201x{2wu2yu}2k{201ts}2w{4qx5kx5ou5qx5rs17su5tu}2x{17su5tu5ou}2y{4qx5kx5ou5qx5rs17ss5ts}'fof'-6ofn{17sw5tw5ou5qw5rs}7t{cksclscmscnscoscps4ls}3u{17su5tu5os5qs}3v{17su5tu5os5qs}7p{17su5tu}ck{4qu5kt5qt5rs17ss5ts}4l{4qu5kt5qt5rs17ss5ts}cm{4qu5kt5qt5rs17ss5ts}cn{4qu5kt5qt5rs17ss5ts}co{4qu5kt5qt5rs17ss5ts}cp{4qu5kt5qt5rs17ss5ts}6l{4qu5ou5qw5rt17su5tu}5q{ckuclucmucnucoucpu4lu}5r{ckuclucmucnucoucpu4lu}7q{cksclscmscnscoscps4ls}6p{4qu5ou5qw5rt17sw5tw}ek{4qu5ou5qw5rt17su5tu}el{4qu5ou5qw5rt17su5tu}em{4qu5ou5qw5rt17su5tu}en{4qu5ou5qw5rt17su5tu}eo{4qu5ou5qw5rt17su5tu}ep{4qu5ou5qw5rt17su5tu}es{17ss5ts5qs4qu}et{4qu5ou5qw5rt17sw5tw}eu{4qu5ou5qw5rt17ss5ts}ev{17ss5ts5qs4qu}6z{17sw5tw5ou5qw5rs}fm{17sw5tw5ou5qw5rs}7n{201ts}fo{17sw5tw5ou5qw5rs}fp{17sw5tw5ou5qw5rs}fq{17sw5tw5ou5qw5rs}7r{cksclscmscnscoscps4ls}fs{17sw5tw5ou5qw5rs}ft{17su5tu}fu{17su5tu}fv{17su5tu}fw{17su5tu}fz{cksclscmscnscoscps4ls}}}"),"Helvetica-Bold":e("{'widths'{k3s2q4scx1w201n3r201o6o201s1w201t1w201u1w201w3m201x3m201y3m2k1w2l2l202m2n2n3r2o3r2p5t202q6o2r1s2s2l2t2l2u2r2v3u2w1w2x2l2y1w2z1w3k3r3l3r3m3r3n3r3o3r3p3r3q3r3r3r3s3r203t2l203u2l3v2l3w3u3x3u3y3u3z3x4k6l4l4s4m4s4n4s4o4s4p4m4q3x4r4y4s4s4t1w4u3r4v4s4w3x4x5n4y4s4z4y5k4m5l4y5m4s5n4m5o3x5p4s5q4m5r5y5s4m5t4m5u3x5v2l5w1w5x2l5y3u5z3r6k2l6l3r6m3x6n3r6o3x6p3r6q2l6r3x6s3x6t1w6u1w6v3r6w1w6x5t6y3x6z3x7k3x7l3x7m2r7n3r7o2l7p3x7q3r7r4y7s3r7t3r7u3m7v2r7w1w7x2r7y3u202l3rcl4sal2lam3ran3rao3rap3rar3ras2lat4tau2pav3raw3uay4taz2lbk2sbl3u'fof'6obo2lbp3xbq3rbr1wbs2lbu2obv3rbz3xck4s202k3rcm4scn4sco4scp4scq6ocr4scs4mct4mcu4mcv4mcw1w2m2zcy1wcz1wdl4sdm4ydn4ydo4ydp4ydq4yds4ydt4sdu4sdv4sdw4sdz3xek3rel3rem3ren3reo3rep3req5ter3res3ret3reu3rev3rew1wex1wey1wez1wfl3xfm3xfn3xfo3xfp3xfq3xfr3ufs3xft3xfu3xfv3xfw3xfz3r203k6o212m6o2dw2l2cq2l3t3r3u2l17s4m19m3r}'kerning'{cl{4qs5ku5ot5qs17sv5tv}201t{2ww4wy2yw}201w{2ks}201x{2ww4wy2yw}2k{201ts201xs}2w{7qs4qu5kw5os5qw5rs17su5tu7tsfzs}2x{5ow5qs}2y{7qs4qu5kw5os5qw5rs17su5tu7tsfzs}'fof'-6o7p{17su5tu5ot}ck{4qs5ku5ot5qs17sv5tv}4l{4qs5ku5ot5qs17sv5tv}cm{4qs5ku5ot5qs17sv5tv}cn{4qs5ku5ot5qs17sv5tv}co{4qs5ku5ot5qs17sv5tv}cp{4qs5ku5ot5qs17sv5tv}6l{17st5tt5os}17s{2kwclvcmvcnvcovcpv4lv4wwckv}5o{2kucltcmtcntcotcpt4lt4wtckt}5q{2ksclscmscnscoscps4ls4wvcks}5r{2ks4ws}5t{2kwclvcmvcnvcovcpv4lv4wwckv}eo{17st5tt5os}fu{17su5tu5ot}6p{17ss5ts}ek{17st5tt5os}el{17st5tt5os}em{17st5tt5os}en{17st5tt5os}6o{201ts}ep{17st5tt5os}es{17ss5ts}et{17ss5ts}eu{17ss5ts}ev{17ss5ts}6z{17su5tu5os5qt}fm{17su5tu5os5qt}fn{17su5tu5os5qt}fo{17su5tu5os5qt}fp{17su5tu5os5qt}fq{17su5tu5os5qt}fs{17su5tu5os5qt}ft{17su5tu5ot}7m{5os}fv{17su5tu5ot}fw{17su5tu5ot}}}"),Courier:e("{'widths'{k3w'fof'6o}'kerning'{'fof'-6o}}"),"Courier-BoldOblique":e("{'widths'{k3w'fof'6o}'kerning'{'fof'-6o}}"),"Times-Bold":e("{'widths'{k3q2q5ncx2r201n3m201o6o201s2l201t2l201u2l201w3m201x3m201y3m2k1t2l2l202m2n2n3m2o3m2p6o202q6o2r1w2s2l2t2l2u3m2v3t2w1t2x2l2y1t2z1w3k3m3l3m3m3m3n3m3o3m3p3m3q3m3r3m3s3m203t2l203u2l3v2l3w3t3x3t3y3t3z3m4k5x4l4s4m4m4n4s4o4s4p4m4q3x4r4y4s4y4t2r4u3m4v4y4w4m4x5y4y4s4z4y5k3x5l4y5m4s5n3r5o4m5p4s5q4s5r6o5s4s5t4s5u4m5v2l5w1w5x2l5y3u5z3m6k2l6l3m6m3r6n2w6o3r6p2w6q2l6r3m6s3r6t1w6u2l6v3r6w1w6x5n6y3r6z3m7k3r7l3r7m2w7n2r7o2l7p3r7q3m7r4s7s3m7t3m7u2w7v2r7w1q7x2r7y3o202l3mcl4sal2lam3man3mao3map3mar3mas2lat4uau1yav3maw3tay4uaz2lbk2sbl3t'fof'6obo2lbp3rbr1tbs2lbu2lbv3mbz3mck4s202k3mcm4scn4sco4scp4scq6ocr4scs4mct4mcu4mcv4mcw2r2m3rcy2rcz2rdl4sdm4ydn4ydo4ydp4ydq4yds4ydt4sdu4sdv4sdw4sdz3rek3mel3mem3men3meo3mep3meq4ser2wes2wet2weu2wev2wew1wex1wey1wez1wfl3rfm3mfn3mfo3mfp3mfq3mfr3tfs3mft3rfu3rfv3rfw3rfz3m203k6o212m6o2dw2l2cq2l3t3m3u2l17s4s19m3m}'kerning'{cl{4qt5ks5ot5qy5rw17sv5tv}201t{cks4lscmscnscoscpscls4wv}2k{201ts}2w{4qu5ku7mu5os5qx5ru17su5tu}2x{17su5tu5ou5qs}2y{4qv5kv7mu5ot5qz5ru17su5tu}'fof'-6o7t{cksclscmscnscoscps4ls}3u{17su5tu5os5qu}3v{17su5tu5os5qu}fu{17su5tu5ou5qu}7p{17su5tu5ou5qu}ck{4qt5ks5ot5qy5rw17sv5tv}4l{4qt5ks5ot5qy5rw17sv5tv}cm{4qt5ks5ot5qy5rw17sv5tv}cn{4qt5ks5ot5qy5rw17sv5tv}co{4qt5ks5ot5qy5rw17sv5tv}cp{4qt5ks5ot5qy5rw17sv5tv}6l{17st5tt5ou5qu}17s{ckuclucmucnucoucpu4lu4wu}5o{ckuclucmucnucoucpu4lu4wu}5q{ckzclzcmzcnzcozcpz4lz4wu}5r{ckxclxcmxcnxcoxcpx4lx4wu}5t{ckuclucmucnucoucpu4lu4wu}7q{ckuclucmucnucoucpu4lu}6p{17sw5tw5ou5qu}ek{17st5tt5qu}el{17st5tt5ou5qu}em{17st5tt5qu}en{17st5tt5qu}eo{17st5tt5qu}ep{17st5tt5ou5qu}es{17ss5ts5qu}et{17sw5tw5ou5qu}eu{17sw5tw5ou5qu}ev{17ss5ts5qu}6z{17sw5tw5ou5qu5rs}fm{17sw5tw5ou5qu5rs}fn{17sw5tw5ou5qu5rs}fo{17sw5tw5ou5qu5rs}fp{17sw5tw5ou5qu5rs}fq{17sw5tw5ou5qu5rs}7r{cktcltcmtcntcotcpt4lt5os}fs{17sw5tw5ou5qu5rs}ft{17su5tu5ou5qu}7m{5os}fv{17su5tu5ou5qu}fw{17su5tu5ou5qu}fz{cksclscmscnscoscps4ls}}}"),Helvetica:e("{'widths'{k3p2q4mcx1w201n3r201o6o201s1q201t1q201u1q201w2l201x2l201y2l2k1w2l1w202m2n2n3r2o3r2p5t202q6o2r1n2s2l2t2l2u2r2v3u2w1w2x2l2y1w2z1w3k3r3l3r3m3r3n3r3o3r3p3r3q3r3r3r3s3r203t2l203u2l3v1w3w3u3x3u3y3u3z3r4k6p4l4m4m4m4n4s4o4s4p4m4q3x4r4y4s4s4t1w4u3m4v4m4w3r4x5n4y4s4z4y5k4m5l4y5m4s5n4m5o3x5p4s5q4m5r5y5s4m5t4m5u3x5v1w5w1w5x1w5y2z5z3r6k2l6l3r6m3r6n3m6o3r6p3r6q1w6r3r6s3r6t1q6u1q6v3m6w1q6x5n6y3r6z3r7k3r7l3r7m2l7n3m7o1w7p3r7q3m7r4s7s3m7t3m7u3m7v2l7w1u7x2l7y3u202l3rcl4mal2lam3ran3rao3rap3rar3ras2lat4tau2pav3raw3uay4taz2lbk2sbl3u'fof'6obo2lbp3rbr1wbs2lbu2obv3rbz3xck4m202k3rcm4mcn4mco4mcp4mcq6ocr4scs4mct4mcu4mcv4mcw1w2m2ncy1wcz1wdl4sdm4ydn4ydo4ydp4ydq4yds4ydt4sdu4sdv4sdw4sdz3xek3rel3rem3ren3reo3rep3req5ter3mes3ret3reu3rev3rew1wex1wey1wez1wfl3rfm3rfn3rfo3rfp3rfq3rfr3ufs3xft3rfu3rfv3rfw3rfz3m203k6o212m6o2dw2l2cq2l3t3r3u1w17s4m19m3r}'kerning'{5q{4wv}cl{4qs5kw5ow5qs17sv5tv}201t{2wu4w1k2yu}201x{2wu4wy2yu}17s{2ktclucmucnu4otcpu4lu4wycoucku}2w{7qs4qz5k1m17sy5ow5qx5rsfsu5ty7tufzu}2x{17sy5ty5oy5qs}2y{7qs4qz5k1m17sy5ow5qx5rsfsu5ty7tufzu}'fof'-6o7p{17sv5tv5ow}ck{4qs5kw5ow5qs17sv5tv}4l{4qs5kw5ow5qs17sv5tv}cm{4qs5kw5ow5qs17sv5tv}cn{4qs5kw5ow5qs17sv5tv}co{4qs5kw5ow5qs17sv5tv}cp{4qs5kw5ow5qs17sv5tv}6l{17sy5ty5ow}do{17st5tt}4z{17st5tt}7s{fst}dm{17st5tt}dn{17st5tt}5o{ckwclwcmwcnwcowcpw4lw4wv}dp{17st5tt}dq{17st5tt}7t{5ow}ds{17st5tt}5t{2ktclucmucnu4otcpu4lu4wycoucku}fu{17sv5tv5ow}6p{17sy5ty5ow5qs}ek{17sy5ty5ow}el{17sy5ty5ow}em{17sy5ty5ow}en{5ty}eo{17sy5ty5ow}ep{17sy5ty5ow}es{17sy5ty5qs}et{17sy5ty5ow5qs}eu{17sy5ty5ow5qs}ev{17sy5ty5ow5qs}6z{17sy5ty5ow5qs}fm{17sy5ty5ow5qs}fn{17sy5ty5ow5qs}fo{17sy5ty5ow5qs}fp{17sy5ty5qs}fq{17sy5ty5ow5qs}7r{5ow}fs{17sy5ty5ow5qs}ft{17sv5tv5ow}7m{5ow}fv{17sv5tv5ow}fw{17sv5tv5ow}}}"),"Helvetica-BoldOblique":e("{'widths'{k3s2q4scx1w201n3r201o6o201s1w201t1w201u1w201w3m201x3m201y3m2k1w2l2l202m2n2n3r2o3r2p5t202q6o2r1s2s2l2t2l2u2r2v3u2w1w2x2l2y1w2z1w3k3r3l3r3m3r3n3r3o3r3p3r3q3r3r3r3s3r203t2l203u2l3v2l3w3u3x3u3y3u3z3x4k6l4l4s4m4s4n4s4o4s4p4m4q3x4r4y4s4s4t1w4u3r4v4s4w3x4x5n4y4s4z4y5k4m5l4y5m4s5n4m5o3x5p4s5q4m5r5y5s4m5t4m5u3x5v2l5w1w5x2l5y3u5z3r6k2l6l3r6m3x6n3r6o3x6p3r6q2l6r3x6s3x6t1w6u1w6v3r6w1w6x5t6y3x6z3x7k3x7l3x7m2r7n3r7o2l7p3x7q3r7r4y7s3r7t3r7u3m7v2r7w1w7x2r7y3u202l3rcl4sal2lam3ran3rao3rap3rar3ras2lat4tau2pav3raw3uay4taz2lbk2sbl3u'fof'6obo2lbp3xbq3rbr1wbs2lbu2obv3rbz3xck4s202k3rcm4scn4sco4scp4scq6ocr4scs4mct4mcu4mcv4mcw1w2m2zcy1wcz1wdl4sdm4ydn4ydo4ydp4ydq4yds4ydt4sdu4sdv4sdw4sdz3xek3rel3rem3ren3reo3rep3req5ter3res3ret3reu3rev3rew1wex1wey1wez1wfl3xfm3xfn3xfo3xfp3xfq3xfr3ufs3xft3xfu3xfv3xfw3xfz3r203k6o212m6o2dw2l2cq2l3t3r3u2l17s4m19m3r}'kerning'{cl{4qs5ku5ot5qs17sv5tv}201t{2ww4wy2yw}201w{2ks}201x{2ww4wy2yw}2k{201ts201xs}2w{7qs4qu5kw5os5qw5rs17su5tu7tsfzs}2x{5ow5qs}2y{7qs4qu5kw5os5qw5rs17su5tu7tsfzs}'fof'-6o7p{17su5tu5ot}ck{4qs5ku5ot5qs17sv5tv}4l{4qs5ku5ot5qs17sv5tv}cm{4qs5ku5ot5qs17sv5tv}cn{4qs5ku5ot5qs17sv5tv}co{4qs5ku5ot5qs17sv5tv}cp{4qs5ku5ot5qs17sv5tv}6l{17st5tt5os}17s{2kwclvcmvcnvcovcpv4lv4wwckv}5o{2kucltcmtcntcotcpt4lt4wtckt}5q{2ksclscmscnscoscps4ls4wvcks}5r{2ks4ws}5t{2kwclvcmvcnvcovcpv4lv4wwckv}eo{17st5tt5os}fu{17su5tu5ot}6p{17ss5ts}ek{17st5tt5os}el{17st5tt5os}em{17st5tt5os}en{17st5tt5os}6o{201ts}ep{17st5tt5os}es{17ss5ts}et{17ss5ts}eu{17ss5ts}ev{17ss5ts}6z{17su5tu5os5qt}fm{17su5tu5os5qt}fn{17su5tu5os5qt}fo{17su5tu5os5qt}fp{17su5tu5os5qt}fq{17su5tu5os5qt}fs{17su5tu5os5qt}ft{17su5tu5ot}7m{5os}fv{17su5tu5ot}fw{17su5tu5ot}}}"),"Courier-Bold":e("{'widths'{k3w'fof'6o}'kerning'{'fof'-6o}}"),"Times-Italic":e("{'widths'{k3n2q4ycx2l201n3m201o5t201s2l201t2l201u2l201w3r201x3r201y3r2k1t2l2l202m2n2n3m2o3m2p5n202q5t2r1p2s2l2t2l2u3m2v4n2w1t2x2l2y1t2z1w3k3m3l3m3m3m3n3m3o3m3p3m3q3m3r3m3s3m203t2l203u2l3v2l3w4n3x4n3y4n3z3m4k5w4l3x4m3x4n4m4o4s4p3x4q3x4r4s4s4s4t2l4u2w4v4m4w3r4x5n4y4m4z4s5k3x5l4s5m3x5n3m5o3r5p4s5q3x5r5n5s3x5t3r5u3r5v2r5w1w5x2r5y2u5z3m6k2l6l3m6m3m6n2w6o3m6p2w6q1w6r3m6s3m6t1w6u1w6v2w6w1w6x4s6y3m6z3m7k3m7l3m7m2r7n2r7o1w7p3m7q2w7r4m7s2w7t2w7u2r7v2s7w1v7x2s7y3q202l3mcl3xal2ram3man3mao3map3mar3mas2lat4wau1vav3maw4nay4waz2lbk2sbl4n'fof'6obo2lbp3mbq3obr1tbs2lbu1zbv3mbz3mck3x202k3mcm3xcn3xco3xcp3xcq5tcr4mcs3xct3xcu3xcv3xcw2l2m2ucy2lcz2ldl4mdm4sdn4sdo4sdp4sdq4sds4sdt4sdu4sdv4sdw4sdz3mek3mel3mem3men3meo3mep3meq4mer2wes2wet2weu2wev2wew1wex1wey1wez1wfl3mfm3mfn3mfo3mfp3mfq3mfr4nfs3mft3mfu3mfv3mfw3mfz2w203k6o212m6m2dw2l2cq2l3t3m3u2l17s3r19m3m}'kerning'{cl{5kt4qw}201s{201sw}201t{201tw2wy2yy6q-t}201x{2wy2yy}2k{201tw}2w{7qs4qy7rs5ky7mw5os5qx5ru17su5tu}2x{17ss5ts5os}2y{7qs4qy7rs5ky7mw5os5qx5ru17su5tu}'fof'-6o6t{17ss5ts5qs}7t{5os}3v{5qs}7p{17su5tu5qs}ck{5kt4qw}4l{5kt4qw}cm{5kt4qw}cn{5kt4qw}co{5kt4qw}cp{5kt4qw}6l{4qs5ks5ou5qw5ru17su5tu}17s{2ks}5q{ckvclvcmvcnvcovcpv4lv}5r{ckuclucmucnucoucpu4lu}5t{2ks}6p{4qs5ks5ou5qw5ru17su5tu}ek{4qs5ks5ou5qw5ru17su5tu}el{4qs5ks5ou5qw5ru17su5tu}em{4qs5ks5ou5qw5ru17su5tu}en{4qs5ks5ou5qw5ru17su5tu}eo{4qs5ks5ou5qw5ru17su5tu}ep{4qs5ks5ou5qw5ru17su5tu}es{5ks5qs4qs}et{4qs5ks5ou5qw5ru17su5tu}eu{4qs5ks5qw5ru17su5tu}ev{5ks5qs4qs}ex{17ss5ts5qs}6z{4qv5ks5ou5qw5ru17su5tu}fm{4qv5ks5ou5qw5ru17su5tu}fn{4qv5ks5ou5qw5ru17su5tu}fo{4qv5ks5ou5qw5ru17su5tu}fp{4qv5ks5ou5qw5ru17su5tu}fq{4qv5ks5ou5qw5ru17su5tu}7r{5os}fs{4qv5ks5ou5qw5ru17su5tu}ft{17su5tu5qs}fu{17su5tu5qs}fv{17su5tu5qs}fw{17su5tu5qs}}}"),"Times-Roman":e("{'widths'{k3n2q4ycx2l201n3m201o6o201s2l201t2l201u2l201w2w201x2w201y2w2k1t2l2l202m2n2n3m2o3m2p5n202q6o2r1m2s2l2t2l2u3m2v3s2w1t2x2l2y1t2z1w3k3m3l3m3m3m3n3m3o3m3p3m3q3m3r3m3s3m203t2l203u2l3v1w3w3s3x3s3y3s3z2w4k5w4l4s4m4m4n4m4o4s4p3x4q3r4r4s4s4s4t2l4u2r4v4s4w3x4x5t4y4s4z4s5k3r5l4s5m4m5n3r5o3x5p4s5q4s5r5y5s4s5t4s5u3x5v2l5w1w5x2l5y2z5z3m6k2l6l2w6m3m6n2w6o3m6p2w6q2l6r3m6s3m6t1w6u1w6v3m6w1w6x4y6y3m6z3m7k3m7l3m7m2l7n2r7o1w7p3m7q3m7r4s7s3m7t3m7u2w7v3k7w1o7x3k7y3q202l3mcl4sal2lam3man3mao3map3mar3mas2lat4wau1vav3maw3say4waz2lbk2sbl3s'fof'6obo2lbp3mbq2xbr1tbs2lbu1zbv3mbz2wck4s202k3mcm4scn4sco4scp4scq5tcr4mcs3xct3xcu3xcv3xcw2l2m2tcy2lcz2ldl4sdm4sdn4sdo4sdp4sdq4sds4sdt4sdu4sdv4sdw4sdz3mek2wel2wem2wen2weo2wep2weq4mer2wes2wet2weu2wev2wew1wex1wey1wez1wfl3mfm3mfn3mfo3mfp3mfq3mfr3sfs3mft3mfu3mfv3mfw3mfz3m203k6o212m6m2dw2l2cq2l3t3m3u1w17s4s19m3m}'kerning'{cl{4qs5ku17sw5ou5qy5rw201ss5tw201ws}201s{201ss}201t{ckw4lwcmwcnwcowcpwclw4wu201ts}2k{201ts}2w{4qs5kw5os5qx5ru17sx5tx}2x{17sw5tw5ou5qu}2y{4qs5kw5os5qx5ru17sx5tx}'fof'-6o7t{ckuclucmucnucoucpu4lu5os5rs}3u{17su5tu5qs}3v{17su5tu5qs}7p{17sw5tw5qs}ck{4qs5ku17sw5ou5qy5rw201ss5tw201ws}4l{4qs5ku17sw5ou5qy5rw201ss5tw201ws}cm{4qs5ku17sw5ou5qy5rw201ss5tw201ws}cn{4qs5ku17sw5ou5qy5rw201ss5tw201ws}co{4qs5ku17sw5ou5qy5rw201ss5tw201ws}cp{4qs5ku17sw5ou5qy5rw201ss5tw201ws}6l{17su5tu5os5qw5rs}17s{2ktclvcmvcnvcovcpv4lv4wuckv}5o{ckwclwcmwcnwcowcpw4lw4wu}5q{ckyclycmycnycoycpy4ly4wu5ms}5r{cktcltcmtcntcotcpt4lt4ws}5t{2ktclvcmvcnvcovcpv4lv4wuckv}7q{cksclscmscnscoscps4ls}6p{17su5tu5qw5rs}ek{5qs5rs}el{17su5tu5os5qw5rs}em{17su5tu5os5qs5rs}en{17su5qs5rs}eo{5qs5rs}ep{17su5tu5os5qw5rs}es{5qs}et{17su5tu5qw5rs}eu{17su5tu5qs5rs}ev{5qs}6z{17sv5tv5os5qx5rs}fm{5os5qt5rs}fn{17sv5tv5os5qx5rs}fo{17sv5tv5os5qx5rs}fp{5os5qt5rs}fq{5os5qt5rs}7r{ckuclucmucnucoucpu4lu5os}fs{17sv5tv5os5qx5rs}ft{17ss5ts5qs}fu{17sw5tw5qs}fv{17sw5tw5qs}fw{17ss5ts5qs}fz{ckuclucmucnucoucpu4lu5os5rs}}}"),"Helvetica-Oblique":e("{'widths'{k3p2q4mcx1w201n3r201o6o201s1q201t1q201u1q201w2l201x2l201y2l2k1w2l1w202m2n2n3r2o3r2p5t202q6o2r1n2s2l2t2l2u2r2v3u2w1w2x2l2y1w2z1w3k3r3l3r3m3r3n3r3o3r3p3r3q3r3r3r3s3r203t2l203u2l3v1w3w3u3x3u3y3u3z3r4k6p4l4m4m4m4n4s4o4s4p4m4q3x4r4y4s4s4t1w4u3m4v4m4w3r4x5n4y4s4z4y5k4m5l4y5m4s5n4m5o3x5p4s5q4m5r5y5s4m5t4m5u3x5v1w5w1w5x1w5y2z5z3r6k2l6l3r6m3r6n3m6o3r6p3r6q1w6r3r6s3r6t1q6u1q6v3m6w1q6x5n6y3r6z3r7k3r7l3r7m2l7n3m7o1w7p3r7q3m7r4s7s3m7t3m7u3m7v2l7w1u7x2l7y3u202l3rcl4mal2lam3ran3rao3rap3rar3ras2lat4tau2pav3raw3uay4taz2lbk2sbl3u'fof'6obo2lbp3rbr1wbs2lbu2obv3rbz3xck4m202k3rcm4mcn4mco4mcp4mcq6ocr4scs4mct4mcu4mcv4mcw1w2m2ncy1wcz1wdl4sdm4ydn4ydo4ydp4ydq4yds4ydt4sdu4sdv4sdw4sdz3xek3rel3rem3ren3reo3rep3req5ter3mes3ret3reu3rev3rew1wex1wey1wez1wfl3rfm3rfn3rfo3rfp3rfq3rfr3ufs3xft3rfu3rfv3rfw3rfz3m203k6o212m6o2dw2l2cq2l3t3r3u1w17s4m19m3r}'kerning'{5q{4wv}cl{4qs5kw5ow5qs17sv5tv}201t{2wu4w1k2yu}201x{2wu4wy2yu}17s{2ktclucmucnu4otcpu4lu4wycoucku}2w{7qs4qz5k1m17sy5ow5qx5rsfsu5ty7tufzu}2x{17sy5ty5oy5qs}2y{7qs4qz5k1m17sy5ow5qx5rsfsu5ty7tufzu}'fof'-6o7p{17sv5tv5ow}ck{4qs5kw5ow5qs17sv5tv}4l{4qs5kw5ow5qs17sv5tv}cm{4qs5kw5ow5qs17sv5tv}cn{4qs5kw5ow5qs17sv5tv}co{4qs5kw5ow5qs17sv5tv}cp{4qs5kw5ow5qs17sv5tv}6l{17sy5ty5ow}do{17st5tt}4z{17st5tt}7s{fst}dm{17st5tt}dn{17st5tt}5o{ckwclwcmwcnwcowcpw4lw4wv}dp{17st5tt}dq{17st5tt}7t{5ow}ds{17st5tt}5t{2ktclucmucnu4otcpu4lu4wycoucku}fu{17sv5tv5ow}6p{17sy5ty5ow5qs}ek{17sy5ty5ow}el{17sy5ty5ow}em{17sy5ty5ow}en{5ty}eo{17sy5ty5ow}ep{17sy5ty5ow}es{17sy5ty5qs}et{17sy5ty5ow5qs}eu{17sy5ty5ow5qs}ev{17sy5ty5ow5qs}6z{17sy5ty5ow5qs}fm{17sy5ty5ow5qs}fn{17sy5ty5ow5qs}fo{17sy5ty5ow5qs}fp{17sy5ty5qs}fq{17sy5ty5ow5qs}7r{5ow}fs{17sy5ty5ow5qs}ft{17sv5tv5ow}7m{5ow}fv{17sv5tv5ow}fw{17sv5tv5ow}}}")}};t.events.push(["addFonts",function(t){var e,s,o,i;for(s in t.fonts)t.fonts.hasOwnProperty(s)&&(e=t.fonts[s],(o=n.Unicode[e.PostScriptName])&&(i=e.metadata.Unicode?e.metadata.Unicode:e.metadata.Unicode={},i.widths=o.widths,i.kerning=o.kerning),(o=r.Unicode[e.PostScriptName])&&(i=e.metadata.Unicode?e.metadata.Unicode:e.metadata.Unicode={},i.encoding=o,o.codePages&&o.codePages.length&&(e.encoding=o.codePages[0])))}])}(jsPDF.API),function(t){var e,s,r,n,o={x:void 0,y:void 0,w:void 0,h:void 0,ln:void 0},i=1;t.setHeaderFunction=function(t){n=t},t.getTextDimensions=function(t){e=this.internal.getFont().fontName,s=this.internal.getFontSize(),r=this.internal.getFont().fontStyle;var n=19.049976/25.4,o;return o=document.createElement("font"),o.id="jsPDFCell",o.style.fontStyle=r,o.style.fontName=e,o.style.fontSize=s+"pt",o.innerText=t,document.body.appendChild(o),t={w:(o.offsetWidth+1)*n,h:(o.offsetHeight+1)*n},document.body.removeChild(o),t},t.cellAddPage=function(){this.addPage(),o={x:void 0,y:void 0,w:void 0,h:void 0,ln:void 0},i+=1},t.cellInitialize=function(){o={x:void 0,y:void 0,w:void 0,h:void 0,ln:void 0},i=1},t.cell=function(t,e,s,r,n,i,a){var u=o;if(void 0!==u.ln&&(u.ln===i?(t=u.x+u.w,e=u.y):(u.y+u.h+r+13>=this.internal.pageSize.height&&(this.cellAddPage(),this.printHeaders&&this.tableHeaderRow&&this.printHeaderRow(i)),e=o.y+o.h)),""!==n[0])if(this.printingHeaderRow?this.rect(t,e,s,r,"FD"):this.rect(t,e,s,r),"right"===a){if(n instanceof Array)for(a=0;a<n.length;a++){var u=n[a],c=this.getStringUnitWidth(u)*this.internal.getFontSize();this.text(u,t+s-c-3,e+this.internal.getLineHeight()*(a+1))}}else this.text(n,t+3,e+this.internal.getLineHeight());return o={x:t,y:e,w:s,h:r,ln:i},this},t.getKeys="function"==typeof Object.keys?function(t){return t?Object.keys(t):[]}:function(t){var e=[],s;for(s in t)t.hasOwnProperty(s)&&e.push(s);return e},t.arrayMax=function(t,e){var s=t[0],r,n,o;for(r=0,n=t.length;n>r;r+=1)o=t[r],e?-1===e(s,o)&&(s=o):o>s&&(s=o);return s},t.table=function(e,s,r){var n=[],o=[],i,a,u,c={},l={},f,d,w=[],m,h=[],p;if(this.lnMod=0,r&&(this.printHeaders=r.printHeaders||!0),!e)throw"No data for PDF table";if(void 0===s||null===s)n=this.getKeys(e[0]);else if(s[0]&&"string"!=typeof s[0])for(a=0,u=s.length;u>a;a+=1)i=s[a],n.push(i.name),o.push(i.prompt),l[i.name]=i.width;else n=s;if(r.autoSize)for(p=function(t){return t[i]},a=0,u=n.length;u>a;a+=1){for(i=n[a],c[i]=e.map(p),w.push(this.getTextDimensions(o[a]||i).w),d=c[i],m=0,u=d.length;u>m;m+=1)f=d[m],w.push(this.getTextDimensions(f).w);l[i]=t.arrayMax(w)}if(r.printHeaders){for(r=this.calculateLineHeight(n,l,o.length?o:n),a=0,u=n.length;u>a;a+=1)i=n[a],h.push([13,13,l[i],r,String(o.length?o[a]:i)]);this.setTableHeaderRow(h),this.printHeaderRow(1)}for(a=0,u=e.length;u>a;a+=1)for(o=e[a],r=this.calculateLineHeight(n,l,o),m=0,h=n.length;h>m;m+=1)i=n[m],this.cell(13,13,l[i],r,o[i],a+2,s[m].align);return this},t.calculateLineHeight=function(t,e,s){for(var r,n=0,o=0;o<t.length;o++)r=t[o],s[r]=this.splitTextToSize(String(s[r]),e[r]-3),r=this.internal.getLineHeight()*s[r].length+3,r>n&&(n=r);return n},t.setTableHeaderRow=function(t){this.tableHeaderRow=t},t.printHeaderRow=function(t){if(!this.tableHeaderRow)throw"Property tableHeaderRow does not exist.";var e,s,r;for(this.printingHeaderRow=!0,void 0!==n&&(s=n(this,i),o={x:s[0],y:s[1],w:s[2],h:s[3],ln:-1}),this.setFontStyle("bold"),s=0,r=this.tableHeaderRow.length;r>s;s+=1)this.setFillColor(200,200,200),e=this.tableHeaderRow[s],e=[].concat(e),this.cell.apply(this,e.concat(t));this.setFontStyle("normal"),this.printingHeaderRow=!1}}(jsPDF.API),function(t){t.putTotalPages=function(t){t=RegExp(t,"g");for(var e=1;e<=this.internal.getNumberOfPages();e++)for(var s=0;s<this.internal.pages[e].length;s++)this.internal.pages[e][s]=this.internal.pages[e][s].replace(t,this.internal.getNumberOfPages());return this}}(jsPDF.API);var BlobBuilder=BlobBuilder||self.WebKitBlobBuilder||self.MozBlobBuilder||self.MSBlobBuilder||function(t){var e=function(t){return Object.prototype.toString.call(t).match(/^\[object\s(.*)\]$/)[1]},s=function(){this.data=[]},r=function(t,e,s){this.data=t,this.size=t.length,this.type=e,this.encoding=s},n=s.prototype,o=r.prototype,i=t.FileReaderSync,a=function(t){this.code=this[this.name=t]},u="NOT_FOUND_ERR SECURITY_ERR ABORT_ERR NOT_READABLE_ERR ENCODING_ERR NO_MODIFICATION_ALLOWED_ERR INVALID_STATE_ERR SYNTAX_ERR".split(" "),c=u.length,l=t.URL||t.webkitURL||t,f=l.createObjectURL,d=l.revokeObjectURL,w=l,m=t.btoa,h=t.atob,p=!1,y=function(t){p=!t},v=t.ArrayBuffer,_=t.Uint8Array;for(s.fake=o.fake=!0;c--;)a.prototype[u[c]]=c+1;try{_&&y.apply(0,new _(1))}catch(g){}return l.createObjectURL||(w=t.URL={}),w.createObjectURL=function(t){var e=t.type;return null===e&&(e="application/octet-stream"),t instanceof r?(e="data:"+e,"base64"===t.encoding?e+";base64,"+t.data:"URI"===t.encoding?e+","+decodeURIComponent(t.data):m?e+";base64,"+m(t.data):e+","+encodeURIComponent(t.data)):f?f.call(l,t):void 0},w.revokeObjectURL=function(t){"data:"!==t.substring(0,5)&&d&&d.call(l,t)},n.append=function(t){var s=this.data;if(_&&t instanceof v)if(p)s.push(String.fromCharCode.apply(String,new _(t)));else{s="",t=new _(t);for(var n=0,o=t.length;o>n;n++)s+=String.fromCharCode(t[n])}else if("Blob"===e(t)||"File"===e(t)){if(!i)throw new a("NOT_READABLE_ERR");n=new i,s.push(n.readAsBinaryString(t))}else t instanceof r?"base64"===t.encoding&&h?s.push(h(t.data)):"URI"===t.encoding?s.push(decodeURIComponent(t.data)):"raw"===t.encoding&&s.push(t.data):("string"!=typeof t&&(t+=""),s.push(unescape(encodeURIComponent(t))))},n.getBlob=function(t){return arguments.length||(t=null),new r(this.data.join(""),t,"raw")},n.toString=function(){return"[object BlobBuilder]"},o.slice=function(t,e,s){var n=arguments.length;return 3>n&&(s=null),new r(this.data.slice(t,n>1?e:this.data.length),s,this.encoding)},o.toString=function(){return"[object Blob]"},s}(self),saveAs=saveAs||navigator.msSaveBlob&&navigator.msSaveBlob.bind(navigator)||function(t){var e=t.document,s=t.URL||t.webkitURL||t,r=e.createElementNS("http://www.w3.org/1999/xhtml","a"),n="download"in r,o=function(s){var r=e.createEvent("MouseEvents");return r.initMouseEvent("click",!0,!1,t,0,0,0,0,0,!1,!1,!1,!1,0,null),s.dispatchEvent(r)},i=t.webkitRequestFileSystem,a=t.requestFileSystem||i||t.mozRequestFileSystem,u=function(e){(t.setImmediate||t.setTimeout)(function(){throw e},0)},c=0,l=[],f=function(t,e,s){e=[].concat(e);for(var r=e.length;r--;){var n=t["on"+e[r]];if("function"==typeof n)try{n.call(t,s||t)}catch(o){u(o)}}},d=function(e,s){var u=this,d=e.type,w=!1,m,h,p=function(){var s=(t.URL||t.webkitURL||t).createObjectURL(e);return l.push(s),s},y=function(){f(u,["writestart","progress","write","writeend"])},v=function(){(w||!m)&&(m=p(e)),h&&(h.location.href=m),u.readyState=u.DONE,y()},_=function(t){return function(){return u.readyState!==u.DONE?t.apply(this,arguments):void 0}},g={create:!0,exclusive:!1},q;return u.readyState=u.INIT,s||(s="download"),n&&(m=p(e),r.href=m,r.download=s,o(r))?(u.readyState=u.DONE,void y()):(t.chrome&&d&&"application/octet-stream"!==d&&(q=e.slice||e.webkitSlice,e=q.call(e,0,e.size,"application/octet-stream"),w=!0),i&&"download"!==s&&(s+=".download"),h="application/octet-stream"===d||i?t:t.open(),void(a?(c+=e.size,a(t.TEMPORARY,c,_(function(t){t.root.getDirectory("saved",g,_(function(t){var r=function(){t.getFile(s,g,_(function(t){t.createWriter(_(function(s){s.onwriteend=function(e){h.location.href=t.toURL(),l.push(t),u.readyState=u.DONE,f(u,"writeend",e)},s.onerror=function(){var t=s.error;t.code!==t.ABORT_ERR&&v()},["writestart","progress","write","abort"].forEach(function(t){s["on"+t]=u["on"+t]}),s.write(e),u.abort=function(){s.abort(),u.readyState=u.DONE},u.readyState=u.WRITING}),v)}),v)};t.getFile(s,{create:!1},_(function(t){t.remove(),r()}),_(function(t){t.code===t.NOT_FOUND_ERR?r():v()}))}),v)}),v)):v()))},w=d.prototype;return w.abort=function(){this.readyState=this.DONE,f(this,"abort")},w.readyState=w.INIT=0,w.WRITING=1,w.DONE=2,w.error=w.onwritestart=w.onprogress=w.onwrite=w.onabort=w.onerror=w.onwriteend=null,t.addEventListener("unload",function(){for(var t=l.length;t--;){var e=l[t];"string"==typeof e?s.revokeObjectURL(e):e.remove()}l.length=0},!1),function(t,e){return new d(t,e)}}(self),MAX_BITS=15,D_CODES=30,BL_CODES=19,LENGTH_CODES=29,LITERALS=256,L_CODES=LITERALS+1+LENGTH_CODES,HEAP_SIZE=2*L_CODES+1,END_BLOCK=256,MAX_BL_BITS=7,REP_3_6=16,REPZ_3_10=17,REPZ_11_138=18,Buf_size=16,Z_DEFAULT_COMPRESSION=-1,Z_FILTERED=1,Z_HUFFMAN_ONLY=2,Z_DEFAULT_STRATEGY=0,Z_NO_FLUSH=0,Z_PARTIAL_FLUSH=1,Z_FULL_FLUSH=3,Z_FINISH=4,Z_OK=0,Z_STREAM_END=1,Z_NEED_DICT=2,Z_STREAM_ERROR=-2,Z_DATA_ERROR=-3,Z_BUF_ERROR=-5,_dist_code=[0,1,2,3,4,4,5,5,6,6,6,6,7,7,7,7,8,8,8,8,8,8,8,8,9,9,9,9,9,9,9,9,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,0,0,16,17,18,18,19,19,20,20,20,20,21,21,21,21,22,22,22,22,22,22,22,22,23,23,23,23,23,23,23,23,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29];Tree._length_code=[0,1,2,3,4,5,6,7,8,8,9,9,10,10,11,11,12,12,12,12,13,13,13,13,14,14,14,14,15,15,15,15,16,16,16,16,16,16,16,16,17,17,17,17,17,17,17,17,18,18,18,18,18,18,18,18,19,19,19,19,19,19,19,19,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,28],Tree.base_length=[0,1,2,3,4,5,6,7,8,10,12,14,16,20,24,28,32,40,48,56,64,80,96,112,128,160,192,224,0],Tree.base_dist=[0,1,2,3,4,6,8,12,16,24,32,48,64,96,128,192,256,384,512,768,1024,1536,2048,3072,4096,6144,8192,12288,16384,24576],Tree.d_code=function(t){return 256>t?_dist_code[t]:_dist_code[256+(t>>>7)]},Tree.extra_lbits=[0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0],Tree.extra_dbits=[0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13],Tree.extra_blbits=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,7],Tree.bl_order=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15],StaticTree.static_ltree=[12,8,140,8,76,8,204,8,44,8,172,8,108,8,236,8,28,8,156,8,92,8,220,8,60,8,188,8,124,8,252,8,2,8,130,8,66,8,194,8,34,8,162,8,98,8,226,8,18,8,146,8,82,8,210,8,50,8,178,8,114,8,242,8,10,8,138,8,74,8,202,8,42,8,170,8,106,8,234,8,26,8,154,8,90,8,218,8,58,8,186,8,122,8,250,8,6,8,134,8,70,8,198,8,38,8,166,8,102,8,230,8,22,8,150,8,86,8,214,8,54,8,182,8,118,8,246,8,14,8,142,8,78,8,206,8,46,8,174,8,110,8,238,8,30,8,158,8,94,8,222,8,62,8,190,8,126,8,254,8,1,8,129,8,65,8,193,8,33,8,161,8,97,8,225,8,17,8,145,8,81,8,209,8,49,8,177,8,113,8,241,8,9,8,137,8,73,8,201,8,41,8,169,8,105,8,233,8,25,8,153,8,89,8,217,8,57,8,185,8,121,8,249,8,5,8,133,8,69,8,197,8,37,8,165,8,101,8,229,8,21,8,149,8,85,8,213,8,53,8,181,8,117,8,245,8,13,8,141,8,77,8,205,8,45,8,173,8,109,8,237,8,29,8,157,8,93,8,221,8,61,8,189,8,125,8,253,8,19,9,275,9,147,9,403,9,83,9,339,9,211,9,467,9,51,9,307,9,179,9,435,9,115,9,371,9,243,9,499,9,11,9,267,9,139,9,395,9,75,9,331,9,203,9,459,9,43,9,299,9,171,9,427,9,107,9,363,9,235,9,491,9,27,9,283,9,155,9,411,9,91,9,347,9,219,9,475,9,59,9,315,9,187,9,443,9,123,9,379,9,251,9,507,9,7,9,263,9,135,9,391,9,71,9,327,9,199,9,455,9,39,9,295,9,167,9,423,9,103,9,359,9,231,9,487,9,23,9,279,9,151,9,407,9,87,9,343,9,215,9,471,9,55,9,311,9,183,9,439,9,119,9,375,9,247,9,503,9,15,9,271,9,143,9,399,9,79,9,335,9,207,9,463,9,47,9,303,9,175,9,431,9,111,9,367,9,239,9,495,9,31,9,287,9,159,9,415,9,95,9,351,9,223,9,479,9,63,9,319,9,191,9,447,9,127,9,383,9,255,9,511,9,0,7,64,7,32,7,96,7,16,7,80,7,48,7,112,7,8,7,72,7,40,7,104,7,24,7,88,7,56,7,120,7,4,7,68,7,36,7,100,7,20,7,84,7,52,7,116,7,3,8,131,8,67,8,195,8,35,8,163,8,99,8,227,8],
StaticTree.static_dtree=[0,5,16,5,8,5,24,5,4,5,20,5,12,5,28,5,2,5,18,5,10,5,26,5,6,5,22,5,14,5,30,5,1,5,17,5,9,5,25,5,5,5,21,5,13,5,29,5,3,5,19,5,11,5,27,5,7,5,23,5],StaticTree.static_l_desc=new StaticTree(StaticTree.static_ltree,Tree.extra_lbits,LITERALS+1,L_CODES,MAX_BITS),StaticTree.static_d_desc=new StaticTree(StaticTree.static_dtree,Tree.extra_dbits,0,D_CODES,MAX_BITS),StaticTree.static_bl_desc=new StaticTree(null,Tree.extra_blbits,0,BL_CODES,MAX_BL_BITS);var MAX_MEM_LEVEL=9,DEF_MEM_LEVEL=8,STORED=0,FAST=1,SLOW=2,config_table=[new Config(0,0,0,0,STORED),new Config(4,4,8,4,FAST),new Config(4,5,16,8,FAST),new Config(4,6,32,32,FAST),new Config(4,4,16,16,SLOW),new Config(8,16,32,32,SLOW),new Config(8,16,128,128,SLOW),new Config(8,32,128,256,SLOW),new Config(32,128,258,1024,SLOW),new Config(32,258,258,4096,SLOW)],z_errmsg="need dictionary;stream end;;;stream error;data error;;buffer error;;".split(";"),NeedMore=0,BlockDone=1,FinishStarted=2,FinishDone=3,PRESET_DICT=32,INIT_STATE=42,BUSY_STATE=113,FINISH_STATE=666,Z_DEFLATED=8,STORED_BLOCK=0,STATIC_TREES=1,DYN_TREES=2,MIN_MATCH=3,MAX_MATCH=258,MIN_LOOKAHEAD=MAX_MATCH+MIN_MATCH+1;ZStream.prototype={deflateInit:function(t,e){return this.dstate=new Deflate,e||(e=MAX_BITS),this.dstate.deflateInit(this,t,e)},deflate:function(t){return this.dstate?this.dstate.deflate(this,t):Z_STREAM_ERROR},deflateEnd:function(){if(!this.dstate)return Z_STREAM_ERROR;var t=this.dstate.deflateEnd();return this.dstate=null,t},deflateParams:function(t,e){return this.dstate?this.dstate.deflateParams(this,t,e):Z_STREAM_ERROR},deflateSetDictionary:function(t,e){return this.dstate?this.dstate.deflateSetDictionary(this,t,e):Z_STREAM_ERROR},read_buf:function(t,e,s){var r=this.avail_in;return r>s&&(r=s),0===r?0:(this.avail_in-=r,t.set(this.next_in.subarray(this.next_in_index,this.next_in_index+r),e),this.next_in_index+=r,this.total_in+=r,r)},flush_pending:function(){var t=this.dstate.pending;t>this.avail_out&&(t=this.avail_out),0!==t&&(this.next_out.set(this.dstate.pending_buf.subarray(this.dstate.pending_out,this.dstate.pending_out+t),this.next_out_index),this.next_out_index+=t,this.dstate.pending_out+=t,this.total_out+=t,this.avail_out-=t,this.dstate.pending-=t,0===this.dstate.pending&&(this.dstate.pending_out=0))}},void function(t,e){"object"==typeof module?module.exports=e():"function"==typeof define?define(e):t.adler32cs=e()}(this,function(){var t="function"==typeof ArrayBuffer&&"function"==typeof Uint8Array,e=null,s=function(){if(!t)return function(){return!1};try{var s=require("buffer");"function"==typeof s.Buffer&&(e=s.Buffer)}catch(r){}return function(t){return t instanceof ArrayBuffer||null!==e&&t instanceof e}}(),r=function(){return null!==e?function(t){return new e(t,"utf8").toString("binary")}:function(t){return unescape(encodeURIComponent(t))}}(),n=function(t,e){for(var s=65535&t,r=t>>>16,n=0,o=e.length;o>n;n++)s=(s+(255&e.charCodeAt(n)))%65521,r=(r+s)%65521;return(r<<16|s)>>>0},o=function(t,e){for(var s=65535&t,r=t>>>16,n=0,o=e.length;o>n;n++)s=(s+e[n])%65521,r=(r+s)%65521;return(r<<16|s)>>>0},i={},a=i.Adler32=function(){var e=function(t){if(!(this instanceof e))throw new TypeError("Constructor cannot called be as a function.");if(!isFinite(t=null==t?1:+t))throw Error("First arguments needs to be a finite number.");this.checksum=t>>>0},i=e.prototype={};return i.constructor=e,e.from=function(t){return t.prototype=i,t}(function(t){if(!(this instanceof e))throw new TypeError("Constructor cannot called be as a function.");if(null==t)throw Error("First argument needs to be a string.");this.checksum=n(1,t.toString())}),e.fromUtf8=function(t){return t.prototype=i,t}(function(t){if(!(this instanceof e))throw new TypeError("Constructor cannot called be as a function.");if(null==t)throw Error("First argument needs to be a string.");t=r(t.toString()),this.checksum=n(1,t)}),t&&(e.fromBuffer=function(t){return t.prototype=i,t}(function(t){if(!(this instanceof e))throw new TypeError("Constructor cannot called be as a function.");if(!s(t))throw Error("First argument needs to be ArrayBuffer.");return t=new Uint8Array(t),this.checksum=o(1,t)})),i.update=function(t){if(null==t)throw Error("First argument needs to be a string.");return t=t.toString(),this.checksum=n(this.checksum,t)},i.updateUtf8=function(t){if(null==t)throw Error("First argument needs to be a string.");return t=r(t.toString()),this.checksum=n(this.checksum,t)},t&&(i.updateBuffer=function(t){if(!s(t))throw Error("First argument needs to be ArrayBuffer.");return t=new Uint8Array(t),this.checksum=o(this.checksum,t)}),i.clone=function(){return new a(this.checksum)},e}();return i.from=function(t){if(null==t)throw Error("First argument needs to be a string.");return n(1,t.toString())},i.fromUtf8=function(t){if(null==t)throw Error("First argument needs to be a string.");return t=r(t.toString()),n(1,t)},t&&(i.fromBuffer=function(t){if(!s(t))throw Error("First argument need to be ArrayBuffer.");return t=new Uint8Array(t),o(1,t)}),i});

var QRCode;!function(){function t(t){this.mode=u.MODE_8BIT_BYTE,this.data=t,this.parsedData=[];for(var e=0,r=this.data.length;r>e;e++){var o=[],i=this.data.charCodeAt(e);i>65536?(o[0]=240|(1835008&i)>>>18,o[1]=128|(258048&i)>>>12,o[2]=128|(4032&i)>>>6,o[3]=128|63&i):i>2048?(o[0]=224|(61440&i)>>>12,o[1]=128|(4032&i)>>>6,o[2]=128|63&i):i>128?(o[0]=192|(1984&i)>>>6,o[1]=128|63&i):o[0]=i,this.parsedData.push(o)}this.parsedData=Array.prototype.concat.apply([],this.parsedData),this.parsedData.length!=this.data.length&&(this.parsedData.unshift(191),this.parsedData.unshift(187),this.parsedData.unshift(239))}function e(t,e){this.typeNumber=t,this.errorCorrectLevel=e,this.modules=null,this.moduleCount=0,this.dataCache=null,this.dataList=[]}function r(t,e){if(void 0==t.length)throw new Error(t.length+"/"+e);for(var r=0;r<t.length&&0==t[r];)r++;this.num=new Array(t.length-r+e);for(var o=0;o<t.length-r;o++)this.num[o]=t[o+r]}function o(t,e){this.totalCount=t,this.dataCount=e}function i(){this.buffer=[],this.length=0}function n(){return"undefined"!=typeof CanvasRenderingContext2D}function a(){var t=!1,e=navigator.userAgent;if(/android/i.test(e)){t=!0;var r=e.toString().match(/android ([0-9]\.[0-9])/i);r&&r[1]&&(t=parseFloat(r[1]))}return t}function s(t,e){for(var r=1,o=h(t),i=0,n=p.length;n>=i;i++){var a=0;switch(e){case l.L:a=p[i][0];break;case l.M:a=p[i][1];break;case l.Q:a=p[i][2];break;case l.H:a=p[i][3]}if(a>=o)break;r++}if(r>p.length)throw new Error("Too long data");return r}function h(t){var e=encodeURI(t).toString().replace(/\%[0-9a-fA-F]{2}/g,"a");return e.length+(e.length!=t?3:0)}t.prototype={getLength:function(t){return this.parsedData.length},write:function(t){for(var e=0,r=this.parsedData.length;r>e;e++)t.put(this.parsedData[e],8)}},e.prototype={addData:function(e){var r=new t(e);this.dataList.push(r),this.dataCache=null},isDark:function(t,e){if(0>t||this.moduleCount<=t||0>e||this.moduleCount<=e)throw new Error(t+","+e);return this.modules[t][e]},getModuleCount:function(){return this.moduleCount},make:function(){this.makeImpl(!1,this.getBestMaskPattern())},makeImpl:function(t,r){this.moduleCount=4*this.typeNumber+17,this.modules=new Array(this.moduleCount);for(var o=0;o<this.moduleCount;o++){this.modules[o]=new Array(this.moduleCount);for(var i=0;i<this.moduleCount;i++)this.modules[o][i]=null}this.setupPositionProbePattern(0,0),this.setupPositionProbePattern(this.moduleCount-7,0),this.setupPositionProbePattern(0,this.moduleCount-7),this.setupPositionAdjustPattern(),this.setupTimingPattern(),this.setupTypeInfo(t,r),this.typeNumber>=7&&this.setupTypeNumber(t),null==this.dataCache&&(this.dataCache=e.createData(this.typeNumber,this.errorCorrectLevel,this.dataList)),this.mapData(this.dataCache,r)},setupPositionProbePattern:function(t,e){for(var r=-1;7>=r;r++)if(!(-1>=t+r||this.moduleCount<=t+r))for(var o=-1;7>=o;o++)-1>=e+o||this.moduleCount<=e+o||(r>=0&&6>=r&&(0==o||6==o)||o>=0&&6>=o&&(0==r||6==r)||r>=2&&4>=r&&o>=2&&4>=o?this.modules[t+r][e+o]=!0:this.modules[t+r][e+o]=!1)},getBestMaskPattern:function(){for(var t=0,e=0,r=0;8>r;r++){this.makeImpl(!0,r);var o=f.getLostPoint(this);(0==r||t>o)&&(t=o,e=r)}return e},createMovieClip:function(t,e,r){var o=t.createEmptyMovieClip(e,r),i=1;this.make();for(var n=0;n<this.modules.length;n++)for(var a=n*i,s=0;s<this.modules[n].length;s++){var h=s*i,u=this.modules[n][s];u&&(o.beginFill(0,100),o.moveTo(h,a),o.lineTo(h+i,a),o.lineTo(h+i,a+i),o.lineTo(h,a+i),o.endFill())}return o},setupTimingPattern:function(){for(var t=8;t<this.moduleCount-8;t++)null==this.modules[t][6]&&(this.modules[t][6]=t%2==0);for(var e=8;e<this.moduleCount-8;e++)null==this.modules[6][e]&&(this.modules[6][e]=e%2==0)},setupPositionAdjustPattern:function(){for(var t=f.getPatternPosition(this.typeNumber),e=0;e<t.length;e++)for(var r=0;r<t.length;r++){var o=t[e],i=t[r];if(null==this.modules[o][i])for(var n=-2;2>=n;n++)for(var a=-2;2>=a;a++)-2==n||2==n||-2==a||2==a||0==n&&0==a?this.modules[o+n][i+a]=!0:this.modules[o+n][i+a]=!1}},setupTypeNumber:function(t){for(var e=f.getBCHTypeNumber(this.typeNumber),r=0;18>r;r++){var o=!t&&1==(e>>r&1);this.modules[Math.floor(r/3)][r%3+this.moduleCount-8-3]=o}for(var r=0;18>r;r++){var o=!t&&1==(e>>r&1);this.modules[r%3+this.moduleCount-8-3][Math.floor(r/3)]=o}},setupTypeInfo:function(t,e){for(var r=this.errorCorrectLevel<<3|e,o=f.getBCHTypeInfo(r),i=0;15>i;i++){var n=!t&&1==(o>>i&1);6>i?this.modules[i][8]=n:8>i?this.modules[i+1][8]=n:this.modules[this.moduleCount-15+i][8]=n}for(var i=0;15>i;i++){var n=!t&&1==(o>>i&1);8>i?this.modules[8][this.moduleCount-i-1]=n:9>i?this.modules[8][15-i-1+1]=n:this.modules[8][15-i-1]=n}this.modules[this.moduleCount-8][8]=!t},mapData:function(t,e){for(var r=-1,o=this.moduleCount-1,i=7,n=0,a=this.moduleCount-1;a>0;a-=2)for(6==a&&a--;;){for(var s=0;2>s;s++)if(null==this.modules[o][a-s]){var h=!1;n<t.length&&(h=1==(t[n]>>>i&1));var u=f.getMask(e,o,a-s);u&&(h=!h),this.modules[o][a-s]=h,i--,-1==i&&(n++,i=7)}if(o+=r,0>o||this.moduleCount<=o){o-=r,r=-r;break}}}},e.PAD0=236,e.PAD1=17,e.createData=function(t,r,n){for(var a=o.getRSBlocks(t,r),s=new i,h=0;h<n.length;h++){var u=n[h];s.put(u.mode,4),s.put(u.getLength(),f.getLengthInBits(u.mode,t)),u.write(s)}for(var l=0,h=0;h<a.length;h++)l+=a[h].dataCount;if(s.getLengthInBits()>8*l)throw new Error("code length overflow. ("+s.getLengthInBits()+">"+8*l+")");for(s.getLengthInBits()+4<=8*l&&s.put(0,4);s.getLengthInBits()%8!=0;)s.putBit(!1);for(;;){if(s.getLengthInBits()>=8*l)break;if(s.put(e.PAD0,8),s.getLengthInBits()>=8*l)break;s.put(e.PAD1,8)}return e.createBytes(s,a)},e.createBytes=function(t,e){for(var o=0,i=0,n=0,a=new Array(e.length),s=new Array(e.length),h=0;h<e.length;h++){var u=e[h].dataCount,l=e[h].totalCount-u;i=Math.max(i,u),n=Math.max(n,l),a[h]=new Array(u);for(var g=0;g<a[h].length;g++)a[h][g]=255&t.buffer[g+o];o+=u;var d=f.getErrorCorrectPolynomial(l),c=new r(a[h],d.getLength()-1),p=c.mod(d);s[h]=new Array(d.getLength()-1);for(var g=0;g<s[h].length;g++){var m=g+p.getLength()-s[h].length;s[h][g]=m>=0?p.get(m):0}}for(var v=0,g=0;g<e.length;g++)v+=e[g].totalCount;for(var _=new Array(v),C=0,g=0;i>g;g++)for(var h=0;h<e.length;h++)g<a[h].length&&(_[C++]=a[h][g]);for(var g=0;n>g;g++)for(var h=0;h<e.length;h++)g<s[h].length&&(_[C++]=s[h][g]);return _};for(var u={MODE_NUMBER:1,MODE_ALPHA_NUM:2,MODE_8BIT_BYTE:4,MODE_KANJI:8},l={L:1,M:0,Q:3,H:2},g={PATTERN000:0,PATTERN001:1,PATTERN010:2,PATTERN011:3,PATTERN100:4,PATTERN101:5,PATTERN110:6,PATTERN111:7},f={PATTERN_POSITION_TABLE:[[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50],[6,30,54],[6,32,58],[6,34,62],[6,26,46,66],[6,26,48,70],[6,26,50,74],[6,30,54,78],[6,30,56,82],[6,30,58,86],[6,34,62,90],[6,28,50,72,94],[6,26,50,74,98],[6,30,54,78,102],[6,28,54,80,106],[6,32,58,84,110],[6,30,58,86,114],[6,34,62,90,118],[6,26,50,74,98,122],[6,30,54,78,102,126],[6,26,52,78,104,130],[6,30,56,82,108,134],[6,34,60,86,112,138],[6,30,58,86,114,142],[6,34,62,90,118,146],[6,30,54,78,102,126,150],[6,24,50,76,102,128,154],[6,28,54,80,106,132,158],[6,32,58,84,110,136,162],[6,26,54,82,110,138,166],[6,30,58,86,114,142,170]],G15:1335,G18:7973,G15_MASK:21522,getBCHTypeInfo:function(t){for(var e=t<<10;f.getBCHDigit(e)-f.getBCHDigit(f.G15)>=0;)e^=f.G15<<f.getBCHDigit(e)-f.getBCHDigit(f.G15);return(t<<10|e)^f.G15_MASK},getBCHTypeNumber:function(t){for(var e=t<<12;f.getBCHDigit(e)-f.getBCHDigit(f.G18)>=0;)e^=f.G18<<f.getBCHDigit(e)-f.getBCHDigit(f.G18);return t<<12|e},getBCHDigit:function(t){for(var e=0;0!=t;)e++,t>>>=1;return e},getPatternPosition:function(t){return f.PATTERN_POSITION_TABLE[t-1]},getMask:function(t,e,r){switch(t){case g.PATTERN000:return(e+r)%2==0;case g.PATTERN001:return e%2==0;case g.PATTERN010:return r%3==0;case g.PATTERN011:return(e+r)%3==0;case g.PATTERN100:return(Math.floor(e/2)+Math.floor(r/3))%2==0;case g.PATTERN101:return e*r%2+e*r%3==0;case g.PATTERN110:return(e*r%2+e*r%3)%2==0;case g.PATTERN111:return(e*r%3+(e+r)%2)%2==0;default:throw new Error("bad maskPattern:"+t)}},getErrorCorrectPolynomial:function(t){for(var e=new r([1],0),o=0;t>o;o++)e=e.multiply(new r([1,d.gexp(o)],0));return e},getLengthInBits:function(t,e){if(e>=1&&10>e)switch(t){case u.MODE_NUMBER:return 10;case u.MODE_ALPHA_NUM:return 9;case u.MODE_8BIT_BYTE:return 8;case u.MODE_KANJI:return 8;default:throw new Error("mode:"+t)}else if(27>e)switch(t){case u.MODE_NUMBER:return 12;case u.MODE_ALPHA_NUM:return 11;case u.MODE_8BIT_BYTE:return 16;case u.MODE_KANJI:return 10;default:throw new Error("mode:"+t)}else{if(!(41>e))throw new Error("type:"+e);switch(t){case u.MODE_NUMBER:return 14;case u.MODE_ALPHA_NUM:return 13;case u.MODE_8BIT_BYTE:return 16;case u.MODE_KANJI:return 12;default:throw new Error("mode:"+t)}}},getLostPoint:function(t){for(var e=t.getModuleCount(),r=0,o=0;e>o;o++)for(var i=0;e>i;i++){for(var n=0,a=t.isDark(o,i),s=-1;1>=s;s++)if(!(0>o+s||o+s>=e))for(var h=-1;1>=h;h++)0>i+h||i+h>=e||(0!=s||0!=h)&&a==t.isDark(o+s,i+h)&&n++;n>5&&(r+=3+n-5)}for(var o=0;e-1>o;o++)for(var i=0;e-1>i;i++){var u=0;t.isDark(o,i)&&u++,t.isDark(o+1,i)&&u++,t.isDark(o,i+1)&&u++,t.isDark(o+1,i+1)&&u++,(0==u||4==u)&&(r+=3)}for(var o=0;e>o;o++)for(var i=0;e-6>i;i++)t.isDark(o,i)&&!t.isDark(o,i+1)&&t.isDark(o,i+2)&&t.isDark(o,i+3)&&t.isDark(o,i+4)&&!t.isDark(o,i+5)&&t.isDark(o,i+6)&&(r+=40);for(var i=0;e>i;i++)for(var o=0;e-6>o;o++)t.isDark(o,i)&&!t.isDark(o+1,i)&&t.isDark(o+2,i)&&t.isDark(o+3,i)&&t.isDark(o+4,i)&&!t.isDark(o+5,i)&&t.isDark(o+6,i)&&(r+=40);for(var l=0,i=0;e>i;i++)for(var o=0;e>o;o++)t.isDark(o,i)&&l++;var g=Math.abs(100*l/e/e-50)/5;return r+=10*g}},d={glog:function(t){if(1>t)throw new Error("glog("+t+")");return d.LOG_TABLE[t]},gexp:function(t){for(;0>t;)t+=255;for(;t>=256;)t-=255;return d.EXP_TABLE[t]},EXP_TABLE:new Array(256),LOG_TABLE:new Array(256)},c=0;8>c;c++)d.EXP_TABLE[c]=1<<c;for(var c=8;256>c;c++)d.EXP_TABLE[c]=d.EXP_TABLE[c-4]^d.EXP_TABLE[c-5]^d.EXP_TABLE[c-6]^d.EXP_TABLE[c-8];for(var c=0;255>c;c++)d.LOG_TABLE[d.EXP_TABLE[c]]=c;r.prototype={get:function(t){return this.num[t]},getLength:function(){return this.num.length},multiply:function(t){for(var e=new Array(this.getLength()+t.getLength()-1),o=0;o<this.getLength();o++)for(var i=0;i<t.getLength();i++)e[o+i]^=d.gexp(d.glog(this.get(o))+d.glog(t.get(i)));return new r(e,0)},mod:function(t){if(this.getLength()-t.getLength()<0)return this;for(var e=d.glog(this.get(0))-d.glog(t.get(0)),o=new Array(this.getLength()),i=0;i<this.getLength();i++)o[i]=this.get(i);for(var i=0;i<t.getLength();i++)o[i]^=d.gexp(d.glog(t.get(i))+e);return new r(o,0).mod(t)}},o.RS_BLOCK_TABLE=[[1,26,19],[1,26,16],[1,26,13],[1,26,9],[1,44,34],[1,44,28],[1,44,22],[1,44,16],[1,70,55],[1,70,44],[2,35,17],[2,35,13],[1,100,80],[2,50,32],[2,50,24],[4,25,9],[1,134,108],[2,67,43],[2,33,15,2,34,16],[2,33,11,2,34,12],[2,86,68],[4,43,27],[4,43,19],[4,43,15],[2,98,78],[4,49,31],[2,32,14,4,33,15],[4,39,13,1,40,14],[2,121,97],[2,60,38,2,61,39],[4,40,18,2,41,19],[4,40,14,2,41,15],[2,146,116],[3,58,36,2,59,37],[4,36,16,4,37,17],[4,36,12,4,37,13],[2,86,68,2,87,69],[4,69,43,1,70,44],[6,43,19,2,44,20],[6,43,15,2,44,16],[4,101,81],[1,80,50,4,81,51],[4,50,22,4,51,23],[3,36,12,8,37,13],[2,116,92,2,117,93],[6,58,36,2,59,37],[4,46,20,6,47,21],[7,42,14,4,43,15],[4,133,107],[8,59,37,1,60,38],[8,44,20,4,45,21],[12,33,11,4,34,12],[3,145,115,1,146,116],[4,64,40,5,65,41],[11,36,16,5,37,17],[11,36,12,5,37,13],[5,109,87,1,110,88],[5,65,41,5,66,42],[5,54,24,7,55,25],[11,36,12],[5,122,98,1,123,99],[7,73,45,3,74,46],[15,43,19,2,44,20],[3,45,15,13,46,16],[1,135,107,5,136,108],[10,74,46,1,75,47],[1,50,22,15,51,23],[2,42,14,17,43,15],[5,150,120,1,151,121],[9,69,43,4,70,44],[17,50,22,1,51,23],[2,42,14,19,43,15],[3,141,113,4,142,114],[3,70,44,11,71,45],[17,47,21,4,48,22],[9,39,13,16,40,14],[3,135,107,5,136,108],[3,67,41,13,68,42],[15,54,24,5,55,25],[15,43,15,10,44,16],[4,144,116,4,145,117],[17,68,42],[17,50,22,6,51,23],[19,46,16,6,47,17],[2,139,111,7,140,112],[17,74,46],[7,54,24,16,55,25],[34,37,13],[4,151,121,5,152,122],[4,75,47,14,76,48],[11,54,24,14,55,25],[16,45,15,14,46,16],[6,147,117,4,148,118],[6,73,45,14,74,46],[11,54,24,16,55,25],[30,46,16,2,47,17],[8,132,106,4,133,107],[8,75,47,13,76,48],[7,54,24,22,55,25],[22,45,15,13,46,16],[10,142,114,2,143,115],[19,74,46,4,75,47],[28,50,22,6,51,23],[33,46,16,4,47,17],[8,152,122,4,153,123],[22,73,45,3,74,46],[8,53,23,26,54,24],[12,45,15,28,46,16],[3,147,117,10,148,118],[3,73,45,23,74,46],[4,54,24,31,55,25],[11,45,15,31,46,16],[7,146,116,7,147,117],[21,73,45,7,74,46],[1,53,23,37,54,24],[19,45,15,26,46,16],[5,145,115,10,146,116],[19,75,47,10,76,48],[15,54,24,25,55,25],[23,45,15,25,46,16],[13,145,115,3,146,116],[2,74,46,29,75,47],[42,54,24,1,55,25],[23,45,15,28,46,16],[17,145,115],[10,74,46,23,75,47],[10,54,24,35,55,25],[19,45,15,35,46,16],[17,145,115,1,146,116],[14,74,46,21,75,47],[29,54,24,19,55,25],[11,45,15,46,46,16],[13,145,115,6,146,116],[14,74,46,23,75,47],[44,54,24,7,55,25],[59,46,16,1,47,17],[12,151,121,7,152,122],[12,75,47,26,76,48],[39,54,24,14,55,25],[22,45,15,41,46,16],[6,151,121,14,152,122],[6,75,47,34,76,48],[46,54,24,10,55,25],[2,45,15,64,46,16],[17,152,122,4,153,123],[29,74,46,14,75,47],[49,54,24,10,55,25],[24,45,15,46,46,16],[4,152,122,18,153,123],[13,74,46,32,75,47],[48,54,24,14,55,25],[42,45,15,32,46,16],[20,147,117,4,148,118],[40,75,47,7,76,48],[43,54,24,22,55,25],[10,45,15,67,46,16],[19,148,118,6,149,119],[18,75,47,31,76,48],[34,54,24,34,55,25],[20,45,15,61,46,16]],o.getRSBlocks=function(t,e){var r=o.getRsBlockTable(t,e);if(void 0==r)throw new Error("bad rs block @ typeNumber:"+t+"/errorCorrectLevel:"+e);for(var i=r.length/3,n=[],a=0;i>a;a++)for(var s=r[3*a+0],h=r[3*a+1],u=r[3*a+2],l=0;s>l;l++)n.push(new o(h,u));return n},o.getRsBlockTable=function(t,e){switch(e){case l.L:return o.RS_BLOCK_TABLE[4*(t-1)+0];case l.M:return o.RS_BLOCK_TABLE[4*(t-1)+1];case l.Q:return o.RS_BLOCK_TABLE[4*(t-1)+2];case l.H:return o.RS_BLOCK_TABLE[4*(t-1)+3];default:return}},i.prototype={get:function(t){var e=Math.floor(t/8);return 1==(this.buffer[e]>>>7-t%8&1)},put:function(t,e){for(var r=0;e>r;r++)this.putBit(1==(t>>>e-r-1&1))},getLengthInBits:function(){return this.length},putBit:function(t){var e=Math.floor(this.length/8);this.buffer.length<=e&&this.buffer.push(0),t&&(this.buffer[e]|=128>>>this.length%8),this.length++}};var p=[[17,14,11,7],[32,26,20,14],[53,42,32,24],[78,62,46,34],[106,84,60,44],[134,106,74,58],[154,122,86,64],[192,152,108,84],[230,180,130,98],[271,213,151,119],[321,251,177,137],[367,287,203,155],[425,331,241,177],[458,362,258,194],[520,412,292,220],[586,450,322,250],[644,504,364,280],[718,560,394,310],[792,624,442,338],[858,666,482,382],[929,711,509,403],[1003,779,565,439],[1091,857,611,461],[1171,911,661,511],[1273,997,715,535],[1367,1059,751,593],[1465,1125,805,625],[1528,1190,868,658],[1628,1264,908,698],[1732,1370,982,742],[1840,1452,1030,790],[1952,1538,1112,842],[2068,1628,1168,898],[2188,1722,1228,958],[2303,1809,1283,983],[2431,1911,1351,1051],[2563,1989,1423,1093],[2699,2099,1499,1139],[2809,2213,1579,1219],[2953,2331,1663,1273]],m=function(){var t=function(t,e){this._el=t,this._htOption=e};return t.prototype.draw=function(t){function e(t,e){var r=document.createElementNS("http://www.w3.org/2000/svg",t);for(var o in e)e.hasOwnProperty(o)&&r.setAttribute(o,e[o]);return r}var r=this._htOption,o=this._el,i=t.getModuleCount(),n=Math.floor(r.width/i),a=Math.floor(r.height/i);this.clear();var s=e("svg",{viewBox:"0 0 "+String(i)+" "+String(i),width:"100%",height:"100%",fill:r.colorLight});s.setAttributeNS("http://www.w3.org/2000/xmlns/","xmlns:xlink","http://www.w3.org/1999/xlink"),o.appendChild(s),s.appendChild(e("rect",{fill:r.colorLight,width:"100%",height:"100%"})),s.appendChild(e("rect",{fill:r.colorDark,width:"1",height:"1",id:"template"}));for(var h=0;i>h;h++)for(var u=0;i>u;u++)if(t.isDark(h,u)){var l=e("use",{x:String(u),y:String(h)});l.setAttributeNS("http://www.w3.org/1999/xlink","href","#template"),s.appendChild(l)}},t.prototype.clear=function(){for(;this._el.hasChildNodes();)this._el.removeChild(this._el.lastChild)},t}(),v="svg"===document.documentElement.tagName.toLowerCase(),_=v?m:n()?function(){function t(){this._elImage.src=this._elCanvas.toDataURL("image/png"),this._elImage.style.display="block",this._elCanvas.style.display="none"}function e(t,e){var r=this;if(r._fFail=e,r._fSuccess=t,null===r._bSupportDataURI){var o=document.createElement("img"),i=function(){r._bSupportDataURI=!1,r._fFail&&r._fFail.call(r)},n=function(){r._bSupportDataURI=!0,r._fSuccess&&r._fSuccess.call(r)};return o.onabort=i,o.onerror=i,o.onload=n,void(o.src="data:image/gif;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==")}r._bSupportDataURI===!0&&r._fSuccess?r._fSuccess.call(r):r._bSupportDataURI===!1&&r._fFail&&r._fFail.call(r)}if(this._android&&this._android<=2.1){var r=1/window.devicePixelRatio,o=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(t,e,i,n,a,s,h,u,l){if("nodeName"in t&&/img/i.test(t.nodeName))for(var g=arguments.length-1;g>=1;g--)arguments[g]=arguments[g]*r;else"undefined"==typeof u&&(arguments[1]*=r,arguments[2]*=r,arguments[3]*=r,arguments[4]*=r);o.apply(this,arguments)}}var i=function(t,e){this._bIsPainted=!1,this._android=a(),this._htOption=e,this._elCanvas=document.createElement("canvas"),this._elCanvas.width=e.width,this._elCanvas.height=e.height,t.appendChild(this._elCanvas),this._el=t,this._oContext=this._elCanvas.getContext("2d"),this._bIsPainted=!1,this._elImage=document.createElement("img"),this._elImage.alt="Scan me!",this._elImage.style.display="none",this._el.appendChild(this._elImage),this._bSupportDataURI=null};return i.prototype.draw=function(t){var e=this._elImage,r=this._oContext,o=this._htOption,i=t.getModuleCount(),n=o.width/i,a=o.height/i,s=Math.round(n),h=Math.round(a);e.style.display="none",this.clear();for(var u=0;i>u;u++)for(var l=0;i>l;l++){var g=t.isDark(u,l),f=l*n,d=u*a;r.strokeStyle=g?o.colorDark:o.colorLight,r.lineWidth=1,r.fillStyle=g?o.colorDark:o.colorLight,r.fillRect(f,d,n,a),r.strokeRect(Math.floor(f)+.5,Math.floor(d)+.5,s,h),r.strokeRect(Math.ceil(f)-.5,Math.ceil(d)-.5,s,h)}this._bIsPainted=!0},i.prototype.makeImage=function(){this._bIsPainted&&e.call(this,t)},i.prototype.isPainted=function(){return this._bIsPainted},i.prototype.clear=function(){this._oContext.clearRect(0,0,this._elCanvas.width,this._elCanvas.height),this._bIsPainted=!1},i.prototype.round=function(t){return t?Math.floor(1e3*t)/1e3:t},i}():function(){var t=function(t,e){this._el=t,this._htOption=e};return t.prototype.draw=function(t){for(var e=this._htOption,r=this._el,o=t.getModuleCount(),i=Math.floor(e.width/o),n=Math.floor(e.height/o),a=['<table style="border:0;border-collapse:collapse;">'],s=0;o>s;s++){a.push("<tr>");for(var h=0;o>h;h++)a.push('<td style="border:0;border-collapse:collapse;padding:0;margin:0;width:'+i+"px;height:"+n+"px;background-color:"+(t.isDark(s,h)?e.colorDark:e.colorLight)+';"></td>');a.push("</tr>")}a.push("</table>"),r.innerHTML=a.join("");var u=r.childNodes[0],l=(e.width-u.offsetWidth)/2,g=(e.height-u.offsetHeight)/2;l>0&&g>0&&(u.style.margin=g+"px "+l+"px")},t.prototype.clear=function(){this._el.innerHTML=""},t}();QRCode=function(t,e){if(this._htOption={width:256,height:256,typeNumber:4,colorDark:"#000000",colorLight:"#ffffff",correctLevel:l.H},"string"==typeof e&&(e={text:e}),e)for(var r in e)this._htOption[r]=e[r];"string"==typeof t&&(t=document.getElementById(t)),this._htOption.useSVG&&(_=m),this._android=a(),this._el=t,this._oQRCode=null,this._oDrawing=new _(this._el,this._htOption),this._htOption.text&&this.makeCode(this._htOption.text)},QRCode.prototype.makeCode=function(t){this._oQRCode=new e(s(t,this._htOption.correctLevel),this._htOption.correctLevel),this._oQRCode.addData(t),this._oQRCode.make(),this._el.title=t,this._oDrawing.draw(this._oQRCode),this.makeImage()},QRCode.prototype.makeImage=function(){"function"==typeof this._oDrawing.makeImage&&(!this._android||this._android>=3)&&this._oDrawing.makeImage()},QRCode.prototype.clear=function(){this._oDrawing.clear()},QRCode.CorrectLevel=l}();

!function(t){"use strict";"function"==typeof define&&define.amd?define(["jquery"],t):"object"==typeof exports?module.exports=t(require("jquery")):t(jQuery)}(function($){"use strict";function t(){var t=document.createElement("input");return t.setAttribute("type","range"),"text"!==t.type}function i(t,i){var e=Array.prototype.slice.call(arguments,2);return setTimeout(function(){return t.apply(null,e)},i)}function e(t,i){return i=i||100,function(){if(!t.debouncing){var e=Array.prototype.slice.apply(arguments);t.lastReturnVal=t.apply(window,e),t.debouncing=!0}return clearTimeout(t.debounceTimeout),t.debounceTimeout=setTimeout(function(){t.debouncing=!1},i),t.lastReturnVal}}function n(t){return t&&(0===t.offsetWidth||0===t.offsetHeight||t.open===!1)}function o(t){for(var i=[],e=t.parentNode;n(e);)i.push(e),e=e.parentNode;return i}function s(t,i){function e(t){"undefined"!=typeof t.open&&(t.open=t.open?!1:!0)}var n=o(t),s=n.length,r=[],h=t[i];if(s){for(var a=0;s>a;a++)r[a]=n[a].style.cssText,n[a].style.display="block",n[a].style.height="0",n[a].style.overflow="hidden",n[a].style.visibility="hidden",e(n[a]);h=t[i];for(var l=0;s>l;l++)n[l].style.cssText=r[l],e(n[l])}return h}function r(t,i){var e=parseFloat(t);return Number.isNaN(e)?i:e}function h(t){return t.charAt(0).toUpperCase()+t.substr(1)}function a(t,n){if(this.$window=$(window),this.$document=$(document),this.$element=$(t),this.options=$.extend({},p,n),this.polyfill=this.options.polyfill,this.orientation=this.$element[0].getAttribute("data-orientation")||this.options.orientation,this.onInit=this.options.onInit,this.onSlide=this.options.onSlide,this.onSlideEnd=this.options.onSlideEnd,this.DIMENSION=f.orientation[this.orientation].dimension,this.DIRECTION=f.orientation[this.orientation].direction,this.DIRECTION_STYLE=f.orientation[this.orientation].directionStyle,this.COORDINATE=f.orientation[this.orientation].coordinate,this.polyfill&&u)return!1;this.identifier="js-"+l+"-"+d++,this.startEvent=this.options.startEvent.join("."+this.identifier+" ")+"."+this.identifier,this.moveEvent=this.options.moveEvent.join("."+this.identifier+" ")+"."+this.identifier,this.endEvent=this.options.endEvent.join("."+this.identifier+" ")+"."+this.identifier,this.toFixed=(this.step+"").replace(".","").length-1,this.$fill=$('<div class="'+this.options.fillClass+'" />'),this.$handle=$('<div class="'+this.options.handleClass+'" />'),this.$range=$('<div class="'+this.options.rangeClass+" "+this.options[this.orientation+"Class"]+'" id="'+this.identifier+'" />').insertAfter(this.$element).prepend(this.$fill,this.$handle),this.$element.css({position:"absolute",width:"1px",height:"1px",overflow:"hidden",opacity:"0"}),this.handleDown=$.proxy(this.handleDown,this),this.handleMove=$.proxy(this.handleMove,this),this.handleEnd=$.proxy(this.handleEnd,this),this.init();var o=this;this.$window.on("resize."+this.identifier,e(function(){i(function(){o.update()},300)},20)),this.$document.on(this.startEvent,"#"+this.identifier+":not(."+this.options.disabledClass+")",this.handleDown),this.$element.on("change."+this.identifier,function(t,i){if(!i||i.origin!==o.identifier){var e=t.target.value,n=o.getPositionFromValue(e);o.setPosition(n)}})}Number.isNaN=Number.isNaN||function(t){return"number"==typeof t&&t!==t};var l="rangeslider",d=0,u=t(),p={polyfill:!0,orientation:"horizontal",rangeClass:"rangeslider",disabledClass:"rangeslider--disabled",horizontalClass:"rangeslider--horizontal",verticalClass:"rangeslider--vertical",fillClass:"rangeslider__fill",handleClass:"rangeslider__handle",startEvent:["mousedown","touchstart","pointerdown"],moveEvent:["mousemove","touchmove","pointermove"],endEvent:["mouseup","touchend","pointerup"]},f={orientation:{horizontal:{dimension:"width",direction:"left",directionStyle:"left",coordinate:"x"},vertical:{dimension:"height",direction:"top",directionStyle:"bottom",coordinate:"y"}}};a.prototype.init=function(){this.update(!0,!1),this.onInit&&"function"==typeof this.onInit&&this.onInit()},a.prototype.update=function(t,i){t=t||!1,t&&(this.min=r(this.$element[0].getAttribute("min"),0),this.max=r(this.$element[0].getAttribute("max"),100),this.value=r(this.$element[0].value,Math.round(this.min+(this.max-this.min)/2)),this.step=r(this.$element[0].getAttribute("step"),1)),this.handleDimension=s(this.$handle[0],"offset"+h(this.DIMENSION)),this.rangeDimension=s(this.$range[0],"offset"+h(this.DIMENSION)),this.maxHandlePos=this.rangeDimension-this.handleDimension,this.grabPos=this.handleDimension/2,this.position=this.getPositionFromValue(this.value),this.$element[0].disabled?this.$range.addClass(this.options.disabledClass):this.$range.removeClass(this.options.disabledClass),this.setPosition(this.position,i)},a.prototype.handleDown=function(t){if(this.$document.on(this.moveEvent,this.handleMove),this.$document.on(this.endEvent,this.handleEnd),!((" "+t.target.className+" ").replace(/[\n\t]/g," ").indexOf(this.options.handleClass)>-1)){var i=this.getRelativePosition(t),e=this.$range[0].getBoundingClientRect()[this.DIRECTION],n=this.getPositionFromNode(this.$handle[0])-e,o="vertical"===this.orientation?this.maxHandlePos-(i-this.grabPos):i-this.grabPos;this.setPosition(o),i>=n&&i<n+this.handleDimension&&(this.grabPos=i-n)}},a.prototype.handleMove=function(t){t.preventDefault();var i=this.getRelativePosition(t),e="vertical"===this.orientation?this.maxHandlePos-(i-this.grabPos):i-this.grabPos;this.setPosition(e)},a.prototype.handleEnd=function(t){t.preventDefault(),this.$document.off(this.moveEvent,this.handleMove),this.$document.off(this.endEvent,this.handleEnd),this.$element.trigger("change",{origin:this.identifier}),this.onSlideEnd&&"function"==typeof this.onSlideEnd&&this.onSlideEnd(this.position,this.value)},a.prototype.cap=function(t,i,e){return i>t?i:t>e?e:t},a.prototype.setPosition=function(t,i){var e,n;void 0===i&&(i=!0),e=this.getValueFromPosition(this.cap(t,0,this.maxHandlePos)),n=this.getPositionFromValue(e),this.$fill[0].style[this.DIMENSION]=n+this.grabPos+"px",this.$handle[0].style[this.DIRECTION_STYLE]=n+"px",this.setValue(e),this.position=n,this.value=e,i&&this.onSlide&&"function"==typeof this.onSlide&&this.onSlide(n,e)},a.prototype.getPositionFromNode=function(t){for(var i=0;null!==t;)i+=t.offsetLeft,t=t.offsetParent;return i},a.prototype.getRelativePosition=function(t){var i=h(this.COORDINATE),e=this.$range[0].getBoundingClientRect()[this.DIRECTION],n=0;return"undefined"!=typeof t["page"+i]?n=t["client"+i]:"undefined"!=typeof t.originalEvent["client"+i]?n=t.originalEvent["client"+i]:t.originalEvent.touches&&t.originalEvent.touches[0]&&"undefined"!=typeof t.originalEvent.touches[0]["client"+i]?n=t.originalEvent.touches[0]["client"+i]:t.currentPoint&&"undefined"!=typeof t.currentPoint[this.COORDINATE]&&(n=t.currentPoint[this.COORDINATE]),n-e},a.prototype.getPositionFromValue=function(t){var i,e;return i=(t-this.min)/(this.max-this.min),e=Number.isNaN(i)?0:i*this.maxHandlePos},a.prototype.getValueFromPosition=function(t){var i,e;return i=t/(this.maxHandlePos||1),e=this.step*Math.round(i*(this.max-this.min)/this.step)+this.min,Number(e.toFixed(this.toFixed))},a.prototype.setValue=function(t){(t!==this.value||""===this.$element[0].value)&&this.$element.val(t).trigger("input",{origin:this.identifier})},a.prototype.destroy=function(){this.$document.off("."+this.identifier),this.$window.off("."+this.identifier),this.$element.off("."+this.identifier).removeAttr("style").removeData("plugin_"+l),this.$range&&this.$range.length&&this.$range[0].parentNode.removeChild(this.$range[0])},$.fn[l]=function(t){var i=Array.prototype.slice.call(arguments,1);return this.each(function(){var e=$(this),n=e.data("plugin_"+l);n||e.data("plugin_"+l,n=new a(this,t)),"string"==typeof t&&n[t].apply(n,i)})}});

!function(t){"use strict";"function"==typeof define&&define.amd?define(["jquery"],t):"object"==typeof exports&&"object"==typeof module?module.exports=t:t(jQuery)}(function($,t){"use strict";function e(t,e,r,n){for(var a=[],i=0;i<t.length;i++){var s=t[i];if(s){var o=tinycolor(s),l=o.toHsl().l<.5?"sp-thumb-el sp-thumb-dark":"sp-thumb-el sp-thumb-light";l+=tinycolor.equals(e,s)?" sp-thumb-active":"";var c=o.toString(n.preferredFormat||"rgb"),f=g?"background-color:"+o.toRgbString():"filter:"+o.toFilter();a.push('<span title="'+c+'" data-color="'+o.toRgbString()+'" class="'+l+'"><span class="sp-thumb-inner" style="'+f+';" /></span>')}else{var u="sp-clear-display";a.push($("<div />").append($('<span data-color="" style="background-color:transparent;" class="'+u+'"></span>').attr("title",n.noColorSelectedText)).html())}}return"<div class='sp-cf "+r+"'>"+a.join("")+"</div>"}function r(){for(var t=0;t<d.length;t++)d[t]&&d[t].hide()}function n(t,e){var r=$.extend({},h,t);return r.callbacks={move:l(r.move,e),change:l(r.change,e),show:l(r.show,e),hide:l(r.hide,e),beforeShow:l(r.beforeShow,e)},r}function a(a,s){function l(){if(W.showPaletteOnly&&(W.showPalette=!0),It.text(W.showPaletteOnly?W.togglePaletteMoreText:W.togglePaletteLessText),W.palette){dt=W.palette.slice(0),pt=$.isArray(dt[0])?dt:[dt],gt={};for(var t=0;t<pt.length;t++)for(var e=0;e<pt[t].length;e++){var r=tinycolor(pt[t][e]).toRgbString();gt[r]=!0}}St.toggleClass("sp-flat",X),St.toggleClass("sp-input-disabled",!W.showInput),St.toggleClass("sp-alpha-enabled",W.showAlpha),St.toggleClass("sp-clear-enabled",Ut),St.toggleClass("sp-buttons-disabled",!W.showButtons),St.toggleClass("sp-palette-buttons-disabled",!W.togglePaletteOnly),St.toggleClass("sp-palette-disabled",!W.showPalette),St.toggleClass("sp-palette-only",W.showPaletteOnly),St.toggleClass("sp-initial-disabled",!W.showInitial),St.addClass(W.className).addClass(W.containerClassName),I()}function h(){function t(t){return t.data&&t.data.ignore?(F($(t.target).closest(".sp-thumb-el").data("color")),E()):(F($(t.target).closest(".sp-thumb-el").data("color")),E(),D(!0),W.hideAfterPaletteSelect&&H()),!1}if(p&&St.find("*:not(input)").attr("unselectable","on"),l(),Lt&&xt.after(Kt).hide(),Ut||qt.hide(),X)xt.after(St).hide();else{var e="parent"===W.appendTo?xt.parent():$(W.appendTo);1!==e.length&&(e=$("body")),e.append(St)}m(),Vt.bind("click.spectrum touchstart.spectrum",function(t){kt||P(),t.stopPropagation(),$(t.target).is("input")||t.preventDefault()}),(xt.is(":disabled")||W.disabled===!0)&&K(),St.click(o),Ot.change(C),Ot.bind("paste",function(){setTimeout(C,1)}),Ot.keydown(function(t){13==t.keyCode&&C()}),jt.text(W.cancelText),jt.bind("click.spectrum",function(t){t.stopPropagation(),t.preventDefault(),T(),H()}),qt.attr("title",W.clearText),qt.bind("click.spectrum",function(t){t.stopPropagation(),t.preventDefault(),Jt=!0,E(),X&&D(!0)}),Dt.text(W.chooseText),Dt.bind("click.spectrum",function(t){t.stopPropagation(),t.preventDefault(),p&&Ot.is(":focus")&&Ot.trigger("change"),N()&&(D(!0),H())}),It.text(W.showPaletteOnly?W.togglePaletteMoreText:W.togglePaletteLessText),It.bind("click.spectrum",function(t){t.stopPropagation(),t.preventDefault(),W.showPaletteOnly=!W.showPaletteOnly,W.showPaletteOnly||X||St.css("left","-="+(Ct.outerWidth(!0)+5)),l()}),c(Tt,function(t,e,r){ht=t/st,Jt=!1,r.shiftKey&&(ht=Math.round(10*ht)/10),E()},k,S),c(Mt,function(t,e){ct=parseFloat(e/at),Jt=!1,W.showAlpha||(ht=1),E()},k,S),c(Pt,function(t,e,r){if(r.shiftKey){if(!yt){var n=ft*et,a=rt-ut*rt,i=Math.abs(t-n)>Math.abs(e-a);yt=i?"x":"y"}}else yt=null;var s=!yt||"x"===yt,o=!yt||"y"===yt;s&&(ft=parseFloat(t/et)),o&&(ut=parseFloat((rt-e)/rt)),Jt=!1,W.showAlpha||(ht=1),E()},k,S),Wt?(F(Wt),j(),Gt=Yt||tinycolor(Wt).format,y(Wt)):j(),X&&A();var r=p?"mousedown.spectrum":"click.spectrum touchstart.spectrum";Nt.delegate(".sp-thumb-el",r,t),Et.delegate(".sp-thumb-el:nth-child(1)",r,{ignore:!0},t)}function m(){if(G&&window.localStorage){try{var t=window.localStorage[G].split(",#");t.length>1&&(delete window.localStorage[G],$.each(t,function(t,e){y(e)}))}catch(e){}try{bt=window.localStorage[G].split(";")}catch(e){}}}function y(t){if(Y){var e=tinycolor(t).toRgbString();if(!gt[e]&&-1===$.inArray(e,bt))for(bt.push(e);bt.length>vt;)bt.shift();if(G&&window.localStorage)try{window.localStorage[G]=bt.join(";")}catch(r){}}}function w(){var t=[];if(W.showPalette)for(var e=0;e<bt.length;e++){var r=tinycolor(bt[e]).toRgbString();gt[r]||t.push(bt[e])}return t.reverse().slice(0,W.maxSelectionSize)}function _(){var t=O(),r=$.map(pt,function(r,n){return e(r,t,"sp-palette-row sp-palette-row-"+n,W)});m(),bt&&r.push(e(w(),t,"sp-palette-row sp-palette-row-selection",W)),Nt.html(r.join(""))}function x(){if(W.showInitial){var t=Xt,r=O();Et.html(e([t,r],r,"sp-palette-row-initial",W))}}function k(){(0>=rt||0>=et||0>=at)&&I(),tt=!0,St.addClass(mt),yt=null,xt.trigger("dragstart.spectrum",[O()])}function S(){tt=!1,St.removeClass(mt),xt.trigger("dragstop.spectrum",[O()])}function C(){var t=Ot.val();if(null!==t&&""!==t||!Ut){var e=tinycolor(t);e.isValid()?(F(e),D(!0)):Ot.addClass("sp-validation-error")}else F(null),D(!0)}function P(){Z?H():A()}function A(){var t=$.Event("beforeShow.spectrum");return Z?void I():(xt.trigger(t,[O()]),void(J.beforeShow(O())===!1||t.isDefaultPrevented()||(r(),Z=!0,$(wt).bind("keydown.spectrum",M),$(wt).bind("click.spectrum",R),$(window).bind("resize.spectrum",U),Kt.addClass("sp-active"),St.removeClass("sp-hidden"),I(),j(),Xt=O(),x(),J.show(Xt),xt.trigger("show.spectrum",[Xt]))))}function M(t){27===t.keyCode&&H()}function R(t){2!=t.button&&(tt||(Qt?D(!0):T(),H()))}function H(){Z&&!X&&(Z=!1,$(wt).unbind("keydown.spectrum",M),$(wt).unbind("click.spectrum",R),$(window).unbind("resize.spectrum",U),Kt.removeClass("sp-active"),St.addClass("sp-hidden"),J.hide(O()),xt.trigger("hide.spectrum",[O()]))}function T(){F(Xt,!0)}function F(t,e){if(tinycolor.equals(t,O()))return void j();var r,n;!t&&Ut?Jt=!0:(Jt=!1,r=tinycolor(t),n=r.toHsv(),ct=n.h%360/360,ft=n.s,ut=n.v,ht=n.a),j(),r&&r.isValid()&&!e&&(Gt=Yt||r.getFormat())}function O(t){return t=t||{},Ut&&Jt?null:tinycolor.fromRatio({h:ct,s:ft,v:ut,a:Math.round(100*ht)/100},{format:t.format||Gt})}function N(){return!Ot.hasClass("sp-validation-error")}function E(){j(),J.move(O()),xt.trigger("move.spectrum",[O()])}function j(){Ot.removeClass("sp-validation-error"),q();var t=tinycolor.fromRatio({h:ct,s:1,v:1});Pt.css("background-color",t.toHexString());var e=Gt;1>ht&&(0!==ht||"name"!==e)&&("hex"===e||"hex3"===e||"hex6"===e||"name"===e)&&(e="rgb");var r=O({format:e}),n="";if($t.removeClass("sp-clear-display"),$t.css("background-color","transparent"),!r&&Ut)$t.addClass("sp-clear-display");else{var a=r.toHexString(),i=r.toRgbString();if(g||1===r.alpha?$t.css("background-color",i):($t.css("background-color","transparent"),$t.css("filter",r.toFilter())),W.showAlpha){var s=r.toRgb();s.a=0;var o=tinycolor(s).toRgbString(),l="linear-gradient(left, "+o+", "+a+")";p?Ht.css("filter",tinycolor(o).toFilter({gradientType:1},a)):(Ht.css("background","-webkit-"+l),Ht.css("background","-moz-"+l),Ht.css("background","-ms-"+l),Ht.css("background","linear-gradient(to right, "+o+", "+a+")"))}n=r.toString(e)}W.showInput&&Ot.val(n),W.showPalette&&_(),x()}function q(){var t=ft,e=ut;if(Ut&&Jt)Ft.hide(),Rt.hide(),At.hide();else{Ft.show(),Rt.show(),At.show();var r=t*et,n=rt-e*rt;r=Math.max(-nt,Math.min(et-nt,r-nt)),n=Math.max(-nt,Math.min(rt-nt,n-nt)),At.css({top:n+"px",left:r+"px"});var a=ht*st;Ft.css({left:a-ot/2+"px"});var i=ct*at;Rt.css({top:i-lt+"px"})}}function D(t){var e=O(),r="",n=!tinycolor.equals(e,Xt);e&&(r=e.toString(Gt),y(e)),zt&&xt.val(r),t&&n&&(J.change(e),xt.trigger("change",[e]))}function I(){et=Pt.width(),rt=Pt.height(),nt=At.height(),it=Mt.width(),at=Mt.height(),lt=Rt.height(),st=Tt.width(),ot=Ft.width(),X||(St.css("position","absolute"),W.offset?St.offset(W.offset):St.offset(i(St,Vt))),q(),W.showPalette&&_(),xt.trigger("reflow.spectrum")}function z(){xt.show(),Vt.unbind("click.spectrum touchstart.spectrum"),St.remove(),Kt.remove(),d[Zt.id]=null}function B(e,r){return e===t?$.extend({},W):r===t?W[e]:(W[e]=r,void l())}function L(){kt=!1,xt.attr("disabled",!1),Vt.removeClass("sp-disabled")}function K(){H(),kt=!0,xt.attr("disabled",!0),Vt.addClass("sp-disabled")}function V(t){W.offset=t,I()}var W=n(s,a),X=W.flat,Y=W.showSelectionPalette,G=W.localStorageKey,Q=W.theme,J=W.callbacks,U=f(I,10),Z=!1,tt=!1,et=0,rt=0,nt=0,at=0,it=0,st=0,ot=0,lt=0,ct=0,ft=0,ut=0,ht=1,dt=[],pt=[],gt={},bt=W.selectionPalette.slice(0),vt=W.maxSelectionSize,mt="sp-dragging",yt=null,wt=a.ownerDocument,_t=wt.body,xt=$(a),kt=!1,St=$(v,wt).addClass(Q),Ct=St.find(".sp-picker-container"),Pt=St.find(".sp-color"),At=St.find(".sp-dragger"),Mt=St.find(".sp-hue"),Rt=St.find(".sp-slider"),Ht=St.find(".sp-alpha-inner"),Tt=St.find(".sp-alpha"),Ft=St.find(".sp-alpha-handle"),Ot=St.find(".sp-input"),Nt=St.find(".sp-palette"),Et=St.find(".sp-initial"),jt=St.find(".sp-cancel"),qt=St.find(".sp-clear"),Dt=St.find(".sp-choose"),It=St.find(".sp-palette-toggle"),zt=xt.is("input"),Bt=zt&&"color"===xt.attr("type")&&u(),Lt=zt&&!X,Kt=Lt?$(b).addClass(Q).addClass(W.className).addClass(W.replacerClassName):$([]),Vt=Lt?Kt:xt,$t=Kt.find(".sp-preview-inner"),Wt=W.color||zt&&xt.val(),Xt=!1,Yt=W.preferredFormat,Gt=Yt,Qt=!W.showButtons||W.clickoutFiresChange,Jt=!Wt,Ut=W.allowEmpty&&!Bt;h();var Zt={show:A,hide:H,toggle:P,reflow:I,option:B,enable:L,disable:K,offset:V,set:function(t){F(t),D()},get:O,destroy:z,container:St};return Zt.id=d.push(Zt)-1,Zt}function i(t,e){var r=0,n=t.outerWidth(),a=t.outerHeight(),i=e.outerHeight(),s=t[0].ownerDocument,o=s.documentElement,l=o.clientWidth+$(s).scrollLeft(),c=o.clientHeight+$(s).scrollTop(),f=e.offset();return f.top+=i,f.left-=Math.min(f.left,f.left+n>l&&l>n?Math.abs(f.left+n-l):0),f.top-=Math.min(f.top,f.top+a>c&&c>a?Math.abs(a+i-r):r),f}function s(){}function o(t){t.stopPropagation()}function l(t,e){var r=Array.prototype.slice,n=r.call(arguments,2);return function(){return t.apply(e,n.concat(r.call(arguments)))}}function c(t,e,r,n){function a(t){t.stopPropagation&&t.stopPropagation(),t.preventDefault&&t.preventDefault(),t.returnValue=!1}function i(r){if(c){if(p&&l.documentMode<9&&!r.button)return o();var n=r.originalEvent&&r.originalEvent.touches&&r.originalEvent.touches[0],i=n&&n.pageX||r.pageX,s=n&&n.pageY||r.pageY,g=Math.max(0,Math.min(i-f.left,h)),b=Math.max(0,Math.min(s-f.top,u));d&&a(r),e.apply(t,[g,b,r])}}function s(e){var n=e.which?3==e.which:2==e.button;n||c||r.apply(t,arguments)!==!1&&(c=!0,u=$(t).height(),h=$(t).width(),f=$(t).offset(),$(l).bind(g),$(l.body).addClass("sp-dragging"),i(e),a(e))}function o(){c&&($(l).unbind(g),$(l.body).removeClass("sp-dragging"),setTimeout(function(){n.apply(t,arguments)},0)),c=!1}e=e||function(){},r=r||function(){},n=n||function(){};var l=document,c=!1,f={},u=0,h=0,d="ontouchstart"in window,g={};g.selectstart=a,g.dragstart=a,g["touchmove mousemove"]=i,g["touchend mouseup"]=o,$(t).bind("touchstart mousedown",s)}function f(t,e,r){var n;return function(){var a=this,i=arguments,s=function(){n=null,t.apply(a,i)};r&&clearTimeout(n),(r||!n)&&(n=setTimeout(s,e))}}function u(){return $.fn.spectrum.inputTypeColorSupport()}var h={beforeShow:s,move:s,change:s,show:s,hide:s,color:!1,flat:!1,showInput:!1,allowEmpty:!1,showButtons:!0,clickoutFiresChange:!0,showInitial:!1,showPalette:!1,showPaletteOnly:!1,hideAfterPaletteSelect:!1,togglePaletteOnly:!1,showSelectionPalette:!0,localStorageKey:!1,appendTo:"body",maxSelectionSize:7,cancelText:"cancel",chooseText:"choose",togglePaletteMoreText:"more",togglePaletteLessText:"less",clearText:"Clear Color Selection",noColorSelectedText:"No Color Selected",preferredFormat:!1,className:"",containerClassName:"",replacerClassName:"",showAlpha:!1,theme:"sp-light",palette:[["#ffffff","#000000","#ff0000","#ff8000","#ffff00","#008000","#0000ff","#4b0082","#9400d3"]],selectionPalette:[],disabled:!1,offset:null},d=[],p=!!/msie/i.exec(window.navigator.userAgent),g=function(){function t(t,e){return!!~(""+t).indexOf(e)}var e=document.createElement("div"),r=e.style;return r.cssText="background-color:rgba(0,0,0,.5)",t(r.backgroundColor,"rgba")||t(r.backgroundColor,"hsla")}(),b=["<div class='sp-replacer'>","<div class='sp-preview'><div class='sp-preview-inner'></div></div>","<div class='sp-dd'>&#9660;</div>","</div>"].join(""),v=function(){var t="";if(p)for(var e=1;6>=e;e++)t+="<div class='sp-"+e+"'></div>";return["<div class='sp-container sp-hidden'>","<div class='sp-palette-container'>","<div class='sp-palette sp-thumb sp-cf'></div>","<div class='sp-palette-button-container sp-cf'>","<button type='button' class='sp-palette-toggle'></button>","</div>","</div>","<div class='sp-picker-container'>","<div class='sp-top sp-cf'>","<div class='sp-fill'></div>","<div class='sp-top-inner'>","<div class='sp-color'>","<div class='sp-sat'>","<div class='sp-val'>","<div class='sp-dragger'></div>","</div>","</div>","</div>","<div class='sp-clear sp-clear-display'>","</div>","<div class='sp-hue'>","<div class='sp-slider'></div>",t,"</div>","</div>","<div class='sp-alpha'><div class='sp-alpha-inner'><div class='sp-alpha-handle'></div></div></div>","</div>","<div class='sp-input-container sp-cf'>","<input class='sp-input' type='text' spellcheck='false'  />","</div>","<div class='sp-initial sp-thumb sp-cf'></div>","<div class='sp-button-container sp-cf'>","<a class='sp-cancel' href='#'></a>","<button type='button' class='sp-choose'></button>","</div>","</div>","</div>"].join("")}(),m="spectrum.id";$.fn.spectrum=function(t,e){if("string"==typeof t){var r=this,n=Array.prototype.slice.call(arguments,1);return this.each(function(){var e=d[$(this).data(m)];if(e){var a=e[t];if(!a)throw new Error("Spectrum: no such method: '"+t+"'");"get"==t?r=e.get():"container"==t?r=e.container:"option"==t?r=e.option.apply(e,n):"destroy"==t?(e.destroy(),$(this).removeData(m)):a.apply(e,n)}}),r}return this.spectrum("destroy").each(function(){var e=$.extend({},t,$(this).data()),r=a(this,e);$(this).data(m,r.id)})},$.fn.spectrum.load=!0,$.fn.spectrum.loadOpts={},$.fn.spectrum.draggable=c,$.fn.spectrum.defaults=h,$.fn.spectrum.inputTypeColorSupport=function y(){if("undefined"==typeof y._cachedResult){var t=$("<input type='color'/>")[0];y._cachedResult="color"===t.type&&""!==t.value}return y._cachedResult},$.spectrum={},$.spectrum.localization={},$.spectrum.palettes={},$.fn.spectrum.processNativeColorInputs=function(){var t=$("input[type=color]");t.length&&!u()&&t.spectrum({preferredFormat:"hex6"})},function(){function t(t){var r={r:0,g:0,b:0},a=1,s=!1,o=!1;return"string"==typeof t&&(t=F(t)),"object"==typeof t&&(t.hasOwnProperty("r")&&t.hasOwnProperty("g")&&t.hasOwnProperty("b")?(r=e(t.r,t.g,t.b),s=!0,o="%"===String(t.r).substr(-1)?"prgb":"rgb"):t.hasOwnProperty("h")&&t.hasOwnProperty("s")&&t.hasOwnProperty("v")?(t.s=R(t.s),t.v=R(t.v),r=i(t.h,t.s,t.v),s=!0,o="hsv"):t.hasOwnProperty("h")&&t.hasOwnProperty("s")&&t.hasOwnProperty("l")&&(t.s=R(t.s),t.l=R(t.l),r=n(t.h,t.s,t.l),s=!0,o="hsl"),t.hasOwnProperty("a")&&(a=t.a)),a=x(a),{ok:s,format:t.format||o,r:D(255,I(r.r,0)),g:D(255,I(r.g,0)),b:D(255,I(r.b,0)),a:a}}function e(t,e,r){return{r:255*k(t,255),g:255*k(e,255),b:255*k(r,255)}}function r(t,e,r){t=k(t,255),e=k(e,255),r=k(r,255);var n=I(t,e,r),a=D(t,e,r),i,s,o=(n+a)/2;if(n==a)i=s=0;else{var l=n-a;switch(s=o>.5?l/(2-n-a):l/(n+a),n){case t:i=(e-r)/l+(r>e?6:0);break;case e:i=(r-t)/l+2;break;case r:i=(t-e)/l+4}i/=6}return{h:i,s:s,l:o}}function n(t,e,r){function n(t,e,r){return 0>r&&(r+=1),r>1&&(r-=1),1/6>r?t+6*(e-t)*r:.5>r?e:2/3>r?t+(e-t)*(2/3-r)*6:t}var a,i,s;if(t=k(t,360),e=k(e,100),r=k(r,100),0===e)a=i=s=r;else{var o=.5>r?r*(1+e):r+e-r*e,l=2*r-o;a=n(l,o,t+1/3),i=n(l,o,t),s=n(l,o,t-1/3)}return{r:255*a,g:255*i,b:255*s}}function a(t,e,r){t=k(t,255),e=k(e,255),r=k(r,255);var n=I(t,e,r),a=D(t,e,r),i,s,o=n,l=n-a;if(s=0===n?0:l/n,n==a)i=0;else{switch(n){case t:i=(e-r)/l+(r>e?6:0);break;case e:i=(r-t)/l+2;break;case r:i=(t-e)/l+4}i/=6}return{h:i,s:s,v:o}}function i(t,e,r){t=6*k(t,360),e=k(e,100),r=k(r,100);var n=j.floor(t),a=t-n,i=r*(1-e),s=r*(1-a*e),o=r*(1-(1-a)*e),l=n%6,c=[r,s,i,i,o,r][l],f=[o,r,r,s,i,i][l],u=[i,i,o,r,r,s][l];return{r:255*c,g:255*f,b:255*u}}function s(t,e,r,n){var a=[M(q(t).toString(16)),M(q(e).toString(16)),M(q(r).toString(16))];return n&&a[0].charAt(0)==a[0].charAt(1)&&a[1].charAt(0)==a[1].charAt(1)&&a[2].charAt(0)==a[2].charAt(1)?a[0].charAt(0)+a[1].charAt(0)+a[2].charAt(0):a.join("")}function o(t,e,r,n){var a=[M(H(n)),M(q(t).toString(16)),M(q(e).toString(16)),M(q(r).toString(16))];return a.join("")}function l(t,e){e=0===e?0:e||10;var r=B(t).toHsl();return r.s-=e/100,r.s=S(r.s),B(r)}function c(t,e){e=0===e?0:e||10;var r=B(t).toHsl();return r.s+=e/100,r.s=S(r.s),B(r)}function f(t){return B(t).desaturate(100)}function u(t,e){e=0===e?0:e||10;var r=B(t).toHsl();return r.l+=e/100,r.l=S(r.l),B(r)}function h(t,e){e=0===e?0:e||10;var r=B(t).toRgb();return r.r=I(0,D(255,r.r-q(255*-(e/100)))),r.g=I(0,D(255,r.g-q(255*-(e/100)))),r.b=I(0,D(255,r.b-q(255*-(e/100)))),B(r)}function d(t,e){e=0===e?0:e||10;var r=B(t).toHsl();return r.l-=e/100,r.l=S(r.l),B(r)}function p(t,e){var r=B(t).toHsl(),n=(q(r.h)+e)%360;return r.h=0>n?360+n:n,B(r)}function g(t){var e=B(t).toHsl();return e.h=(e.h+180)%360,B(e)}function b(t){var e=B(t).toHsl(),r=e.h;return[B(t),B({h:(r+120)%360,s:e.s,l:e.l}),B({h:(r+240)%360,s:e.s,l:e.l})]}function v(t){var e=B(t).toHsl(),r=e.h;return[B(t),B({h:(r+90)%360,s:e.s,l:e.l}),B({h:(r+180)%360,s:e.s,l:e.l}),B({h:(r+270)%360,s:e.s,l:e.l})]}function m(t){var e=B(t).toHsl(),r=e.h;return[B(t),B({h:(r+72)%360,s:e.s,l:e.l}),B({h:(r+216)%360,s:e.s,l:e.l})]}function y(t,e,r){e=e||6,r=r||30;var n=B(t).toHsl(),a=360/r,i=[B(t)];for(n.h=(n.h-(a*e>>1)+720)%360;--e;)n.h=(n.h+a)%360,i.push(B(n));return i}function w(t,e){e=e||6;for(var r=B(t).toHsv(),n=r.h,a=r.s,i=r.v,s=[],o=1/e;e--;)s.push(B({h:n,s:a,v:i})),i=(i+o)%1;return s}function _(t){var e={};for(var r in t)t.hasOwnProperty(r)&&(e[t[r]]=r);return e}function x(t){return t=parseFloat(t),(isNaN(t)||0>t||t>1)&&(t=1),t}function k(t,e){P(t)&&(t="100%");var r=A(t);return t=D(e,I(0,parseFloat(t))),r&&(t=parseInt(t*e,10)/100),j.abs(t-e)<1e-6?1:t%e/parseFloat(e)}function S(t){return D(1,I(0,t))}function C(t){return parseInt(t,16)}function P(t){return"string"==typeof t&&-1!=t.indexOf(".")&&1===parseFloat(t)}function A(t){return"string"==typeof t&&-1!=t.indexOf("%")}function M(t){return 1==t.length?"0"+t:""+t}function R(t){return 1>=t&&(t=100*t+"%"),t}function H(t){return Math.round(255*parseFloat(t)).toString(16)}function T(t){return C(t)/255}function F(t){t=t.replace(O,"").replace(N,"").toLowerCase();var e=!1;if(L[t])t=L[t],e=!0;else if("transparent"==t)return{r:0,g:0,b:0,a:0,format:"name"};var r;return(r=V.rgb.exec(t))?{r:r[1],g:r[2],b:r[3]}:(r=V.rgba.exec(t))?{r:r[1],g:r[2],b:r[3],a:r[4]}:(r=V.hsl.exec(t))?{h:r[1],s:r[2],l:r[3]}:(r=V.hsla.exec(t))?{h:r[1],s:r[2],l:r[3],a:r[4]}:(r=V.hsv.exec(t))?{h:r[1],s:r[2],v:r[3]}:(r=V.hsva.exec(t))?{h:r[1],s:r[2],v:r[3],a:r[4]}:(r=V.hex8.exec(t))?{a:T(r[1]),r:C(r[2]),g:C(r[3]),b:C(r[4]),format:e?"name":"hex8"}:(r=V.hex6.exec(t))?{r:C(r[1]),g:C(r[2]),b:C(r[3]),format:e?"name":"hex"}:(r=V.hex3.exec(t))?{r:C(r[1]+""+r[1]),g:C(r[2]+""+r[2]),b:C(r[3]+""+r[3]),format:e?"name":"hex"}:!1}var O=/^[\s,#]+/,N=/\s+$/,E=0,j=Math,q=j.round,D=j.min,I=j.max,z=j.random,B=function(e,r){if(e=e?e:"",r=r||{},e instanceof B)return e;if(!(this instanceof B))return new B(e,r);var n=t(e);this._originalInput=e,this._r=n.r,this._g=n.g,this._b=n.b,this._a=n.a,this._roundA=q(100*this._a)/100,this._format=r.format||n.format,this._gradientType=r.gradientType,this._r<1&&(this._r=q(this._r)),this._g<1&&(this._g=q(this._g)),this._b<1&&(this._b=q(this._b)),this._ok=n.ok,this._tc_id=E++};B.prototype={isDark:function(){return this.getBrightness()<128},isLight:function(){return!this.isDark()},isValid:function(){return this._ok},getOriginalInput:function(){return this._originalInput},getFormat:function(){return this._format},getAlpha:function(){return this._a},getBrightness:function(){var t=this.toRgb();return(299*t.r+587*t.g+114*t.b)/1e3},setAlpha:function(t){return this._a=x(t),this._roundA=q(100*this._a)/100,this},toHsv:function(){var t=a(this._r,this._g,this._b);return{h:360*t.h,s:t.s,v:t.v,a:this._a}},toHsvString:function(){var t=a(this._r,this._g,this._b),e=q(360*t.h),r=q(100*t.s),n=q(100*t.v);return 1==this._a?"hsv("+e+", "+r+"%, "+n+"%)":"hsva("+e+", "+r+"%, "+n+"%, "+this._roundA+")"},toHsl:function(){var t=r(this._r,this._g,this._b);return{h:360*t.h,s:t.s,l:t.l,a:this._a}},toHslString:function(){var t=r(this._r,this._g,this._b),e=q(360*t.h),n=q(100*t.s),a=q(100*t.l);return 1==this._a?"hsl("+e+", "+n+"%, "+a+"%)":"hsla("+e+", "+n+"%, "+a+"%, "+this._roundA+")"},toHex:function(t){return s(this._r,this._g,this._b,t)},toHexString:function(t){return"#"+this.toHex(t)},toHex8:function(){return o(this._r,this._g,this._b,this._a)},toHex8String:function(){return"#"+this.toHex8()},toRgb:function(){return{r:q(this._r),g:q(this._g),b:q(this._b),a:this._a}},toRgbString:function(){return 1==this._a?"rgb("+q(this._r)+", "+q(this._g)+", "+q(this._b)+")":"rgba("+q(this._r)+", "+q(this._g)+", "+q(this._b)+", "+this._roundA+")"},toPercentageRgb:function(){return{r:q(100*k(this._r,255))+"%",g:q(100*k(this._g,255))+"%",b:q(100*k(this._b,255))+"%",a:this._a}},toPercentageRgbString:function(){return 1==this._a?"rgb("+q(100*k(this._r,255))+"%, "+q(100*k(this._g,255))+"%, "+q(100*k(this._b,255))+"%)":"rgba("+q(100*k(this._r,255))+"%, "+q(100*k(this._g,255))+"%, "+q(100*k(this._b,255))+"%, "+this._roundA+")"},toName:function(){return 0===this._a?"transparent":this._a<1?!1:K[s(this._r,this._g,this._b,!0)]||!1},toFilter:function(t){var e="#"+o(this._r,this._g,this._b,this._a),r=e,n=this._gradientType?"GradientType = 1, ":"";if(t){var a=B(t);r=a.toHex8String()}return"progid:DXImageTransform.Microsoft.gradient("+n+"startColorstr="+e+",endColorstr="+r+")"},toString:function(t){var e=!!t;t=t||this._format;var r=!1,n=this._a<1&&this._a>=0,a=!e&&n&&("hex"===t||"hex6"===t||"hex3"===t||"name"===t);return a?"name"===t&&0===this._a?this.toName():this.toRgbString():("rgb"===t&&(r=this.toRgbString()),"prgb"===t&&(r=this.toPercentageRgbString()),("hex"===t||"hex6"===t)&&(r=this.toHexString()),"hex3"===t&&(r=this.toHexString(!0)),"hex8"===t&&(r=this.toHex8String()),"name"===t&&(r=this.toName()),"hsl"===t&&(r=this.toHslString()),"hsv"===t&&(r=this.toHsvString()),r||this.toHexString())},_applyModification:function(t,e){var r=t.apply(null,[this].concat([].slice.call(e)));return this._r=r._r,this._g=r._g,this._b=r._b,this.setAlpha(r._a),this},lighten:function(){return this._applyModification(u,arguments)},brighten:function(){return this._applyModification(h,arguments)},darken:function(){return this._applyModification(d,arguments)},desaturate:function(){return this._applyModification(l,arguments)},saturate:function(){return this._applyModification(c,arguments)},greyscale:function(){return this._applyModification(f,arguments)},spin:function(){return this._applyModification(p,arguments)},_applyCombination:function(t,e){return t.apply(null,[this].concat([].slice.call(e)))},analogous:function(){return this._applyCombination(y,arguments)},complement:function(){return this._applyCombination(g,arguments)},monochromatic:function(){return this._applyCombination(w,arguments)},splitcomplement:function(){return this._applyCombination(m,arguments)},triad:function(){return this._applyCombination(b,arguments)},tetrad:function(){return this._applyCombination(v,arguments)}},B.fromRatio=function(t,e){if("object"==typeof t){var r={};for(var n in t)t.hasOwnProperty(n)&&("a"===n?r[n]=t[n]:r[n]=R(t[n]));t=r}return B(t,e)},B.equals=function(t,e){return t&&e?B(t).toRgbString()==B(e).toRgbString():!1},B.random=function(){return B.fromRatio({r:z(),g:z(),b:z()})},B.mix=function(t,e,r){r=0===r?0:r||50;var n=B(t).toRgb(),a=B(e).toRgb(),i=r/100,s=2*i-1,o=a.a-n.a,l;l=s*o==-1?s:(s+o)/(1+s*o),l=(l+1)/2;var c=1-l,f={r:a.r*l+n.r*c,g:a.g*l+n.g*c,b:a.b*l+n.b*c,a:a.a*i+n.a*(1-i)};return B(f)},B.readability=function(t,e){var r=B(t),n=B(e),a=r.toRgb(),i=n.toRgb(),s=r.getBrightness(),o=n.getBrightness(),l=Math.max(a.r,i.r)-Math.min(a.r,i.r)+Math.max(a.g,i.g)-Math.min(a.g,i.g)+Math.max(a.b,i.b)-Math.min(a.b,i.b);return{brightness:Math.abs(s-o),color:l}},B.isReadable=function(t,e){var r=B.readability(t,e);return r.brightness>125&&r.color>500},B.mostReadable=function(t,e){for(var r=null,n=0,a=!1,i=0;i<e.length;i++){var s=B.readability(t,e[i]),o=s.brightness>125&&s.color>500,l=3*(s.brightness/125)+s.color/500;(o&&!a||o&&a&&l>n||!o&&!a&&l>n)&&(a=o,n=l,r=B(e[i]))}return r};var L=B.names={aliceblue:"f0f8ff",antiquewhite:"faebd7",aqua:"0ff",aquamarine:"7fffd4",azure:"f0ffff",beige:"f5f5dc",bisque:"ffe4c4",black:"000",blanchedalmond:"ffebcd",blue:"00f",blueviolet:"8a2be2",brown:"a52a2a",burlywood:"deb887",burntsienna:"ea7e5d",cadetblue:"5f9ea0",chartreuse:"7fff00",chocolate:"d2691e",coral:"ff7f50",cornflowerblue:"6495ed",cornsilk:"fff8dc",crimson:"dc143c",cyan:"0ff",darkblue:"00008b",darkcyan:"008b8b",darkgoldenrod:"b8860b",darkgray:"a9a9a9",darkgreen:"006400",darkgrey:"a9a9a9",darkkhaki:"bdb76b",darkmagenta:"8b008b",darkolivegreen:"556b2f",darkorange:"ff8c00",darkorchid:"9932cc",darkred:"8b0000",darksalmon:"e9967a",darkseagreen:"8fbc8f",darkslateblue:"483d8b",darkslategray:"2f4f4f",darkslategrey:"2f4f4f",darkturquoise:"00ced1",darkviolet:"9400d3",deeppink:"ff1493",deepskyblue:"00bfff",dimgray:"696969",dimgrey:"696969",dodgerblue:"1e90ff",firebrick:"b22222",floralwhite:"fffaf0",forestgreen:"228b22",fuchsia:"f0f",gainsboro:"dcdcdc",ghostwhite:"f8f8ff",gold:"ffd700",goldenrod:"daa520",gray:"808080",green:"008000",greenyellow:"adff2f",grey:"808080",honeydew:"f0fff0",hotpink:"ff69b4",indianred:"cd5c5c",indigo:"4b0082",ivory:"fffff0",khaki:"f0e68c",lavender:"e6e6fa",lavenderblush:"fff0f5",lawngreen:"7cfc00",lemonchiffon:"fffacd",lightblue:"add8e6",lightcoral:"f08080",lightcyan:"e0ffff",lightgoldenrodyellow:"fafad2",lightgray:"d3d3d3",lightgreen:"90ee90",lightgrey:"d3d3d3",lightpink:"ffb6c1",lightsalmon:"ffa07a",lightseagreen:"20b2aa",lightskyblue:"87cefa",lightslategray:"789",lightslategrey:"789",lightsteelblue:"b0c4de",lightyellow:"ffffe0",lime:"0f0",limegreen:"32cd32",linen:"faf0e6",magenta:"f0f",maroon:"800000",mediumaquamarine:"66cdaa",mediumblue:"0000cd",mediumorchid:"ba55d3",mediumpurple:"9370db",mediumseagreen:"3cb371",mediumslateblue:"7b68ee",mediumspringgreen:"00fa9a",mediumturquoise:"48d1cc",mediumvioletred:"c71585",midnightblue:"191970",mintcream:"f5fffa",mistyrose:"ffe4e1",moccasin:"ffe4b5",navajowhite:"ffdead",navy:"000080",oldlace:"fdf5e6",olive:"808000",olivedrab:"6b8e23",orange:"ffa500",orangered:"ff4500",orchid:"da70d6",palegoldenrod:"eee8aa",palegreen:"98fb98",paleturquoise:"afeeee",palevioletred:"db7093",papayawhip:"ffefd5",peachpuff:"ffdab9",peru:"cd853f",pink:"ffc0cb",plum:"dda0dd",powderblue:"b0e0e6",purple:"800080",rebeccapurple:"663399",red:"f00",rosybrown:"bc8f8f",royalblue:"4169e1",saddlebrown:"8b4513",salmon:"fa8072",sandybrown:"f4a460",seagreen:"2e8b57",seashell:"fff5ee",sienna:"a0522d",silver:"c0c0c0",skyblue:"87ceeb",slateblue:"6a5acd",slategray:"708090",slategrey:"708090",snow:"fffafa",springgreen:"00ff7f",steelblue:"4682b4",tan:"d2b48c",teal:"008080",thistle:"d8bfd8",tomato:"ff6347",turquoise:"40e0d0",violet:"ee82ee",wheat:"f5deb3",white:"fff",whitesmoke:"f5f5f5",yellow:"ff0",yellowgreen:"9acd32"},K=B.hexNames=_(L),V=function(){var t="[-\\+]?\\d+%?",e="[-\\+]?\\d*\\.\\d+%?",r="(?:"+e+")|(?:"+t+")",n="[\\s|\\(]+("+r+")[,|\\s]+("+r+")[,|\\s]+("+r+")\\s*\\)?",a="[\\s|\\(]+("+r+")[,|\\s]+("+r+")[,|\\s]+("+r+")[,|\\s]+("+r+")\\s*\\)?";return{rgb:new RegExp("rgb"+n),rgba:new RegExp("rgba"+a),hsl:new RegExp("hsl"+n),hsla:new RegExp("hsla"+a),hsv:new RegExp("hsv"+n),hsva:new RegExp("hsva"+a),hex3:/^([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,hex6:/^([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,hex8:/^([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/}}();window.tinycolor=B}(),$(function(){$.fn.spectrum.load&&$.fn.spectrum.processNativeColorInputs()})});

/* Web Font Loader v1.6.27 - (c) Adobe Systems, Google. License: Apache 2.0 */(function(){function aa(a,b,c){return a.call.apply(a.bind,arguments)}function ba(a,b,c){if(!a)throw Error();if(2<arguments.length){var d=Array.prototype.slice.call(arguments,2);return function(){var c=Array.prototype.slice.call(arguments);Array.prototype.unshift.apply(c,d);return a.apply(b,c)}}return function(){return a.apply(b,arguments)}}function p(a,b,c){p=Function.prototype.bind&&-1!=Function.prototype.bind.toString().indexOf("native code")?aa:ba;return p.apply(null,arguments)}var q=Date.now||function(){return+new Date};function ca(a,b){this.a=a;this.m=b||a;this.c=this.m.document}var da=!!window.FontFace;function t(a,b,c,d){b=a.c.createElement(b);if(c)for(var e in c)c.hasOwnProperty(e)&&("style"==e?b.style.cssText=c[e]:b.setAttribute(e,c[e]));d&&b.appendChild(a.c.createTextNode(d));return b}function u(a,b,c){a=a.c.getElementsByTagName(b)[0];a||(a=document.documentElement);a.insertBefore(c,a.lastChild)}function v(a){a.parentNode&&a.parentNode.removeChild(a)}
function w(a,b,c){b=b||[];c=c||[];for(var d=a.className.split(/\s+/),e=0;e<b.length;e+=1){for(var f=!1,g=0;g<d.length;g+=1)if(b[e]===d[g]){f=!0;break}f||d.push(b[e])}b=[];for(e=0;e<d.length;e+=1){f=!1;for(g=0;g<c.length;g+=1)if(d[e]===c[g]){f=!0;break}f||b.push(d[e])}a.className=b.join(" ").replace(/\s+/g," ").replace(/^\s+|\s+$/,"")}function y(a,b){for(var c=a.className.split(/\s+/),d=0,e=c.length;d<e;d++)if(c[d]==b)return!0;return!1}
function z(a){if("string"===typeof a.f)return a.f;var b=a.m.location.protocol;"about:"==b&&(b=a.a.location.protocol);return"https:"==b?"https:":"http:"}function ea(a){return a.m.location.hostname||a.a.location.hostname}
function A(a,b,c){function d(){k&&e&&f&&(k(g),k=null)}b=t(a,"link",{rel:"stylesheet",href:b,media:"all"});var e=!1,f=!0,g=null,k=c||null;da?(b.onload=function(){e=!0;d()},b.onerror=function(){e=!0;g=Error("Stylesheet failed to load");d()}):setTimeout(function(){e=!0;d()},0);u(a,"head",b)}
function B(a,b,c,d){var e=a.c.getElementsByTagName("head")[0];if(e){var f=t(a,"script",{src:b}),g=!1;f.onload=f.onreadystatechange=function(){g||this.readyState&&"loaded"!=this.readyState&&"complete"!=this.readyState||(g=!0,c&&c(null),f.onload=f.onreadystatechange=null,"HEAD"==f.parentNode.tagName&&e.removeChild(f))};e.appendChild(f);setTimeout(function(){g||(g=!0,c&&c(Error("Script load timeout")))},d||5E3);return f}return null};function C(){this.a=0;this.c=null}function D(a){a.a++;return function(){a.a--;E(a)}}function F(a,b){a.c=b;E(a)}function E(a){0==a.a&&a.c&&(a.c(),a.c=null)};function G(a){this.a=a||"-"}G.prototype.c=function(a){for(var b=[],c=0;c<arguments.length;c++)b.push(arguments[c].replace(/[\W_]+/g,"").toLowerCase());return b.join(this.a)};function H(a,b){this.c=a;this.f=4;this.a="n";var c=(b||"n4").match(/^([nio])([1-9])$/i);c&&(this.a=c[1],this.f=parseInt(c[2],10))}function fa(a){return I(a)+" "+(a.f+"00")+" 300px "+J(a.c)}function J(a){var b=[];a=a.split(/,\s*/);for(var c=0;c<a.length;c++){var d=a[c].replace(/['"]/g,"");-1!=d.indexOf(" ")||/^\d/.test(d)?b.push("'"+d+"'"):b.push(d)}return b.join(",")}function K(a){return a.a+a.f}function I(a){var b="normal";"o"===a.a?b="oblique":"i"===a.a&&(b="italic");return b}
function ga(a){var b=4,c="n",d=null;a&&((d=a.match(/(normal|oblique|italic)/i))&&d[1]&&(c=d[1].substr(0,1).toLowerCase()),(d=a.match(/([1-9]00|normal|bold)/i))&&d[1]&&(/bold/i.test(d[1])?b=7:/[1-9]00/.test(d[1])&&(b=parseInt(d[1].substr(0,1),10))));return c+b};function ha(a,b){this.c=a;this.f=a.m.document.documentElement;this.h=b;this.a=new G("-");this.j=!1!==b.events;this.g=!1!==b.classes}function ia(a){a.g&&w(a.f,[a.a.c("wf","loading")]);L(a,"loading")}function M(a){if(a.g){var b=y(a.f,a.a.c("wf","active")),c=[],d=[a.a.c("wf","loading")];b||c.push(a.a.c("wf","inactive"));w(a.f,c,d)}L(a,"inactive")}function L(a,b,c){if(a.j&&a.h[b])if(c)a.h[b](c.c,K(c));else a.h[b]()};function ja(){this.c={}}function ka(a,b,c){var d=[],e;for(e in b)if(b.hasOwnProperty(e)){var f=a.c[e];f&&d.push(f(b[e],c))}return d};function N(a,b){this.c=a;this.f=b;this.a=t(this.c,"span",{"aria-hidden":"true"},this.f)}function O(a){u(a.c,"body",a.a)}function P(a){return"display:block;position:absolute;top:-9999px;left:-9999px;font-size:300px;width:auto;height:auto;line-height:normal;margin:0;padding:0;font-variant:normal;white-space:nowrap;font-family:"+J(a.c)+";"+("font-style:"+I(a)+";font-weight:"+(a.f+"00")+";")};function Q(a,b,c,d,e,f){this.g=a;this.j=b;this.a=d;this.c=c;this.f=e||3E3;this.h=f||void 0}Q.prototype.start=function(){var a=this.c.m.document,b=this,c=q(),d=new Promise(function(d,e){function k(){q()-c>=b.f?e():a.fonts.load(fa(b.a),b.h).then(function(a){1<=a.length?d():setTimeout(k,25)},function(){e()})}k()}),e=new Promise(function(a,d){setTimeout(d,b.f)});Promise.race([e,d]).then(function(){b.g(b.a)},function(){b.j(b.a)})};function R(a,b,c,d,e,f,g){this.v=a;this.B=b;this.c=c;this.a=d;this.s=g||"BESbswy";this.f={};this.w=e||3E3;this.u=f||null;this.o=this.j=this.h=this.g=null;this.g=new N(this.c,this.s);this.h=new N(this.c,this.s);this.j=new N(this.c,this.s);this.o=new N(this.c,this.s);a=new H(this.a.c+",serif",K(this.a));a=P(a);this.g.a.style.cssText=a;a=new H(this.a.c+",sans-serif",K(this.a));a=P(a);this.h.a.style.cssText=a;a=new H("serif",K(this.a));a=P(a);this.j.a.style.cssText=a;a=new H("sans-serif",K(this.a));a=
P(a);this.o.a.style.cssText=a;O(this.g);O(this.h);O(this.j);O(this.o)}var S={D:"serif",C:"sans-serif"},T=null;function U(){if(null===T){var a=/AppleWebKit\/([0-9]+)(?:\.([0-9]+))/.exec(window.navigator.userAgent);T=!!a&&(536>parseInt(a[1],10)||536===parseInt(a[1],10)&&11>=parseInt(a[2],10))}return T}R.prototype.start=function(){this.f.serif=this.j.a.offsetWidth;this.f["sans-serif"]=this.o.a.offsetWidth;this.A=q();la(this)};
function ma(a,b,c){for(var d in S)if(S.hasOwnProperty(d)&&b===a.f[S[d]]&&c===a.f[S[d]])return!0;return!1}function la(a){var b=a.g.a.offsetWidth,c=a.h.a.offsetWidth,d;(d=b===a.f.serif&&c===a.f["sans-serif"])||(d=U()&&ma(a,b,c));d?q()-a.A>=a.w?U()&&ma(a,b,c)&&(null===a.u||a.u.hasOwnProperty(a.a.c))?V(a,a.v):V(a,a.B):na(a):V(a,a.v)}function na(a){setTimeout(p(function(){la(this)},a),50)}function V(a,b){setTimeout(p(function(){v(this.g.a);v(this.h.a);v(this.j.a);v(this.o.a);b(this.a)},a),0)};function W(a,b,c){this.c=a;this.a=b;this.f=0;this.o=this.j=!1;this.s=c}var X=null;W.prototype.g=function(a){var b=this.a;b.g&&w(b.f,[b.a.c("wf",a.c,K(a).toString(),"active")],[b.a.c("wf",a.c,K(a).toString(),"loading"),b.a.c("wf",a.c,K(a).toString(),"inactive")]);L(b,"fontactive",a);this.o=!0;oa(this)};
W.prototype.h=function(a){var b=this.a;if(b.g){var c=y(b.f,b.a.c("wf",a.c,K(a).toString(),"active")),d=[],e=[b.a.c("wf",a.c,K(a).toString(),"loading")];c||d.push(b.a.c("wf",a.c,K(a).toString(),"inactive"));w(b.f,d,e)}L(b,"fontinactive",a);oa(this)};function oa(a){0==--a.f&&a.j&&(a.o?(a=a.a,a.g&&w(a.f,[a.a.c("wf","active")],[a.a.c("wf","loading"),a.a.c("wf","inactive")]),L(a,"active")):M(a.a))};function pa(a){this.j=a;this.a=new ja;this.h=0;this.f=this.g=!0}pa.prototype.load=function(a){this.c=new ca(this.j,a.context||this.j);this.g=!1!==a.events;this.f=!1!==a.classes;qa(this,new ha(this.c,a),a)};
function ra(a,b,c,d,e){var f=0==--a.h;(a.f||a.g)&&setTimeout(function(){var a=e||null,k=d||null||{};if(0===c.length&&f)M(b.a);else{b.f+=c.length;f&&(b.j=f);var h,m=[];for(h=0;h<c.length;h++){var l=c[h],n=k[l.c],r=b.a,x=l;r.g&&w(r.f,[r.a.c("wf",x.c,K(x).toString(),"loading")]);L(r,"fontloading",x);r=null;if(null===X)if(window.FontFace){var x=/Gecko.*Firefox\/(\d+)/.exec(window.navigator.userAgent),ya=/OS X.*Version\/10\..*Safari/.exec(window.navigator.userAgent)&&/Apple/.exec(window.navigator.vendor);
X=x?42<parseInt(x[1],10):ya?!1:!0}else X=!1;X?r=new Q(p(b.g,b),p(b.h,b),b.c,l,b.s,n):r=new R(p(b.g,b),p(b.h,b),b.c,l,b.s,a,n);m.push(r)}for(h=0;h<m.length;h++)m[h].start()}},0)}function qa(a,b,c){var d=[],e=c.timeout;ia(b);var d=ka(a.a,c,a.c),f=new W(a.c,b,e);a.h=d.length;b=0;for(c=d.length;b<c;b++)d[b].load(function(b,d,c){ra(a,f,b,d,c)})};function sa(a,b){this.c=a;this.a=b}function ta(a,b,c){var d=z(a.c);a=(a.a.api||"fast.fonts.net/jsapi").replace(/^.*http(s?):(\/\/)?/,"");return d+"//"+a+"/"+b+".js"+(c?"?v="+c:"")}
sa.prototype.load=function(a){function b(){if(f["__mti_fntLst"+d]){var c=f["__mti_fntLst"+d](),e=[],h;if(c)for(var m=0;m<c.length;m++){var l=c[m].fontfamily;void 0!=c[m].fontStyle&&void 0!=c[m].fontWeight?(h=c[m].fontStyle+c[m].fontWeight,e.push(new H(l,h))):e.push(new H(l))}a(e)}else setTimeout(function(){b()},50)}var c=this,d=c.a.projectId,e=c.a.version;if(d){var f=c.c.m;B(this.c,ta(c,d,e),function(e){e?a([]):(f["__MonotypeConfiguration__"+d]=function(){return c.a},b())}).id="__MonotypeAPIScript__"+
d}else a([])};function ua(a,b){this.c=a;this.a=b}ua.prototype.load=function(a){var b,c,d=this.a.urls||[],e=this.a.families||[],f=this.a.testStrings||{},g=new C;b=0;for(c=d.length;b<c;b++)A(this.c,d[b],D(g));var k=[];b=0;for(c=e.length;b<c;b++)if(d=e[b].split(":"),d[1])for(var h=d[1].split(","),m=0;m<h.length;m+=1)k.push(new H(d[0],h[m]));else k.push(new H(d[0]));F(g,function(){a(k,f)})};function va(a,b,c){a?this.c=a:this.c=b+wa;this.a=[];this.f=[];this.g=c||""}var wa="//fonts.googleapis.com/css";function xa(a,b){for(var c=b.length,d=0;d<c;d++){var e=b[d].split(":");3==e.length&&a.f.push(e.pop());var f="";2==e.length&&""!=e[1]&&(f=":");a.a.push(e.join(f))}}
function za(a){if(0==a.a.length)throw Error("No fonts to load!");if(-1!=a.c.indexOf("kit="))return a.c;for(var b=a.a.length,c=[],d=0;d<b;d++)c.push(a.a[d].replace(/ /g,"+"));b=a.c+"?family="+c.join("%7C");0<a.f.length&&(b+="&subset="+a.f.join(","));0<a.g.length&&(b+="&text="+encodeURIComponent(a.g));return b};function Aa(a){this.f=a;this.a=[];this.c={}}
var Ba={latin:"BESbswy","latin-ext":"\u00e7\u00f6\u00fc\u011f\u015f",cyrillic:"\u0439\u044f\u0416",greek:"\u03b1\u03b2\u03a3",khmer:"\u1780\u1781\u1782",Hanuman:"\u1780\u1781\u1782"},Ca={thin:"1",extralight:"2","extra-light":"2",ultralight:"2","ultra-light":"2",light:"3",regular:"4",book:"4",medium:"5","semi-bold":"6",semibold:"6","demi-bold":"6",demibold:"6",bold:"7","extra-bold":"8",extrabold:"8","ultra-bold":"8",ultrabold:"8",black:"9",heavy:"9",l:"3",r:"4",b:"7"},Da={i:"i",italic:"i",n:"n",normal:"n"},
Ea=/^(thin|(?:(?:extra|ultra)-?)?light|regular|book|medium|(?:(?:semi|demi|extra|ultra)-?)?bold|black|heavy|l|r|b|[1-9]00)?(n|i|normal|italic)?$/;
function Fa(a){for(var b=a.f.length,c=0;c<b;c++){var d=a.f[c].split(":"),e=d[0].replace(/\+/g," "),f=["n4"];if(2<=d.length){var g;var k=d[1];g=[];if(k)for(var k=k.split(","),h=k.length,m=0;m<h;m++){var l;l=k[m];if(l.match(/^[\w-]+$/)){var n=Ea.exec(l.toLowerCase());if(null==n)l="";else{l=n[2];l=null==l||""==l?"n":Da[l];n=n[1];if(null==n||""==n)n="4";else var r=Ca[n],n=r?r:isNaN(n)?"4":n.substr(0,1);l=[l,n].join("")}}else l="";l&&g.push(l)}0<g.length&&(f=g);3==d.length&&(d=d[2],g=[],d=d?d.split(","):
g,0<d.length&&(d=Ba[d[0]])&&(a.c[e]=d))}a.c[e]||(d=Ba[e])&&(a.c[e]=d);for(d=0;d<f.length;d+=1)a.a.push(new H(e,f[d]))}};function Ga(a,b){this.c=a;this.a=b}var Ha={Arimo:!0,Cousine:!0,Tinos:!0};Ga.prototype.load=function(a){var b=new C,c=this.c,d=new va(this.a.api,z(c),this.a.text),e=this.a.families;xa(d,e);var f=new Aa(e);Fa(f);A(c,za(d),D(b));F(b,function(){a(f.a,f.c,Ha)})};function Ia(a,b){this.c=a;this.a=b}Ia.prototype.load=function(a){var b=this.a.id,c=this.c.m;b?B(this.c,(this.a.api||"https://use.typekit.net")+"/"+b+".js",function(b){if(b)a([]);else if(c.Typekit&&c.Typekit.config&&c.Typekit.config.fn){b=c.Typekit.config.fn;for(var e=[],f=0;f<b.length;f+=2)for(var g=b[f],k=b[f+1],h=0;h<k.length;h++)e.push(new H(g,k[h]));try{c.Typekit.load({events:!1,classes:!1,async:!0})}catch(m){}a(e)}},2E3):a([])};function Ja(a,b){this.c=a;this.f=b;this.a=[]}Ja.prototype.load=function(a){var b=this.f.id,c=this.c.m,d=this;b?(c.__webfontfontdeckmodule__||(c.__webfontfontdeckmodule__={}),c.__webfontfontdeckmodule__[b]=function(b,c){for(var g=0,k=c.fonts.length;g<k;++g){var h=c.fonts[g];d.a.push(new H(h.name,ga("font-weight:"+h.weight+";font-style:"+h.style)))}a(d.a)},B(this.c,z(this.c)+(this.f.api||"//f.fontdeck.com/s/css/js/")+ea(this.c)+"/"+b+".js",function(b){b&&a([])})):a([])};var Y=new pa(window);Y.a.c.custom=function(a,b){return new ua(b,a)};Y.a.c.fontdeck=function(a,b){return new Ja(b,a)};Y.a.c.monotype=function(a,b){return new sa(b,a)};Y.a.c.typekit=function(a,b){return new Ia(b,a)};Y.a.c.google=function(a,b){return new Ga(b,a)};var Z={load:p(Y.load,Y)};"function"===typeof define&&define.amd?define(function(){return Z}):"undefined"!==typeof module&&module.exports?module.exports=Z:(window.WebFont=Z,window.WebFontConfig&&Y.load(window.WebFontConfig));}());