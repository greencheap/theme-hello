//----------------------------------
// ------- Fabric.js Methods ----------
//----------------------------------

if(fabric.version === '1.6.7') {

	fabric.Object.prototype.setCoords = function() {

		var theta = fabric.util.degreesToRadians(this.angle),
			vpt = this.getViewportTransform(),
			dim = this._calculateCurrentDimensions(),
			currentWidth = dim.x,
			currentHeight = dim.y;

		// If width is negative, make postive. Fixes path selection issue
		if (currentWidth < 0) {
			currentWidth = Math.abs(currentWidth);
		}

		var sinTh = Math.sin(theta),
			cosTh = Math.cos(theta),
			_angle = currentWidth > 0 ? Math.atan(currentHeight / currentWidth) : 0,
			_hypotenuse = (currentWidth / Math.cos(_angle)) / 2,
			offsetX = Math.cos(_angle + theta) * _hypotenuse,
			offsetY = Math.sin(_angle + theta) * _hypotenuse,


		// offset added for rotate and scale actions
		coords = fabric.util.transformPoint(this.getCenterPoint(), vpt),
		tl  = new fabric.Point(coords.x - offsetX, coords.y - offsetY),
		tr  = new fabric.Point(tl.x + (currentWidth * cosTh), tl.y + (currentWidth * sinTh)),
		bl  = new fabric.Point(tl.x - (currentHeight * sinTh), tl.y + (currentHeight * cosTh)),
		br  = new fabric.Point(coords.x + offsetX, coords.y + offsetY),
		ml  = new fabric.Point((tl.x + bl.x)/2, (tl.y + bl.y)/2),
		mt  = new fabric.Point((tr.x + tl.x)/2, (tr.y + tl.y)/2),
		mr  = new fabric.Point((br.x + tr.x)/2, (br.y + tr.y)/2),
		mb  = new fabric.Point((br.x + bl.x)/2, (br.y + bl.y)/2),
		mtrX = this.__imageEditor ? mt.x : tr.x,
		mtrY = this.__imageEditor ? mt.y : tr.y,
		mtr = new fabric.Point(mtrX + sinTh * this.rotatingPointOffset, mtrY - cosTh * this.rotatingPointOffset); //FPD: Adjust calculation for top/right position

		this.oCoords = {
			// corners
			tl: tl, tr: tr, br: br, bl: bl,
			// middle
			ml: ml, mt: mt, mr: mr, mb: mb,
			// rotating point
			mtr: mtr
		};

		// set coordinates of the draggable boxes in the corners used to scale/rotate the image
		this._setCornerCoords && this._setCornerCoords();

		return this;
	 };

	 // https://jsfiddle.net/jojobyte/3j352toh/1/
	fabric.Textbox.prototype._wrapLine = function(ctx, text, lineIndex) {
		var lineWidth        = 0,
			lines            = [],
			line             = '',
			words            = text.split(' '),
			word             = '',
			letter           = '',
			offset           = 0,
			infix            = ' ',
			wordWidth        = 0,
			infixWidth       = 0,
			letterWidth      = 0,
			largestWordWidth = 0;

		for (var i = 0; i < words.length; i++) {
			word = words[i];
			wordWidth = this._measureText(ctx, word, lineIndex, offset);
			lineWidth += infixWidth;

			// Break Words if wordWidth is greater than textbox width
			if (wordWidth > this.width) {
				line += infix;
				var wordLetters = word.split('');
				while (wordLetters.length) {
					letterWidth = this._getWidthOfChar(ctx, wordLetters[0], lineIndex, offset);
					if (lineWidth + letterWidth > this.width) {
						lines.push(line);
						line = '';
						lineWidth = 0;
					}
					line += wordLetters.shift();
					offset++;
					lineWidth += letterWidth;
				}
				word = '';
			} else {
				lineWidth += wordWidth;
			}

			if (lineWidth >= this.width && line !== '') {
				lines.push(line);
				line = '';
				lineWidth = wordWidth;
			}

			if (line !== '' || i === 1) {
				line += infix;
			}
			line += word;
			offset += word.length;
			infixWidth = this._measureText(ctx, infix, lineIndex, offset);
			offset++;
		}

		i && lines.push(line);

		if (largestWordWidth > this.dynamicMinWidth) {
			this.dynamicMinWidth = largestWordWidth;
		}

		return lines;
	};

}
else { //FABRICJS 2.+

	fabric.util.object.extend(fabric.Textbox.prototype, {
	  maxWidth: 0,
	  fixedWidth: true,
	  hyphenation : false,
	  get2DCursorLocation: function(selectionStart, skipWrapping) {
	    if (typeof selectionStart === "undefined") {
	      selectionStart = this.selectionStart;
	    }
	    var lines = skipWrapping ? this._unwrappedTextLines : this._textLines;
	    var len = lines.length;
	    for (var i = 0; i < len; i++) {
	      if (selectionStart <= lines[i].length) {
	        return {
	          lineIndex: i,
	          charIndex: selectionStart
	        };
	      }
	      if(this._longLines[i]){
	        selectionStart ++;
	      }
	      selectionStart -= lines[i].length + 1;
	    }
	    return {
	      lineIndex: i - 1,
	      charIndex: lines[i - 1].length < selectionStart ? lines[i - 1].length : selectionStart
	    };
	  },
	  _renderText: function(ctx) {
	    if (this.paintFirst === "stroke") {
	      this._renderTextStroke(ctx);
	      this._renderTextFill(ctx);
	    } else {
	      this._renderTextFill(ctx);
	      this._renderTextStroke(ctx);
	    }
	    if(this.hyphenation){
	      this._renderTextOversize(ctx);
	    }
	  },
	  _renderTextOversize: function(ctx){
	    var lineHeight = 0;
	    for (var i = 0, len = this._textLines.length; i < len; i++) {
	      var lineWidth = this.measureLine(i).width;
	      var lineLeftOffset = this._getLineLeftOffset(i);
	      var heightOfLine = this.getHeightOfLine(i);
	      if(this._longLines[i]){
	        ctx.fillRect(this._getLeftOffset() + lineLeftOffset + lineWidth + 2, this._getTopOffset() + lineHeight + heightOfLine/2 - 1, 5, this.fontSize / 15);
	      }
	      lineHeight += heightOfLine;
	    }
	  },
	  _getNewSelectionStartFromOffset: function(mouseOffset, prevWidth, width, index, jlen) {
	    var distanceBtwLastCharAndCursor = mouseOffset.x - prevWidth,
	      distanceBtwNextCharAndCursor = width - mouseOffset.x,
	      offset = distanceBtwNextCharAndCursor > distanceBtwLastCharAndCursor
	      || distanceBtwNextCharAndCursor < 0 ? 0 : 1,
	      newSelectionStart = index + offset;

	    if (this.flipX) {
	      newSelectionStart = jlen - newSelectionStart;
	    }
	    // the index passed into the function is padded by the amount of lines from _textLines (to account for \n)
	    // we need to remove this padding, and pad it by actual lines, and / or spaces that are meant to be there
	    var tmp     = 0,
	      removed = 0,
	      _long = 0; //modified @den.ponomarev

	    // account for removed characters
	    for (var i = 0; i < this._textLines.length; i++) {
	      tmp += this._textLines[i].length;
	      if (tmp + removed >= newSelectionStart) {
	        break;
	      }
	      //modified @den.ponomarev
	      if(this._longLines[i]){
	        newSelectionStart--;
	        _long++;
	      }
	      if (this.text[tmp + removed] === '\n' || this.text[tmp + removed] === ' ') {
	        removed++;
	      }
	    }
	    if (newSelectionStart > this.text.length) {
	      newSelectionStart = this.text.length;
	    }
	    //modified @den.ponomarev
	    return newSelectionStart - i + removed + _long;
	    //return newSelectionStart + _long;
	  },
	  _wrapLine: function(_line, lineIndex, desiredWidth) {
	    var lineWidth = 0,
	      graphemeLines = [],
	      line = [],
	      words = _line.split(this._reSpaceAndTab),
	      word = "",
	      offset = 0,
	      infix = " ",
	      wordWidth = 0,
	      infixWidth = 0,
	      largestWordWidth = 0,
	      lineJustStarted = true,
	      additionalSpace = this._getWidthOfCharSpacing();

	    this._longLines = [];
	    //todo desiredWidth
	    var _maxWidth = this.maxWidth || this.fixedWidth && this.width;
	    var isLongWord = false;

	    for (var i = 0; i < words.length; i++) {
	      word = fabric.util.string.graphemeSplit(words[i]);
	      wordWidth = this._measureWord(word, lineIndex, offset);

	      if (!this.breakWords) {
	        var _isLong = _maxWidth && wordWidth > _maxWidth;

	        if (_isLong) {
	          if (line.length != 0) {
	            graphemeLines.push(line);
	            this._longLines.push(isLongWord);
	            isLongWord = false;
	            lineWidth = 0;
	            line = [];
	          }

	          var _hypheSize = 0;
	          var _bigWordWidth = 0;// lineWidth + infixWidth;
	          for (var k = 0, len = word.length; k < len && _bigWordWidth <= _maxWidth - _hypheSize; k++) {
	            _bigWordWidth += this._measureWord(word[k], lineIndex, k + offset);
	          }
	          var new_word = word.splice(0, k - 1);
	          isLongWord = true;
	          words.splice(i, 1, new_word.join(""), word.join(""));
	          i--;
	          lineJustStarted = true;
	          continue;
	        }
	      }
	      lineWidth += infixWidth + wordWidth - additionalSpace;

	      if (lineWidth >= this.width){

	        if (this.breakWords) {
	          lineWidth -= wordWidth;
	          line.push(infix);
	          var wordLetters = word.splice(0);

	          while (wordLetters.length) {
	            var letterWidth = this._measureWord(wordLetters[0], lineIndex, offset);
	            if (lineWidth + letterWidth > this.width) {
	              graphemeLines.push(line);
	              this._longLines.push(true);
	              line = [];
	              lineWidth = 0;
	            }
	            line.push(wordLetters.shift());
	            offset++;
	            lineWidth += letterWidth;
	          }
	        }else if(!lineJustStarted){
	           graphemeLines.push(line);
	           this._longLines.push(isLongWord);
	           isLongWord = false;
	           line = [];
	           lineWidth = wordWidth;
	           lineJustStarted = true;
	        }
	      }
	      else {
	        lineWidth += additionalSpace;
	      }
	      offset += word.length;

	      if (!lineJustStarted) {
	        line.push(infix);
	      }
	      line = line.concat(word);

	      infixWidth = this._measureWord(infix, lineIndex, offset);
	      offset++;

	       // keep track of largest word
	      if (wordWidth > largestWordWidth) {
	        largestWordWidth = wordWidth;
	      }
	      lineJustStarted = false;
	    }

	    i && graphemeLines.push(line);
	    this._longLines.push(false);

	    if (this.breakWords) {
	      this.dynamicMinWidth = 0;
	    }else if (largestWordWidth > this.dynamicMinWidth) {
	      this.dynamicMinWidth = largestWordWidth - additionalSpace;
	    }
	    return graphemeLines;
	  },
	});


	fabric.Object.prototype.calcCoords = function(absolute) {

		var multiplyMatrices = fabric.util.multiplyTransformMatrices,
			transformPoint = fabric.util.transformPoint,
			degreesToRadians = fabric.util.degreesToRadians,
			rotateMatrix = this._calcRotateMatrix(),
			translateMatrix = this._calcTranslateMatrix(),
			startMatrix = multiplyMatrices(translateMatrix, rotateMatrix),
			vpt = this.getViewportTransform(),
			finalMatrix = absolute ? startMatrix : multiplyMatrices(vpt, startMatrix),
			dim = this._getTransformedDimensions(), w = dim.x / 2, h = dim.y / 2, tl = transformPoint({
            	x: -w,
				y: -h
        	}, finalMatrix),
			tr = transformPoint({
	            x: w,
	            y: -h
	        }, finalMatrix),
	        bl = transformPoint({
	            x: -w,
	            y: h
	        }, finalMatrix),
	        br = transformPoint({
	            x: w,
	            y: h
	        }, finalMatrix);

        if (!absolute) {

            var padding = this.padding,
            	angle = degreesToRadians(this.angle),
            	cos = fabric.util.cos(angle),
            	sin = fabric.util.sin(angle),
            	cosP = cos * padding,
            	sinP = sin * padding,
            	cosPSinP = cosP + sinP,
            	cosPMinusSinP = cosP - sinP;

            if (padding) {
                tl.x -= cosPMinusSinP;
                tl.y -= cosPSinP;
                tr.x += cosPSinP;
                tr.y -= cosPMinusSinP;
                bl.x -= cosPSinP;
                bl.y += cosPMinusSinP;
                br.x += cosPMinusSinP;
                br.y += cosPSinP;
            }

            var ml = new fabric.Point((tl.x + bl.x) / 2, (tl.y + bl.y) / 2),
            	mt = new fabric.Point((tr.x + tl.x) / 2, (tr.y + tl.y) / 2),
            	mr = new fabric.Point((br.x + tr.x) / 2, (br.y + tr.y) / 2),
            	mb = new fabric.Point((br.x + bl.x) / 2, (br.y + bl.y) / 2),
            	//FPD: Adjust calculation for top/right position
            	mtrX = this.__imageEditor ? mt.x : tr.x,
            	mtrY = this.__imageEditor ? mt.y : tr.y,
            	mtr = new fabric.Point(mtrX + sin * this.rotatingPointOffset, mtrY - cos * this.rotatingPointOffset);
            	//FPD: end
        }

        var coords = {
            tl: tl,
            tr: tr,
            br: br,
            bl: bl
        };

        if (!absolute) {
            coords.ml = ml;
            coords.mt = mt;
            coords.mr = mr;
            coords.mb = mb;
            coords.mtr = mtr;
        }

        return coords;

	};

}

fabric.Canvas.prototype._getRotatedCornerCursor = function(corner, target, e) {
  var n = Math.round((target.angle % 360) / 45);

  //FPD: add CursorOffset
   var cursorOffset = {
    mt: 0, // n
    tr: 1, // ne
    mr: 2, // e
    br: 3, // se
    mb: 4, // s
    bl: 5, // sw
    ml: 6, // w
    tl: 7 // nw
  };

  if (n < 0) {
    n += 8; // full circle ahead
  }
  n += cursorOffset[corner];
  //FPD: uncomment for older version of fabricjs
  /*if (e.shiftKey && cursorOffset[corner] % 2 === 0) {
    //if we are holding shift and we are on a mx corner...
    n += 2;
  }*/
  // normalize n to be from 0 to 7
  n %= 8;

  //FPD: set cursor for copy and remove
  switch(corner) {
	  case 'tl':
	  	return target.copyable ? 'copy' : 'default';
	  break;
	  case 'bl':
	  	return 'pointer';
	  break;
  }
  return this.cursorMap[n];
};

fabric.Text.prototype._constrainScale = function(value) {

	if (Math.abs(value) < this.minScaleLimit) {
		if (value < 0) {
			return -this.minScaleLimit;
		}
		else {
			return this.minScaleLimit;
		}
	}

	//FPD: minimum font size
	if(this.minFontSize !== undefined) {

		var scaledFontSize = parseFloat(Number(value * this.fontSize).toFixed(0));
		if(scaledFontSize < this.minFontSize) {
			return this.minFontSize / this.fontSize;
	  	}

	}

	//FPD: maximum font size
	if(this.maxFontSize !== undefined) {

		var scaledFontSize = parseFloat(Number(value * this.fontSize).toFixed(0));
		if(scaledFontSize > this.maxFontSize) {
			return this.maxFontSize / this.fontSize;
	  	}

	}

	return value;

};
fabric.Object.prototype._drawControl = function(control, ctx, methodName, left, top) {

	var size = this.cornerSize,
		iconOffset = 4,
		iconSize = size - (iconOffset*2),
		offset = (size*.5),
		offsetCorner = 10,
		dotSize = 4;

	offset = offsetCorner = 0;

	if (this.isControlVisible(control)) {

		var wh = this._calculateCurrentDimensions(),
          	width = wh.x,
          	height = wh.y;

		if (control == 'br' ||
			control == 'mtr' ||
			control == 'tl' ||
			control == 'bl' ||
			control == 'ml' ||
			control == 'mr' ||
			control == 'mb' ||
			control == 'mt') {
			switch (control) {

				case 'tl': //copy
					left = left - offset + offsetCorner;
					top = top  - offset + offsetCorner;
					icon = this.__editorMode || this.copyable ? String.fromCharCode('0xe942') : false;
					break;
				case 'mtr': // rotate
					var rotateRight = this.__imageEditor ? 0 : (width/2);
					left = left + rotateRight + offset - offsetCorner;
					top = top  - offset + offsetCorner;
					icon = (this.__editorMode || this.rotatable) && !this.uploadZone ? String.fromCharCode('0xe923') : false;
					break;
				case 'br': // resize
					left = left + offset - offsetCorner;
					top = top  + offset - offsetCorner;
					icon = (this.__editorMode || this.resizable) && this.type !== 'textbox' ? String.fromCharCode('0xe922') : false;
					break;
				case 'bl': //remove
					left = left - offset + offsetCorner;
					top = top + offset - offsetCorner;
					icon = this.__editorMode || this.removable ? String.fromCharCode('0xe926') : false;
					break;
			}

		}

		this.transparentCorners || ctx.clearRect(left, top, size, size);
		if (icon !== false) {

			var extraLeftOffset = control == 'mt' || control == 'mb' ? 5 : 0;
			ctx.fillStyle = this.cornerColor;

			if(!this.__imageEditor) {

				if(control == 'ml' || control == 'mr' || control == 'mt' || control == 'mb') {
					ctx.beginPath();
					left += (dotSize * 3);
					top += (dotSize * 3);
					ctx.arc(left,top,dotSize,0,2*Math.PI);
					ctx.fillStyle = this.cornerIconColor;
					ctx.fill();
				}
				else {
					ctx.fillRect(left, top, size, size);
					ctx.font = iconSize+'px FontFPD';
					ctx.fillStyle = this.cornerIconColor;
					ctx.textAlign = 'left';
					ctx.textBaseline = 'top';
					ctx.fillText(icon, left+iconOffset+extraLeftOffset, top+iconOffset);
				}

			}
			else {
				ctx.fillRect(left, top, size, size);
			}
		}
	}
};

fabric.util.object.extend(fabric.Canvas.prototype, {

    _setSVGObject: function(markup, instance, reviver) {

	    var result = instance.toSVG(reviver);
		//add clipping path to exported svg
	    if(instance.clippingRect && instance.visible) {

			//create svg clip for reference
		     var svgClip = new fabric.Rect({
				  left: instance.clippingRect.left,
				  top: instance.clippingRect.top,
				  fill: 'transparent',
				  width: instance.clippingRect.width,
				  height: instance.clippingRect.height,
				  originX: 'left',
				  originY: 'top'
				}),
				//calculate correct position from center and translate
				center = svgClip.getCenterPoint(),
		    	left = -svgClip.width / 2,
		    	top = -svgClip.height / 2;
				offsetX = center.x + left,
				offsetY = center.y + top,
				id = instance.id || ++fabric.Object.__uid;

			markup.push('<clipPath id="clip-'+id+'"><rect x="'+offsetX+'" y="'+offsetY+'" width="'+instance.clippingRect.width+'" height="'+instance.clippingRect.height+'"></rect></clipPath>');
			markup.push('<g clip-path="url(#clip-'+id+')">'+result+'</g>');

		}
		else if(instance.visible) {
			markup.push(result);
		}

	},

});

fabric.util.object.extend(fabric.Text.prototype, {

	//Modify tspan in SVG otherwise text styles are not displayed in PDF
	_createTextCharSpan: function(_char, styleDecl, left, top) {

		//FPD: add text styles to tspan
		styleDecl.fontWeight = this.fontWeight;
		styleDecl.fontStyle = this.fontStyle;

		var shouldUseWhitespace = _char !== _char.trim() || _char.match(/  +/g),
        	styleProps = this.getSvgSpanStyles(styleDecl, shouldUseWhitespace);

		//FPD: add underlined text
        styleProps += this.textDecoration === 'underline' ? ' text-decoration: underline;' : '';

        var fillStyles = styleProps ? 'style="' + styleProps + '"' : '',
          	dy = styleDecl.deltaY, dySpan = '',
		  	NUM_FRACTION_DIGITS = fabric.Object.NUM_FRACTION_DIGITS;

		if (dy) {
        	dySpan = ' dy="' + fabric.util.toFixed(dy, NUM_FRACTION_DIGITS) + '" ';
      	}

      return [
		'<tspan x="', fabric.util.toFixed(left, NUM_FRACTION_DIGITS), '" y="',
		fabric.util.toFixed(top, NUM_FRACTION_DIGITS), '" ', dySpan,
		fillStyles, '>',
		fabric.util.string.escapeXml(_char),
		'</tspan>'
      ].join('');

	}
});

var FPDPathGroupName = fabric.version === '1.6.7' ? 'path-group' : 'group';

/**
 * A class with some static helper functions. You do not need to initiate the class, just call the methods directly, e.g. FPDUtil.isIE();
 *
 * @class FPDUtil
 */
var FPDUtil =  {

	/**
	 * Checks if browser is IE and return version number.
	 *
	 * @method isIE
	 * @return {Boolean} Returns true if browser is IE.
	 * @static
	 */
	isIE : function() {

		var myNav = navigator.userAgent.toLowerCase();
		return (myNav.indexOf('msie') !== -1) ? parseInt(myNav.split('msie')[1]) : false;

	},

	/**
	 * Resets the key names of the deprecated keys.
	 *
	 * @method rekeyDeprecatedKeys
	 * @param {Object} object An object containing element parameters.
	 * @return {Object} Returns the edited object.
	 * @static
	 */
	rekeyDeprecatedKeys : function(object) {

		var depractedKeys = [
			{old: 'x', replace: 'left'},
			{old: 'y', replace: 'top'},
			{old: 'degree', replace: 'angle'},
			{old: 'currentColor', replace: 'fill'},
			{old: 'filters', replace: 'availableFilters'},
			{old: 'textSize', replace: 'fontSize'},
			{old: 'font', replace: 'fontFamily'},
			{old: 'scale', replace: ['scaleX', 'scaleY']},
			{old: 'uploadZoneScaleMode', replace: 'scaleMode'},
		];

		for(var i=0; i < depractedKeys.length; ++i) {
			if(object.hasOwnProperty(depractedKeys[i].old) && !object.hasOwnProperty(depractedKeys[i].replace)) {

				var replaceObj = depractedKeys[i].replace;
				//this.log('FPD 4.0.0: Parameter "'+depractedKeys[i].old+'" is depracted. Please use "'+replaceObj.toString()+'" instead!', 'warn');

				if(typeof replaceObj === 'object') { //check if old needs to be replaced with multiple options, e.g. scale=>scaleX,scaleY

					for(var j=0; j < replaceObj.length; ++j) {
						object[replaceObj[j]] = object[depractedKeys[i].old];
					}

				}
				else {
					object[depractedKeys[i].replace] = object[depractedKeys[i].old];
				}

				delete object[depractedKeys[i].old];
			}
		}

		return object;

	},

	/**
	 * Writes a message in the console.
	 *
	 * @method log
	 * @param {String} message The text that will be displayed in the console.
	 * @param {String} [type=log] The output type - info, error, warn or log.
	 * @static
	 */
	log : function(message, type) {

		if(typeof console === 'undefined') { return false; }

		if(type === 'info') {
			console.info(message);
		}
		else if (type === 'error') {
			console.error(message);
		}
		else if (type === 'warn') {
			console.warn(message);
		}
		else {
			console.log(message);
		}

	},

	/**
	 * Checks if a string is an URL.
	 *
	 * @method isUrl
	 * @param {String} s The string.
	 * @return {Boolean} Returns true if string is an URL.
	 * @static
	 */
	isUrl : function(s) {

		var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
		return regexp.test(s);

	},

	/**
	 * Removes an element from an array by value.
	 *
	 * @method removeFromArray
	 * @param {Array} array The target array.
	 * @param {String} element The element value.
	 * @return {Array} Returns the edited array.
	 * @static
	 */
	removeFromArray : function(array, element) {

	    var index = array.indexOf(element);
	    if (index > -1) {
		    array.splice(index, 1);
		}

		return array;

	},

	/**
	 * Checks if a string is XML formatted.
	 *
	 * @method isXML
	 * @param {String} string The target string.
	 * @return {Boolean} Returns true if string is XML formatted.
	 * @static
	 */
	isXML : function(string){

	    try {
	        xmlDoc = jQuery.parseXML(string); //is valid XML
	        return true;
	    } catch (err) {
	        // was not XML
	        return false;
	    }

	},

	/**
	 * Checks if an image can be colorized and returns the image type
	 *
	 * @method elementIsColorizable
	 * @param {fabric.Object} element The target element.
	 * @return {String | Boolean} Returns the element type(text, dataurl, png or svg) or false if the element can not be colorized.
	 * @static
	 */
	elementIsColorizable : function(element) {

		if(this.getType(element.type) === 'text') {
			return 'text';
		}

		if(!element.source) {
			return false;
		}

		//check if url is a png or base64 encoded
		var imageParts = element.source.split('.');
		//its base64 encoded
		if(imageParts.length == 1) {

			//check if dataurl is png
			if(imageParts[0].search('data:image/png;') == -1) {
				element.fill = element.colors = false;
				return false;
			}
			else {
				return 'dataurl';
			}

		}
		//its a url
		else {

			var source = element.source;
			source = source.split('?')[0];//remove all url parameters
			imageParts = source.split('.');

			//only png and svg are colorizable
			if($.inArray('png', imageParts) == -1 && $.inArray('svg', imageParts) == -1) {
				element.fill = element.colors = false;
				return false;
			}
			else {
				if($.inArray('svg', imageParts) == -1) {
					return 'png';
				}
				else {
					return 'svg';
				}
			}

		}

	},

	/**
	 * Returns a simpler type of a fabric object.
	 *
	 * @method getType
	 * @param {String} fabricType The fabricjs type.
	 * @return {String} This could be image or text.
	 * @static
	 */
	getType : function(fabricType) {

		if(fabricType === 'text' || fabricType === 'i-text' || fabricType === 'curvedText' || fabricType === 'textbox') {
			return 'text';
		}
		else {
			return 'image';
		}

	},

	/**
	 * Looks for the .fpd-tooltip classes and adds a nice tooltip to these elements (tooltipster).
	 *
	 * @method updateTooltip
	 * @param {jQuery} [$container] The container to look in. If not set, the whole document will be searched.
	 * @static
	 */
	updateTooltip : function($container) {

		$tooltips = $container ? $container.find('.fpd-tooltip') : $('.fpd-tooltip');

		$tooltips.each(function(i, tooltip) {

			var $tooltip = $(tooltip);
			if($tooltip.hasClass('tooltipstered')) {
				$tooltip.tooltipster('reposition');
			}
			else {
				$tooltip.tooltipster({
					offsetY: 0,
					position: 'bottom',
					theme: '.fpd-tooltip-theme',
					touchDevices: false
				});
			}

		});

	},

	/**
	 * Makes an unique array.
	 *
	 * @method arrayUnique
	 * @param {Array} array The target array.
	 * @return {Array} Returns the edited array.
	 * @static
	 */
	arrayUnique : function(array) {

	    var a = array.concat();
	    for(var i=0; i<a.length; ++i) {
	        for(var j=i+1; j<a.length; ++j) {
	            if(a[i] === a[j])
	                a.splice(j--, 1);
	        }
	    }

	    return a;
	},

	/**
	 * Creates a nice scrollbar for an element.
	 *
	 * @method createScrollbar
	 * @param {jQuery} target The target element.
	 * @static
	 */
	createScrollbar : function($target, axis) {

		axis = axis === undefined ? 'y' : axis;

		if($target.hasClass('mCustomScrollbar')) {
			$target.mCustomScrollbar('scrollTo', 0);
		}
		else {
			$target.mCustomScrollbar({
				scrollbarPosition: 'outside',
				autoExpandScrollbar: true,
				autoHideScrollbar: true,
				scrollInertia: 200,
				axis: axis,
				callbacks: {
					onTotalScrollOffset: 100,
					onTotalScroll:function() {
						$(this).trigger('_sbOnTotalScroll');
						FPDUtil.refreshLazyLoad($(this).find('.fpd-grid'), true);
					}
				}
			});
		}

	},

	/**
	 * Checks if a value is not empty. 0 is allowed.
	 *
	 * @method notEmpty
	 * @param {Number | String} value The target value.
	 * @return {Array} Returns true if not empty.
	 * @static
	 */
	notEmpty : function(value) {

		if(value === undefined || value === false || value.length === 0) {
			return false;
		}
		return true;

	},

	/**
	 * Opens the modal box with an own message.
	 *
	 * @method showModal
	 * @param {String} message The message you would like to display in the modal box.
	 * @return {jQuery} Returns a jQuery object containing the modal.
	 * @static
	 */
	showModal : function(htmlMessage, fullscreen, type, $container) {

		type = type === undefined ? '' : type;
		$container = $container === undefined ? $('body') : $container;

		if($container.is('body')) {
			$container.addClass('fpd-overflow-hidden')
		}

		var fullscreenCSS = fullscreen ? 'fpd-fullscreen' : '';
			html = '<div class="fpd-modal-internal fpd-modal-overlay"><div class="fpd-modal-wrapper fpd-shadow-3"><div class="fpd-modal-close"><span class="fpd-icon-close"></span></div><div class="fpd-modal-content"></div></div></div>';

		if($('.fpd-modal-internal').length === 0) {

			$container.append(html)
			.children('.fpd-modal-internal:first').click(function(evt) {

				$target = $(evt.target);
				if($target.hasClass('fpd-modal-overlay')) {

					$target.find('.fpd-modal-close').click();

				}

			});

		}

		if(type === 'prompt') {
			htmlMessage = '<input type="text" placeholder="'+htmlMessage+'" /><span class="fpd-btn"></span>';
		}
		else if(type === 'confirm') {
			htmlMessage = '<div class="fpd-confirm-msg">'+htmlMessage+'</div><span class="fpd-btn fpd-confirm"></span>';
		}

		$container.children('.fpd-modal-internal').attr('data-type', type).removeClass('fpd-fullscreen').addClass(fullscreenCSS)
		.fadeIn(300).find('.fpd-modal-content').html(htmlMessage);

		return $container.children('.fpd-modal-internal');

	},

	/**
	 * Shows a message in the snackbar.
	 *
	 * @method showMessage
	 * @param {String} text The text for the message.
	 * @static
	 */
	showMessage : function(text) {

		var $body = $('body'),
			$snackbarWrapper;

		if($body.children('.fpd-snackbar-wrapper').length > 0) {
			$snackbarWrapper = $body.children('.fpd-snackbar-wrapper');
		}
		else {
			$snackbarWrapper = $body.append('<div class="fpd-snackbar-wrapper"></div>').children('.fpd-snackbar-wrapper');
		}

		var $snackbar = $('<div class="fpd-snackbar fpd-shadow-1"><p></p></div>');
		$snackbar.children('p').html(text);
		$snackbar.appendTo($snackbarWrapper);

		setTimeout(function() {

			$snackbar.addClass('fpd-show-up');

			setTimeout(function() {
				$snackbar.remove();
			}, 5000);

		}, 10);

	},

	/**
	 * Adds a preloader icon to loading picture and loads the image.
	 *
	 * @method loadGridImage
	 * @param {jQuery} picture The image container.
	 * @param {String} source The image URL.
	 * @static
	 */
	loadGridImage : function($picture, source) {

		if($picture.length > 0 && source) {

			$picture.addClass('fpd-on-loading');
			var image = new Image();
			image.src = source;
			image.onload = function() {
				$picture.data('originWidth', this.width).data('originHeight', this.height)
				.removeClass('fpd-on-loading').fadeOut(0)
				.stop().fadeIn(200).css('background-image', 'url("'+this.src+'")');
			};

		}

	},

	//
	/**
	 * Refreshs the items using lazy load.
	 *
	 * @method refreshLazyLoad
	 * @param {jQuery} container The container.
	 * @param {Boolean} loadByCounter If true 15 images will be loaded at once. If false all images will be loaded in the container.
	 * @static
	 */
	refreshLazyLoad : function($container, loadByCounter) {

		if($container && $container.length > 0 && $container.is(':visible')) {

			var $item = $container.children('.fpd-item.fpd-hidden:first'),
				counter = 0,
				amount = loadByCounter ? 15 : 0;

			while(
				(counter < amount
					|| $container.parent('.mCSB_container').height()-150 < $container.parents('.fpd-scroll-area:first').height())
				&& $item.length > 0
			) {
				var $pic = $item.children('picture');
				$item.removeClass('fpd-hidden');
				FPDUtil.loadGridImage($pic, $pic.data('img'));
				$item = $item.next('.fpd-item.fpd-hidden');
				counter++;
			}

		}

	},

	/**
	 * Parses the fabricjs options to a FPD options object.
	 *
	 * @method parseFabricObjectToFPDElement
	 * @param {Object} object The target fabricjs object.
	 * @return {Object} Returns the FPD object.
	 * @static
	 */
	parseFabricObjectToFPDElement : function(object) {

		if(!object) { return {}; }

		var options = new FancyProductDesignerOptions(),
			properties = Object.keys(options.defaults.elementParameters),
			additionalKeys  = FPDUtil.getType(object.type) === 'text' ? Object.keys(options.defaults.textParameters) : Object.keys(options.defaults.imageParameters);

		properties = $.merge(properties, additionalKeys);

		var parameters = {};
		for(var i=0; i < properties.length; ++i) {
			var prop = properties[i];
			if(object[prop] !== undefined) {
				parameters[prop] = object[prop];
			}

		}

		return {
			type: FPDUtil.getType(object.type), //type
			source: object.source, //source
			title: object.title,  //title
			parameters: parameters  //parameters
		};

	},

	/**
	 * If pop-up blocker is enabled, the user will get a notification modal.
	 *
	 * @method popupBlockerAlert
	 * @param {window} popup The target popup window.
	 * @static
	 */
	popupBlockerAlert : function(popup, fpdInstance) {

		if (popup == null || typeof(popup)=='undefined') {
			FPDUtil.showModal(fpdInstance.getTranslation('misc', 'popup_blocker_alert'));
		}

	},

	/**
	 * Returns the scale value calculated with the passed image dimensions and the defined "resize-to" dimensions.
	 *
	 * @method getScalingByDimesions
	 * @param {Number} imgW The width of the image.
	 * @param {Number} imgH The height of the image.
	 * @param {Number} resizeToW The maximum width for the image.
	 * @param {Number} resizeToH The maximum height for the image.
	 * @return {Number} The scale value to resize an image to a desired dimension.
	  * @static
	 */
	getScalingByDimesions : function(imgW, imgH, resizeToW, resizeToH, mode) {

		mode = typeof mode === 'undefined' ? 'fit' : mode;
		resizeToW = typeof resizeToW !== 'number' ? 0 : resizeToW;
		resizeToH = typeof resizeToH !== 'number' ? 0 : resizeToH;

		var scaling = 1,
			rwSet = resizeToW !== 0,
			rhSet = resizeToH !== 0;

		if(mode === 'cover') { //cover whole area

			var dW = resizeToW - imgW,
				dH =  resizeToH - imgH;

		    if (dW < dH) { //scale width
		    	scaling = rwSet ? Math.max(resizeToW / imgW,  resizeToH / imgH) : 1;
		    }
		    else { //scale height
		      	scaling = rhSet ? Math.max(resizeToW / imgW,  resizeToH / imgH) : 1;
		    }

		}
		else { //fit into area

			if(imgW > imgH) {
				scaling = rwSet ? Math.min(resizeToW / imgW,  resizeToH / imgH) : 1;
			}
			else {
				scaling = rhSet ? Math.min(resizeToW / imgW,  resizeToH / imgH) : 1;
			}

		}

		return parseFloat(scaling.toFixed(10));

	},

	/**
	 * Checks if the browser local storage is available.
	 *
	 * @method localStorageAvailable
	 * @return {Boolean} Returns true if local storage is available.
	 * @static
	 */
	localStorageAvailable : function() {

		localStorageAvailable = true;
		//execute this because of a ff issue with localstorage
		try {
			window.localStorage.length;
			window.localStorage.setItem('fpd-storage', 'just-testing');
			//window.localStorage.clear();
		}
		catch(error) {
			localStorageAvailable = false;
			//In Safari, the most common cause of this is using "Private Browsing Mode". You are not able to save products in your browser.
		}

		return localStorageAvailable;

	},

	/**
	 * Checks if the dimensions of an image is within the allowed range set in the customImageParameters of the view options.
	 *
	 * @method checkImageDimensions
	 * @param {FancyProductDesigner} fpdInstance Instance of FancyProductDesigner.
	 * @param {Number} imageW The image width.
	 * @param {Number} imageH The image height.
	 * @return {Array} Returns true if image dimension is within allowed range(minW, minH, maxW, maxH).
	 * @static
	 */
	checkImageDimensions : function(fpdInstance, imageW, imageH) {

		var currentCustomImageParameters = fpdInstance.currentViewInstance.options.customImageParameters;

		if(imageW > currentCustomImageParameters.maxW ||
		imageW < currentCustomImageParameters.minW ||
		imageH > currentCustomImageParameters.maxH ||
		imageH < currentCustomImageParameters.minH) {

			if(fpdInstance.mainBar) {
				fpdInstance.mainBar.toggleDialog(false);
			}

			var msg = fpdInstance.getTranslation('misc', 'uploaded_image_size_alert')
					  .replace('%minW', currentCustomImageParameters.minW)
					  .replace('%minH', currentCustomImageParameters.minH)
					  .replace('%maxW', currentCustomImageParameters.maxW)
					  .replace('%maxH', currentCustomImageParameters.maxH);

			FPDUtil.showModal(msg);
			return false;

		}
		else {
			return true;
		}

	},

	/**
	 * Checks if an element has a color selection.
	 *
	 * @method elementHasColorSelection
	 * @param {fabric.Object} element The target element.
	 * @return {Boolean} Returns true if element has colors.
	 * @static
	 */
	elementHasColorSelection : function(element) {

		return (Array.isArray(element.colors) || Boolean(element.colors) || element.colorLinkGroup) && FPDUtil.elementIsColorizable(element) !== false;

	},

	/**
	 * Returns the available colors of an element.
	 *
	 * @method elementAvailableColors
	 * @param {fabric.Object} element The target element.
	 * @param {FancyProductDesigner} fpdInstance Instance of FancyProductDesigner.
	 * @return {Array} Available colors.
	 * @static
	 */
	elementAvailableColors : function(element, fpdInstance) {

		var availableColors = [];
		if(element.type == FPDPathGroupName) {

			var paths = element.getObjects();
			if(paths.length === 1) {
				availableColors = element.colors;
			}
			else {
				availableColors = [];
				for(var i=0; i < paths.length; ++i) {
					var path = paths[i],
						color = tinycolor(path.fill);
					availableColors.push(color.toHexString());
				}
			}

		}
		else if(element.colorLinkGroup) {
			availableColors = fpdInstance.colorLinkGroups[element.colorLinkGroup].colors;
		}
		else {
			availableColors = element.colors;
		}

		return availableColors;

	},

	/**
	 * Changes a single path color by index.
	 *
	 * @method changePathColor
	 * @param {fabric.Object} element The target element.
	 * @param {Number} index The path index.
	 * @param {String} color Hexadecimal color value.
	 * @return {Array} All colors used in the SVG.
	 * @static
	 */
	changePathColor : function(element, index, color) {

		var svgColors = [],
			paths = element.getObjects();

		for(var i=0; i < paths.length; ++i) {

			var path = paths[i],
				c = tinycolor(path.fill);

			svgColors.push(c.toHexString());
		}

		svgColors[index] = typeof color === 'string' ? color : color.toHexString();

		return svgColors;

	},

	/**
	 * Checks if a string is a valid hexadecimal color value.
	 *
	 * @method isHex
	 * @param {String} value The target value.
	 * @return {Boolean} Returns true if value is a valid hexadecimal color.
	 * @static
	 */
	isHex : function(value) {
		return /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(value);
	},

	/**
	 * Adds a thousand separator and returns it.
	 *
	 * @method addThousandSep
	 * @param {Number} n A numeric value.
	 * @return {String} Returns a string.
	 * @static
	 */
	addThousandSep : function(n){

	    var rx=  /(\d+)(\d{3})/;
	    return String(n).replace(/^\d+/, function(w){
	        while(rx.test(w)){
	            w= w.replace(rx, '$1'+thousandSeparator+'$2');
	        }
	        return w;
	    });

	},

	getFilter : function(type, opts) {

		if(typeof type !== 'string') {
			return null;
		}

		opts = opts === undefined ? {} : opts;
		type = type.toLowerCase();

		if(FPDFilters[type] && FPDFilters[type].array) {
			return new fabric.Image.filters.ColorMatrix({
				matrix: FPDFilters[type].array,
			});
		}

		switch(type) {
			case 'grayscale':
				return new fabric.Image.filters.Grayscale();
			break;
			case 'sepia':
				return new fabric.Image.filters.Sepia();
			break;
			case 'sepia2':
				return new fabric.Image.filters.Sepia2();
			break;
			case 'brightness':
				return new fabric.Image.filters.Brightness(opts);
			break;
			case 'contrast':
				return new fabric.Image.filters.Contrast(opts);
			break;
			case 'removewhite':
				return fabric.version === '1.6.7' ? new fabric.Image.filters.RemoveWhite(opts) : new fabric.Image.filters.RemoveColor(opts);
			break;
		}

		return null;

	},

	spectrumColorNames : function($spContainer, fpdInstance) {

		$spContainer.find('.sp-palette-container .sp-thumb-el').each(function(i, ci) {

			var color = ci.title,
				colorName = fpdInstance.mainOptions.hexNames[color.replace('#', '').toLowerCase()];

			$(ci).attr('title', colorName ? colorName : color).addClass('fpd-tooltip');

			FPDUtil.updateTooltip($spContainer);

		});

	},

	getDeviceByScreenSize : function() {

		var windowWidth = jQuery(window).width();
		if(windowWidth < 568) {
			return 'smartphone';
		}
		else if(windowWidth > 568 && windowWidth <= 768) {
			return 'tablet';
		}
		else {
			return 'desktop'
		}

	},

	elementIsEditable : function(element) {

		return element &&
			(typeof element.colors === 'object' ||
			element.colors === true ||
			element.colors == 1 ||
			element.removable ||
			element.draggable ||
			element.resizable ||
			element.rotatable ||
			element.zChangeable ||
			element.advancedEditing ||
			element.editable
			|| element.uploadZone
			|| (element.colorLinkGroup && element.colorLinkGroup.length > 0));


	},

	hexToRgb : function(hex) {

	    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	    return result ? {
	        r: parseInt(result[1], 16),
	        g: parseInt(result[2], 16),
	        b: parseInt(result[3], 16)
	    } : null;

	},

	unitToPixel : function(length, unit, dpi) {

		dpi = dpi === undefined ? 72 : dpi;

		var ppi = length * dpi;

		if(unit == 'cm') {
			return Math.round(ppi / 2.54);
		}
		else if(unit == 'mm') {
			return Math.round(ppi / 25.4);
		}
		else {
			return Math.round(ppi);
		}

	},

	pixelToUnit : function(pixel, unit, dpi) {

		dpi = dpi === undefined ? 72 : dpi;

		var inches = pixel / dpi;

		if(unit == 'cm') {
			return Math.round(inches * 2.54);
		}
		else if(unit == 'mm') {
			return Math.round(inches * 25.4);
		}
		else {
			return Math.round(inches);
		}

	},

	isSVG : function(element) {

		return element !== null && (element.type === FPDPathGroupName || element.d !== undefined || $.inArray('svg', element.source.split('.')) !== -1);

	}

};

var FPDEmojisRegex = /\uD83C\uDFF4(?:\uDB40\uDC67\uDB40\uDC62(?:\uDB40\uDC65\uDB40\uDC6E\uDB40\uDC67|\uDB40\uDC77\uDB40\uDC6C\uDB40\uDC73|\uDB40\uDC73\uDB40\uDC63\uDB40\uDC74)\uDB40\uDC7F|\u200D\u2620\uFE0F)|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|\uD83D\uDC68(?:\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83D\uDC68|(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDB0-\uDDB3])|(?:\uD83C[\uDFFB-\uDFFF])\u200D(?:\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDB0-\uDDB3]))|\uD83D\uDC69\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDB0-\uDDB3])|\uD83D\uDC69\u200D\uD83D\uDC66\u200D\uD83D\uDC66|(?:\uD83D\uDC41\uFE0F\u200D\uD83D\uDDE8|\uD83D\uDC69(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2695\u2696\u2708]|\uD83D\uDC68(?:(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])|(?:(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)\uFE0F|\uD83D\uDC6F|\uD83E[\uDD3C\uDDDE\uDDDF])\u200D[\u2640\u2642]|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642]|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDD6-\uDDDD])(?:(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642]|\u200D[\u2640\u2642])|\uD83D\uDC69\u200D[\u2695\u2696\u2708])\uFE0F|\uD83D\uDC69\u200D\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D[\uDC66\uDC67])|\uD83D\uDC68(?:\u200D(?:(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D[\uDC66\uDC67])|\uD83D[\uDC66\uDC67])|\uD83C[\uDFFB-\uDFFF])|\uD83C\uDFF3\uFE0F\u200D\uD83C\uDF08|\uD83D\uDC69\u200D\uD83D\uDC67|\uD83D\uDC69(?:\uD83C[\uDFFB-\uDFFF])\u200D(?:\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDB0-\uDDB3])|\uD83D\uDC69\u200D\uD83D\uDC66|\uD83C\uDDF6\uD83C\uDDE6|\uD83C\uDDFD\uD83C\uDDF0|\uD83C\uDDF4\uD83C\uDDF2|\uD83D\uDC69(?:\uD83C[\uDFFB-\uDFFF])|\uD83C\uDDED(?:\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA])|\uD83C\uDDEC(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE])|\uD83C\uDDEA(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA])|\uD83C\uDDE8(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF5\uDDF7\uDDFA-\uDDFF])|\uD83C\uDDF2(?:\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF])|\uD83C\uDDF3(?:\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF])|\uD83C\uDDFC(?:\uD83C[\uDDEB\uDDF8])|\uD83C\uDDFA(?:\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF])|\uD83C\uDDF0(?:\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF])|\uD83C\uDDEF(?:\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5])|\uD83C\uDDF8(?:\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF])|\uD83C\uDDEE(?:\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9])|\uD83C\uDDFF(?:\uD83C[\uDDE6\uDDF2\uDDFC])|\uD83C\uDDEB(?:\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7])|\uD83C\uDDF5(?:\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE])|\uD83C\uDDE9(?:\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF])|\uD83C\uDDF9(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF])|\uD83C\uDDE7(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF])|[#\*0-9]\uFE0F\u20E3|\uD83C\uDDF1(?:\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE])|\uD83C\uDDE6(?:\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF])|\uD83C\uDDF7(?:\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC])|\uD83C\uDDFB(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA])|\uD83C\uDDFE(?:\uD83C[\uDDEA\uDDF9])|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDD6-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uD83C[\uDFFB-\uDFFF])|(?:[\u261D\u270A-\u270D]|\uD83C[\uDF85\uDFC2\uDFC7]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC70\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDCAA\uDD74\uDD7A\uDD90\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC]|\uD83E[\uDD18-\uDD1C\uDD1E\uDD1F\uDD30-\uDD36\uDDB5\uDDB6\uDDD1-\uDDD5])(?:\uD83C[\uDFFB-\uDFFF])|(?:[\u261D\u26F9\u270A-\u270D]|\uD83C[\uDF85\uDFC2-\uDFC4\uDFC7\uDFCA-\uDFCC]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66-\uDC69\uDC6E\uDC70-\uDC78\uDC7C\uDC81-\uDC83\uDC85-\uDC87\uDCAA\uDD74\uDD75\uDD7A\uDD90\uDD95\uDD96\uDE45-\uDE47\uDE4B-\uDE4F\uDEA3\uDEB4-\uDEB6\uDEC0\uDECC]|\uD83E[\uDD18-\uDD1C\uDD1E\uDD1F\uDD26\uDD30-\uDD39\uDD3D\uDD3E\uDDB5\uDDB6\uDDB8\uDDB9\uDDD1-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])?|(?:[\u231A\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD\u25FE\u2614\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA\u26AB\u26BD\u26BE\u26C4\u26C5\u26CE\u26D4\u26EA\u26F2\u26F3\u26F5\u26FA\u26FD\u2705\u270A\u270B\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B\u2B1C\u2B50\u2B55]|\uD83C[\uDC04\uDCCF\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF7C\uDF7E-\uDF93\uDFA0-\uDFCA\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF4\uDFF8-\uDFFF]|\uD83D[\uDC00-\uDC3E\uDC40\uDC42-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDD7A\uDD95\uDD96\uDDA4\uDDFB-\uDE4F\uDE80-\uDEC5\uDECC\uDED0-\uDED2\uDEEB\uDEEC\uDEF4-\uDEF9]|\uD83E[\uDD10-\uDD3A\uDD3C-\uDD3E\uDD40-\uDD45\uDD47-\uDD70\uDD73-\uDD76\uDD7A\uDD7C-\uDDA2\uDDB0-\uDDB9\uDDC0-\uDDC2\uDDD0-\uDDFF])|(?:[#\*0-9\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23E9-\u23F3\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB-\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u261D\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692-\u2697\u2699\u269B\u269C\u26A0\u26A1\u26AA\u26AB\u26B0\u26B1\u26BD\u26BE\u26C4\u26C5\u26C8\u26CE\u26CF\u26D1\u26D3\u26D4\u26E9\u26EA\u26F0-\u26F5\u26F7-\u26FA\u26FD\u2702\u2705\u2708-\u270D\u270F\u2712\u2714\u2716\u271D\u2721\u2728\u2733\u2734\u2744\u2747\u274C\u274E\u2753-\u2755\u2757\u2763\u2764\u2795-\u2797\u27A1\u27B0\u27BF\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B50\u2B55\u3030\u303D\u3297\u3299]|\uD83C[\uDC04\uDCCF\uDD70\uDD71\uDD7E\uDD7F\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE02\uDE1A\uDE2F\uDE32-\uDE3A\uDE50\uDE51\uDF00-\uDF21\uDF24-\uDF93\uDF96\uDF97\uDF99-\uDF9B\uDF9E-\uDFF0\uDFF3-\uDFF5\uDFF7-\uDFFF]|\uD83D[\uDC00-\uDCFD\uDCFF-\uDD3D\uDD49-\uDD4E\uDD50-\uDD67\uDD6F\uDD70\uDD73-\uDD7A\uDD87\uDD8A-\uDD8D\uDD90\uDD95\uDD96\uDDA4\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA-\uDE4F\uDE80-\uDEC5\uDECB-\uDED2\uDEE0-\uDEE5\uDEE9\uDEEB\uDEEC\uDEF0\uDEF3-\uDEF9]|\uD83E[\uDD10-\uDD3A\uDD3C-\uDD3E\uDD40-\uDD45\uDD47-\uDD70\uDD73-\uDD76\uDD7A\uDD7C-\uDDA2\uDDB0-\uDDB9\uDDC0-\uDDC2\uDDD0-\uDDFF])\uFE0F/g;

/**
 * The class defining the default options for Fancy Product Designer.
 *
 * @class Options
 */
var FancyProductDesignerOptions = function() {

	/**
	 * The default options. See: {{#crossLink "Options.defaults"}}{{/crossLink}}
	 *
	 * @property defaults
	 * @for Options
	 * @type {Object}
	 */
	this.defaults = {
		imageLoadTimestamp: false,
	    /**
		* The stage(canvas) width for the product designer.
		*
		* @property stageWidth
		* @for Options.defaults
		* @type {Number}
		* @default "900"
		*/
		stageWidth: 900,
		/**
		* The stage(canvas) height for the product designer.
		*
		* @property stageHeight
		* @for Options.defaults
		* @type {Number}
		* @default "600"
		*/
		stageHeight: 600,
		/**
		* Enables the editor mode, which will add a helper box underneath the product designer with some options of the current selected element.
		*
		* @property editorMode
		* @for Options.defaults
		* @type {Boolean}
		* @default false
		*/
		editorMode: false,
		/**
		* The properties that will be displayed in the editor box when an element is selected.
		*
		* @property editorBoxParameters
		* @for Options.defaults
		* @type {Array}
		* @default ['left', 'top', 'angle', 'fill', 'width', 'height', 'fontSize', 'price']
		*/
		editorBoxParameters: ['left', 'top', 'angle', 'fill', 'width', 'height', 'fontSize', 'price'],
		/**
		* An array containing all available fonts.<br/>Since V4.3 you can use TrueType fonts (ttf), which is also recommend. TrueType fonts are required to include the font in the PDF for Fancy Product Designer - Admin, see example.
		*
		* @property fonts
		* @for Options.defaults
		* @type {Aarray}
		* @default [{name: 'Arial'}, {name: 'Lobster', url: 'google'}]
		* @example since V4.3 set font like this<br />[{name: "Lobster", url: "google"}, {name: 'Custom', url: 'https://yourdomain.com/fonts/custom.ttf"}]
		*/
		fonts: [{name: 'Arial'}, {name: 'Lobster', url: 'google'}],
		/**
		* The directory path that contains the templates.
		*
		* @property templatesDirectory
		* @for Options.defaults
		* @type {String}
		* @default 'templates/'
		*/
		templatesDirectory: 'html/',
		/**
		* To add photos from Facebook, you have to set your own Facebook API key.
		*
		* @property facebookAppId
		* @for Options.defaults
		* @type {String}
		* @default ''
		*/
		facebookAppId: '',
		/**
		* To add photos from Instagram, you have to set an <a href="http://instagram.com/developer/" target="_blank">Instagram client ID</a>.
		*
		* @property instagramClientId
		* @for Options.defaults
		* @type {String}
		* @default ''
		*/
		instagramClientId: '', //the instagram client ID
		/**
		* This URI to the html/instagram_auth.html. You have to update this option if you are using a different folder structure.
		*
		* @property instagramRedirectUri
		* @for Options.defaults
		* @type {String}
		* @default ''
		*/
		instagramRedirectUri: '',
		/**
		* The zoom step when using the UI slider to change the zoom level.
		*
		* @property zoomStep
		* @for Options.defaults
		* @type {Number}
		* @default 0.2
		*/
		zoomStep: 0.2,
		/**
		* The maximal zoom factor. Set it to 1 to hide the zoom feature in the user interface.
		*
		* @property maxZoom
		* @for Options.defaults
		* @type {Number}
		* @default 3
		*/
		maxZoom: 3,
		/**
		* Set custom names for your hexdecimal colors. key=hexcode without #, value: name of the color.
		*
		* @property hexNames
		* @for Options.defaults
		* @type {Object}
		* @default {}
		* @example hexNames: {000000: 'dark',ffffff: 'white'}
		*/
		hexNames: {},
		/**
		* The border color of the selected element.
		*
		* @property selectedColor
		* @for Options.defaults
		* @type {String}
		* @default '#d5d5d5'
		*/
		selectedColor: '#f5f5f5',
		/**
		* The border color of the bounding box.
		*
		* @property boundingBoxColor
		* @for Options.defaults
		* @type {String}
		* @default '#005ede'
		*/
		boundingBoxColor: '#005ede',
		/**
		* The border color of the element when its outside of his bounding box.
		*
		* @property outOfBoundaryColor
		* @for Options.defaults
		* @type {String}
		* @default '#990000'
		*/
		outOfBoundaryColor: '#990000',
		/**
		* If true only the initial elements will be replaced when changing the product. Custom added elements will not be removed.
		*
		* @property replaceInitialElements
		* @for Options.defaults
		* @type {Boolean}
		* @default false
		*/
		replaceInitialElements: false,
		/**
		* If true lazy load will be used for the images in the "Designs" module and "Change Product" module.
		*
		* @property lazyLoad
		* @for Options.defaults
		* @type {Boolean}
		* @default true
		*/
		lazyLoad: true,
		/**
		* Defines the file type used for the templates. E.g. if you want to convert all template files (productdesigner.html and canvaserror.html) into PHP files, you need to change this option to 'php'.
		*
		* @property templatesType
		* @for Options.defaults
		* @type {String}
		* @default 'html'
		*/
		templatesType: 'html',
		/**
		* An object that contains the settings for the AJAX post when a custom added image is added to the canvas (Uploaded Images, Facebook/Instagram Photos). This allows to send the URL of the image to a custom-built script, that returns the data URI of the image or uploads the image to your server and returns the new URL on your server. By default the URL is send to php/custom-image-handler.php. See the <a href="http://api.jquery.com/jquery.ajax/" target="_blank">official jQuery.ajax documentation</a> for more information. The data object has a reserved property called url, which is the image URL that will send to the script. The success function is also reserved.
		*
		* @property customImageAjaxSettings
		* @for Options.defaults
		* @type {Object}
		* @example
		* <pre> customImageAjaxSettings: {<br />  url: 'src/php/custom-image-handler.php',<br />  data: {<br/>   saveOnServer: 1, //image is uploaded to your server <br/>   uploadsDir: '/path/to/uploads_dir', //into this directory <br/>   uploadsDirURL: 'http://yourdomain.com/uploads_dir' //and returns the new URL from this location <br />}}</pre>
		*/
		customImageAjaxSettings: {
			/**
			* The URL to the custom-image-handler.php
			*
			* @property url
			* @type {String}
			* @for Options.defaults.customImageAjaxSettings
			* @default 'php/custom-image-handler.php'
			*/
			url: 'php/custom-image-handler.php',
			/**
			* The HTTP method to use for the request.
			*
			* @property method
			* @type {String}
			* @for Options.defaults.customImageAjaxSettings
			* @default 'POST'
			*/
			method: 'POST',
			/**
			* The type of data that you're expecting back from the server.
			*
			* @property dataType
			* @type {String}
			* @for Options.defaults.customImageAjaxSettings
			* @default 'json'
			*/
			dataType: 'json',
			/**
			* The data object sent to the server.
			*
			* @property data
			* @type {Object}
			* @for Options.defaults.customImageAjaxSettings
			* @default {
				saveOnServer: 0, - use integer as boolean value. 0=false, 1=true
				uploadsDir: './uploads', - if saveOnServer is 1, you need to specify the directory path where the images are saved
				uploadsDirURL: 'http://yourdomain.com/uploads' - if saveOnServer is 1, you need to specify the directory URL where the images are saved
			}
			*/
			data: {
				saveOnServer: 0, //use integer as boolean value. 0=false, 1=true
				uploadsDir: './uploads', //if saveOnServer is true, you need to specify the directory path where the images are saved
				uploadsDirURL: 'http://yourdomain.com/uploads' //if saveOnServer is true, you need to specify the directory URL where the images are saved
			}
		},
		/**
		* Enable an improved resize filter, that may improve the image quality when its resized.
		*
		* @property improvedResizeQuality
		* @for Options.defaults
		* @type {Boolean}
		* @default false
		*/
		improvedResizeQuality: false,
		/**
		* Make the canvas and the elements in the canvas responsive.
		*
		* @property responsive
		* @for Options.defaults
		* @type {Boolean}
		* @default true
		*/
		responsive: true,
		/**
		* Hex color value defining the color for the corner icon controls.
		*
		* @property cornerIconColor
		* @for Options.defaults
		* @type {String}
		* @default '#000000'
		*/
		cornerIconColor: '#000000', //hex
		/**
		* The URL to the JSON file or an object containing all content from the JSON file. Set to false, if you do not need it.
		*
		* @property langJSON
		* @for Options.defaults
		* @type {String | Object | Boolean}
		* @default 'lang/default.json'
		*/
		langJSON: 'lang/default.json',
		/**
		* The color palette when the color wheel is displayed.
		*
		* @property colorPickerPalette
		* @for Options.defaults
		* @type {Array}
		* @default []
		* @example ['#000', '#fff']
		*/
		colorPickerPalette: [], //when colorpicker is enabled, you can define a default palette
		/**
		* An object defining the available actions in the different zones.
		*
		* @property actions
		* @for Options.defaults
		* @type {Object}
		* @default {'top': [], 'right': [], 'bottom': [], 'left': []}
		* @example {'top': ['manage-layers'], 'right': ['info'], 'bottom': ['undo', 'redo'], 'left': []}
		*/
		actions:  {
			'top': [],
			'right': [],
			'bottom': [],
			'left': []
		},
		/**
		* An array defining the available modules in the main bar. Possible values: 'products', 'images', 'text', 'designs'. 'names-numbers', 'drawing' requires Fancy Product Designer Plus Add-On.
		*
		* @property mainBarModules
		* @for Options.defaults
		* @type {Array}
		* @default ['products', 'images', 'text', 'designs']
		*/
		mainBarModules: ['products', 'images', 'text', 'designs', 'manage-layers'],
		/**
		* Set the initial active module.
		*
		* @property initialActiveModule
		* @for Options.defaults
		* @type {String}
		* @default ''
		*/
		initialActiveModule: '',
		/**
		* An object defining the maximum values for input elements in the toolbar.
		*
		* @property maxValues
		* @for Options.defaults
		* @type {String}
		* @default {}
		*/
		maxValues: {},
		/**
		* Set a watermark image when the user downloads/prints the product via the actions. To pass a watermark, just enter a string with an image URL.
		*
		* @property watermark
		* @for Options.defaults
		* @type {Boolean | String}
		* @default false
		*/
		watermark: false,
		/**
		* The number of columns used for the grid images in the images and designs module.
		*
		* @property gridColumns
		* @for Options.defaults
		* @type {Number}
		* @default 2
		*/
		gridColumns: 2,
		/**
		* An object containing the currency string(use %d as placeholder for price), decimal separator and thousand separator.
		*
		* @property priceFormat
		* @for Options.defaults
		* @type {Object}
		* @default {currency: '&#36;%d', decimalSep: '.', thousandSep: ','}
		*/
		priceFormat: {currency: '&#36;%d', decimalSep: '.', thousandSep: ','},
		/**
		* The ID of an element that will be used as container for the main bar.
		*
		* @property mainBarContainer
		* @for Options.defaults
		* @type {Boolean | String}
		* @default false
		* @example #customMainBarContainer
		*/
		mainBarContainer: false,
		/**
		* The ID of an element that will be used to open the modal, in which the designer is included.
		*
		* @property modalMode
		* @for Options.defaults
		* @type {Boolean | String}
		* @default false
		* @example #modalButton
		*/
		modalMode: false,
		/**
		* Enable keyboard control. Use arrow keys to move and backspace key to delete selected element.
		*
		* @property keyboardControl
		* @for Options.defaults
		* @type {Boolean}
		* @default true
		*/
		keyboardControl: true,
		/**
		* Deselect active element when clicking outside of the product designer.
		*
		* @property deselectActiveOnOutside
		* @for Options.defaults
		* @type {Boolean}
		* @default true
		*/
		deselectActiveOnOutside: true,
		/**
		* All upload zones will be always on top of all elements.
		*
		* @property uploadZonesTopped
		* @for Options.defaults
		* @type {Boolean}
		* @default true
		*/
		uploadZonesTopped: true,
		/**
		* Loads the first initial product into stage.
		*
		* @property loadFirstProductInStage
		* @for Options.defaults
		* @type {Boolean}
		* @default true
		*/
		loadFirstProductInStage: true,
		/**
		* If the user leaves the page without saving the product or the getProduct() method is not, a alert window will pop up.
		*
		* @property unsavedProductAlert
		* @for Options.defaults
		* @type {Boolean}
		* @default false
		*/
		unsavedProductAlert: false,
		/**
		* If the user adds something and off-canvas panel or dialog is opened, it will be closed.
		*
		* @property hideDialogOnAdd
		* @for Options.defaults
		* @type {Boolean}
		* @default false
		*/
		hideDialogOnAdd: false,
		/**
		* Set the placement of the toolbar. Possible values: 'dynamic', 'inside-bottom', 'inside-top', 'smart'
		*
		* @property toolbarPlacement
		* @for Options.defaults
		* @type {String}
		* @default 'smart'
		*/
		toolbarPlacement: 'smart',
		/**
		* The grid size for snap action. First value defines the width on the a-axis, the second on the y-axis.
		*
		* @property snapGridSize
		* @for Options.defaults
		* @type {Array}
		* @default [50, 50]
		*/
		snapGridSize: [50, 50],
		/**
		* An object containing <a href="http://fabricjs.com/docs/fabric.Canvas.html" target="_blank">options for the fabricjs canvas</a>.
		*
		* @property fabricCanvasOptions
		* @for Options.defaults
		* @type {Object}
		* @default {}
		*/
		fabricCanvasOptions: {},
		/**
		* Defines the values for the select element in the names & numbers module. Requires Fancy Product Designer Plus Add-On.
		*
		* @property namesNumbersDropdown
		* @for Options.defaults
		* @type {Array}
		* @default []
		*/
		namesNumbersDropdown: [],
		/**
		* Sets price for any extra entry in the names & numbers module. Requires Fancy Product Designer Plus Add-On.
		*
		* @property namesNumbersEntryPrice
		* @for Options.defaults
		* @type {Number}
		* @default 0
		*/
		namesNumbersEntryPrice: 0,
		/**
		* Sets the placement for the color selection, possible values: 'inside-tl', 'inside-tc', 'inside-tr', 'inside-bl', 'inside-bc', 'inside-br' or ID of another element(#my-color-selection). Requires Fancy Product Designer Plus Add-On.
		*
		* @property colorSelectionPlacement
		* @for Options.defaults
		* @type {String}
		* @default ''
		*/
		colorSelectionPlacement: '',
		/**
		* Sets the placement for the Bulk-Add Variations Form. Just enter ID or class of another element(#my-color-selection). Requires Fancy Product Designer Plus Add-On.
		*
		* @property bulkVariationsPlacement
		* @for Options.defaults
		* @type {String}
		* @default ''
		*/
		bulkVariationsPlacement: '',
		/**
		* The available variations for the Bulk-Add Variations Form, e.g.: {'Size': ['XL', 'L', 'M', 'S'], 'Color': ['Red', 'Blue']}. Requires Fancy Product Designer Plus Add-On.
		*
		* @property bulkVariations
		* @for Options.defaults
		* @type {Object}
		* @default {}
		*/
		bulkVariations: {},
		/**
		* The element where the toolbar will be appended when toolbarPlacement='dynamic'.
		*
		* @property toolbarDynamicContext
		* @for Options.defaults
		* @type {String}
		* @default 'body'
		*/
		toolbarDynamicContext: 'body',
		/**
		* Addtional properties for the bounding box. Can be used to set the stroke width etc.. See http://fabricjs.com/docs/fabric.Rect.html
		*
		* @property boundingBoxProps
		* @for Options.defaults
		* @type {Object}
		* @default {strokeWidth: 1}
		*/
		boundingBoxProps: {strokeWidth: 1},
		/**
		* If the image (custom uploaded or design) is larger than the canvas, it will be scaled down to fit into the canvas.
		*
		* @property fitImagesInCanvas
		* @for Options.defaults
		* @type {Boolean}
		* @default false
		*/
		fitImagesInCanvas: false,
		/**
		* Set a maximum price for all products or for specific views. -1 disables the max. price.
		*
		* @property maxPrice
		* @for Options.defaults
		* @type {Number}
		* @default -1
		*/
		maxPrice: -1,
		/**
		* The text can be edited in the canvas by double click/tap.
		*
		* @property inCanvasTextEditing
		* @for Options.defaults
		* @type {Boolean}
		* @default true
		*/
		inCanvasTextEditing: true,
		/**
		* The text input in the toolbar when be opened when an editable text is selected.
		*
		* @property openTextInputOnSelect
		* @for Options.defaults
		* @type {Boolean}
		* @default false
		*/
		openTextInputOnSelect: false,
		/**
		* An array of design category titles (only top-level categories) to enable particular design categories for an upload zone or for the view. An empty array will enable all design categories.
		*
		* @property designCategories
		* @type {Array}
		* @for Options.defaults
		* @default []
		*/
		designCategories: [],
		/**
		* Will make the view(s) optional, so the user have to unlock it. The price for the elements in the view will be added to the total product price as soon as the view is unlocked.
		*
		* @property optionalView
		* @for Options.defaults
		* @type {Boolean}
		* @default false
		*/
		optionalView: false,
		/**
		* When using the save/load actions, store the product in user's browser storage.
		*
		* @property saveActionBrowserStorage
		* @for Options.defaults
		* @type {Boolean}
		* @default true
		*/
		saveActionBrowserStorage: true,
		/**
		* An array containing the pricing rules groups. Use the <a href="http://fancyproductdesigner.com/addon-pricing-rules/" target="_blank" style="text-decoration: underline;">online tool to generate pricing rules</a>. Requires Fancy Product Designer Pricing Add-On.
		*
		* @property pricingRules
		* @for Options.defaults
		* @type {Array}
		* @default []
		*/
		pricingRules: [],
		/**
		* Enables an agreement modal that needs to be confirmed before uploaded images can be used in the product designer. The text in the agreement modal can be set through the language JSON.
		*
		* @property uploadAgreementModal
		* @for Options.defaults
		* @type {Boolean}
		* @default false
		*/
		uploadAgreementModal: false,
		/**
		* An object containing the settings for the image editor.
		*
		* @property imageEditorSettings
		* @for Options.defaults
		* @type {Object}
		* @default {masks: []}
		*/
		imageEditorSettings: {
			/**
			* An array containing the SVG urls for custom mask shapes. Use only one path per SVG, only the first path will be used as mask shape.
			*
			* @property masks
			* @type {Array}
			* @for Options.defaults.imageEditorSettings
			* @default []
			*/
			masks: []
		},
		/**
		* An object containing left, top, width and height properties that represents a printing box. A printing box is a rectangle which is always visible in the canvas and represents the printing area. It is used in the ADMIN solution to create a PDF with a specific printing area.
		*
		* @propert printingBox
		* @for Options.defaults
		* @type {Object}
		* @default null
		*/
		printingBox: null,
		/**
		* Open the Info modal when product designer is loaded. The Info action needs to be added to show the modal.
		*
		* @property autoOpenInfo
		* @for Options.defaults
		* @type {Boolean}
		* @default false
		*/
		autoOpenInfo: false,
		/**
		* Create a custom guided tour by definifing an object with a key/css selector for the target element and the value for the text in the guided tour step. The first part of the key string defines the target type (module or action) followed by a a colon and the name of the module/action or just enter a custom CSS selector string, e.g. module:products, action:manage-layers or #any-element.
		*
		* @property guidedTour
		* @for Options.defaults
		* @type {Null | Object}
		* @default null
		* @example guidedTour: {
"module:products": "This is the text for first step.",
"action:manage-layers": "This is the text for second step.",
"#any-element": "Pointer on a custom HTML element"
}
		*/
		guidedTour: null,
		/**
		* As soon as an element with a color link group is added, the colours of this element will be used for the color group. If false, the colours of all element in the color group will be concatenated.
		*
		* @property replaceColorsInColorGroup
		* @for Options.defaults
		* @type {Boolean}
		* @default false
		*/
		replaceColorsInColorGroup: false,
		/**
		* Defines the image types in lowercase that can be uploaded. Currently the designer supports jpg, svg and png images.
		*
		* @property allowedImageTypes
		* @for Options.defaults
		* @type {Array}
		* @default []
		*/
		allowedImageTypes: ['jpeg', 'png', 'svg'],
		/**
		* To add photos from Pixabay, you have to set an <a href="https://pixabay.com/api/docs/" target="_blank">Pixabay API key</a>.
		*
		* @property pixabayApiKey
		* @for Options.defaults
		* @type {String}
		* @default ''
		*/
		pixabayApiKey: '',
		/**
		* If you want to access high-resolution images, enable this option and you have to ask Pixabay for permission. <a href="https://pixabay.com/api/docs/#hires_image_search_response" target="_blank">You can easily do that here, next to the headline</a>.
		*
		* @property pixabayHighResImages
		* @for Options.defaults
		* @type {Boolean}
		* @default false
		*/
		pixabayHighResImages: false,
		/**
		* Language code of the language to be searched in. Accepted values: cs, da, de, en, es, fr, id, it, hu, nl, no, pl, pt, ro, sk, fi, sv, tr, vi, th, bg, ru, el, ja, ko, zh.
		*
		* @property pixabayLang
		* @for Options.defaults
		* @type {String}
		* @default ''
		* @version 4.7.5
		*/
		pixabayLang: 'en',
		/**
		* Display the internal modals (info, qr-code etc.) in the product designer instead in the whole page.
		*
		* @property openModalInDesigner
		* @for Options.defaults
		* @type {Boolean}
		* @default false
		*/
		openModalInDesigner: false,
		/**
		* Shows the current image size in pixels in a tooltip above the image element when its selected.
		*
		* @property imageSizeTooltip
		* @for Options.defaults
		* @type {Boolean}
		* @default false
		*/
		imageSizeTooltip: false,
		/**
		* To add photos from DepositPhotos, you have to set an <a href="https://pixabay.com/api/docs/" target="_blank">Pixabay API key</a>.
		*
		* @property depositphotosApiKey
		* @for Options.defaults
		* @type {String}
		* @default ''
		*/
		depositphotosApiKey: '',
		/**
		* The language shortcut that defines the language for the category titles. Available language shortcuts: en,de,fr,sp,ru,it,pt,es,pl,nl,jp,cz,se,zh,tr,mx,gr,ko,br,hu,uk,ro,id,th.
		*
		* @property depositphotosLang
		* @for Options.defaults
		* @type {String}
		* @default 'en'
		*/
		depositphotosLang: 'en',
		/**
		* The price that is charged when adding an image from depositphotos.com.
		*
		* @property depositphotosPrice
		* @for Options.defaults
		* @type {Number}
		* @default 0
		*/
		depositphotosPrice: 0,
		/**
		* Highlight objects (editable texts and upload zones) with a dashed border. To enable this just define a hexadecimal color value.
		*
		* @property highlightEditableObjects
		* @for Options.defaults
		* @type {String}
		* @default ''
		* @version 3.7.2
		*/
		highlightEditableObjects: '',
		/**
		* When an element is replaced, apply fill(color) from replaced element to added element.
		*
		* @property applyFillWhenReplacing
		* @for Options.defaults
		* @type {Boolean}
		* @default true
		* @version 3.7.2
		*/
		applyFillWhenReplacing: true,
		/**
		* An array containing layouts. A layout is technically a view that will replace all elements in a view when selected.
		*
		* @property layouts
		* @for Options.defaults
		* @type {Array}
		* @default []
		* @version 4.7.0
		*/
		layouts: [],
		/**
		* Options for the Dynamic Views modul. Requires Fancy Product Designer Plus Add-On.
		*
		* @property dynamicViewsOptions
		* @for Options.defaults
		* @type {Object}
		* @default {}
		* @version 4.7.0
		*/
		dynamicViewsOptions: {
			unit: 'mm', //mm, cm, inch
			formats: [], //predefined formats when adding a blank view
		},
		/**
		* Emojis in text elements will be removed when changing or adding text.
		*
		* @property disableTextEmojis
		* @for Options.defaults
		* @type {Boolean}
		* @default false
		* @version 4.7.4
		*/
		disableTextEmojis: false,
		/**
		* An object containing the default element parameters in addition to the <a href="http://fabricjs.com/docs/fabric.Object.html" target="_blank">default Fabric Object properties</a>. See <a href="./Options.defaults.elementParameters.html">Options.defaults.elementParameters</a>.
		*
		* @property elementParameters
		* @for Options.defaults
		* @type {Object}
		*/
		elementParameters: {
			objectCaching: false,
			/**
			* Allows to set the z-index of an element, -1 means it will be added on the stack of layers
			*
			* @property z
			* @type {Number}
			* @for Options.defaults.elementParameters
			* @default -1
			*/
			z: -1,
			/**
			* The price for the element.
			*
			* @property price
			* @type {Number}
			* @for Options.defaults.elementParameters
			* @default 0
			*/
			price: 0, //how much does the element cost
			/**
			* <ul><li>If false, no colorization for the element is possible.</li><li>One hexadecimal color will enable the colorpicker</li><li>Mulitple hexadecimal colors separated by commmas will show a range of colors the user can choose from.</li></ul>
			*
			* @property colors
			* @type {Boolean | String}
			* @for Options.defaults.elementParameters
			* @default false
			* @example colors: "#000000" => Colorpicker, colors: "#000000,#ffffff" => Range of colors
			*/
			colors: false,
			/**
			* If true the user can remove the element.
			*
			* @property removable
			* @type {Boolean}
			* @for Options.defaults.elementParameters
			* @default false
			*/
			removable: false,
			/**
			* If true the user can drag the element.
			*
			* @property draggable
			* @type {Boolean}
			* @for Options.defaults.elementParameters
			* @default false
			*/
			draggable: false,
			/**
			* If true the user can rotate the element.
			*
			* @property rotatable
			* @type {Boolean}
			* @for Options.defaults.elementParameters
			* @default false
			*/
			rotatable: false,
			/**
			* If true the user can resize the element.
			*
			* @property resizable
			* @type {Boolean}
			* @for Options.defaults.elementParameters
			* @default false
			*/
			resizable: false,
			/**
			* If true the user can copy non-initial elements. Copyable property is enabled for designs and custom added elements automatically.
			*
			* @property copyable
			* @type {Boolean}
			* @for Options.defaults.elementParameters
			* @default false
			*/
			copyable: false,
			/**
			* If true the user can change the z-position the element.
			*
			* @property zChangeable
			* @type {Boolean}
			* @for Options.defaults.elementParameters
			* @default false
			*/
			zChangeable: false,
			/**
			* Defines a bounding box (printing area) for the element.<ul>If false no bounding box</li><li>The title of an element in the same view, then the boundary of the target element will be used as bounding box.</li><li>An object with x,y,width and height defines the bounding box</li></ul>
			*
			* @property boundingBox
			* @type {Boolean}
			* @for Options.defaults.elementParameters
			* @default false
			*/
			boundingBox: false,
			/**
			* Set the mode for the bounding box. Possible values: 'none', 'clipping', 'limitModify', 'inside'
			*
			* @property boundingBoxMode
			* @type {String}
			* @for Options.defaults.elementParameters
			* @default 'inside'
			*/
			boundingBoxMode: 'inside',
			/**
			* Centers the element in the canvas or when it has a bounding box in the bounding box.
			*
			* @property autoCenter
			* @type {Boolean}
			* @for Options.defaults.elementParameters
			* @default false
			*/
			autoCenter: false,
			/**
			* Replaces an element with the same type and replace value.
			*
			* @property replace
			* @type {String}
			* @for Options.defaults.elementParameters
			* @default ''
			*/
			replace: '',
			/**
			* If a replace value is set, you can decide if the element replaces the elements with the same replace value in all views or only in the current showing view.
			*
			* @property replaceInAllViews
			* @type {Boolean}
			* @for Options.defaults.elementParameters
			* @default ''
			*/
			replaceInAllViews: false,
			/**
			* Selects the element when its added to stage.
			*
			* @property autoSelect
			* @type {Boolean}
			* @for Options.defaults.elementParameters
			* @default false
			*/
			autoSelect: false,
			/**
			* Sets the element always on top.
			*
			* @property topped
			* @type {Boolean}
			* @for Options.defaults.elementParameters
			* @default false
			*/
			topped: false,
			/**
			* You can define different prices when using a range of colors, set through the colors option.
			*
			* @property colorPrices
			* @type {Object}
			* @for Options.defaults.elementParameters
			* @default {}
			* @example colorPrices: {"000000": 2, "ffffff: "3.5"}
			*/
			colorPrices: {},
			/**
			* Include the element in a color link group. So elements with the same color link group are changing to same color as soon as one element in the group is changing the color.
			*
			* @property colorLinkGroup
			* @type {Boolean | String}
			* @for Options.defaults.elementParameters
			* @default false
			* @example 'my-color-group'
			*/
			colorLinkGroup: false,
			/**
			* An array of URLs to pattern image - onyl for SVG images or text elements.
			*
			* @property patterns
			* @type {Array}
			* @for Options.defaults.elementParameters
			* @default []
			* @example patterns: ['patterns/pattern_1.png', 'patterns/pattern_2.png',]
			*/
			patterns: [],
			/**
			* An unique identifier for the element.
			*
			* @property sku
			* @type {String}
			* @for Options.defaults.elementParameters
			* @default ''
			*/
			sku: '',
			/**
			* When true the element is not exported in SVG. If you are going to use one of the data URL methods (e.g. <a href="./FancyProductDesigner.html#method_getProductDataURL">getProductDataURL()</a>), you need to set onlyExportable=true in the options, so the element is not exported in the data URL.
			*
			* @property excludeFromExport
			* @type {Boolean}
			* @for Options.defaults.elementParameters
			* @default false
			*/
			excludeFromExport: false,
			/**
			* Shows the element colors in color selection panel. Requires Fancy Product Designer Plus Add-On.
			*
			* @property showInColorSelection
			* @type {Boolean}
			* @for Options.defaults.elementParameters
			* @default false
			*/
			showInColorSelection: false,
			/**
			* By the default the element will be locked and needs to be unlocked by the user via the "Manage Layers" module.
			*
			* @property locked
			* @type {Boolean}
			* @for Options.defaults.elementParameters
			* @default false
			*/
			locked: false,
			originX: 'center',
			originY: 'center',
			cornerSize: 24,
			fill: false,
			lockUniScaling: true,
			pattern: false,
			top: 0,
			left: 0,
			angle: 0,
			flipX: false,
			flipY: false,
			opacity: 1,
			scaleX: 1,
			scaleY: 1,
		},
		/**
		* An object containing the default text element parameters in addition to the <a href="http://fabricjs.com/docs/fabric.IText.html" target="_blank">default Fabric IText properties</a>. See <a href="./Options.defaults.textParameters.html">Options.defaults.textParameters</a>. The properties in the object will merge with the properties in the elementParameters.
		*
		* @property textParameters
		* @for Options.defaults
		* @type {Object}
		*/
		textParameters: {
			/**
			* The maximal allowed characters. 0 means unlimited characters.
			*
			* @property maxLength
			* @type {Number}
			* @for Options.defaults.textParameters
			* @default 0
			*/
			maxLength: 0,
			/**
			* If true the text will be curved.
			*
			* @property curved
			* @type {Boolean}
			* @for Options.defaults.textParameters
			* @default false
			*/
			curved: false,
			/**
			* If true the the user can switch between curved and normal text.
			*
			* @property curvable
			* @type {Boolean}
			* @for Options.defaults.textParameters
			* @default false
			*/
			curvable: false,
			/**
			* The letter spacing when the text is curved.
			*
			* @property curveSpacing
			* @type {Number}
			* @for Options.defaults.textParameters
			* @default 10
			*/
			curveSpacing: 10,
			/**
			* The radius when the text is curved.
			*
			* @property curveRadius
			* @type {Number}
			* @for Options.defaults.textParameters
			* @default 80
			*/
			curveRadius: 80,
			/**
			* Reverses the curved text.
			*
			* @property curveReverse
			* @type {Boolean}
			* @for Options.defaults.textParameters
			* @default false
			*/
			curveReverse: false,
			/**
			* The maximal allowed lines. 0 means unlimited characters.
			*
			* @property maxLines
			* @type {Number}
			* @for Options.defaults.textParameters
			* @default 0
			*/
			maxLines: 0,
			/**
			* Enables the text element as a text box. A text box has a fixed width and not be resized.
			*
			* @property textBox
			* @type {Boolean}
			* @for Options.defaults.textParameters
			* @default false
			*/
			textBox: false,
			/**
			* Enables the text element as a placeholder for the Names & Numbers module. You can enable this parameter for one text element in a view.
			*
			* @property textPlaceholder
			* @type {Boolean | Array}
			* @for Options.defaults.textParameters
			* @default false
			*/
			textPlaceholder: false,
			/**
			* Enables the text element as a number placeholder for the Names & Numbers module. You can enable this parameter for one text element in a view. If you want to define a range of allowed numbers, just use an array. The first value in the array defines the minimum value, the second value defines the maximum value, e.g. [0, 10].
			*
			* @property numberPlaceholder
			* @type {Boolean}
			* @for Options.defaults.textParameters
			* @default false
			*/
			numberPlaceholder: false,
			/**
			* Addtional space between letters.
			*
			* @property letterSpacing
			* @type {Number}
			* @for Options.defaults.textParameters
			* @default 0
			*/
			letterSpacing: 0,
			/**
			* The price will be charged first after the text has been edited.
			*
			* @property chargeAfterEditing
			* @type {Boolean}
			* @for Options.defaults.textParameters
			* @default false
			*/
			chargeAfterEditing: false,
			/**
			* The minimum font size.
			*
			* @property minFontSize
			* @type {Number}
			* @for Options.defaults.textParameters
			* @default 1
			*/
			minFontSize: 1,
			/**
			* Set the text transform - none, lowercase, uppercase.
			*
			* @property textTransform
			* @type {String}
			* @for Options.defaults.textParameters
			* @default 'none'
			*/
			textTransform: 'none',
			/**
			* Set a width for the text, so the text will be scaled up/down to the given area.
			*
			* @property widthFontSize
			* @type {Number}
			* @for Options.defaults.textParameters
			* @default 0
			*/
			widthFontSize: 0,
			/**
			* The maximum font size.
			*
			* @property maxFontSize
			* @type {Number}
			* @for Options.defaults.textParameters
			* @default 1
			*/
			maxFontSize: 1000,
			/**
			* The color of the shadow.
			*
			* @property shadowColor
			* @type {Number}
			* @for Options.defaults.textParameters
			* @default ''
			*/
			shadowColor: '',
			/**
			* Shadow Blur.
			*
			* @property shadowBlur
			* @type {Number}
			* @for Options.defaults.textParameters
			* @default 0
			*/
			shadowBlur: 0,
			/**
			* Shadow horizontal offset.
			*
			* @property shadowOffsetX
			* @type {Number}
			* @for Options.defaults.textParameters
			* @default 0
			*/
			shadowOffsetX: 0,
			/**
			* Shadow vertical offset.
			*
			* @property shadowOffsetY
			* @type {Number}
			* @for Options.defaults.textParameters
			* @default 0
			*/
			shadowOffsetY: 0,
			editable: true,
			fontFamily: "Arial",
			fontSize: 18,
			lineHeight: 1,
			fontWeight: 'normal', //set the font weight - bold or normal
			fontStyle: 'normal', //'normal', 'italic'
			textDecoration: 'normal', //'normal' or 'underline'
			padding: 10,
			textAlign: 'left',
			stroke: null,
			strokeWidth: 0,
			charSpacing: 0,
		},
		/**
		* An object containing the default image element parameters in addition to the <a href="http://fabricjs.com/docs/fabric.Image.html" target="_blank">default Fabric Image properties</a>. See <a href="./Options.defaults.imageParameters.html">Options.defaults.imageParameters</a>. The properties in the object will merge with the properties in the elementParameters.
		*
		* @property imageParameters
		* @for Options.defaults
		* @type {Object}
		*/
		imageParameters: {
			/**
			* If true the image will be used as upload zone. That means the image is a clickable area in which the user can add different media types.
			*
			* @property uploadZone
			* @type {Boolean}
			* @for Options.defaults.imageParameters
			* @default false
			*/
			uploadZone: false,
			/**
			* Sets a filter on the image. Possible values: 'grayscale', 'sepia', 'sepia2' or any filter name from FPDFilters class.
			*
			* @property filter
			* @type {Boolean}
			* @for Options.defaults.imageParameters
			* @default null
			*/
			filter: null,
			/**
			* Allow user to unlock proportional resizing in the toolbar.
			*
			* @property uniScalingUnlockable
			* @type {Boolean}
			* @for Options.defaults.imageParameters
			* @default false
			*/
			uniScalingUnlockable: false,
			/**
			* Set the scale mode when image is added into an upload zone or resizeToW/resizeToH properties are set. Possible values: 'fit', 'cover'
			*
			* @property scaleMode
			* @type {String}
			* @for Options.defaults.imageParameters
			* @default 'fit'
			*/
			scaleMode: 'fit',
			/**
			* Resizes the uploaded image to this width. 0 means it will not be resized.
			*
			* @property resizeToW
			* @type {Number}
			* @for Options.defaults.imageParameters
			* @default 0
			*/
			resizeToW: 0,
			/**
			* Resizes the uploaded image to this height. 0 means it will not be resized.
			*
			* @property resizeToH
			* @type {Number}
			* @for Options.defaults.imageParameters
			* @default 0
			*/
			resizeToH: 0,
			/**
			* Enables advanced editing, the user can crop, set filters and manipulate the color of the image. This works only for png or jpeg images. If the original image has been edited via the image editor, the original image will be replaced by a PNG with 72DPI!
			*
			* @property advancedEditing
			* @type {Boolean}
			* @for Options.defaults.imageParameters
			* @default false
			*/
			advancedEditing: false,
			padding: 0,
			minScaleLimit: 0.01
		},
		/**
		* An object containing the default parameters for custom added images. See <a href="./Options.defaults.customImageParameters.html">Options.defaults.customImageParameters</a>. The properties in the object will merge with the properties in the elementParameters and imageParameters.
		*
		* @property customImageParameters
		* @for Options.defaults
		* @type {Object}
		*/
		customImageParameters: {
			/**
			* The minimum upload size width.
			*
			* @property minW
			* @type {Number}
			* @for Options.defaults.customImageParameters
			* @default 100
			*/
			minW: 100,
			/**
			* The minimum upload size height.
			*
			* @property minH
			* @type {Number}
			* @for Options.defaults.customImageParameters
			* @default 100
			*/
			minH: 100,
			/**
			* The maximum upload size width.
			*
			* @property maxW
			* @type {Number}
			* @for Options.defaults.customImageParameters
			* @default 1500
			*/
			maxW: 1500,
			/**
			* The maximum upload size height.
			*
			* @property maxH
			* @type {Number}
			* @for Options.defaults.customImageParameters
			* @default 1500
			*/
			maxH: 1500,
			/**
			* The minimum allowed DPI for uploaded images. Works only with JPEG images.
			*
			* @property minDPI
			* @type {Number}
			* @for Options.defaults.customImageParameters
			* @default 72
			*/
			minDPI: 72,
			/**
			* The maxiumum image size in MB.
			*
			* @property maxSize
			* @type {Number}
			* @for Options.defaults.customImageParameters
			* @default 10
			*/
			maxSize: 10
		},
		/**
		* An object containing additional parameters for custom added text.The properties in the object will merge with the properties in the elementParameters and textParameters.
		*
		* @property customTextParameters
		* @for Options.defaults
		* @type {Object}
		*/
		customTextParameters: {},
		/**
		* An object containing the supported media types the user can add in the product designer.
		*
		* @property customAdds
		* @for Options.defaults
		* @type {Object}
		*/
		customAdds: {
			/**
			* If true the user can add images from the designs library.
			*
			* @property designs
			* @type {Boolean}
			* @for Options.defaults.customAdds
			* @default true
			*/
			designs: true,
			/**
			* If true the user can add an own image.
			*
			* @property uploads
			* @type {Boolean}
			* @for Options.defaults.customAdds
			* @default true
			*/
			uploads: true,
			/**
			* If true the user can add own text.
			*
			* @property texts
			* @type {Boolean}
			* @for Options.defaults.customAdds
			* @default true
			*/
			texts: true,
			/**
			* If true the user can add own drawings.
			*
			* @property drawing
			* @type {Boolean}
			* @for Options.defaults.customAdds
			* @default true
			*/
			drawing: true
		},
		/**
		* An object containing the properties (parameters) for the QR code.
		*
		* @property qrCodeProps
		* @for Options.defaults
		* @type {Object}
		*/
		qrCodeProps: {
			/**
			* @property autoCenter
			* @type {Boolean}
			* @for Options.defaults.qrCodeProps
			* @default true
			*/
			autoCenter: true,
			/**
			* @property draggable
			* @type {Boolean}
			* @for Options.defaults.qrCodeProps
			* @default true
			*/
			draggable: true,
			/**
			* @property removable
			* @type {Boolean}
			* @for Options.defaults.qrCodeProps
			* @default true
			*/
			removable: true,
			/**
			* @property resizable
			* @type {Boolean}
			* @for Options.defaults.qrCodeProps
			* @default true
			*/
			resizable: true
		},
	};

	/**
	 * Merges the default options with custom options.
	 *
	 * @method merge
	 * @for Options
	 * @param {Object} defaults The default object.
	 * @param {Object} [merge] The merged object, that will be merged into the defaults.
	 * @return {Object} The new options object.
	 */
	this.merge = function(defaults, merge) {

		typeof merge === 'undefined' ? {} : merge;

		var options = $.extend({}, defaults, merge);
		options.elementParameters = $.extend({}, defaults.elementParameters, options.elementParameters);
		options.textParameters = $.extend({}, defaults.textParameters, options.textParameters);
		options.imageParameters = $.extend({}, defaults.imageParameters, options.imageParameters);
		options.customTextParameters = $.extend({}, defaults.customTextParameters, options.customTextParameters);
		options.customImageParameters = $.extend({}, defaults.customImageParameters, options.customImageParameters);
		options.customAdds = $.extend({}, defaults.customAdds, options.customAdds);
		options.customImageAjaxSettings = $.extend({}, defaults.customImageAjaxSettings, options.customImageAjaxSettings);
		options.qrCodeProps = $.extend({}, defaults.qrCodeProps, options.qrCodeProps);
		options.imageEditorSettings = $.extend({}, defaults.imageEditorSettings, options.imageEditorSettings);
		options.dynamicViewsOptions = $.extend({}, defaults.dynamicViewsOptions, options.dynamicViewsOptions);

		return options;

	};

	/**
	 * Returns all element parameter keys.
	 *
	 * @method getParameterKeys
	 * @for Options
	 * @return {Array} An array containing all element parameter keys.
	 */
	this.getParameterKeys = function() {

		var elementParametersKeys = Object.keys(this.defaults.elementParameters),
			imageParametersKeys = Object.keys(this.defaults.imageParameters),
			textParametersKeys = Object.keys(this.defaults.textParameters);

		elementParametersKeys = elementParametersKeys.concat(imageParametersKeys);
		elementParametersKeys = elementParametersKeys.concat(textParametersKeys);

		return elementParametersKeys;

	};

};

/**
 * The class to create a view. A view contains the canvas. You need to call {{#crossLink "FancyProductDesignerView/setup:method"}}{{/crossLink}} to set up the canvas with all elements, after setting an instance of {{#crossLink "FancyProductDesignerView"}}{{/crossLink}}.
 *
 * @class FancyProductDesignerView
 * @constructor
 * @param {jQuery} elem - jQuery object holding the container.
 * @param {Object} view - The default options for the view.
 * @param {Function} callback - This function will be called as soon as the view and all initial elements are loaded.
 * @param {Object} fabricjsCanvasOptions - Options for the fabricjs canvas.
 */
var FancyProductDesignerView = function($productStage, view, callback, fabricCanvasOptions) {

	'use strict';

	fabricCanvasOptions = typeof fabricCanvasOptions === 'undefined' ? {} : fabricCanvasOptions;

	var $this = $(this),
		instance = this,
		mouseDownStage = false,
		initialElementsLoaded = false,
		tempModifiedParameters = null,
		modifiedType = null,
		limitModifyParameters = {},
		fpdOptions = new FancyProductDesignerOptions();

	var _initialize = function() {

		/**
		 * The view title.
		 *
		 * @property title
		 * @type String
		 */
		instance.title = view.title;
		/**
		 * The view thumbnail.
		 *
		 * @property thumbnail
		 * @type String
		 */
		instance.thumbnail = view.thumbnail;
		/**
		 * The view elements.
		 *
		 * @property elements
		 * @type Object
		 */
		instance.elements = view.elements;
		/**
		 * The view options.
		 *
		 * @property options
		 * @type Object
		 */
		instance.options = view.options;
		/**
		 * The view undos.
		 *
		 * @property undos
		 * @type Array
		 * @default []
		 */
		instance.undos = [];
		/**
		 * The view redos.
		 *
		 * @property redos
		 * @type Array
		 * @default []
		 */
		instance.redos = [];
		/**
		 * The total price for the view without max. price.
		 *
		 * @property totalPrice
		 * @type Number
		 * @default 0
		 */
		instance.totalPrice = 0;
		/**
		 * The total price for the view including max. price and corrert formatting.
		 *
		 * @property truePrice
		 * @type Number
		 * @default 0
		 */
		instance.truePrice = 0;
		/**
		 * The set zoom for the view.
		 *
		 * @property zoom
		 * @type Number
		 * @default 0
		 */
		instance.zoom = 1;
		/**
		 * The responsive scale.
		 *
		 * @property responsiveScale
		 * @type Number
		 * @default 1
		 */
		instance.responsiveScale = 1;
		/**
		 * The current selected element.
		 *
		 * @property currentElement
		 * @type fabric.Object
		 * @default null
		 */
		instance.currentElement = null;
		/**
		 * The current selected bounding box object.
		 *
		 * @property currentBoundingObject
		 * @type fabric.Object
		 * @default null
		 */
		instance.currentBoundingObject = null;
		/**
		 * The title of the current selected upload zone.
		 *
		 * @property currentUploadZone
		 * @type String
		 * @default null
		 */
		instance.currentUploadZone = null;
		/**
		 * An instance of fabricjs canvas class. <a href="http://fabricjs.com/docs/fabric.Canvas.html" target="_blank">It allows to interact with the fabricjs API.</a>
		 *
		 * @property stage
		 * @type fabric.Canvas
		 * @default null
		 */
		instance.stage = null;
		/**
		 * Properties to include when using the {{#crossLink "FancyProductDesignerView/getJSON:method"}}{{/crossLink}} or {{#crossLink "FancyProductDesignerView/getElementJSON:method"}}{{/crossLink}}.
		 *
		 * @property propertiesToInclude
		 * @type Array
		 * @default ['_isInitial', 'lockMovementX', 'lockMovementY', 'lockRotation', 'lockScalingX', 'lockScalingY', 'lockScalingFlip', 'lockUniScaling', 'resizeType', 'clipTo', 'clippingRect', 'boundingBox', 'boundingBoxMode', 'selectable', 'evented', 'title', 'editable', 'cornerColor', 'cornerIconColor', 'borderColor', 'isEditable', 'hasUploadZone']
		 */
		instance.propertiesToInclude = ['_isInitial', 'lockMovementX', 'lockMovementY', 'lockRotation', 'lockScalingX', 'lockScalingY', 'lockScalingFlip', 'lockUniScaling', 'resizeType', 'clipTo', 'clippingRect', 'boundingBox', 'boundingBoxMode', 'selectable', 'evented', 'title', 'editable', 'cornerColor', 'cornerIconColor', 'borderColor', 'isEditable', 'hasUploadZone'];
		/**
		 * The URL to the SVG that is going to be used as mask.
		 *
		 * @property mask
		 * @type String
		 * @default null
		 */
		instance.mask = view.mask ? view.mask : null;
		/**
		 * The image object that is going to be used as mask for this view.
		 *
		 * @property maskObject
		 * @type fabric.Image
		 * @default null
		 */
		instance.maskObject = null;
		/**
		 * A fabric.Rect representing the printing box.
		 *
		 * @property printingBoxObject
		 * @type fabric.Rect
		 * @default null
		 */
		instance.printingBoxObject = null;
		/**
		 * The locked state of the view.
		 *
		 * @property locked
		 * @type Boolean
		 * @default false
		 */
		instance.locked = view.locked !== undefined ? view.locked : view.options.optionalView;
		instance.dragStage = false;

		//PLUS
		instance.textPlaceholder = null;
		instance.numberPlaceholder = null;
		instance.names_numbers = view.names_numbers ? view.names_numbers : null;

		//replace old width option with stageWidth
		if(instance.options.width) {
			instance.options.stageWidth = instance.options.width;
			delete instance.options['width'];
		}

		//add new canvas
		$productStage.append('<canvas></canvas>');

		$this.on('elementAdd', function(evt, element){

			if(!element) {
				return;
			}

			//check for other topped elements
			_bringToppedElementsToFront();

			if(element.isCustom && !element.hasUploadZone && !element.replace) {
				element.copyable = element.originParams.copyable = true;
				instance.stage.renderAll();
			}

		});

		//create fabric stage
		var canvas = $productStage.children('canvas:last').get(0),
			canvasOptions = $.extend({}, {
				containerClass: 'fpd-view-stage fpd-hidden',
				selection: false,
				hoverCursor: 'pointer',
				controlsAboveOverlay: true,
				centeredScaling: true,
				allowTouchScrolling: true,
				preserveObjectStacking: true
			}, fabricCanvasOptions);

		instance.stage = new fabric.Canvas(canvas, canvasOptions).on({
			'object:added': function(opts) {

				var element = opts.target,
					price = element.price;

				//if element is added into upload zone, use upload zone price if one is set
				if((instance.currentUploadZone && instance.currentUploadZone != '')) {

					var uploadZoneObj = instance.getElementByTitle(instance.currentUploadZone);
					price = uploadZoneObj.price ? uploadZoneObj.price : price;

				}

				if(price !== undefined &&
					price !== 0 &&
					!element.uploadZone &&
					element.type !== 'rect' &&
					(!element.chargeAfterEditing || element._isPriced)
				) {

					element.setCoords();
					instance.changePrice(price, '+');

				}

				$this.trigger('fabricObject:added', [element]);

			},
			'object:removed': function(opts) {

				var element = opts.target;

				if(element.price !== undefined && element.price !== 0 && !element.uploadZone
					&& (!element.chargeAfterEditing || element._isPriced)) {
					instance.changePrice(element.price, '-');
				}

				$this.trigger('fabricObject:removed', [element]);

			}
		});

		instance.stage.setDimensions({width: instance.options.stageWidth, height: instance.options.stageHeight});

		if(instance.mask) {
			instance.setMask(instance.mask);
		}

		if(instance.options.printingBox && instance.options.printingBox.hasOwnProperty('left')) {

			instance.printingBoxObject = new fabric.Rect({
				left: instance.options.printingBox.left,
				top: instance.options.printingBox.top,
				width: instance.options.printingBox.width,
				height: instance.options.printingBox.height,
				stroke: instance.options.printingBox.visibility || instance.options.editorMode ? '#f4b7bb' : 'transparent',
				strokeWidth: 1.5,
				strokeLineCap: 'square',
				//strokeDashArray: [10, 10],
				fill: false,
				selectable: false,
				evented: false,
				originX: 'left',
				originY: 'top',
				name: "printing-box",
				excludeFromExport: true
			});

			instance.stage.add(instance.printingBoxObject);

		}


	};

	var _afterSetup = function() {

		callback.call(callback, instance);

		initialElementsLoaded = true;

		if(instance.options.keyboardControl) {

			$(document).on('keydown', function(evt) {

				var $target = $(evt.target);

				if(instance.currentElement && !$target.is('textarea,input[type="text"],input[type="number"]')) {

					switch(evt.which) {
						case 8:
							//remove element
							if(instance.currentElement.removable) {
								instance.removeElement(instance.currentElement);
							}

						break;
				        case 37: // left

					        if(instance.currentElement.draggable) {
						        instance.setElementParameters({left: instance.currentElement.left - 1});
					        }

				        break;
				        case 38: // up

				        	if(instance.currentElement.draggable) {
						        instance.setElementParameters({top: instance.currentElement.top - 1});
					        }

				        break;
				        case 39: // right

				        	if(instance.currentElement.draggable) {
						        instance.setElementParameters({left: instance.currentElement.left + 1});
					        }

				        break;
				        case 40: // down

				        	if(instance.currentElement.draggable) {
						        instance.setElementParameters({top: instance.currentElement.top + 1});
					        }

				        break;

				        default: return; //other keys
				    }

				    evt.preventDefault();

				}

			});

		}

		$this.on('elementChange', function() {

			if(fabricCanvasOptions.allowTouchScrolling) {
				instance.stage.allowTouchScrolling = false;
			}

		});

		//attach handlers to stage
		var lastTouchX,
			lastTouchY;
		instance.stage.on({
			'after:render': function() {

				if(instance.options.highlightEditableObjects.length > 3) {

					instance.stage.contextContainer.strokeStyle = instance.options.highlightEditableObjects;
					instance.stage.forEachObject(function(obj) {

						if(obj !== instance.stage.getActiveObject() && !obj.isMoving
							&& ((FPDUtil.getType(obj.type) === 'text' && obj.editable) || obj.uploadZone)) {

							var bound = obj.getBoundingRect();
							instance.stage.contextContainer.setLineDash([5, 15]);
							instance.stage.contextContainer.strokeRect(
				                bound.left,
				                bound.top,
				                bound.width,
				                bound.height
							);

						}
						else {
							instance.stage.contextContainer.setLineDash([]);
						}

		            });

				}

			},
			'mouse:over': function(opts) {

				if(instance.currentElement && instance.currentElement.draggable && opts.target === instance.currentElement) {
					instance.stage.hoverCursor = 'move';
				}
				else {
					instance.stage.hoverCursor = 'pointer';
				}

			},
			'mouse:down': function(opts) {

				if(opts.e.touches) {
					lastTouchX = opts.e.touches[0].clientX;
					lastTouchY = opts.e.touches[0].clientY;
				}

				mouseDownStage = true;

				//fix: when editing text via textarea and doing a modification via corner controls
				if(opts.target && opts.target.__corner && typeof opts.target.exitEditing === 'function') {
					opts.target.exitEditing();
				}

				if(opts.target == undefined) {
					instance.deselectElement();
				}
				else {
					tempModifiedParameters = instance.getElementJSON();
				}


			},
			'mouse:up': function(opts) {

				if(fabricCanvasOptions.allowTouchScrolling) {
					instance.stage.allowTouchScrolling = true;
				}

				var targetCorner = false;
				if(opts.target) {
					targetCorner = opts.target.__corner;
				}

				//remove element
				if(targetCorner == 'bl' && (opts.target.removable || instance.options.editorMode)) {
					instance.removeElement(opts.target);
				}

				//copy element
				if(targetCorner == 'tl' && opts.target.copyable && !opts.target.hasUploadZone) {

					var newOpts = instance.getElementJSON();

					if(!instance.options.editorMode) {
						newOpts.top = newOpts.top + 30;
						newOpts.left = newOpts.left + 30;
						newOpts.autoSelect = true;
					}

					instance.addElement(
						FPDUtil.getType(opts.target.type),
						opts.target.source,
						'Copy '+opts.target.title,
						newOpts
					);

				}

				mouseDownStage = false;

			},
			'mouse:move': function(opts) {

				if(mouseDownStage && instance.dragStage) {

					//mobile fix: touch pan
					if(opts.e.touches) {
						var currentTouchX = opts.e.touches[0].clientX,
							currentTouchY = opts.e.touches[0].clientY;
					}

					instance.stage.relativePan(new fabric.Point(opts.e.touches ? (currentTouchX - lastTouchX) : opts.e.movementX, opts.e.touches ? (currentTouchY - lastTouchY) : opts.e.movementY));

					//mobile fix: touch pan
					if(opts.e.touches) {
						lastTouchX = currentTouchX;
						lastTouchY = currentTouchY;
					}

				}

			},
			'text:editing:entered': function(opts) {
			},
			'text:changed': function(opts) {

				instance.setElementParameters({text: opts.target.text});

			},
			'text:editing:exited':  function() {
			},
			'object:moving': function(opts) {

				modifiedType = 'moving';

				if(!opts.target.lockMovementX || !opts.target.lockMovementY) {
					_snapToGrid(opts.target);
					_snapToCenter(opts.target);
				}

				instance.stage.contextContainer.strokeStyle = '#990000';

				_checkContainment(opts.target);

				/**
			     * Gets fired when an element is changing via drag, resize or rotate.
			     *
			     * @event FancyProductDesignerView#elementChange
			     * @param {Event} event
			     * @param {String} modifiedType - The modified type.
			     * @param {fabric.Object} element - The fabricJS object.
			     */
				$this.trigger('elementChange', [modifiedType, opts.target]);

			},
			'object:scaling': function(opts) {

				modifiedType = 'scaling';
				_checkContainment(opts.target);

				$this.trigger('elementChange', [modifiedType, opts.target]);

			},
			'object:rotating': function(opts) {

				modifiedType = 'rotating';
				_checkContainment(opts.target);

				$this.trigger('elementChange', [modifiedType, opts.target]);

			},
			'object:modified': function(opts) {

				if(tempModifiedParameters) {

					_setUndoRedo({element: opts.target, parameters: tempModifiedParameters, interaction: 'modify'});
					tempModifiedParameters = null;

				}

				if(FPDUtil.getType(opts.target.type) === 'text' && opts.target.type !== 'curvedText') {

					var newFontSize = opts.target.fontSize * opts.target.scaleX;

					newFontSize = parseFloat(Number(newFontSize).toFixed(0));
		            opts.target.scaleX = 1;
		            opts.target.scaleY = 1;
		            opts.target._clearCache();
		            opts.target.set('fontSize', newFontSize);
		            opts.target.fontSize = newFontSize;

				}

				if(modifiedType !== null) {

					var modifiedParameters = {};

					switch(modifiedType) {
						case 'moving':
							modifiedParameters.left = Number(opts.target.left);
							modifiedParameters.top = Number(opts.target.top);
						break;
						case 'scaling':
							if(FPDUtil.getType(opts.target.type) === 'text' && opts.target.type !== 'curvedText') {
								modifiedParameters.fontSize = parseInt(opts.target.fontSize);
							}
							else {
								modifiedParameters.scaleX = parseFloat(opts.target.scaleX);
								modifiedParameters.scaleY = parseFloat(opts.target.scaleY);
							}
						break;
						case 'rotating':
							modifiedParameters.angle = opts.target.angle;
						break;
					}

					/**
				     * Gets fired when an element is modified.
				     *
				     * @event FancyProductDesignerView#elementModify
				     * @param {Event} event
				     * @param {fabric.Object} element - The fabricJS object.
				     * @param {Object} modifiedParameters - The modified parameters.
				     */
					$this.trigger('elementModify', [opts.target, modifiedParameters]);
				}

				modifiedType = null;

			},
			'selection:updated': _elementSelect, //Fabric V2.1
			'object:selected': _elementSelect
		});

		instance.stage.renderAll();

		//trigger price change after view has been created to get initial price
		$this.trigger('priceChange', [0, instance.truePrice]);

	};

	var _elementSelect = function(opts) {

		var selectedElement = opts.target;

		instance.deselectElement(false);

		//dont select anything when in dragging mode
		if(instance.dragStage) {
			instance.deselectElement();
			return false;
		}

		instance.currentElement = selectedElement;

		/**
	     * Gets fired as soon as an element is selected.
	     *
	     * @event FancyProductDesignerView#elementSelect
	     * @param {Event} event
	     * @param {fabric.Object} currentElement - The current selected element.
	     */
		$this.trigger('elementSelect', [selectedElement]);

		selectedElement.setControlVisible('tr', false);

		if(selectedElement.type !== 'rect') {
			selectedElement.set({
				borderColor: instance.options.selectedColor,
				rotatingPointOffset: 0
			});
		}

		//change cursor to move when element is draggable
		selectedElement.draggable ? instance.stage.hoverCursor = 'move' : instance.stage.hoverCursor = 'pointer';

		//check for a boundingbox
		if(selectedElement.boundingBox && !selectedElement.uploadZone && !instance.options.editorMode) {

			var bbCoords = instance.getBoundingBoxCoords(opts.target);
			if(bbCoords) {

				var boundingBoxProps = {
					left: bbCoords.left,
					top: bbCoords.top,
					width: bbCoords.width,
					height: bbCoords.height,
					stroke: instance.options.boundingBoxColor,
					strokeWidth: 1,
					strokeLineCap: 'square',
					strokeDashArray: [5, 5],
					fill: false,
					selectable: false,
					evented: false,
					originX: 'left',
					originY: 'top',
					name: "bounding-box",
					excludeFromExport: true
				};

				boundingBoxProps = $.extend({}, boundingBoxProps, instance.options.boundingBoxProps);
				instance.currentBoundingObject = new fabric.Rect(boundingBoxProps);

				instance.stage.add(instance.currentBoundingObject);
				instance.currentBoundingObject.bringToFront();

				/**
			     * Gets fired when bounding box is toggling.
			     *
			     * @event FancyProductDesignerView#boundingBoxToggle
			     * @param {Event} event
			     * @param {fabric.Object} currentBoundingObject - The current bounding box object.
			     * @param {Boolean} state
			     */
				$this.trigger('boundingBoxToggle', [instance.currentBoundingObject, true]);

			}

			_checkContainment(opts.target);
		}

	};

	var _setUndoRedo = function(undo, redo, trigger) {

		trigger = typeof trigger === 'undefined' ? true : trigger;

		if(undo) {
			instance.undos.push(undo);

			if(instance.undos.length > 20) {
				instance.undos.shift();
			}
		}

		if(redo) {
			instance.redos.push(redo);
		}

		if(trigger) {

			/**
		     * Gets fired when the canvas has been saved in the undos or redos array.
		     *
		     * @event FancyProductDesignerView#undoRedoSet
		     * @param {Event} event
		     * @param {Array} undos - An array containing all undo objects.
		     * @param {Array} redos - An array containing all redos objects.
		    */

			$this.trigger('undoRedoSet', [instance.undos, instance.redos]);

		}

	};

	//brings all topped elements to front
	var _bringToppedElementsToFront = function() {

		var objects = instance.stage.getObjects(),
			bringToFrontObj = [];

		for(var i = 0; i < objects.length; ++i) {
			var object = objects[i];
			if(object.topped || (object.uploadZone && instance.options.uploadZonesTopped)) {
				bringToFrontObj.push(object);
			}
		}

		for(var i = 0; i < bringToFrontObj.length; ++i) {
			bringToFrontObj[i].bringToFront();
		}

		//bring all elements inside a upload zone to front
		/*for(var i = 0; i < objects.length; ++i) {
			var object = objects[i];
			if(object.hasUploadZone) {
				object.bringToFront().setCoords();
			}
		}*/

		if(instance.currentBoundingObject) {
			instance.currentBoundingObject.bringToFront();
		}

		if(instance.printingBoxObject) {
			instance.printingBoxObject.bringToFront();
		}

		var snapLinesGroup = instance.getElementByID('_snap_lines_group');
		if(snapLinesGroup) {
			snapLinesGroup.bringToFront();
		}

		instance.stage.renderAll();

	};

	var _snapToGrid = function(element) {

		if(instance._snapElements) {

			var gridX = instance.options.snapGridSize[0] ? instance.options.snapGridSize[0] : 50,
				gridY = instance.options.snapGridSize[1] ? instance.options.snapGridSize[1] : 50,
				currentPosPoint = element.getPointByOrigin('left', 'top'),
				point = new fabric.Point(element.padding + (Math.round(currentPosPoint.x / gridX) * gridX), element.padding + (Math.round(currentPosPoint.y / gridY) * gridY));

				element.setPositionByOrigin(point, 'left', 'top');

		}

	};

	//snap element to center
	var _snapToCenter = function(element) {

		if(instance._snapElements) {

			var edgeDetectionX = instance.options.snapGridSize[0] ? instance.options.snapGridSize[0] : 50,
				edgeDetectionY = instance.options.snapGridSize[1] ? instance.options.snapGridSize[1] : 50,
				elementCenter = element.getCenterPoint(),
				stageCenter = {x: instance.options.stageWidth * .5, y: instance.options.stageHeight * .5};

			if(Math.abs(elementCenter.x - stageCenter.x) < edgeDetectionX) {

				element.setPositionByOrigin(new fabric.Point(stageCenter.x, elementCenter.y), 'center', 'center');
				$productStage.siblings('.fpd-snap-line-v').css('left', '50%' ).show();

		    }
		    else {
			     $productStage.siblings('.fpd-snap-line-v').hide();
		    }
		    if (Math.abs(elementCenter.y - stageCenter.y) < edgeDetectionY) {

			    elementCenter = element.getCenterPoint();
				element.setPositionByOrigin(new fabric.Point(elementCenter.x, stageCenter.y), 'center', 'center');
		        $productStage.siblings('.fpd-snap-line-h').css('top', '50%' ).show();

		    }
		    else {
			    $productStage.siblings('.fpd-snap-line-h').hide();
		    }

		}

	};

	//checks if an element is in its containment (bounding box)
	var _checkContainment = function(target) {

		if(instance.currentBoundingObject && !target.hasUploadZone) {

			target.setCoords();

			if(target.boundingBoxMode === 'limitModify') {

				var targetBoundingRect = target.getBoundingRect(),
					bbBoundingRect = instance.currentBoundingObject.getBoundingRect(),
					minX = bbBoundingRect.left,
					maxX = bbBoundingRect.left+bbBoundingRect.width-targetBoundingRect.width,
					minY = bbBoundingRect.top,
					maxY = bbBoundingRect.top+bbBoundingRect.height-targetBoundingRect.height;

				//check if target element is not contained within bb
			    if(!target.isContainedWithinObject(instance.currentBoundingObject)) {

					//check if no corner is used, 0 means its dragged
					if(target.__corner === 0) {
						if(targetBoundingRect.left > minX && targetBoundingRect.left < maxX) {
						   limitModifyParameters.left = target.left;
					    }

					    if(targetBoundingRect.top > minY && targetBoundingRect.top < maxY) {
						   limitModifyParameters.top = target.top;
					    }
					}

			        target.setOptions(limitModifyParameters);


			    } else {

				    limitModifyParameters = {left: target.left, top: target.top, angle: target.angle, scaleX: target.scaleX, scaleY: target.scaleY};

			    }

				/**
			     * Gets fired when the containment of an element is checked.
			     *
			     * @event FancyProductDesignerView#elementCheckContainemt
			     * @param {Event} event
			     * @param {fabric.Object} target
			     * @param {Boolean} boundingBoxMode
			     */
			    $this.trigger('elementCheckContainemt', [target, 'limitModify']);

			}
			else if(target.boundingBoxMode === 'inside' || target.boundingBoxMode === 'clipping') {

				var isOut = false,
					tempIsOut = target.isOut;

					isOut = !target.isContainedWithinObject(instance.currentBoundingObject);

				if(isOut) {

					if(target.boundingBoxMode === 'inside') {
						target.borderColor = instance.options.outOfBoundaryColor;
					}

					target.isOut = true;

				}
				else {

					if(target.boundingBoxMode === 'inside') {
						target.borderColor = instance.options.selectedColor;
					}

					target.isOut = false;

				}

				if(tempIsOut != target.isOut && tempIsOut != undefined) {
					if(isOut) {

						/**
					     * Gets fired as soon as an element is outside of its bounding box.
					     *
					     * @event FancyProductDesignerView#elementOut
					     * @param {Event} event
					     */
						$this.trigger('elementOut', [target]);
					}
					else {

						/**
					     * Gets fired as soon as an element is inside of its bounding box again.
					     *
					     * @event FancyProductDesignerView#elementIn
					     * @param {Event} event
					     */
						$this.trigger('elementIn', [target]);
					}
				}

				$this.trigger('elementCheckContainemt', [target, target.boundingBoxMode]);

			}

		}

		instance.stage.renderAll();

	};

	//center object
	var _centerObject = function(object, hCenter, vCenter, boundingBox) {

		var cp = object.getCenterPoint(),
			left = cp.x,
			top = cp.y;

		if(hCenter) {

			if(boundingBox) {
				left = boundingBox.left + boundingBox.width * 0.5;
			}
			else {
				left = instance.options.stageWidth * 0.5;
			}

		}

		if(vCenter) {
			if(boundingBox) {
				top = boundingBox.top + boundingBox.height * 0.5;
			}
			else {
				top = instance.options.stageHeight * 0.5;
			}

		}

		object.setPositionByOrigin(new fabric.Point(left, top), 'center', 'center');

		instance.stage.renderAll();
		object.setCoords();

		_checkContainment(object);

	};

	//sets the price for the element if it has color prices
	var _setColorPrice = function(element, hex) {

		//only execute when initial elements are loaded and element has color prices and colors is an object
		if(initialElementsLoaded && element.colorPrices && typeof element.colors === 'object' && element.colors.length > 1) {

			//subtract current color price, if set and is hex
			if(element.currentColorPrice !== undefined) {
				element.price -= element.currentColorPrice;
				instance.changePrice(element.currentColorPrice, '-');
			}

			if(typeof hex === 'string') {

				var hexKey = hex.replace('#', '');

				if(element.colorPrices.hasOwnProperty(hexKey) || element.colorPrices.hasOwnProperty(hexKey.toUpperCase())) {

					var elementColorPrice = element.colorPrices[hexKey] === undefined ? element.colorPrices[hexKey.toUpperCase()] : element.colorPrices[hexKey];

					element.currentColorPrice = elementColorPrice;
					element.price += element.currentColorPrice;
					instance.changePrice(element.currentColorPrice, '+');

				}
				else {
					element.currentColorPrice = 0;
				}

			}
			else {
				element.currentColorPrice = 0;
			}

		}

	};

	//sets the pattern for a svg image or text
	var _setPattern = function(element, url) {

		var _loadFromScript = instance.options._loadFromScript ? instance.options._loadFromScript : '';
		if(url) {
			url = _loadFromScript + url;
		}
		if(FPDUtil.isSVG(element)) {

			if(url) {

				fabric.util.loadImage(url, function(img) {

					if(typeof element.getObjects == 'function') { //multi-path svg
						var paths = element.getObjects();
						for(var i=0; i < paths.length; ++i) {
							paths[i].set('fill', new fabric.Pattern({
								source: img,
								repeat: 'repeat'
							}));
						}
					}
					else { //single path SVG
						element.set('fill', new fabric.Pattern({
							source: img,
							repeat: 'repeat'
						}));
					}

					instance.stage.renderAll();

				});
			}

		}
		else if(FPDUtil.getType(element.type) === 'text') {

			if(url) {
				fabric.util.loadImage(url, function(img) {

					element.set('fill', new fabric.Pattern({
						source: img,
						repeat: 'repeat'
					}));
					instance.stage.renderAll();
				});
			}
			else {
				var color = element.fill ? element.fill : element.colors[0];
				color = color ? color : '#000000';
				element.set('fill', color);
			}

		}

	};

	//defines the clipping area
	var _clipElement = function(element) {

		var bbCoords = instance.getBoundingBoxCoords(element) || element.clippingRect;
		if(bbCoords) {

			element.clippingRect = bbCoords;
			element.clipTo = function(ctx) {
				_clipById(ctx, this);
			};

		}

	};

	//draws the clipping
	var _clipById = function (ctx, _this, scale) {

		scale = scale === undefined ? 1 : scale;

		var clipRect = _this.clippingRect;

	    ctx.save();

	    var m = _this.calcTransformMatrix(),
			iM = fabric.util.invertTransform(m);

		ctx.transform.apply(ctx, iM);
	    ctx.beginPath();
	    ctx.rect(
	        clipRect.left,
	        clipRect.top,
	        clipRect.width * scale,
	        clipRect.height * scale
	    );
	    ctx.fillStyle = 'transparent';
	    ctx.fill();
	    ctx.closePath();
	    ctx.restore();

	};

	var _elementHasUploadZone = function(element) {

		if(element && element.hasUploadZone) {

			//check if upload zone contains objects
			var objects = instance.stage.getObjects(),
				uploadZoneEmpty = true;

			for(var i=0; i < objects.length; ++i) {

				var object = objects[i];
				if(object.replace == element.replace) {
					uploadZoneEmpty = false;
					break;
				}

			}

			var uploadZoneObject = instance.getUploadZone(element.replace);
			if(uploadZoneObject) {
				uploadZoneObject.set('opacity', uploadZoneEmpty ? 1 : 0);
				uploadZoneObject.evented = uploadZoneEmpty;
			}

			instance.stage.renderAll();
		}

	};

	var _maxTextboxLines = function(textbox, text) {

		textbox.set('text', text); //render text

		//loop: remove chars as long as lineHeights = maxLines
		while(textbox.__lineHeights.length > textbox.maxLines) {
			text = textbox.text;
			text = text.slice(0, -1);
			textbox.set('text', text);
			//if lineHeights are ok, exit editing
			if(textbox.__lineHeights.length <= textbox.maxLines) {
				textbox.exitEditing();
			}
		}

		return text;

	};

	//return an element by ID
	this.getElementByID = function(id) {

		var objects = instance.stage.getObjects();
		for(var i=0; i < objects.length; ++i) {
			if(objects[i].id == id) {
				return objects[i];
				break;
			}
		}

		return false;

	};

	/**
	 * Adds a new element to the view.
	 *
	 * @method addElement
	 * @param {string} type The type of an element you would like to add, 'image' or 'text'.
	 * @param {string} source For image the URL to the image and for text elements the default text.
	 * @param {string} title Only required for image elements.
	 * @param {object} [parameters] An object with the parameters, you would like to apply on the element.
	 */
	this.addElement = function(type, source, title, params) {

		if(type === undefined || source === undefined || title === undefined) {
			return;
		}

		/**
	     * Gets fired as soon as an element has beed added.
	     *
	     * @event FancyProductDesignerView#beforeElementAdd
	     * @param {Event} event
	     * @param {String} type - The element type.
	     * @param {String} source - URL for image, text string for text element.
	     * @param {String} title - The title for the element.
	     * @param {Object} params - The default properties.
	     */
		$this.trigger('beforeElementAdd', [type, source, title, params]);

		params = typeof params !== 'undefined' ? params : {};
		if(type === 'text') {
			//strip HTML tags
			source = source.replace(/(<([^>]+)>)/ig,"");
			title = title.replace(/(<([^>]+)>)/ig,"");
		}

		if(typeof params != "object") {
			FPDUtil.showModal("The element "+title+" does not have a valid JSON object as parameters! Please check the syntax, maybe you set quotes wrong.");
			return false;
		}

		//check that fill is a string
		if(typeof params.fill !== 'string' && !$.isArray(params.fill)) {
			params.fill = false;
		}

		//replace depraceted keys
		params = FPDUtil.rekeyDeprecatedKeys(params);

		//merge default options
		if(FPDUtil.getType(type) === 'text') {
			params = $.extend({}, instance.options.elementParameters, instance.options.textParameters, params);
		}
		else {
			params = $.extend({}, instance.options.elementParameters, instance.options.imageParameters, params);
		}

		var pushTargetObject = false,
			targetObject = null;

		//store current color and convert colors in string to array
		if(params.colors && typeof params.colors == 'string') {

			//check if string contains hex color values
			if(params.colors.indexOf('#') == 0) {
				//convert string into array
				var colors = params.colors.replace(/\s+/g, '').split(',');
				params.colors = colors;
			}

		}

		params._isInitial = !initialElementsLoaded;

		if(FPDUtil.getType(type) === 'text') {
			var defaultTextColor = params.colors[0] ? params.colors[0] : '#000000';
			params.fill = params.fill ? params.fill : defaultTextColor;
		}

		var fabricParams = {
			source: source,
			title: title,
			id: String(new Date().getTime()),
			cornerColor: instance.options.cornerColor ? instance.options.cornerColor : instance.options.selectedColor,
			cornerIconColor: instance.options.cornerIconColor
		};

		params.__editorMode = instance.options.editorMode;
		if(instance.options.editorMode) {
			fabricParams.selectable = fabricParams.evented = fabricParams.draggable = fabricParams.removable = fabricParams.resizable = fabricParams.rotatable = fabricParams.zChangeable = fabricParams.copyable = fabricParams.lockUniScaling = true;

		}
		else {
			$.extend(fabricParams, {
				selectable: false,
				lockRotation: true,
				hasRotatingPoint: false,
				lockScalingX: true,
				lockScalingY: true,
				lockMovementX: true,
				lockMovementY: true,
				hasControls: false,
				evented: false,
			});
		}

		fabricParams = $.extend({}, params, fabricParams);

		if(type == 'image' || type == 'path' || type == FPDPathGroupName) {

			fabricParams.crossOrigin = '';
			fabricParams.lockUniScaling = instance.options.editorMode ? false : !fabricParams.uniScalingUnlockable;

			if(!FPDUtil.isXML(source)) {
				var splitURLParams = source.split('?'); //remove url parameters
				source = fabricParams.source = splitURLParams[0];
			}

			var _fabricImageLoaded = function(fabricImage, params, vectorImage, originParams) {

				if(fabricImage) {

					originParams = originParams === undefined ? {} : originParams;

					$.extend(params, {
						originParams: $.extend({}, params, originParams)
					});

					fabricImage.setOptions(params);
					instance.stage.add(fabricImage);
					instance.setElementParameters(params, fabricImage, false);

					fabricImage.originParams.angle = fabricImage.angle;
					fabricImage.originParams.z = instance.getZIndex(fabricImage);

					if(instance.options.improvedResizeQuality && !vectorImage) {

						if(fabric.version === '1.6.7') { //Fabric 1.6.7
							fabricImage.resizeFilters.push(new fabric.Image.filters.Resize({
							    resizeType: 'hermite'
							}));
						}
						else {
							fabricImage.resizeFilter = new fabric.Image.filters.Resize({type: 'hermite'});
						}

					}

					if(!fabricImage._isInitial) {
						_setUndoRedo({
							element: fabricImage,
							parameters: params,
							interaction: 'add'
						});
					}

				}
				else {
					FPDUtil.showModal("The image with the URL<br /><i style='font-size: 10px;'>"+params.source+"</i><br />can not be loaded into the canvas. <p><br />Troubleshooting<br/><ul><li>The URL is not correct!</li><li>The image has been blocked by <a href='https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS' target='_blank'>CORS policy</a>. You need to host the image under the same protocol and domain or enable 'Access-Control-Allow-Origin' on the server where you host the image. <a href='http://enable-cors.org/' target='_blank'>Read more about it here.</a></li></ul></p>");
				}

				/**
			     * Gets fired as soon as an element has beed added.
			     *
			     * @event FancyProductDesignerView#elementAdd
			     * @param {Event} event
			     * @param {fabric.Object} object - The fabric object.
			     */
				$this.trigger('elementAdd', [fabricImage]);

			};


			if(source === undefined || source.length === 0) {
				FPDUtil.log('No image source set for: '+ title);
				return;
			}

			//add SVG from XML document
			if(FPDUtil.isXML(source)) {

				fabric.loadSVGFromString(source, function(objects, options) {
					var svgGroup = fabric.util.groupSVGElements(objects, options);
					_fabricImageLoaded(svgGroup, fabricParams, true);
				});

			}
			//load svg from url
			else if($.inArray('svg', source.split('.')) != -1) {

				var timeStamp = Date.now().toString(),
					_loadFromScript = instance.options._loadFromScript ? instance.options._loadFromScript : '',
					url = _loadFromScript + source;

				if(instance.options.imageLoadTimestamp && !instance.options._loadFromScript) {
					url += '?'+timeStamp;
				}

				fabric.loadSVGFromURL(url, function(objects, options) {

					//if objects is null, svg is loaded from external server with cors disabled
					var svgGroup = objects ? fabric.util.groupSVGElements(objects, options) : null;

					//replace fill prop with svgFill
					if(fabricParams.fill) {

						if(!fabricParams.svgFill) {
							fabricParams.svgFill = fabricParams.fill;
						}

						delete fabricParams['fill'];
					}
					//if no default colors are set, use the initial path colors
					else if(!fabricParams.fill && !fabricParams.svgFill) {

						if(objects) {
							params.colors = [];
							for(var i=0; i < objects.length; ++i) {
								var color = objects[i].fill.length > 0 ? tinycolor(objects[i].fill).toHexString() : 'transparent';
								params.colors.push(color);
							}
							params.svgFill = params.colors;
						}

						fabricParams.svgFill = params.svgFill;
					}

					_fabricImageLoaded(svgGroup, fabricParams, true, {svgFill: params.svgFill});

				});

			}
			//load png/jpeg from url
			else {

				var timeStamp = Date.now().toString(),
					_loadFromScript = instance.options._loadFromScript ? instance.options._loadFromScript : '',
					url;

				if(source.indexOf('data:image/') == -1) {//do not add timestamp to data URI

					url = _loadFromScript + source;

					if(instance.options.imageLoadTimestamp && !instance.options._loadFromScript) {
						url += '?'+timeStamp;
					}

				}
				else {
					url = source;
				}

				new fabric.Image.fromURL(url, function(fabricImg) {

					//if src is empty, image is loaded from external server with cors disabled
					fabricImg = fabricImg.getSrc() === '' ? null : fabricImg;
					_fabricImageLoaded(fabricImg, fabricParams, false);

				}, {crossOrigin: 'anonymous'});

			}

		}
		else if(FPDUtil.getType(type) === 'text') {

			source = source.replace(/\\n/g, '\n');
			params.text = params.text ? params.text : source;
			fabricParams.resizable = params.widthFontSize ? false : params.resizable;

			$.extend(fabricParams, {
				spacing: params.curveSpacing,
				radius: params.curveRadius,
				reverse: params.curveReverse,
				originParams: $.extend({}, params)
			});

			if(instance.options.editorMode) {
				fabricParams.editable = true;
			}

			//ensure origin text is always the initial text, even when action:save
			if(params.originParams && params.originParams.text) {
				fabricParams.originParams.text = params.originParams.text;
			}

			//make text curved
			var fabricText;
			if(params.curved && typeof fabric.CurvedText !== 'undefined') {

				var _tempText = fabricParams.text; //fix: text property gets empty, when creating curved text
				fabricText = new fabric.CurvedText(source, fabricParams);
				fabricParams.text = _tempText;

			}
			//make text box
			else if(params.textBox) {

				fabricParams.lockUniScaling = !instance.options.editorMode;
				fabricParams.resizable = instance.options.editorMode !== false;
				fabricText = new fabric.Textbox(source, fabricParams);
				fabricText.setControlVisible('bl', true);

				if(!instance.options.inCanvasTextEditing) {
					fabricText.on({'editing:entered': function() {
						this.exitEditing();
					}});
				}

			}
			//just interactive text
			else {
				fabricText = new fabric.IText(source, fabricParams);

				if(!instance.options.inCanvasTextEditing) {
					fabricText.on({'editing:entered': function() {
						this.exitEditing();
					}});
				}

			}

			if(fabricParams.textPlaceholder || fabricParams.numberPlaceholder) {

				if(fabricParams.textPlaceholder) {
					instance.textPlaceholder = fabricText;
					fabricParams.removable = false;
				}

				if(fabricParams.numberPlaceholder) {
					instance.numberPlaceholder = fabricText;
					fabricParams.removable = false;
				}

			}

			instance.stage.add(fabricText);
			instance.setElementParameters(fabricParams, fabricText, false);

			fabricText.originParams = $.extend({}, fabricText.toJSON(), fabricText.originParams);
			delete fabricText.originParams['clipTo'];
			fabricText.originParams.z = instance.getZIndex(fabricText);

			if(!fabricText._isInitial) {
				_setUndoRedo({
					element: fabricText,
					parameters: fabricParams,
					interaction: 'add'
				});
			}

			$this.trigger('elementAdd', [fabricText]);

		}
		else {

			FPDUtil.showModal('Sorry. This type of element is not allowed!');

		}

	};

	/**
	 * Returns an fabric object by title.
	 *
	 * @method getElementByTitle
	 * @param {string} title The title of an element.
	 * @return {Object} FabricJS Object.
	 */
	this.getElementByTitle = function(title) {

		var objects = instance.stage.getObjects();
		for(var i = 0; i < objects.length; ++i) {
			if(objects[i].title == title) {
				return objects[i];
				break;
			}
		}

	};

	/**
	 * Deselects the current selected element.
	 *
	 * @method deselectElement
	 * @param {boolean} [discardActiveObject=true] Discards the active element.
	 */
	this.deselectElement = function(discardActiveObject) {

		discardActiveObject = typeof discardActiveObject == 'undefined' ? true : discardActiveObject;

		if(instance.currentBoundingObject) {

			instance.stage.remove(instance.currentBoundingObject);
			$this.trigger('boundingBoxToggle', [instance.currentBoundingObject, false]);
			instance.currentBoundingObject = null;

		}

		if(discardActiveObject) {
			instance.stage.discardActiveObject();
		}

		instance.currentElement = null;
		instance.stage.renderAll().calcOffset();

		$this.trigger('elementSelect', [null]);

	};

	/**
	 * Removes an element using the fabric object or the title of an element.
	 *
	 * @method removeElement
	 * @param {object|string} element Needs to be a fabric object or the title of an element.
	 */
	this.removeElement = function(element) {

		if(typeof element === 'string') {
			element = instance.getElementByTitle(element);
		}

		_setUndoRedo({
			element: element,
			parameters: instance.getElementJSON(element),
			interaction: 'remove'
		});

		this.deselectElement();

		setTimeout(function() {

			instance.stage.remove(element);
			_elementHasUploadZone(element);

			/**
		     * Gets fired as soon as an element has been removed.
		     *
		     * @event FancyProductDesignerView#elementRemove
		     * @param {Event} event
		     * @param {fabric.Object} element - The fabric object that has been removed.
		     */
			$this.trigger('elementRemove', [element]);

		}, 1);


	};

	/**
	 * Sets the parameters for a specified element.
	 *
	 * @method setElementParameters
	 * @param {object} parameters An object with the parameters that should be applied to the element.
	 * @param {fabric.Object | string} [element] A fabric object or the title of an element. If no element is set, the parameters will be applied to the current selected element.
	 * @param {Boolean} [saveUndo=true] Save new parameters also in undos.
	 */
	this.setElementParameters = function(parameters, element, saveUndo) {

		element = typeof element === 'undefined' ? instance.stage.getActiveObject() : element;
		saveUndo = typeof saveUndo === 'undefined' ? true : saveUndo;

		if(!element || parameters === undefined) {
			return false;
		}

		//if element is string, get by title
		if(typeof element == 'string') {
			element = instance.getElementByTitle(element);
		}

		var elemType = FPDUtil.getType(element.type);

		//store undos
		if(saveUndo && initialElementsLoaded) {

			var undoParameters = instance.getElementJSON();

			if(element._tempFill) {
				undoParameters.fill = element._tempFill;
				element._tempFill = undefined;
			}

			_setUndoRedo({
				element: element,
				parameters: undoParameters,
				interaction: 'modify'
			});

		}

		//adds the element into a upload zone
		if((instance.currentUploadZone && instance.currentUploadZone != '')) {

			parameters.z = -1;
			var uploadZoneObj = instance.getElementByTitle(instance.currentUploadZone),
				scale = FPDUtil.getScalingByDimesions(
					element.width,
					element.height,
					uploadZoneObj.width * uploadZoneObj.scaleX,
					uploadZoneObj.height * uploadZoneObj.scaleY,
					uploadZoneObj.scaleMode
				);

			$.extend(parameters, {
					boundingBox: instance.currentUploadZone,
					boundingBoxMode: 'clipping',
					scaleX: scale,
					scaleY: scale,
					autoCenter: true,
					removable: true,
					zChangeable: false,
					autoSelect: false,
					copyable: false,
					hasUploadZone: true,
					z: instance.getZIndex(instance.getElementByTitle(instance.currentUploadZone)),
					rotatable: uploadZoneObj.rotatable,
					draggable: uploadZoneObj.draggable,
					resizable: uploadZoneObj.resizable,
					price: uploadZoneObj.price ? uploadZoneObj.price : parameters.price,
					replace: instance.currentUploadZone,
					lockUniScaling: !uploadZoneObj.uniScalingUnlockable
				}
			);

			//set some origin params that are needed when resetting element in UZ
			$.extend(parameters.originParams, {
				boundingBox: parameters.boundingBox,
				replace: parameters.replace,
				rotatable: parameters.rotatable,
				draggable: parameters.draggable,
				resizable: parameters.resizable,
				lockUniScaling: parameters.uniScalingUnlockable,
				price: parameters.price,
				scaleX: parameters.scaleX,
				scaleY: parameters.scaleY,
				hasUploadZone: true,
				autoCenter: true
			});

		}

		//if topped, z-index can not be changed
		if(parameters.topped) {
			parameters.zChangeable = false;
		}

		//new element added
		if(FPDUtil.elementIsEditable(parameters)) {
			parameters.isEditable = parameters.evented = parameters.selectable = true;
		}

		//upload zones have no controls
		if(!parameters.uploadZone || instance.options.editorMode) {

			if(parameters.draggable) {
				parameters.lockMovementX = parameters.lockMovementY = false;
			}

			if(parameters.rotatable) {
				parameters.lockRotation = false;
				parameters.hasRotatingPoint = true;
			}

			if(parameters.resizable) {
				parameters.lockScalingX = parameters.lockScalingY = false;
			}

			if((parameters.resizable || parameters.rotatable || parameters.removable)) {
				parameters.hasControls = true;
			}

		}

		if(parameters.uploadZone) {
			parameters.lockRotation = true;
			parameters.hasRotatingPoint = false;
		}

		if(parameters.replace && parameters.replace != '') {

			var replacedElement = instance.getElementByReplace(parameters.replace);

			//element with replace in view found and replaced element is not the new element
			if(replacedElement !== null && replacedElement !== element ) {
				parameters.z = instance.getZIndex(replacedElement);
				parameters.left = element.originParams.left = replacedElement.left;
				parameters.top = element.originParams.top =  replacedElement.top;
				parameters.autoCenter = false;
				if(instance.options.applyFillWhenReplacing) {
					parameters.fill = replacedElement.fill;
				}
				instance.removeElement(replacedElement);
			}

		}

		//needs to before setOptions
		if(typeof parameters.text === 'string') {

			var text = parameters.text;

			//remove emojis
			if(instance.options.disableTextEmojis) {
				text = text.replace(FPDEmojisRegex, '');
				text = text.replace(String.fromCharCode(65039), ""); //fix: some emojis left a symbol with char code 65039
			}

			if(element.maxLength != 0 && text.length > element.maxLength) {
				text = text.substr(0, element.maxLength);
				element.selectionStart = element.maxLength;
			}

			//check lines length
			if(element.maxLines != 0) {

				if(element.type == 'textbox' && element.__lineHeights) {
					text = _maxTextboxLines(element, text);
				}
				else if(text.split("\n").length > element.maxLines) {
					text = text.replace(/([\s\S]*)\n/, "$1");
					element.exitEditing(); //exit editing when max lines are reached
				}

			}

			element.set('text', text);
			parameters.text = text;

			if(element.type == 'i-text' && element.widthFontSize && text.length > 0) {

				var resizedFontSize;
				if(element.width > element.widthFontSize) {
					resizedFontSize = element.fontSize * (element.widthFontSize / (element.width + 1)); //decrease font size
				}
				else {
					resizedFontSize = element.fontSize * (element.widthFontSize / (element.width - 1)); //increase font size
				}

				resizedFontSize = parseInt(resizedFontSize);
				element.fontSize = parameters.fontSize = resizedFontSize;

			}
			if(element.chargeAfterEditing) {

				if(!element._isPriced) {
					instance.changePrice(element.price, '+');
					element._isPriced = true;
				}

				if( element.originParams.text === text && element._isPriced) {
					instance.changePrice(element.price, '-');
					element._isPriced = false;
				}

			}

		}

		if(elemType === 'text') {

			if(fabric.version !== '1.6.7') { //Fabric 1.6.7

				if(parameters.hasOwnProperty('textDecoration')) {
					parameters.underline = parameters.textDecoration === 'underline';
				}

			}

			if(parameters.letterSpacing !== undefined) {
				parameters.charSpacing = parameters.letterSpacing * 100;
			}

			if(parameters.fontSize && parameters.fontSize < element.minFontSize) {
				parameters.fontSize = element.minFontSize;
			}
			else if(parameters.fontSize && parameters.fontSize > element.maxFontSize) {
				parameters.fontSize = element.maxFontSize;
			}

			if(parameters.text) {

				if(element.textTransform === 'uppercase') {
					text = text.toUpperCase()
				}
				else if(element.textTransform === 'lowercase') {
					text = text.toLowerCase()
				}

				element.set('text', text);
				parameters.text = text;

			}

			if(parameters.textTransform) {

				var text = element.text;
				if(parameters.textTransform === 'uppercase') {
					text = text.toUpperCase()
				}
				else if(parameters.textTransform === 'lowercase') {
					text = text.toLowerCase()
				}

				element.set('text', text);
				parameters.text = text;

			}

			if((parameters.shadowColor || parameters.shadowBlur || parameters.shadowOffsetX || parameters.shadowOffsetY) && !element.shadow) {
				element.setShadow({color: 'rgba(0,0,0,0)'});
			}

			if(parameters.shadowColor) {
				element.shadow.color = parameters.shadowColor;
			}

			if(parameters.shadowBlur) {
				element.shadow.blur = parameters.shadowBlur;
			}

			if(parameters.shadowOffsetX) {
				element.shadow.offsetX = parameters.shadowOffsetX;
			}

			if(parameters.shadowOffsetY) {
				element.shadow.offsetY = parameters.shadowOffsetY;
			}

		}

		delete parameters['paths']; //no paths in parameters
		element.setOptions(parameters);

		if(parameters.autoCenter) {
			instance.centerElement(true, true, element);
		}

		//change element color
		if(parameters.fill !== undefined || parameters.svgFill !== undefined) {
			var fill = parameters.svgFill !== undefined ? parameters.svgFill : parameters.fill;
			instance.changeColor(element, fill);
			element.pattern = undefined;
		}

		//set pattern
		if(parameters.pattern !== undefined) {
			_setPattern(element, parameters.pattern);
			_setColorPrice(element, parameters.pattern);
		}

		//set filter
		if(parameters.filter) {

			element.filters = [];
			var fabricFilter = FPDUtil.getFilter(parameters.filter);

			if(fabricFilter != null) {
				element.filters.push(fabricFilter);
			}
			if(typeof element.applyFilters !== 'undefined') {
				element.applyFilters();
			}

		}

		//clip element
		if((parameters.boundingBox && parameters.boundingBoxMode === 'clipping') || parameters.hasUploadZone) {
			_clipElement(element);
		}

		//set z position
		if(parameters.z >= 0) {
			element.moveTo(parameters.z);
			_bringToppedElementsToFront();
		}

		if(element.curved) {

			if(parameters.curveRadius) {
				element.set('radius', parameters.curveRadius);
			}

			if(parameters.curveSpacing) {
				element.set('spacing', parameters.curveSpacing);
			}

			if(parameters.curveReverse !== undefined) {
				element.set('reverse', parameters.curveReverse);
			}

		}

		if(element.uploadZone) {
			element.evented = element.opacity !== 0;
		}
		else if(element.isEditable && !instance.options.editorMode) {
			element.evented = !parameters.locked;
		}


		//check if a upload zone contains an object
		var objects = instance.stage.getObjects();
		for(var i=0; i < objects.length; ++i) {

			var object = objects[i];

			if(object.uploadZone && object.title == parameters.replace) {
				object.opacity = 0;
				object.evented = false;
			}

		}

		element.setCoords();
		instance.stage.renderAll().calcOffset();

		$this.trigger('elementModify', [element, parameters]);

		_checkContainment(element);

		//select element
		if(parameters.autoSelect && element.isEditable && !instance.options.editorMode && $(instance.stage.getElement()).is(':visible')) {

			setTimeout(function() {
				instance.stage.setActiveObject(element);
				instance.stage.renderAll();
			}, 1);

		}

	};

	/**
	 * Returns the bounding box of an element.
	 *
	 * @method getBoundingBoxCoords
	 * @param {fabric.Object} element A fabric object
	 * @return {Object | Boolean} The bounding box object with x,y,width and height or false.
	 */
	this.getBoundingBoxCoords = function(element) {

		if(element.boundingBox || element.uploadZone) {

			if(typeof element.boundingBox == "object") {

				return {
					left: element.boundingBox.x,
					top: element.boundingBox.y,
					width: element.boundingBox.width,
					height: element.boundingBox.height
				};

			}
			else {

				var objects = instance.stage.getObjects();

				for(var i=0; i < objects.length; ++i) {

					//get all layers from first view
					var object = objects[i];
					if(element.boundingBox == object.title) {

						var topLeftPoint = object.getPointByOrigin('left', 'top');

						return {
							left: topLeftPoint.x,
							top: topLeftPoint.y,
							width: object.width * object.scaleX,
							height: object.height * object.scaleY
						};

						break;
					}

				}

			}

		}

		return false;

	};

	/**
	 * Creates a data URL of the view.
	 *
	 * @method toDataURL
	 * @param {Function} callback A function that will be called when the data URL is created. The function receives the data URL.
	 * @param {String} [backgroundColor=transparent] The background color as hexadecimal value. For 'png' you can also use 'transparent'.
	 * @param {Object} [options] See fabricjs documentation http://fabricjs.com/docs/fabric.Canvas.html#toDataURL.
	 * @param {Boolean} [options.onlyExportable=false] If true elements with excludeFromExport=true are not exported in the image.
	 * @param {String} [watermarkImg=false] URL to an imae that will be added as watermark.
	 */
	this.toDataURL = function(callback, backgroundColor, options, watermarkImg) {

		callback = callback === undefined ? function() {} : callback;
		backgroundColor = backgroundColor === undefined ? 'transparent' : backgroundColor;
		options = options === undefined ? {} : options;
		options.onlyExportable = options.onlyExportable === undefined ? false : options.onlyExportable;
		options.multiplier = options.multiplier === undefined ? 1 : options.multiplier;
		watermarkImg = watermarkImg === undefined ? false : watermarkImg;

		instance.stage.enableRetinaScaling = false;

		var invisibleObjs = ['_snap_lines_group', '_ruler_hor', '_ruler_ver'],
			hiddenObjs = [];

		instance.stage.getObjects().forEach(function(obj) {

			if(invisibleObjs.indexOf(obj.id) !== -1 || (obj.excludeFromExport && options.onlyExportable)) {

				obj.visible = false;
				hiddenObjs.push(obj);

			}

		});

		instance.deselectElement();
		instance.stage.setDimensions({width: instance.options.stageWidth, height: instance.options.stageHeight}).setZoom(1);

		//scale view mask to multiplier
		if(instance.maskObject && instance.maskObject._originParams) {
			instance.maskObject.left = instance.maskObject._originParams.left * options.multiplier;
			instance.maskObject.top = instance.maskObject._originParams.top * options.multiplier;
			instance.maskObject.scaleX = instance.maskObject._originParams.scaleX * options.multiplier;
			instance.maskObject.scaleY = instance.maskObject._originParams.scaleY * options.multiplier;
			instance.maskObject.setCoords();
		}

		instance.stage.setBackgroundColor(backgroundColor, function() {

			if(watermarkImg) {
				instance.stage.add(watermarkImg);
				watermarkImg.center();
				watermarkImg.bringToFront();
			}

			//get data url
			callback(instance.stage.toDataURL(options));

			instance.stage.enableRetinaScaling = true;

			if(watermarkImg) {
				instance.stage.remove(watermarkImg);
			}

			if($(instance.stage.wrapperEl).is(':visible')) {
				instance.resetCanvasSize();
			}

			instance.stage.setBackgroundColor('transparent', function() {
				instance.stage.renderAll();
			});

			for(var i=0; i<hiddenObjs.length; ++i) {
				hiddenObjs[i].visible = true;
			}

		});

	};

	/**
	 * Returns the view as SVG.
	 *
	 * @method toSVG
	 * @param {Object} options See fabricjs documentation http://fabricjs.com/docs/fabric.Canvas.html#toSVG
	 * @param {Function} reviver See fabricjs documentation http://fabricjs.com/docs/fabric.Canvas.html#toSVG
	 * @param {Boolean} respectPrintingBox Only generate SVG from printing box
	 * @return {String} A XML representing a SVG.
	 */
	this.toSVG = function(options, reviver, respectPrintingBox) {

		options = options === undefined ? {} : options;
		respectPrintingBox = respectPrintingBox === undefined ? false : respectPrintingBox;

		var svg;

		instance.deselectElement();
		if(respectPrintingBox && instance.options.printingBox) {

			options.viewBox = {
				x: instance.options.printingBox.left,
				y: instance.options.printingBox.top,
				width: instance.options.printingBox.width,
				height: instance.options.printingBox.height
			};

			instance.stage.setDimensions({width: instance.options.printingBox.width, height: instance.options.printingBox.height}).setZoom(1);
		}
		else {
			instance.stage.setDimensions({width: instance.options.stageWidth, height: instance.options.stageHeight}).setZoom(1);
		}

		//remove background, otherwise unneeeded rect is added in the svg
		var tempCanvasBackground = instance.stage['backgroundColor'];
		if(tempCanvasBackground == 'transparent') {
			instance.stage['backgroundColor'] = false;
		}

		svg = instance.stage.toSVG(options, reviver);

		instance.stage['backgroundColor'] = tempCanvasBackground;

		if($(instance.stage.wrapperEl).is(':visible')) {
			instance.resetCanvasSize();
		}

		var $svg = $(svg);
		svg = $('<div>').append($svg.clone()).html().replace(/(?:\r\n|\r|\n)/g, ''); //replace all newlines

		return svg;

	};

	/**
	 * Removes the canvas and resets all relevant view properties.
	 *
	 * @method reset
	 */
	this.reset = function(removeCanvas) {

		removeCanvas = removeCanvas === undefined ? true : removeCanvas;

		instance.undos = [];
		instance.redos = [];
		instance.elements = null;
		instance.totalPrice = instance.truePrice = 0;
		instance.stage.clear();

		if(removeCanvas) {
			instance.stage.wrapperEl.remove();
		}

		$this.trigger('clear');
		$this.trigger('priceChange', [0, 0]);

	};

	/**
	 * Undo the last change.
	 *
	 * @method undo
	 */
	this.undo = function() {

		if(instance.undos.length > 0) {

			var last = instance.undos.pop();

			//check if element was removed
			if(last.interaction === 'remove') {

				instance.stage.add(last.element);
				last.interaction = 'add';
			}
			else if(last.interaction === 'add') {
				instance.stage.remove(last.element);
				last.interaction = 'remove';
			}

			_setUndoRedo(false, {
				element: last.element,
				parameters: instance.getElementJSON(last.element),
				interaction: last.interaction
			});

			instance.setElementParameters(last.parameters, last.element, false);

			this.deselectElement();
			_elementHasUploadZone(last.element);

		}

		return instance.undos;

	};

	/**
	 * Redo the last change.
	 *
	 * @method redo
	 */
	this.redo = function() {

		if(instance.redos.length > 0) {

			var last = instance.redos.pop();

			if(last.interaction === 'remove') {
				instance.stage.add(last.element);
				last.interaction = 'add';
			}
			else if(last.interaction === 'add') {
				instance.stage.remove(last.element);
				last.interaction = 'remove';
			}

			_setUndoRedo({
				element: last.element,
				parameters: instance.getElementJSON(last.element),
				interaction: last.interaction
			});

			instance.setElementParameters(last.parameters, last.element, false);

			this.deselectElement();
			_elementHasUploadZone(last.element);

		}

		return instance.redos;

	};

	/**
	 * Get the canvas(stage) JSON.
	 *
	 * @method getJSON
	 * @return {Object} An object with properties.
	 */
	this.getJSON = function() {

		var parameterKeys = fpdOptions.getParameterKeys();

		parameterKeys = parameterKeys.concat(instance.propertiesToInclude);

		return instance.stage.toJSON(parameterKeys);

	};

	/**
	 * Resizes the canvas responsive.
	 *
	 * @method resetCanvasSize
	 */
	this.resetCanvasSize = function() {

		instance.responsiveScale = $productStage.outerWidth() < instance.options.stageWidth ? $productStage.outerWidth() / instance.options.stageWidth : 1;
		instance.responsiveScale = parseFloat(Number(instance.responsiveScale.toFixed(7)));
		instance.responsiveScale = instance.responsiveScale > 1 ? 1 : instance.responsiveScale;

		if(!instance.options.responsive) {
			instance.responsiveScale = 1;
		}

		if(instance.maskObject && instance.maskObject._originParams) {
			instance.maskObject.left = instance.maskObject._originParams.left * instance.responsiveScale;
			instance.maskObject.top = instance.maskObject._originParams.top * instance.responsiveScale;
			instance.maskObject.scaleX = instance.maskObject._originParams.scaleX * instance.responsiveScale;
			instance.maskObject.scaleY = instance.maskObject._originParams.scaleY * instance.responsiveScale;
			instance.maskObject.setCoords();
		}

		instance.stage
		.setDimensions({
			width: $productStage.width(),
			height: instance.options.stageHeight * instance.responsiveScale
		})
		.setZoom(instance.responsiveScale)
		.calcOffset()
		.renderAll();

		$productStage.height(instance.stage.height);

		var $container = $productStage.parents('.fpd-container:first');
		if($container.length > 0) {
			$container.height($container.hasClass('fpd-sidebar') ? instance.stage.height : 'auto');
			$container.width($container.hasClass('fpd-topbar') ? instance.options.stageWidth : 'auto');
		}

		return instance.responsiveScale;

	};

	/**
	 * Gets an elment by replace property.
	 *
	 * @method getElementByReplace
	 */
	this.getElementByReplace = function(replaceValue) {

		var objects = instance.stage.getObjects();
		for(var i = 0; i < objects.length; ++i) {
			var object = objects[i];
			if(object.replace === replaceValue) {
				return object;
				break;
			}
		}

		return null;

	};

	/**
	 * Gets the JSON of an element.
	 *
	 * @method getElementJSON
	 * @param {String} [element] The target element. If not set, it it will use the current selected.
	 * @param {Boolean} [addPropertiesToInclude=false] Include the properties from {{#crossLink "FancyProductDesignerView/propertiesToInclude:property"}}{{/crossLink}}.
	 * @return {Object} An object with properties.
	 */
	this.getElementJSON = function(element, addPropertiesToInclude) {

		element = element === undefined ? instance.stage.getActiveObject() : element;
		addPropertiesToInclude = addPropertiesToInclude === undefined ? false : addPropertiesToInclude;

		if(!element) { return {}; }

		var properties = Object.keys(instance.options.elementParameters),
			additionalKeys  = FPDUtil.getType(element.type) === 'text' ? Object.keys(instance.options.textParameters) : Object.keys(instance.options.imageParameters);

		properties = $.merge(properties, additionalKeys);

		if(addPropertiesToInclude) {
			properties = $.merge(properties, instance.propertiesToInclude);
		}

		if(element.uploadZone) {
			properties.push('customAdds');
			properties.push('designCategories');
			properties.push('designCategories[]'); //fpd-admin
		}

		if(FPDUtil.getType(element.type) === 'text') {
			properties.push('text');
		}

		if(element.type === FPDPathGroupName) {
			properties.push('svgFill');
		}

		properties.push('width');
		properties.push('height');
		properties.push('isEditable');
		properties.push('hasUploadZone');
		properties.push('clippingRect');
		properties.push('evented');
		properties.push('isCustom');
		properties.push('currentColorPrice');
		properties.push('_isPriced');
		properties.push('originParams');
		properties.push('originSource');
		properties.push('depositphotos');
		properties = properties.sort();

		var topLeftPoint = element.getPointByOrigin('left', 'top');
		if(addPropertiesToInclude) {

			var json = element.toJSON(properties);
			json.topLeftX = topLeftPoint.x;
			json.topLeftY = topLeftPoint.y;

			return json;

		}
		else {

			var json = {};
			for(var i=0; i < properties.length; ++i) {
				var prop = properties[i];
				if(element[prop] !== undefined) {
					json[prop] = element[prop];
				}

			}

			json.topLeftX = topLeftPoint.x;
			json.topLeftY = topLeftPoint.y;

			return json;
		}

	};

	/**
	 * Centers an element horizontal or/and vertical.
	 *
	 * @method centerElement
	 * @param {Boolean} h Center horizontal.
	 * @param {Boolean} v Center vertical.
	 * @param {fabric.Object} [element] The element to center. If not set, it centers the current selected element.
	 */
	this.centerElement = function(h, v, element) {

		element = typeof element === 'undefined' ? instance.stage.getActiveObject() : element;

		_centerObject(element, h, v, instance.getBoundingBoxCoords(element));
		element.autoCenter = false;

	};

	/**
	 * Aligns an element.
	 *
	 * @method alignElement
	 * @param {String} pos Allowed values: left, right, top or bottom.
	 * @param {fabric.Object} [element] The element to center. If not set, it centers the current selected element.
	 */
	this.alignElement = function(pos, element) {

		element = typeof element === 'undefined' ? instance.stage.getActiveObject() : element;

		var localPoint = element.getPointByOrigin('left', 'top'),
			boundingBox = instance.getBoundingBoxCoords(element),
			posOriginX = 'left',
			posOriginY = 'top';

		if(pos === 'left') {

			localPoint.x = boundingBox ? boundingBox.left : 0;
			localPoint.x += element.padding + 1;

		}
		else if(pos === 'top') {

			localPoint.y = boundingBox ? boundingBox.top : 0;
			localPoint.y += element.padding + 1;

		}
		else if(pos === 'right') {

			localPoint.x = boundingBox ? boundingBox.left + boundingBox.width - element.padding : instance.options.stageWidth - element.padding;
			localPoint.x -= FPDUtil.getType(element.type) == 'text' ? 4 : 0;
			posOriginX = 'right';

		}
		else {

			localPoint.y = boundingBox ? boundingBox.top + boundingBox.height - element.padding : instance.options.stageHeight;
			localPoint.y -= FPDUtil.getType(element.type) == 'text' ? 4 : 0;
			posOriginY = 'bottom';

		}

		element.setPositionByOrigin(localPoint, posOriginX, posOriginY);

		instance.stage.renderAll();
		element.setCoords();

		_checkContainment(element);

	};

	/**
	 * Gets the z-index of an element.
	 *
	 * @method getZIndex
	 * @param {fabric.Object} [element] The element to center. If not set, it centers the current selected element.
	 * @return {Number} The index.
	 */
	this.getZIndex = function(element) {

		element = typeof element === 'undefined' ? instance.stage.getActiveObject() : element;

		var objects = instance.stage.getObjects();
		return objects.indexOf(element);
	};

	/**
	 * Changes the color of an element.
	 *
	 * @method changeColor
	 * @param {fabric.Object} element The element to colorize.
	 * @param {String} hex The color.
	 * @param {Boolean} colorLinking Use color linking.
	 */
	this.changeColor = function(element, hex, colorLinking) {

		colorLinking = typeof colorLinking === 'undefined' ? true : colorLinking;

		var colorizable = FPDUtil.elementIsColorizable(element);

		//check if hex color has only 4 digits, if yes, append 3 more
		if(typeof hex === 'string' && hex.length == 4) {
			hex += hex.substr(1, hex.length);
		}

		//text
		if(FPDUtil.getType(element.type) === 'text') {

			hex = hex === false ? '#000000' : hex;

			//set color of a text element
			element.set('fill', hex);
			instance.stage.renderAll();

			element.pattern = null;
			element.fill = hex;

		}
		//path groups (svg)
		else if(element.type == FPDPathGroupName && typeof hex == 'object') {

			for(var i=0; i < hex.length; ++i) {
				element.getObjects()[i].set('fill', hex[i]);
			}

			instance.stage.renderAll();

			element.svgFill = hex;
			delete element['fill'];

		}
		//image
		else {

			//colorize png or dataurl image
			if(colorizable == 'png' || colorizable == 'dataurl') {

				element.filters = [];
				if(hex !== false) {

					if(typeof fabric.Image.filters.BlendColor !== 'undefined') {

						//fix: fabricjs 2.+ when element is custom element and changing base products
						setTimeout(function() {
							element.filters.push(new fabric.Image.filters.BlendColor({mode: 'tint', color: hex}));
							element.applyFilters();
							instance.stage.renderAll();
							$this.trigger('elementColorChange', [element, hex, colorLinking]);
						}, 1);

					}
					else { //Fabric V1.6.7
						element.filters.push(new fabric.Image.filters.Tint({color: hex}));
						element.applyFilters(function() {
							instance.stage.renderAll();
							$this.trigger('elementColorChange', [element, hex, colorLinking]);
						});
					}

				}

				element.fill = hex;

			}
			//colorize svg
			else if(colorizable == 'svg') {
				element.set('fill', typeof hex === 'object' ? hex[0] : hex);
			}


		}

		_setColorPrice(element, hex);

		/**
	     * Gets fired when the color of an element is changing.
	     *
	     * @event FancyProductDesignerView#elementColorChange
	     * @param {Event} event
	     * @param {fabric.Object} element
	     * @param {String} hex
	     * @param {Boolean} colorLinking
	     */
		$this.trigger('elementColorChange', [element, hex, colorLinking]);

	};

	/**
	 * Gets the index of the view.
	 *
	 * @method getIndex
	 * @return {Number} The index.
	 */
	this.getIndex = function() {

		return $productStage.children('.fpd-view-stage').index(instance.stage.wrapperEl);

	};

	/**
	 * Gets an upload zone by title.
	 *
	 * @method getUploadZone
	 * @param {String} title The target title of an element.
	 * @return {fabric.Object} A fabric object representing the upload zone.
	 */
	this.getUploadZone = function(title) {

		var objects = instance.stage.getObjects();

		for(var i=0; i < objects.length; ++i) {

			if(objects[i].uploadZone && objects[i].title == title) {
				return objects[i];
				break;
			}

		}

	};

	/**
	 * Changes the price by an operator, + or -.
	 *
	 * @method changePrice
	 * @param {Number} price Price as number.
	 * @param {String} operator "+" or "-".
	 * @return {Number} The total price of the view.
	 */
	this.changePrice = function(price, operator) {

		if(operator === '+') {
			instance.totalPrice += price;
		}
		else {
			instance.totalPrice -= price;
		}

		instance.truePrice = instance.totalPrice;

		if(typeof instance.options.maxPrice === 'number' && instance.options.maxPrice !== -1 && instance.truePrice > instance.options.maxPrice) {
			instance.truePrice = instance.options.maxPrice;
		}

		//price has decimals, set max. decimals to 2
		if(instance.truePrice % 1 != 0) {
			instance.truePrice = Number(instance.truePrice.toFixed(2));
		}

		/**
	     * Gets fired as soon as the price has changed.
	     *
	     * @event FancyProductDesignerView#priceChange
	     * @param {Event} event
	     * @param {number} elementPrice - The price of the added element.
	     * @param {number} truePrice - The total price.
	     */
		$this.trigger('priceChange', [price, instance.truePrice]);

		return instance.truePrice;

	};

	/**
	 * Use a SVG image as mask for the whole view. The image needs to be a SVG file with only one path. The method toSVG() does not include the mask.
	 *
	 * @method setMask
	 * @param {Object|Null} maskObject An object containing the URL to the svg. Optional: scaleX, scaleY, left and top.
	 */
	this.setMask = function(maskObject, callback) {

		callback = typeof callback !== 'undefined' ? callback : function() {};

		if(maskObject && maskObject.url && $.inArray('svg', maskObject.url.split('.')) != -1) {

			var timeStamp = Date.now().toString(),
				_loadFromScript = instance.options._loadFromScript ? instance.options._loadFromScript : '',
				url = _loadFromScript + maskObject.url;

			if(instance.options.imageLoadTimestamp && !instance.options._loadFromScript) {
				url += '?'+timeStamp;
			}

			//check if url is available
			$.get(url)
			.done(function(data) {

				fabric.loadSVGFromURL(url, function(objects, options) {

					var svgGroup = null;
					if(objects) {
						//if objects is null, svg is loaded from external server with cors disabled
						svgGroup = objects ? fabric.util.groupSVGElements(objects, options) : null;

						svgGroup.excludeFromExport = true;
						svgGroup.objectCaching = false;
						svgGroup.set('fill', 'rgba(0,0,0,0)');
						svgGroup.set('scaleX', maskObject.scaleX ? Number(maskObject.scaleX) :  1);
						svgGroup.set('scaleY', maskObject.scaleY ? Number(maskObject.scaleY) :  1);
						svgGroup.set('left', maskObject.left ? Number(maskObject.left) :  0);
						svgGroup.set('top', maskObject.top ? Number(maskObject.top) :  0);
						svgGroup._originParams = {
							scaleX: svgGroup.scaleX,
							scaleY: svgGroup.scaleX,
							left: svgGroup.left,
							top: svgGroup.top
						}
						instance.stage.clipTo = function(ctx) {
						  svgGroup.render(ctx);
						};
						instance.stage.renderAll();

						instance.maskObject = svgGroup;
						instance.resetCanvasSize();
					}

					callback(svgGroup);

				});

			})
			.fail(callback);

		}
		else {
			instance.stage.clipTo = instance.maskObject = instance.mask = null;
			instance.stage.renderAll();
		}

	};

	/**
	 * Returns all options with the keys that are set in FancyProductDesignerView.relevantOptions property.
	 *
	 * @method getOptions
	 * @return {Object} An object containing all relevant options.
	 */
	this.getOptions = function() {

		var options = {};

		if(typeof FancyProductDesignerView.relevantOptions === 'object') {

			FancyProductDesignerView.relevantOptions.forEach(function(key) {
				options[key] = instance.options[key];
			});

		}

		return options;

	};

	/**
	 * Toggles the lockment of view. If the view is locked, the price of the view will not be added to the total product price.
	 *
	 * @method toggleLock
	 * @param {Boolean} toggle The toggle state.
	 * @return {Boolean} The toggle state.
	 */
	this.toggleLock = function(toggle) {

		toggle = toggle === undefined ? true : toggle;

		instance.locked = toggle;

		$this.trigger('priceChange', [0, instance.truePrice]);

		return toggle;

	};

	/**
	 * Removes the current elements and loads a set of new elements into the view.
	 *
	 * @param {Array} elements An array containing elements.
	 * @param {Function} callback A function that will be called when all elements have beed added.
	 * @method loadElements
	 */
	this.loadElements = function(elements, callback) {

		if(initialElementsLoaded) {
			instance.reset(false);
		}

		instance.elements = elements;

		function _removeNotValidElementObj(element) {

			if(element.type === undefined || element.source === undefined || element.title === undefined) {

				var removeInd = instance.elements.indexOf(element)
				if(removeInd !== -1) {
					instance.elements.splice(removeInd, 1);
					FPDUtil.log('Element index '+removeInd+' from instance.elements removed, its not a valid element object!', 'info');
					_onElementAdded();
					return true;
				}

			}

			return false;

		};

		var element = instance.elements[0];
		//check if view contains at least one element
		if(element) {

			var countElements = 0;
			//iterative function when element is added, add next one
			function _onElementAdded() {

				countElements++;

				//add all elements of a view
				if(countElements < instance.elements.length) {
					var element = instance.elements[countElements];
					if(!_removeNotValidElementObj(element)) {
						instance.addElement( element.type, element.source, element.title, element.parameters);
					}

				}
				//all initial elements are added, view is created
				else {

					$this.off('elementAdd', _onElementAdded);
					if(typeof callback !== 'undefined') {
						callback.call(callback);
					}

				}

			};

			//listen when element is added
			$this.on('elementAdd', _onElementAdded);
			//add first element of view
			if(!_removeNotValidElementObj(element)) {
				instance.addElement( element.type, element.source, element.title, element.parameters);
			}


		}
		//no elements in view, view is created without elements
		else {
			if(typeof callback !== 'undefined') {
				callback.call(callback);
			}
		}

	};

	/**
	 * This method needs to be called after the instance of {{#crossLink "FancyProductDesignerView"}}{{/crossLink}} is set.
	 *
	 * @method setup
	 */
	this.setup = function() {

		this.loadElements(instance.elements, _afterSetup);

	};

	_initialize();

};

FancyProductDesignerView.relevantOptions = [
	'stageWidth',
	'stageHeight',
	'customAdds',
	'customImageParameters',
	'customTextParameters',
	'maxPrice',
	'optionalView',
	'designCategories',
	'printingBox',
	'output',
	'layouts'
];

var FPDFilters =  {

	none: {
		name: 'None',
		preview: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAAAXNSR0IArs4c6QAAAAlwSFlzAAALEwAACxMBAJqcGAAABGhpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IlhNUCBDb3JlIDUuNC4wIj4KICAgPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICAgICAgPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIKICAgICAgICAgICAgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iCiAgICAgICAgICAgIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIgogICAgICAgICAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyIKICAgICAgICAgICAgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIj4KICAgICAgICAgPHhtcE1NOkRlcml2ZWRGcm9tIHJkZjpwYXJzZVR5cGU9IlJlc291cmNlIj4KICAgICAgICAgICAgPHN0UmVmOmluc3RhbmNlSUQ+eG1wLmlpZDozNDlGNUFEOERDNDhFNDExOThFMDgyRUM1NERENjU5QTwvc3RSZWY6aW5zdGFuY2VJRD4KICAgICAgICAgICAgPHN0UmVmOmRvY3VtZW50SUQ+QzA2NTAzMzhGRDBGRjNDNTQ2NjQ5MTdERjU4RTZBOUY8L3N0UmVmOmRvY3VtZW50SUQ+CiAgICAgICAgIDwveG1wTU06RGVyaXZlZEZyb20+CiAgICAgICAgIDx4bXBNTTpEb2N1bWVudElEPnhtcC5kaWQ6NDJBOTU5NjZBQTVFMTFFNDg3MTc5QzUzNEZBREI5NjI8L3htcE1NOkRvY3VtZW50SUQ+CiAgICAgICAgIDx4bXBNTTpJbnN0YW5jZUlEPnhtcC5paWQ6NDJBOTU5NjVBQTVFMTFFNDg3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'
	},

	grayscale: {
		name: 'Grayscale',
		preview: 'data:image/png;base64,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'
	},

	sepia: {
		name: 'Sepia',
		preview: 'data:image/png;base64,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'
	},

	sepia2: {
		name: 'Sepia Second',
		preview: 'data:image/png;base64,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'
	},

	cold: {
		name: 'Cold',
		array: [
			1,0,0,0,0,
			0,1,0,0,0,
			-0.2, 0.2, 0.1, 0.4, 0,
			0,0,0,1,0
		],
		preview: 'data:image/png;base64,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'
	},

	black_white: {
		name: 'Black & White',
		array: [
			0,1,0,0,0,
			0,1,0,0,0,
			0,1,0,0,0,
			0,1,0,1,0
		],
		preview: 'data:image/png;base64,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'
	},

	old: {
		name: 'Old',
		array: [
			1,0,0,0,0,
			-0.4,1.3,-0.4,0.2,-0.1,
			0,0,1,0,0,
			0,0,0,1,0
		],
		preview: 'data:image/png;base64,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'
	},

	milk: {
		name: 'Milk',
		array: [
			0,1,0,0,0,
			0,1,0,0,0,
			0,0.6,1,0,0,
			0,0,0,1,0
		],
		preview: 'data:image/png;base64,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'
	},

	purple: {
		name: 'Purple',
		array: [
			1,-0.2,0,0,0,
			0,1,0,-0.1,0,
			0,1.2,1,0.1,0,
			0,0,1.7,1,0
		],
		preview: 'data:image/png;base64,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'
	},

	yellow: {
		name: 'Yellow',
		array: [
			1,0,0,0,0,
			-0.2,1,0.3,0.1,0,
			-0.1,0,1,0,0,
			0,0,0,1,0
		],
		preview: 'data:image/png;base64,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'
	},

	vintage: {
		name: 'Vintage',
		array: [
			0.6279345635605994, 0.3202183420819367, -0.03965408211312453, 0, 9.651285835294123,
            0.02578397704808868, 0.6441188644374771, 0.03259127616149294, 0, 7.462829176470591,
            0.0466055556782719, -0.0851232987247891, 0.5241648018700465, 0, 5.159190588235296,
            0, 0, 0, 1, 0
		],
		preview: 'data:image/png;base64,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'
	},

	kodachrome: {
		name: 'Kodachrome',
		array: [
			1.1285582396593525, -0.3967382283601348, -0.03992559172921793, 0, 63.72958762196502,
            -0.16404339962244616, 1.0835251566291304, -0.05498805115633132, 0, 24.732407896706203,
            -0.16786010706155763, -0.5603416277695248, 1.6014850761964943, 0, 35.62982807460946,
            0, 0, 0, 1, 0
		],
		preview: 'data:image/png;base64,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'
	},

	technicolor: {
		name: 'Technicolor',
		array: [
			1.9125277891456083, -0.8545344976951645, -0.09155508482755585, 0, 11.793603434377337,
            -0.3087833385928097, 1.7658908555458428, -0.10601743074722245, 0, -70.35205161461398,
            -0.231103377548616, -0.7501899197440212, 1.847597816108189, 0, 30.950940869491138,
            0, 0, 0, 1, 0
		],
		preview: 'data:image/png;base64,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'
	},

	monochrome: {
		name: 'Monochrome',
		array: [
			0.95,0,0,0,0.05,
			0.85,0,0,0,0.15,
			0.5,0,0,0,0.5,
			0,0,0,1,0
		],
		preview: 'data:image/png;base64,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'
	},

};

var FPDToolbar = function($uiElementToolbar, fpdInstance) {

	var instance = this,
		$body = $('body'),
		$uiToolbarSub = $uiElementToolbar.children('.fpd-sub-panel'),
		$colorPicker = $uiElementToolbar.find('.fpd-color-wrapper'),
		$fontFamilyDropdown = $uiElementToolbar.find('.fpd-tool-font-family'),
		colorDragging = false;

	this.isTransforming = false; //is true, while transforming via slider
	this.placement = fpdInstance.mainOptions.toolbarPlacement;

	var _initialize = function() {

		$uiElementToolbar.data('instance', instance);

		instance.setPlacement(instance.placement);

		$body.on('mousedown touchstart', function(evt) { //check when transforming via slider

			if($(evt.target).parents('.fpd-range-slider').length > 0) {
				$(evt.target).parents('.fpd-range-slider').prev('input').change();
				instance.isTransforming = true;
			}

		})
		.on('mouseup touchend', function() {
			instance.isTransforming = false;
		});

		//set max values
		var maxValuesKeys = Object.keys(fpdInstance.mainOptions.maxValues);
		for(var i=0; i < maxValuesKeys.length; ++i) {

			var maxValueProp = maxValuesKeys[i];
			$uiElementToolbar.find('[data-control="'+maxValueProp+'"]').attr('max', fpdInstance.mainOptions.maxValues[maxValueProp]);

		}

		//first-level tools
		$uiElementToolbar.find('.fpd-row > div').click(function() {

			var $this = $(this);

			$uiElementToolbar.find('.fpd-row > div').not($this).removeClass('fpd-active');

			if($this.data('panel')) { //has a sub a panel

				$this.tooltipster('hide');

				$this.toggleClass('fpd-active'); //activate panel opener
				$uiToolbarSub.toggle($this.hasClass('fpd-active')) //display sub wrapper, if opener is active
				.children().removeClass('fpd-active') //hide all panels in sub wrapper
				.filter('.fpd-panel-'+$this.data('panel')).addClass('fpd-active'); //display related panel

				var element = fpdInstance.currentElement;

				if($this.data('panel') == 'fill') {

					if(FPDUtil.elementHasColorSelection(element)) {

						var availableColors;
						if(element.colorLinkGroup) {
							availableColors = fpdInstance.colorLinkGroups[element.colorLinkGroup].colors;
						}
						else {
							availableColors = element.colors;
						}

						$colorPicker.children('input').spectrum('destroy');
						$colorPicker.empty().removeClass('fpd-colorpicker-group');

						//svg with more than one path
						if(element.type == FPDPathGroupName && (element.getObjects().length > 1 || availableColors == 1)) {

							var paths = element.getObjects();
							for(var i=0; i < paths.length; ++i) {
								var path = paths[i],
									color = tinycolor(path.fill);

								$colorPicker.append('<input type="text" value="'+color.toHexString()+'" />');
							}

							$colorPicker.addClass('fpd-colorpicker-group').children('input').spectrum('destroy').spectrum({
								showPaletteOnly: $.isArray(element.colors),
								preferredFormat: "hex",
								showInput: true,
								showInitial: true,
								showButtons: false,
								showPalette: fpdInstance.mainOptions.colorPickerPalette && fpdInstance.mainOptions.colorPickerPalette.length > 0,
								palette: $.isArray(element.colors) ? element.colors : fpdInstance.mainOptions.colorPickerPalette,
								show: function(color) {

									var svgColors = FPDUtil.changePathColor(
										fpdInstance.currentElement,
										$colorPicker.children('input').index(this),
										color
									);

									FPDUtil.spectrumColorNames($(this).spectrum('container'), fpdInstance);

									element._tempFill = svgColors;

								},
								move: function(color) {

									var svgColors = FPDUtil.changePathColor(
										element,
										$colorPicker.children('input').index(this),
										color
									);

									//fpdInstance.currentViewInstance.changeColor(element, svgColors);
									fpdInstance.currentViewInstance.setElementParameters({fill: svgColors}, element);

								},
								change: function(color) {

									var svgColors = FPDUtil.changePathColor(
										element,
										$colorPicker.children('input').index(this),
										color
									);

									$(document).unbind("click.spectrum"); //fix, otherwise change is fired on every click
									fpdInstance.currentViewInstance.setElementParameters({fill: svgColors}, element);

								}
							});

						}
						//color list or for svg with one path
						else if(availableColors.length > 1 || (element.type == FPDPathGroupName && element.getObjects().length === 1)) {

							$colorPicker.html('<div class="fpd-color-palette fpd-grid"></div>');

							for(var i=0; i < availableColors.length; ++i) {

								var color = availableColors[i];
									colorName = fpdInstance.mainOptions.hexNames[color.replace('#', '').toLowerCase()];

								colorName = colorName ? colorName : color;
								$colorPicker.children('.fpd-grid').append('<div class="fpd-item fpd-tooltip" title="'+colorName+'" style="background-color: '+color+';"></div>')
								.children('.fpd-item:last').click(function() {

									var color = tinycolor($(this).css('backgroundColor'));

									//update current color in toolbar
									$uiElementToolbar.find('.fpd-current-fill').css('background', color.toHexString());

									var fillValue = color.toHexString();
									if(fpdInstance.currentElement.type == FPDPathGroupName) {

										fillValue = FPDUtil.changePathColor(
											element,
											0,
											color
										);

									}

									fpdInstance.currentViewInstance.setElementParameters({fill: fillValue});

								});

							}

							FPDUtil.updateTooltip();

						}
						//colorwheel
						else {

							$colorPicker.html('<input type="text" value="'+(element.fill ? element.fill : availableColors[0])+'" />');

							$colorPicker.children('input').spectrum({
								flat: true,
								preferredFormat: "hex",
								showInput: true,
								showInitial: true,
								showPalette: fpdInstance.mainOptions.colorPickerPalette && fpdInstance.mainOptions.colorPickerPalette.length > 0,
								palette: fpdInstance.mainOptions.colorPickerPalette,
								show: function(color) {

									FPDUtil.spectrumColorNames($(this).spectrum('container').next('.sp-container'), fpdInstance);
									element._tempFill = color.toHexString();

								},
								move: function(color) {

									//only non-png images are changing while dragging
									if(colorDragging === false || FPDUtil.elementIsColorizable(element) !== 'png') {
										_setElementColor(color.toHexString());
									}

								},
								change: function(color) {

									$(document).unbind("click.spectrum"); //fix, otherwise change is fired on every click
									fpdInstance.currentViewInstance.setElementParameters({fill: color.toHexString()}, element);

								}
							})
							.on('dragstart.spectrum', function() {
								colorDragging = true;
							})
							.on('dragstop.spectrum', function(evt, color) {
								colorDragging = false;
								_setElementColor(color.toHexString());
							});

						}
					}

					//patterns
					if((FPDUtil.isSVG(element) || FPDUtil.getType(element.type) === 'text') && element.patterns && element.patterns.length) {

						$uiToolbarSub.find('.fpd-patterns > .fpd-grid').empty();
						for(var i=0; i < element.patterns.length; ++i) {

							var patternUrl = element.patterns[i];
							$uiToolbarSub.find('.fpd-patterns > .fpd-grid').append('<div class="fpd-item" data-pattern="'+patternUrl+'"><picture style="background-image: url('+patternUrl+');"></picture></div>')
							.children(':last').click(function() {

								var patternUrl = $(this).data('pattern');
								$uiElementToolbar.find('.fpd-current-fill').css('background', 'url('+patternUrl+')');
								fpdInstance.currentViewInstance.setElementParameters( {pattern: patternUrl} );


							});

						}

					}

				}
				else if($this.data('panel') == 'stroke') {

					//stroke color
					var strokeColor = fpdInstance.currentElement.stroke ? fpdInstance.currentElement.stroke : '#000';
				    $uiToolbarSub.find('.fpd-stroke-color-picker input').spectrum('destroy').spectrum({
					    color: strokeColor,
						flat: true,
						preferredFormat: "hex",
						showInput: true,
						showInitial: true,
						showPalette: fpdInstance.mainOptions.colorPickerPalette && fpdInstance.mainOptions.colorPickerPalette.length > 0,
						palette: fpdInstance.mainOptions.colorPickerPalette,
						move: function(color) {
							instance.isTransforming = true;
							fpdInstance.currentViewInstance.setElementParameters( {stroke: color.toHexString()} );

						},
						change: function(color) {

							fpdInstance.currentViewInstance.setElementParameters({stroke: color.toHexString()});

						}
					});

				}

				$uiToolbarSub.css({
					top: $this.parent('.fpd-row').position().top+$this.position().top+$this.outerHeight(true),
					left: $this.parent().position().left - 5
				});

				instance.updatePosition(fpdInstance.currentElement);

			}
			else {

				$uiToolbarSub.hide();

			}

		});

		//create range slider
		$uiToolbarSub.find('.fpd-slider-range').rangeslider({
			polyfill: false,
			rangeClass: 'fpd-range-slider',
			disabledClass: 'fpd-range-slider--disabled',
			horizontalClass: 'fpd-range-slider--horizontal',
		    verticalClass: 'fpd-range-slider--vertical',
		    fillClass: 'fpd-range-slider__fill',
		    handleClass: 'fpd-range-slider__handle',
		    onSlide: function(pos, value) {

			    if(instance.isTransforming) {

				    this.$element.parent().prev('.fpd-slider-number').val(value).change();

				    //proportional scaling
				    if(this.$element.data('control') === 'scaleX' && fpdInstance.currentElement && fpdInstance.currentElement.lockUniScaling) {
					    $uiToolbarSub.find('.fpd-slider-number[data-control="scaleY"]').val(value).change();
				    }

			    }

		    },
		    onSlideEnd: function() {

			    instance.isTransforming = false;
			    instance.updatePosition(fpdInstance.currentElement);

		    }
		});

		//position
		$uiToolbarSub.find('.fpd-panel-position .fpd-icon-button-group > span').click(function() {

			var $this = $(this);
			if($this.hasClass('fpd-align-left')) {
				fpdInstance.currentViewInstance.alignElement('left');
			}
			else if($this.hasClass('fpd-align-top')) {
				fpdInstance.currentViewInstance.alignElement('top');
			}
			else if($this.hasClass('fpd-align-right')) {
				fpdInstance.currentViewInstance.alignElement('right');
			}
			else if($this.hasClass('fpd-align-bottom')) {
				fpdInstance.currentViewInstance.alignElement('bottom');
			}
			else if($this.hasClass('fpd-align-center-h')) {
				fpdInstance.currentViewInstance.centerElement(true, false);
			}
			else if($this.hasClass('fpd-align-center-v')) {
				fpdInstance.currentViewInstance.centerElement(false, true);
			}
			else if($this.hasClass('fpd-flip-h')) {
				fpdInstance.currentViewInstance.setElementParameters({flipX: !fpdInstance.currentElement.get('flipX')});
			}
			else if($this.hasClass('fpd-flip-v')) {
				fpdInstance.currentViewInstance.setElementParameters({flipY: !fpdInstance.currentElement.get('flipY')});
			}

			instance.updatePosition(fpdInstance.currentElement);

		});

		//move layer position
		$uiElementToolbar.find('.fpd-tool-move-up, .fpd-tool-move-down').click(function() {

			var currentZ = fpdInstance.currentViewInstance.getZIndex();

			currentZ = $(this).hasClass('fpd-tool-move-up') ? currentZ+1 : currentZ-1;
			currentZ = currentZ < 0 ? 0 : currentZ;

			fpdInstance.currentViewInstance.setElementParameters( {z: currentZ} );

	    });

		//reset element
	    $uiElementToolbar.find('.fpd-tool-reset').click(function() {

		    $(document).unbind("click.spectrum"); //needs to be triggered, otherwise color is not resetted
			$uiElementToolbar.find('.tooltipstered').tooltipster('destroy');
		    fpdInstance.currentViewInstance.setElementParameters( fpdInstance.currentElement.originParams );
		    fpdInstance.currentViewInstance.deselectElement();

			FPDUtil.updateTooltip();

		});

		//append fonts to dropdown
		if(fpdInstance.mainOptions.fonts && fpdInstance.mainOptions.fonts.length > 0) {

			//fonts array has objects
			if(typeof fpdInstance.mainOptions.fonts[0] === 'object') {
				fpdInstance.mainOptions.fonts.sort(function(a, b) {
					var nameA = a.name.toUpperCase(), // ignore upper and lowercase
						nameB = b.name.toUpperCase(); // ignore upper and lowercase
					if (nameA < nameB) {
						return -1;
					}
					if (nameA > nameB) {
						return 1;
					}

					//same
					return 0;
				});
			}
			else {
				fpdInstance.mainOptions.fonts.sort();
			}

			for(var i=0; i < fpdInstance.mainOptions.fonts.length; ++i) {

				var font = fpdInstance.mainOptions.fonts[i],
					fontName = font;

				if(typeof font == 'object') {
					fontName = font.name;
				}

				$fontFamilyDropdown.children('.fpd-dropdown-list')
				.append('<span class="fpd-item" data-value="'+fontName+'">'+fontName+'</span>')
				.children(':last').css('font-family', fontName);

			}

		}
		else {
			$fontFamilyDropdown.hide();
		}

		//edit text
		var tempFocusText = null;
	    $uiToolbarSub.find('.fpd-panel-edit-text textarea').keyup(function(evt) {

		    evt.stopPropagation;
		    evt.preventDefault();

		    var selectionStart = this.selectionStart,
			 	selectionEnd = this.selectionEnd;

			fpdInstance.currentViewInstance.currentElement.isEditing = true;
		    fpdInstance.currentViewInstance.setElementParameters( {text: this.value} );

		    this.selectionStart = selectionStart;
			this.selectionEnd = selectionEnd;

	    })
	    .focus(function() {
		    tempFocusText = fpdInstance.currentViewInstance.currentElement;
		    tempFocusText.isEditing = true;
	    })
	    .focusout(function() {
		    tempFocusText.isEditing = false;
		    tempFocusText = null;
	    });

		//call content in tab
		$uiToolbarSub.find('.fpd-panel-tabs > span').click(function() {

			var $this = $(this);

			$this.addClass('fpd-active').siblings().removeClass('fpd-active');
			$this.parent().nextAll('.fpd-panel-tabs-content').children('[data-id="'+this.id+'"]').addClass('fpd-active')
			.siblings().removeClass('fpd-active');

			$colorPicker.children('input').spectrum('hide');

		});


		$uiElementToolbar.find('.fpd-number').change(function() {

			var $this = $(this),
				numberParameters = {};

			if( this.value > Number($this.attr('max')) ) {
				this.value = Number($this.attr('max'));
			}

			if( this.value < Number($this.attr('min')) ) {
				this.value = Number($this.attr('min'));
			}

			var value = Number(this.value);

			if($this.hasClass('fpd-slider-number')) {

				$this.next('.fpd-range-wrapper').children('input').val(this.value)
				.rangeslider('update', true, false);

				if($this.data('control') === 'scaleX' && fpdInstance.currentElement && fpdInstance.currentElement.lockUniScaling) {
					$uiElementToolbar.find('[data-control="scaleY"]').val(value).change();
				}

			}

			numberParameters[$this.data('control')] = value;

			if(fpdInstance.currentViewInstance) {

				fpdInstance.currentViewInstance.setElementParameters(
					numberParameters,
					fpdInstance.currentViewInstance.currentElement,
					!instance.isTransforming
				);

			}

		});

		$uiElementToolbar.find('.fpd-toggle').click(function() {

			var $this = $(this).toggleClass('fpd-enabled'),
				toggleParameters = {};

			//ignore curved text switcher
			if(!$this.hasClass('fpd-curved-text-switcher')) {

				toggleParameters[$this.data('control')] = $this.hasClass('fpd-enabled') ? $this.data('enabled') : $this.data('disabled');

				if($this.hasClass('fpd-tool-uniscaling-locker')) {
					_lockUniScaling($this.hasClass('fpd-enabled'));
				}

				fpdInstance.currentViewInstance.setElementParameters(toggleParameters);

			}


		});

		$uiElementToolbar.find('.fpd-dropdown .fpd-item').click(function(evt) {

			evt.stopPropagation();

			var $this = $(this),
				$current = $this.parent().prevAll('.fpd-dropdown-current:first'),
				value = $this.data('value'),
				parameter = {};

			var control = $current.is('input') ? $current.val(value) : $current.html($this.clone()).data('value', value);

			parameter[$current.data('control')] = value;

			if($current.data('control') === 'fontFamily') {
				$current.css('font-family', value);
			}

			fpdInstance.currentViewInstance.setElementParameters(parameter);

			$this.siblings('.fpd-item').show();

		});

		$uiElementToolbar.find('.fpd-dropdown.fpd-search > input').keyup(function() {

			var $items = $(this).css('font-family', 'Helvetica').nextAll('.fpd-dropdown-list:first')
			.children('.fpd-item').hide();

			if(this.value.length === 0) {
				$items.show();
			}
			else {
				$items.filter(':containsCaseInsensitive("'+this.value+'")').show();
			}

		});

		//advanced editing: crop, filters, color manipulation
		$uiElementToolbar.find('.fpd-tool-advanced-editing').click(function() {

			if(fpdInstance.currentViewInstance && fpdInstance.currentViewInstance.currentElement && fpdInstance.currentViewInstance.currentElement.source) {

				var source = fpdInstance.currentViewInstance.currentElement.source,
					$modal = FPDUtil.showModal($(fpdInstance.translatedUI).children('.fpd-image-editor-container').clone(), true),
					imageEditor = new FPDImageEditor(
						$modal.find('.fpd-image-editor-container'),
						fpdInstance.currentViewInstance.currentElement,
						fpdInstance
					);

				imageEditor.loadImage(source);

			}


		});

	};


	var _toggleUiTool = function(tool, showHide) {

		showHide = showHide === undefined ? true : showHide;

		var $tool = $uiElementToolbar.find('.fpd-tool-'+tool).toggle(showHide); //show tool

		//show row if at least one visible tool in row
		if(showHide) {
			$tool.parent('.fpd-row').show();
		}

		return $tool;

	};

	var _toggleSubTool = function(panel, tool, showHide) {

		showHide = Boolean(showHide);

		return $uiToolbarSub.children('.fpd-panel-'+panel)
		.children('.fpd-tool-'+tool).toggle(showHide);
	};

	var _togglePanelTab = function(panel, tab, showHide) {

		$uiToolbarSub.children('.fpd-panel-'+panel)
		.find('.fpd-panel-tabs #'+tab).toggleClass('fpd-disabled', !showHide);

	};

	var _setElementColor = function(color) {

		$uiElementToolbar.find('.fpd-current-fill').css('background', color);
		fpdInstance.currentViewInstance.changeColor(fpdInstance.currentViewInstance.currentElement, color);

	};

	var _lockUniScaling = function(toggle) {

		 $uiToolbarSub.find('.fpd-tool-uniscaling-locker > span').removeClass().addClass(toggle ? 'fpd-icon-locked' : 'fpd-icon-unlocked');
		 $uiToolbarSub.find('.fpd-tool-scaleY').toggleClass('fpd-disabled', toggle);

	};

	this.update = function(element) {

		this.hideTools();

		_toggleUiTool('reset');

		var source = element.source,
			allowedImageTypes = [
				'png',
				'jpg',
				'jpeg',
			];

		if(source) {
			source = source.split('?')[0];//remove all url parameters
			var imageParts = source.split('.'),
				sourceExt = imageParts.pop().toLowerCase();

		}

		if(element.advancedEditing && source &&
			($.inArray(sourceExt, allowedImageTypes) !== -1 || sourceExt.search(/data:image\/(jpeg|png);/) !== -1)) {
			_toggleUiTool('advanced-editing');
		}

		//colors array, true=svg colorization
		if(FPDUtil.elementHasColorSelection(element)) {

			_toggleUiTool('fill');
			_togglePanelTab('fill', 'color', true);

		}

		if((element.resizable && FPDUtil.getType(element.type) === 'image') || element.rotatable) {
			_toggleUiTool('transform');
			_toggleSubTool('transform', 'scale', (element.resizable && FPDUtil.getType(element.type) === 'image'));
			//uni scaling tools
			_lockUniScaling(element.lockUniScaling);
			_toggleSubTool('transform', 'uniscaling-locker', element.resizable && element.uniScalingUnlockable);
			_toggleSubTool('transform', 'angle', element.rotatable);
		}

		if(element.draggable) {
			_toggleUiTool('position');
		}

		if(element.zChangeable) {
			_toggleUiTool('move');
		}


		if((FPDUtil.isSVG(element) || FPDUtil.getType(element.type) === 'text') && element.patterns && element.patterns.length) {

			_toggleUiTool('fill');
			_togglePanelTab('fill', 'pattern', true);

		}

		//text options
		if(FPDUtil.getType(element.type) === 'text' && element.editable) {

			_toggleUiTool('font-family');
			_toggleUiTool('text-size', element.resizable);
			_toggleUiTool('text-line-height');
			_toggleUiTool('text-letter-spacing');
			_toggleUiTool('text-bold');
			_toggleUiTool('text-italic');
			_toggleUiTool('text-underline');
			_toggleUiTool('text-transform');
			_toggleUiTool('text-align');
			_toggleUiTool('text-stroke');
			if(element.curvable) {
				_toggleUiTool('curved-text');
			}

			$uiToolbarSub.find('.fpd-panel-edit-text textarea').val(element.get('text'));
			_toggleUiTool('edit-text', !element.textPlaceholder && !element.numberPlaceholder); //hide edit-text when element is used as placeholder for numbers&names

		}

		//display only enabled tabs and when tabs length > 1
		$uiToolbarSub.find('.fpd-panel-tabs').each(function(index, panelTabs) {

			var $panelTabs = $(panelTabs);
			$panelTabs.toggle($panelTabs.children(':not(.fpd-disabled)').length > 1);
			$panelTabs.children(':not(.fpd-disabled):first').addClass('fpd-active').click();

		});

		//set UI value by selected element
		$uiElementToolbar.find('[data-control]').each(function(index, uiElement) {

			var $uiElement = $(uiElement),
				parameter = $uiElement.data('control');

			if($uiElement.hasClass('fpd-number')) {

				if(element[parameter] !== undefined) {
					var numVal = $uiElement.attr('step') && $uiElement.attr('step').length > 1 ? parseFloat(element[parameter]).toFixed(2) : parseInt(element[parameter]);
					$uiElement.val(numVal);

					if($uiElement.prev('.fpd-range-wrapper')) {
						$uiElement.prev('.fpd-range-wrapper').children('input').val(numVal)
						.rangeslider('update', true, false);
					}

				}

			}
			else if($uiElement.hasClass('fpd-toggle')) {

				$uiElement.toggleClass('fpd-enabled', element[parameter] === $uiElement.data('enabled'));

			}
			else if($uiElement.hasClass('fpd-current-fill')) {

				var currentFill = element[parameter];

				//fill: hex
				if(typeof currentFill === 'string') {
					$uiElement.css('background', currentFill);
				}
				//fill: pattern or svg fill
				else if(typeof currentFill === 'object') {

					if(currentFill.source) { //pattern
						currentFill = currentFill.source.src;
						$uiElement.css('background', 'url('+currentFill+')');
					}
					else { //svg has fill
						currentFill = currentFill[0];
						$uiElement.css('background', currentFill);
					}

				}
				//element: svg
				else if(element.colors === true && element.type === FPDPathGroupName) {
					currentFill = tinycolor(element.getObjects()[0].fill);
					$uiElement.css('background', currentFill);
				}
				//no fill, only colors set
				else if(currentFill === false && element.colors && element.colors[0]) {
					currentFill = element.colors[0];

					$uiElement.css('background', currentFill);
				}

			}
			else if($uiElement.hasClass('fpd-dropdown-current')) {

				if(element[parameter] !== undefined) {

					var value = $uiElement.nextAll('.fpd-dropdown-list:first').children('[data-value="'+element[parameter]+'"]').html();
					$uiElement.is('input') ? $uiElement.val(value) : $uiElement.html(value).data('value');

					if(parameter === 'fontFamily') {
						$uiElement.css('font-family', value);
					}
				}


			}


		});

		instance.updatePosition(element);

	};

	this.hideTools = function() {

		$uiElementToolbar.children('.fpd-row').hide() //hide row
		.children('div').hide().removeClass('fpd-active'); //hide tool in row

		$uiToolbarSub.hide()//hide sub toolbar
		.children().removeClass('fpd-active')//hide all sub panels in sub toolbar
		.find('.fpd-panel-tabs > span').addClass('fpd-disabled'); //disable all tabs

	};

	this.updatePosition = function(element, showHide) {

		showHide = typeof showHide === 'undefined' ? true : showHide;

		if(!element) {
			this.toggle(false);
			return;
		}

		var oCoords = element.oCoords,
			topOffset = oCoords.mb.y,
			designerOffset = fpdInstance.$productStage.offset(),
			mainWrapperOffset = fpdInstance.$mainWrapper.offset();

		if(instance.placement == 'inside-bottom' || instance.placement == 'inside-top') {

			var scrollTopOffset = fpdInstance.$container.parents('.fpd-modal-wrapper').length > 0 ? fpdInstance.$container.parents('.fpd-modal-wrapper').scrollTop() : document.body.scrollTop;

			if(instance.placement == 'inside-top') {

				if(fpdInstance.$container.parents('.fpd-modal-wrapper').length > 0) { //modal mode
					topOffset = scrollTopOffset ? Math.abs(mainWrapperOffset.top) : 0;
				}
				else {
					topOffset = scrollTopOffset > mainWrapperOffset.top ? scrollTopOffset - mainWrapperOffset.top : 0;
				}

			}
			else {

				if(fpdInstance.$container.parents('.fpd-modal-wrapper').length > 0) { //modal mode
					topOffset = scrollTopOffset ? Math.abs(mainWrapperOffset.top) : 0;
				}
				else {
					topOffset = scrollTopOffset > mainWrapperOffset.top ? scrollTopOffset - mainWrapperOffset.top : 0;
				}

			}

			$uiElementToolbar.css({
				top:topOffset
			});

		}
		else { //dynamic

			//set maximal width
			$uiElementToolbar.width(320);
			//calculate largest width of rows
			var maxWidth = Math.max.apply( null, $( $uiElementToolbar.children('.fpd-row') ).map( function () {
			    return $( this ).outerWidth( true );
			}).get() );
			//set new width
			$uiElementToolbar.width(maxWidth+2);

			var elemBoundingRect = element.getBoundingRect(),
				designerTop = fpdInstance.mainOptions.modalMode ? parseInt(fpdInstance.$container.parents('.fpd-modal-product-designer:first > .fpd-modal-wrapper').css("padding-top")) : designerOffset.top,
				lowestY = elemBoundingRect.top + elemBoundingRect.height, //set always to lowest point of element (regnoize angle)
				offsetY = element.padding + element.cornerSize + designerTop; //position under element

			topOffset = lowestY + offsetY; //position above canvas

			//LIMITS
			topOffset = topOffset > fpdInstance.$productStage.height() + designerTop ? fpdInstance.$productStage.height() + designerTop + 5 : topOffset;//do not move under designer
			var viewportH = fpdInstance.mainOptions.modalMode ? fpdInstance.$container.parents('.fpd-modal-product-designer:first > .fpd-modal-wrapper')[0].scrollHeight : document.body.scrollHeight;
			topOffset = topOffset + $uiElementToolbar.height() > viewportH ? designerTop + elemBoundingRect.top -  ($uiElementToolbar.height() + element.padding + element.cornerSize): topOffset; //do not move outside of viewport

			var posLeft = designerOffset.left + oCoords.mb.x,
				halfWidth =  $uiElementToolbar.outerWidth() * .5;

			posLeft = posLeft < halfWidth ? halfWidth : posLeft; //move toolbar not left outside of document
			posLeft = posLeft > $(window).width() - halfWidth ? $(window).width() - halfWidth : posLeft; //move toolbar not right outside of document

			$uiElementToolbar.css({
				left: posLeft,
				top: topOffset
			});

		}

		$uiElementToolbar.toggleClass('fpd-show', showHide);

	};

	this.updateUIValue = function(tool, value) {

		var $UIController = $uiElementToolbar.find('[data-control="'+tool+'"]');

		$UIController.val(value);
		$UIController.filter('.fpd-slider-range').rangeslider('update', true, false);

	};

	this.toggle = function(showHide, reset) {

		reset = reset === undefined ? true : reset;

		if(!showHide && reset) {
			$colorPicker.spectrum('destroy');
		}

		$uiElementToolbar.toggleClass('fpd-show', showHide);

	};

	this.setPlacement = function(placement) {

		instance.placement = placement;

		//remove fpd-toolbar-placement-* class
		$uiElementToolbar.removeClass (function (index, css) {
		    return (css.match (/(^|\s)fpd-toolbar-placement-\S+/g) || []).join(' ');
		});

		$uiElementToolbar.addClass('fpd-toolbar-placement-'+placement);

		if(instance.placement == 'inside-bottom' || instance.placement == 'inside-top') {
			$uiElementToolbar.appendTo(fpdInstance.$mainWrapper);
		}
		else if(fpdInstance.$container.parents('.fpd-modal-product-designer').length > 0) {
			$uiElementToolbar.appendTo(fpdInstance.$container.parents('.fpd-modal-product-designer:first > .fpd-modal-wrapper'));
		}
		else {
			$uiElementToolbar.appendTo(fpdInstance.mainOptions.toolbarDynamicContext);
		}

	}

	_initialize();

};

var FPDToolbarSmart = function($uiElementToolbar, fpdInstance) {

	var instance = this,
		$body = $('body'),
		$uiToolbarSub = $uiElementToolbar.children('.fpd-sub-panel'),
		$colorPicker = $uiElementToolbar.find('.fpd-color-wrapper'),
		colorDragging = false;

	this.isTransforming = false; //is true, while transforming via slider
	this.placement = fpdInstance.mainOptions.toolbarPlacement;

	var _initialize = function() {

		$uiElementToolbar.data('instance', instance);
		instance.setPlacement(instance.placement);

		//disable page scroll for touch devices
		$uiElementToolbar.get(0).addEventListener('touchmove', function(evt) {
		        evt.preventDefault();
		}, false);

		$uiElementToolbar.children('.fpd-scroll-area').mCustomScrollbar({
			axis: 'x',
			scrollInertia: 200,
			mouseWheel: {
				enable: true
			},
			advanced:{
	        	autoExpandHorizontalScroll:true
	      	}
		});

		$body.on('mousedown touchstart', function(evt) { //check when transforming via slider

			if($(evt.target).parents('.fpd-range-slider').length > 0) {
				$(evt.target).parents('.fpd-range-slider').siblings('input').change();
				instance.isTransforming = true;
			}

		})
		.on('mouseup touchend', function() {
			instance.isTransforming = false;
		});

		//close toolbar
		$uiElementToolbar.on('click', '.fpd-close-panel', function() {

			$uiElementToolbar.find('.fpd-panel-font-family input').val('').keyup();
			$colorPicker.children('input').spectrum('hide');
			$uiToolbarSub.hide();

			if(fpdInstance.currentElement && fpdInstance.currentElement.exitEditing === 'function') {
				fpdInstance.currentElement.exitEditing();
			}

/*
			setTimeout(function() {
				instance.updatePosition(fpdInstance.currentElement);
			}, 2000);
*/


		});

		//set max values
		var maxValuesKeys = Object.keys(fpdInstance.mainOptions.maxValues);
		for(var i=0; i < maxValuesKeys.length; ++i) {

			var maxValueProp = maxValuesKeys[i];
			$uiElementToolbar.find('[data-control="'+maxValueProp+'"]').attr('max', fpdInstance.mainOptions.maxValues[maxValueProp]);

		}

		//first-level tools
		$uiElementToolbar.find('[class^="fpd-tool-"]').click(function() {

			var $this = $(this);

			if($this.data('panel')) { //has a sub a panel

				$this.tooltipster('hide');

				$uiToolbarSub.show() //display sub wrapper, if opener is active
				.children().removeClass('fpd-active') //hide all panels in sub wrapper
				.filter('.fpd-panel-'+$this.data('panel')).addClass('fpd-active'); //display related panel

				$uiToolbarSub.find('.fpd-slider-range').rangeslider('update', false, false);

				var element = fpdInstance.currentElement;

				if($this.data('panel') == 'color') {

					if(FPDUtil.elementHasColorSelection(element)) {

						var availableColors;
						if(element.colorLinkGroup) {
							availableColors = fpdInstance.colorLinkGroups[element.colorLinkGroup].colors;
						}
						else {
							availableColors = element.colors;
						}

						$colorPicker.children('input').spectrum('destroy');
						$colorPicker.empty().removeClass('fpd-colorpicker-group');

						//svg with more than one path
						if(element.type == FPDPathGroupName && (element.getObjects().length > 1 || availableColors == 1)) {

							var paths = element.getObjects();
							for(var i=0; i < paths.length; ++i) {
								var path = paths[i],
									color = tinycolor(path.fill);

								$colorPicker.append('<input type="text" value="'+color.toHexString()+'" />');
							}

							$colorPicker.addClass('fpd-colorpicker-group').children('input').spectrum('destroy').spectrum({
								showPaletteOnly: $.isArray(element.colors),
								preferredFormat: "hex",
								showInput: true,
								showInitial: true,
								showButtons: false,
								showPalette: fpdInstance.mainOptions.colorPickerPalette && fpdInstance.mainOptions.colorPickerPalette.length > 0,
								palette: $.isArray(element.colors) ? element.colors : fpdInstance.mainOptions.colorPickerPalette,
								show: function(color) {

									var svgColors = FPDUtil.changePathColor(
										fpdInstance.currentElement,
										$colorPicker.children('input').index(this),
										color
									);

									FPDUtil.spectrumColorNames($(this).spectrum('container'), fpdInstance);

									element._tempFill = svgColors;

								},
								move: function(color) {

									var svgColors = FPDUtil.changePathColor(
										element,
										$colorPicker.children('input').index(this),
										color
									);

									fpdInstance.currentViewInstance.setElementParameters({fill: svgColors}, element);

								},
								change: function(color) {

									var svgColors = FPDUtil.changePathColor(
										element,
										$colorPicker.children('input').index(this),
										color
									);

									$(document).unbind("click.spectrum"); //fix, otherwise change is fired on every click
									fpdInstance.currentViewInstance.setElementParameters({fill: svgColors}, element);

								}
							});

						}
						//color list or for svg with one path
						else if(availableColors.length > 1 || (element.type == FPDPathGroupName && element.getObjects().length === 1)) {

							$colorPicker.html('<div class="fpd-scroll-area"><div class="fpd-color-palette fpd-grid"></div></div>');

							for(var i=0; i < availableColors.length; ++i) {

								var color = availableColors[i];
									colorName = fpdInstance.mainOptions.hexNames[color.replace('#', '').toLowerCase()];

								colorName = colorName ? colorName : color;
								$colorPicker.find('.fpd-grid').append('<div class="fpd-item fpd-tooltip" title="'+colorName+'" style="background-color: '+color+';"></div>')
								.children('.fpd-item:last').click(function() {

									var color = tinycolor($(this).css('backgroundColor'));

									$uiElementToolbar.find('.fpd-tool-color').css('background', color.toHexString());

									var fillValue = color.toHexString();
									if(fpdInstance.currentElement.type == FPDPathGroupName) {

										fillValue = FPDUtil.changePathColor(
											element,
											0,
											color
										);

									}

									fpdInstance.currentViewInstance.setElementParameters({fill: fillValue});

								});

							}

							FPDUtil.updateTooltip();
							$colorPicker.children('.fpd-scroll-area').mCustomScrollbar({
								scrollInertia: 200,
								documentTouchScroll: false,
								contentTouchScroll: true,
								mouseWheel: {
									enable: true,
									preventDefault: true
								},
							});

						}
						//colorwheel
						else {

							$colorPicker.html('<input type="text" value="'+(element.fill ? element.fill : availableColors[0])+'" />');

							$colorPicker.children('input').spectrum({
								flat: true,
								preferredFormat: "hex",
								showInput: true,
								showInitial: true,
								showPalette: fpdInstance.mainOptions.colorPickerPalette && fpdInstance.mainOptions.colorPickerPalette.length > 0,
								palette: fpdInstance.mainOptions.colorPickerPalette,
								show: function(color) {

									FPDUtil.spectrumColorNames($(this).spectrum('container').next('.sp-container'), fpdInstance);
									element._tempFill = color.toHexString();

								},
								move: function(color) {

									//only non-png images are changing while dragging
									if(colorDragging === false || FPDUtil.elementIsColorizable(element) !== 'png') {
										_setElementColor(color.toHexString());
									}

								},
								change: function(color) {

									$(document).unbind("click.spectrum"); //fix, otherwise change is fired on every click
									fpdInstance.currentViewInstance.setElementParameters({fill: color.toHexString()}, element);

								}
							})
							.on('dragstart.spectrum', function() {
								colorDragging = true;
							})
							.on('dragstop.spectrum', function(evt, color) {
								colorDragging = false;
								_setElementColor(color.toHexString());
							});

						}
					}

					//patterns
					if((FPDUtil.isSVG(element) || FPDUtil.getType(element.type) === 'text') && element.patterns && element.patterns.length) {

						$uiToolbarSub.find('.fpd-tool-patterns .fpd-grid').empty();
						for(var i=0; i < element.patterns.length; ++i) {

							var patternUrl = element.patterns[i]
								$lastItem = $('<div/>', {
								'class': 'fpd-item',
								'data-pattern': patternUrl,
								'html': '<picture style="background-image: url('+patternUrl+');"></picture>'
							}).appendTo($uiToolbarSub.find('.fpd-tool-patterns .fpd-grid'));

							$lastItem.click(function() {

								var patternUrl = $(this).data('pattern');
								$uiElementToolbar.find('.fpd-tool-color').css('background', 'url('+patternUrl+')');
								fpdInstance.currentViewInstance.setElementParameters( {pattern: patternUrl} );


							});

						}

						$uiToolbarSub.find('.fpd-tool-patterns .fpd-scroll-area').mCustomScrollbar({
							scrollInertia: 200,
							documentTouchScroll: false,
							contentTouchScroll: true,
							mouseWheel: {
								enable: true,
								preventDefault: true
							},
						});

					}

					//stroke color
				    $uiToolbarSub.find('.fpd-stroke-color-picker input').spectrum('destroy').spectrum({
					    color: element.stroke ? element.stroke : '#000',
						flat: true,
						preferredFormat: "hex",
						showInput: true,
						showInitial: true,
						showPalette: fpdInstance.mainOptions.colorPickerPalette && fpdInstance.mainOptions.colorPickerPalette.length > 0,
						palette: fpdInstance.mainOptions.colorPickerPalette,
						move: function(color) {
							instance.isTransforming = true;
							fpdInstance.currentViewInstance.setElementParameters( {stroke: color.toHexString()} );

						},
						change: function(color) {

							fpdInstance.currentViewInstance.setElementParameters({stroke: color.toHexString()});

						}
					});


					//shadow color
				    $uiToolbarSub.find('.fpd-shadow-color-picker input').spectrum('destroy').spectrum({
					    color: element.stroke ? element.stroke : '#000',
						flat: true,
						preferredFormat: "hex",
						showInput: true,
						showInitial: true,
						showPalette: fpdInstance.mainOptions.colorPickerPalette && fpdInstance.mainOptions.colorPickerPalette.length > 0,
						palette: fpdInstance.mainOptions.colorPickerPalette,
						move: function(color) {
							instance.isTransforming = true;
							fpdInstance.currentViewInstance.setElementParameters( {shadowColor: color.toHexString()} );

						},
						change: function(color) {

							fpdInstance.currentViewInstance.setElementParameters({shadowColor: color.toHexString()});

						}
					});

				}

				$uiElementToolbar.find('.fpd-panel-font-family .fpd-fonts-list').mCustomScrollbar({
					axis: 'y',
					scrollInertia: 200,
					documentTouchScroll: false,
					contentTouchScroll: true,
					mouseWheel: {
						enable: true,
						preventDefault: true
					},
					advanced:{
			        	autoExpandHorizontalScroll:true
			      	}
				});

				instance.updatePosition(fpdInstance.currentElement);

			}

		});

		//call content in tab
		$uiToolbarSub.find('.fpd-panel-tabs > span').click(function() {

			var $this = $(this);

			$this.addClass('fpd-active').siblings().removeClass('fpd-active');
			$this.parent().nextAll('.fpd-panel-tabs-content').children('[data-id="'+this.dataset.tab+'"]').addClass('fpd-active')
			.siblings().removeClass('fpd-active');

			instance.updatePosition(fpdInstance.currentElement);

		});

		//create range slider
		$uiToolbarSub.find('.fpd-slider-range').rangeslider({
			polyfill: false,
			rangeClass: 'fpd-range-slider',
			disabledClass: 'fpd-range-slider--disabled',
			horizontalClass: 'fpd-range-slider--horizontal',
		    verticalClass: 'fpd-range-slider--vertical',
		    fillClass: 'fpd-range-slider__fill',
		    handleClass: 'fpd-range-slider__handle',
		    onSlide: function(pos, value) {

				this.$element.parent().siblings('.fpd-slider-number').val(value).change();
			    if(instance.isTransforming) {

				    //proportional scaling
				    if(this.$element.data('control') === 'scaleX' && fpdInstance.currentElement && fpdInstance.currentElement.lockUniScaling) {
					    $uiToolbarSub.find('.fpd-slider-number[data-control="scaleY"]').val(value).change();
				    }

			    }

		    },
		    onSlideEnd: function() {

			    instance.isTransforming = false;
			    //instance.updatePosition(fpdInstance.currentElement);

		    }
		});

		//Button with mulitple options
		$uiElementToolbar.on('click', '.fpd-btn-options', function(evt) {

			evt.preventDefault();

			var $this = $(this),
				options = $this.data('options'),
				optionKeys = Object.keys(options),
				currentVal = fpdInstance.currentElement ? fpdInstance.currentElement[this.dataset.control] : optionKeys[0],
				nextOption = optionKeys.indexOf(currentVal) == optionKeys.length - 1 ? optionKeys[0] : optionKeys[optionKeys.indexOf(currentVal)+1],
				params = {};

			params[this.dataset.control] = nextOption;
			$this.children('span').removeClass().addClass(options[nextOption]);
			fpdInstance.currentViewInstance.setElementParameters(params);


		});

		$uiElementToolbar.find('.fpd-toggle').click(function() {

			var $this = $(this).toggleClass('fpd-enabled'),
				toggleParameters = {};

			//ignore curved text switcher
			if(!$this.hasClass('fpd-curved-text-switcher')) {

				toggleParameters[$this.data('control')] = $this.hasClass('fpd-enabled') ? $this.data('enabled') : $this.data('disabled');

				if($this.hasClass('fpd-tool-uniscaling-locker')) {
					_lockUniScaling($this.hasClass('fpd-enabled'));
				}

				fpdInstance.currentViewInstance.setElementParameters(toggleParameters);

			}

		});

		$uiElementToolbar.find('.fpd-number').change(function() {

			var $this = $(this),
				numberParameters = {};

			if( this.value > Number($this.attr('max')) ) {
				this.value = Number($this.attr('max'));
			}

			if( this.value < Number($this.attr('min')) ) {
				this.value = Number($this.attr('min'));
			}

			var value = Number(this.value);

			if($this.hasClass('fpd-slider-number')) {

				$this.siblings('.fpd-range-wrapper').children('input').val(this.value)
				.rangeslider('update', true, false);

				if($this.data('control') === 'scaleX' && fpdInstance.currentElement && fpdInstance.currentElement.lockUniScaling) {
					$uiElementToolbar.find('[data-control="scaleY"]').val(value).change();
				}

			}

			numberParameters[$this.data('control')] = value;

			if(fpdInstance.currentViewInstance) {

				fpdInstance.currentViewInstance.setElementParameters(
					numberParameters,
					fpdInstance.currentViewInstance.currentElement,
					!instance.isTransforming
				);

			}

		});

		//append fonts to dropdown
		if(fpdInstance.mainOptions.fonts && fpdInstance.mainOptions.fonts.length > 0) {

			//fonts array has objects
			if(typeof fpdInstance.mainOptions.fonts[0] === 'object') {
				fpdInstance.mainOptions.fonts.sort(function(a, b) {
					var nameA = a.name.toUpperCase(), // ignore upper and lowercase
						nameB = b.name.toUpperCase(); // ignore upper and lowercase
					if (nameA < nameB) {
						return -1;
					}
					if (nameA > nameB) {
						return 1;
					}

					//same
					return 0;
				});
			}
			else {
				fpdInstance.mainOptions.fonts.sort();
			}

			var $fontsList =  $uiToolbarSub.find('.fpd-fonts-list');
			for(var i=0; i < fpdInstance.mainOptions.fonts.length; ++i) {

				var font = fpdInstance.mainOptions.fonts[i],
					fontName = font;

				if(typeof font == 'object') {
					fontName = font.name;
				}

				$('<span/>', {
					'class': 'fpd-item',
					'data-value': fontName,
					'html': fontName,
					'css': {'fontFamily': fontName}
				}).appendTo($fontsList);

			}

			$uiElementToolbar
			.on('keyup', '.fpd-panel-font-family input', function() {

				var $items = $(this).css('font-family', 'Helvetica').nextAll('.fpd-fonts-list')
				.find('.fpd-item').hide();

				if(this.value.length === 0) {
					$items.show();
				}
				else {
					$items.filter(':containsCaseInsensitive("'+this.value+'")').show();
				}

			})
			.on('click', '.fpd-fonts-list .fpd-item', function() {

				var selectedFont = this.dataset.value;

				$uiElementToolbar.find('.fpd-tool-font-family .fpd-current-val').text(selectedFont).css('fontFamily', selectedFont);
				fpdInstance.currentViewInstance.setElementParameters({fontFamily: selectedFont});

			});

		}

		//Edit Text Tools
		$uiElementToolbar.on('click', '.fpd-tool-edit-text', function() {

			var val = $uiToolbarSub.find('.fpd-panel-edit-text textarea').val();
			$uiToolbarSub.find('.fpd-panel-edit-text textarea').focus().val('').val(val);

		});

	    $uiToolbarSub.find('.fpd-panel-edit-text textarea').keyup(function(evt) {

		    evt.stopPropagation;
		    evt.preventDefault();

		    var selectionStart = this.selectionStart,
			 	selectionEnd = this.selectionEnd;

			fpdInstance.currentViewInstance.currentElement.isEditing = true;
		    fpdInstance.currentViewInstance.setElementParameters( {text: this.value} );

		    this.selectionStart = selectionStart;
			this.selectionEnd = selectionEnd;

	    });

		//advanced editing: crop, filters, color manipulation
		$uiElementToolbar.find('.fpd-tool-advanced-editing').click(function() {

			if(fpdInstance.currentViewInstance && fpdInstance.currentViewInstance.currentElement && fpdInstance.currentViewInstance.currentElement.source) {

				var source = fpdInstance.currentViewInstance.currentElement.source,
					$modal = FPDUtil.showModal($(fpdInstance.translatedUI).children('.fpd-image-editor-container').clone(), true),
					imageEditor = new FPDImageEditor(
						$modal.find('.fpd-image-editor-container'),
						fpdInstance.currentViewInstance.currentElement,
						fpdInstance
					);

				imageEditor.loadImage(source);

			}

		});

		//Position Tools
		$uiToolbarSub.on('click', '.fpd-panel-position.fpd-icon-button-group > span', function() {

			var $this = $(this);
			if($this.hasClass('fpd-align-left')) {
				fpdInstance.currentViewInstance.alignElement('left');
			}
			else if($this.hasClass('fpd-align-top')) {
				fpdInstance.currentViewInstance.alignElement('top');
			}
			else if($this.hasClass('fpd-align-right')) {
				fpdInstance.currentViewInstance.alignElement('right');
			}
			else if($this.hasClass('fpd-align-bottom')) {
				fpdInstance.currentViewInstance.alignElement('bottom');
			}
			else if($this.hasClass('fpd-align-center-h')) {
				fpdInstance.currentViewInstance.centerElement(true, false);
			}
			else if($this.hasClass('fpd-align-center-v')) {
				fpdInstance.currentViewInstance.centerElement(false, true);
			}
			else if($this.hasClass('fpd-flip-h')) {
				fpdInstance.currentViewInstance.setElementParameters({flipX: !fpdInstance.currentElement.get('flipX')});
			}
			else if($this.hasClass('fpd-flip-v')) {
				fpdInstance.currentViewInstance.setElementParameters({flipY: !fpdInstance.currentElement.get('flipY')});
			}

			instance.updatePosition(fpdInstance.currentElement);

		});

		//move layer position
		$uiElementToolbar.find('.fpd-tool-move-up, .fpd-tool-move-down').click(function() {

			var currentZ = fpdInstance.currentViewInstance.getZIndex();

			currentZ = $(this).hasClass('fpd-tool-move-up') ? currentZ+1 : currentZ-1;
			currentZ = currentZ < 0 ? 0 : currentZ;

			fpdInstance.currentViewInstance.setElementParameters( {z: currentZ} );

	    });

		//reset element
	    $uiElementToolbar.find('.fpd-tool-reset').click(function() {

		    $(document).unbind("click.spectrum"); //needs to be triggered, otherwise color is not resetted
			$uiElementToolbar.find('.tooltipstered').tooltipster('destroy');
		    fpdInstance.currentViewInstance.setElementParameters( fpdInstance.currentElement.originParams );
		    fpdInstance.currentViewInstance.deselectElement();

			FPDUtil.updateTooltip();

		});

		fpdInstance.$container.on('elementModify', function(evt, element, parameters) {

			if(parameters.fontSize) {
				$uiElementToolbar.find('.fpd-tool-text-size > .fpd-current-val').text(parseInt (parameters.fontSize));
			}

		});

	};

	var _toggleUiTool = function(tool, showHide) {

		showHide = showHide === undefined ? true : showHide;
		return $uiElementToolbar.find('.fpd-tool-'+tool).toggle(showHide);

	};

	var _toggleSubTool = function(panel, tool, showHide) {

		showHide = Boolean(showHide);

		return $uiToolbarSub.children('.fpd-panel-'+panel)
		.children('.fpd-tool-'+tool).toggle(showHide);

	};

	var _togglePanelTab = function(panel, tab, showHide) {

		$uiToolbarSub.children('.fpd-panel-'+panel)
		.find('.fpd-panel-tabs [data-tab="'+tab+'"]').toggleClass('fpd-disabled', !showHide);

	};

	var _setElementColor = function(color) {

		$uiElementToolbar.find('.fpd-tool-color').css('background', color);
		fpdInstance.currentViewInstance.changeColor(fpdInstance.currentViewInstance.currentElement, color);

	};

	var _lockUniScaling = function(toggle) {

		 $uiToolbarSub.find('.fpd-tool-uniscaling-locker > span').removeClass().addClass(toggle ? 'fpd-icon-locked' : 'fpd-icon-unlocked');
		 $uiToolbarSub.find('.fpd-tool-scaleY').toggleClass('fpd-disabled', toggle);

	};

	this.update = function(element) {

		this.hideTools();
		$uiElementToolbar.removeClass('fpd-type-image');

		_toggleUiTool('reset');

		var source = element.source,
			allowedImageTypes = [
				'png',
				'jpg',
				'jpeg',
				'svg'
			];

		if(source) {
			source = source.split('?')[0];//remove all url parameters
			var imageParts = source.split('.'),
				sourceExt = imageParts.pop().toLowerCase();

		}

		if(element.advancedEditing && source &&
			($.inArray(sourceExt, allowedImageTypes) !== -1 || sourceExt.search(/data:image\/(jpeg|png);/) !== -1)) {
			_toggleUiTool('advanced-editing');
		}

		//colors array, true=svg colorization
		if(FPDUtil.elementHasColorSelection(element)) {

			_toggleUiTool('color');
			_togglePanelTab('color', 'fill', true);

		}

		if((element.resizable && FPDUtil.getType(element.type) === 'image') || element.rotatable) {
			_toggleUiTool('transform');
			_toggleSubTool('transform', 'scale', (element.resizable && FPDUtil.getType(element.type) === 'image'));
			//uni scaling tools
			_lockUniScaling(element.lockUniScaling);
			_toggleSubTool('transform', 'uniscaling-locker', element.resizable && element.uniScalingUnlockable);
			_toggleSubTool('transform', 'angle', element.rotatable);
		}

		if(element.draggable) {
			_toggleUiTool('position');
		}

		if(element.zChangeable) {
			_toggleUiTool('move');
		}


		if((FPDUtil.isSVG(element) || FPDUtil.getType(element.type) === 'text') && element.patterns && element.patterns.length) {

			_toggleUiTool('color');
			_toggleUiTool('patterns', true);

		}
		else {
			_toggleUiTool('patterns', false);
		}

		//text options
		if(FPDUtil.getType(element.type) === 'text' && element.editable) {

			_toggleUiTool('font-family');
			_toggleUiTool('text-size', element.resizable);
			_toggleUiTool('text-line-height');
			_toggleUiTool('text-letter-spacing');
			_toggleUiTool('text-styles');
			_toggleUiTool('text-transform');
			_toggleUiTool('text-align');
			_togglePanelTab('color', 'stroke', true);
			_togglePanelTab('color', 'shadow', true);

			if(element.curvable && !element.textBox) {
				_toggleUiTool('curved-text');
			}

			$uiToolbarSub.find('.fpd-panel-edit-text textarea').val(element.get('text'));
			_toggleUiTool('edit-text', !element.textPlaceholder && !element.numberPlaceholder); //hide edit-text when element is used as placeholder for numbers&names

		}
		else {
			$uiElementToolbar.addClass('fpd-type-image');
		}

		//add no margin to last visible tool
		var test = $uiElementToolbar.find('.fpd-top-tools, .fpd-bottom-tools')
		.children('div').removeClass('fpd-no-margin').filter(':visible:last').addClass('fpd-no-margin');

		//display only enabled tabs and when tabs length > 1
		$uiToolbarSub.find('.fpd-panel-tabs').each(function(index, panelTabs) {

			var $panelTabs = $(panelTabs);
			$panelTabs.toggle($panelTabs.children(':not(.fpd-disabled)').length > 1);
			$panelTabs.children(':not(.fpd-disabled):first').addClass('fpd-active').click();

		});

		//set UI value by selected element
		$uiElementToolbar.find('[data-control]').each(function(index, uiElement) {

			var $uiElement = $(uiElement),
				parameter = $uiElement.data('control');

			if($uiElement.hasClass('fpd-number')) {

				if(element[parameter] !== undefined) {

					var numVal = $uiElement.attr('step') && $uiElement.attr('step').length > 1 ? parseFloat(element[parameter]).toFixed(2) : parseInt(element[parameter]);
					$uiElement.val(numVal);


					if($uiElement.prev('.fpd-range-wrapper')) {

						if(parameter == 'fontSize') {
							$uiElement.prev('.fpd-range-wrapper').children('input')
							.attr('min', element.minFontSize)
							.attr('max', element.maxFontSize);
						}
						else if(parameter == 'scaleX' || parameter == 'scaleY') {
							$uiElement.prev('.fpd-range-wrapper').children('input')
							.attr('min', element.minScaleLimit)
						}

						$uiElement.prev('.fpd-range-wrapper').children('input').val(numVal)
						.rangeslider('update', true, false);

					}

				}

			}
			else if($uiElement.hasClass('fpd-toggle')) {

				$uiElement.toggleClass('fpd-enabled', element[parameter] === $uiElement.data('enabled'));

			}
			else if($uiElement.hasClass('fpd-btn-options')) {

				$uiElement.children('span').removeClass()
				.addClass($uiElement.data('options')[element[parameter]]);

			}
			else if($uiElement.hasClass('fpd-tool-color')) {

				var currentFill = element[parameter];

				//fill: hex
				if(typeof currentFill === 'string') {
					$uiElement.css('background', currentFill);
				}
				//fill: pattern or svg fill
				else if(typeof currentFill === 'object') {

					if(currentFill.source) { //pattern
						currentFill = currentFill.source.src;
						$uiElement.css('background', 'url('+currentFill+')');
					}
					else { //svg has fill
						currentFill = currentFill[0];
						$uiElement.css('background', currentFill);
					}

				}
				//element: svg
				else if(element.colors === true && element.type === FPDPathGroupName) {
					currentFill = tinycolor(element.getObjects()[0].fill);
					$uiElement.css('background', currentFill);
				}
				//no fill, only colors set
				else if(currentFill === false && element.colors && element.colors[0]) {
					currentFill = element.colors[0];

					$uiElement.css('background', currentFill);
				}

			}
			else if(parameter == 'fontSize') {
				$uiElementToolbar.find('.fpd-tool-text-size > .fpd-current-val').text(parseInt(element[parameter]));
			}
			else if(parameter == 'fontFamily') {

				if(element[parameter] !== undefined) {
					$uiElementToolbar.find('.fpd-tool-font-family > .fpd-current-val').text(element[parameter])
					.css('font-family', element[parameter]);
				}

			}

		});

		$uiElementToolbar.children('.fpd-scroll-area').mCustomScrollbar('update');
		instance.updatePosition(element);

	};

	this.updateUIValue = function(tool, value) {

		var $UIController = $uiElementToolbar.find('[data-control="'+tool+'"]');

		$UIController.val(value);
		$UIController.filter('.fpd-slider-range').rangeslider('update', true, false);

	};

	this.hideTools = function() {

		$uiElementToolbar //hide row
		.find('.fpd-top-tools > div, .fpd-bottom-tools > div')
		.hide().removeClass('fpd-active'); //hide tool in row

		$uiToolbarSub.hide()//hide sub toolbar
		.children().removeClass('fpd-active')//hide all sub panels in sub toolbar
		.find('.fpd-panel-tabs > span').addClass('fpd-disabled'); //disable all tabs

	};

	this.updatePosition = function(element, showHide) {

		showHide = typeof showHide === 'undefined' ? true : showHide;

		if(!element) {
			this.toggle(false);
			return;
		}

		var oCoords = element.oCoords,
			topOffset = oCoords.mb.y,
			designerOffset = fpdInstance.$productStage.offset();

		var elemBoundingRect = element.getBoundingRect(),
			designerTop = fpdInstance.mainOptions.modalMode ? parseInt(fpdInstance.$container.parents('.fpd-modal-product-designer:first > .fpd-modal-wrapper').css("padding-top")) : designerOffset.top,
			lowestY = elemBoundingRect.top + elemBoundingRect.height, //set always to lowest point of element (consider angle)
			offsetY = element.padding + element.cornerSize + designerTop; //position under element

		topOffset = lowestY + offsetY; //position above canvas

		//LIMITS
		topOffset = topOffset > fpdInstance.$productStage.height() + designerTop ? fpdInstance.$productStage.height() + designerTop + 5 : topOffset;//do not move under designer
		var viewportH = fpdInstance.mainOptions.modalMode ? fpdInstance.$container.parents('.fpd-modal-product-designer:first > .fpd-modal-wrapper')[0].scrollHeight : document.body.scrollHeight;
		topOffset = topOffset + $uiElementToolbar.height() > viewportH ? designerTop + elemBoundingRect.top -  ($uiElementToolbar.height() + element.padding + element.cornerSize): topOffset; //do not move outside of viewport

		var posLeft = designerOffset.left + oCoords.mb.x,
			halfWidth =  $uiElementToolbar.outerWidth() * .5;

		posLeft = posLeft < halfWidth ? halfWidth : posLeft; //move toolbar not left outside of document
		posLeft = posLeft > $(window).width() - halfWidth ? $(window).width() - halfWidth : posLeft; //move toolbar not right outside of document

		$uiElementToolbar.css({
			left: posLeft,
			top: topOffset
		});

		//fixed for mobile: set toolbar always below selected element
/*
		if($uiElementToolbar.css('position') === 'fixed' && !$uiToolbarSub.find('.fpd-panel-edit-text').hasClass('fpd-active')) {

			var toolbarHeight = $uiToolbarSub.is(':visible') ? $uiToolbarSub.outerHeight() : $uiElementToolbar.outerHeight(),
				elementTopOffset = designerOffset.top + elemBoundingRect.top + elemBoundingRect.height;

			elementTopOffset = elementTopOffset > (designerTop + fpdInstance.$productStage.height()) ? designerTop + fpdInstance.$productStage.height() : elementTopOffset;

			$('html, body').scrollTop((elementTopOffset + toolbarHeight + 40) - document.documentElement.clientHeight);

		}
*/

		$uiElementToolbar.toggleClass('fpd-show', showHide);

	};

	this.toggle = function(showHide, reset) {

		reset = reset === undefined ? true : reset;

		if(!showHide && reset) {
			$colorPicker.spectrum('destroy');
		}

		$uiElementToolbar.toggleClass('fpd-show', showHide);

	};

	this.setPlacement = function(placement) {

		if(fpdInstance.$container.parents('.fpd-modal-product-designer').length > 0) {
			$uiElementToolbar.appendTo(fpdInstance.$container.parents('.fpd-modal-product-designer:first > .fpd-modal-wrapper'));
		}
		else {
			$uiElementToolbar.appendTo(fpdInstance.mainOptions.toolbarDynamicContext);
		}

	};


	_initialize();

};





var FPDMainBar = function(fpdInstance, $mainBar, $modules, $draggableDialog) {

	var instance = this,
		$body = $('body'),
		$nav = $mainBar.children('.fpd-navigation'),
		$content;

	this.currentModules = fpdInstance.mainOptions.mainBarModules;
	this.$selectedModule = null;
	this.$container = $mainBar;
	this.mainBarShowing = true;

	var _initialize = function() {

		$draggableDialog.toggleClass('fpd-hidden', fpdInstance.$container.hasClass('fpd-main-bar-container-enabled'));

		if(fpdInstance.$container.hasClass('fpd-topbar') && !fpdInstance.$container.hasClass('fpd-main-bar-container-enabled') && fpdInstance.$container.filter('[class*="fpd-off-canvas-"]').length === 0) { //draggable dialog

			$content = $draggableDialog.addClass('fpd-grid-columns-'+fpdInstance.mainOptions.gridColumns).append('<div class="fpd-content"></div>').children('.fpd-content');

		}
		else {
			$content = $mainBar.append('<div class="fpd-content"></div>').children('.fpd-content');
		}

		instance.$content = $content;

		if(fpdInstance.$container.filter('[class*="fpd-off-canvas-"]').length > 0) {

			var touchStart = 0,
				panX = 0,
				closeStartX = 0,
				$closeBtn = $mainBar.children('.fpd-close-off-canvas');

			$content.on('touchstart', function(evt) {

				touchStart = evt.originalEvent.touches[0].pageX;
				closeStartX = parseInt($closeBtn.css(fpdInstance.$container.hasClass('fpd-off-canvas-left') ? 'left' : 'right'));

			})
			.on('touchmove', function(evt) {

				evt.preventDefault();

				var moveX = evt.originalEvent.touches[0].pageX;
					panX = touchStart-moveX,
					targetPos = fpdInstance.$container.hasClass('fpd-off-canvas-left') ? 'left' : 'right';

				panX = Math.abs(panX) < 0 ? 0 : Math.abs(panX);
				$content.css(targetPos, -panX);
				$closeBtn.css(targetPos, closeStartX - panX);

			})
			.on('touchend', function(evt) {

				var targetPos = fpdInstance.$container.hasClass('fpd-off-canvas-left') ? 'left' : 'right';

				if(Math.abs(panX) > 100) {

					instance.toggleDialog(false);

				}
				else {
					$content.css(targetPos, 0);
					$closeBtn.css(targetPos, closeStartX);
				}

				panX = 0;

			});

		}

		//close off-canvas
		$mainBar.on('click', '.fpd-close-off-canvas', function(evt) {

			evt.stopPropagation();

			$nav.children('div').removeClass('fpd-active');
			instance.toggleDialog(false);

		});

		$body.append($draggableDialog);
		$draggableDialog.draggable({
			handle: $draggableDialog.find('.fpd-dialog-head'),
			containment: $body
		});

		//select module
		$nav.on('click', '> div', function(evt) {

			evt.stopPropagation();

			var $this = $(this);

			fpdInstance.deselectElement();

			if(fpdInstance.currentViewInstance) {
				fpdInstance.currentViewInstance.currentUploadZone = null;
			}

			$content.find('.fpd-manage-layers-panel')
			.find('.fpd-current-color, .fpd-path-colorpicker').spectrum('destroy');

			if(fpdInstance.$container.hasClass('fpd-topbar') && $this.hasClass('fpd-active')) { //hide dialog when clicking on active nav item

				$this.removeClass('fpd-active');
				instance.toggleDialog(false);

			}
			else {
				instance.callModule($this.data('module'));
			}

		});

		//prevent document scrolling when in dialog content
		$body.on({
		    'mousewheel': function(evt) {

				var $target = $(evt.target);
		        if ($target.hasClass('fpd-draggable-dialog') || $target.parents('.fpd-draggable-dialog').length > 0) {
			    	evt.preventDefault();
				    evt.stopPropagation();
			    }

		    }
		});

		//nav in upload zones (text, images, designs)
		$content.on('click', '.fpd-bottom-nav > div', function() {

			var $this = $(this);

			$this.addClass('fpd-active').siblings().removeClass('fpd-active');

			var $selectedModule = $this.parent().next().children('[data-module="'+$this.data('module')+'"]').addClass('fpd-active');
			$selectedModule.siblings().removeClass('fpd-active');

			//short timeout, because fpd-grid must be visible
			setTimeout(function() {
				FPDUtil.refreshLazyLoad($selectedModule.find('.fpd-grid'), false);
			}, 10);


		});

		//close dialog
		$body.on('click touchend', '.fpd-close-dialog', function() {

			if(fpdInstance.currentViewInstance && fpdInstance.currentViewInstance.currentUploadZone) {
				fpdInstance.currentViewInstance.deselectElement();
			}
			instance.toggleDialog(false);

		});

		fpdInstance.$container.on('viewSelect', function() {

			if(instance.$selectedModule) {

				if(instance.$selectedModule.filter('[data-module="manage-layers"]').length > 0) {
					FPDLayersModule.createList(fpdInstance, instance.$selectedModule);
				}
				else if(instance.$selectedModule.filter('[data-module="text-layers"]').length > 0) {
					FPDTextLayersModule.createList(fpdInstance, instance.$selectedModule);
				}
				//PLUS
				else if(typeof FPDNamesNumbersModule !== 'undefined'
					&& instance.$selectedModule.filter('[data-module="names-numbers"]').length > 0) {
					FPDNamesNumbersModule.setup(fpdInstance, instance.$selectedModule);
				}

			}

			/**
		     * Gets fired as soon as the list with the layers has been updated. Is fired when a view is selected or an object has been added/removed.
		     *
		     * @event FancyProductDesigner#layersListUpdate
		     * @param {Event} event
		     */
			fpdInstance.$container.trigger('layersListUpdate');

		});

		fpdInstance.$container.on('fabricObject:added fabricObject:removed', function(evt, element) {

			if(fpdInstance.productCreated && element.type !== 'rect') {

				if(instance.$selectedModule) {
					if(instance.$selectedModule.filter('[data-module="manage-layers"]').length > 0) {
						FPDLayersModule.createList(fpdInstance, instance.$selectedModule);
					}
					else if(instance.$selectedModule.filter('[data-module="text-layers"]').length > 0) {
						FPDTextLayersModule.createList(fpdInstance, instance.$selectedModule);
					}
				}

				fpdInstance.$container.trigger('layersListUpdate');

			}

		});

		instance.setup(instance.currentModules);

	}

	//call module by name
	this.callModule = function(name) {

		var $selectedNavItem = $nav.children('div').removeClass('fpd-active').filter('[data-module="'+name+'"]').addClass('fpd-active');
		instance.$selectedModule = $content.children('div').removeClass('fpd-active').filter('[data-module="'+name+'"]').addClass('fpd-active');

		if($content.parent('.fpd-draggable-dialog').length > 0) {

			if($draggableDialog.attr('style') === undefined || $draggableDialog.attr('style') === '') {
				$draggableDialog.css('top', $mainBar.offset().top + $mainBar.height());
			}
			$draggableDialog.addClass('fpd-active')
			.find('.fpd-dialog-title').text($selectedNavItem.find('.fpd-label').text());

		}

		if(name === 'text') {
			instance.$selectedModule.find('textarea').focus();
		}
		else if(name === 'manage-layers') {

			if(fpdInstance.productCreated) {
				FPDLayersModule.createList(fpdInstance, instance.$selectedModule);
			}

		}
		else if(name === 'text-layers') {

			if(fpdInstance.productCreated) {
				FPDTextLayersModule.createList(fpdInstance, instance.$selectedModule);
			}

		}
		else if(typeof FPDNamesNumbersModule !== 'undefined' && name === 'names-numbers') {

			if(fpdInstance.productCreated) {
				FPDNamesNumbersModule.setup(fpdInstance, instance.$selectedModule);
			}

		}

		instance.toggleDialog(true);
		FPDUtil.refreshLazyLoad(instance.$selectedModule.find('.fpd-grid'), false);

	};

	this.callSecondary = function(className) {

		instance.callModule('secondary');

		$content.children('.fpd-secondary-module').children('.'+className).addClass('fpd-active')
		.siblings().removeClass('fpd-active');


		if(className === 'fpd-upload-zone-adds-panel') {
			$content.find('.fpd-upload-zone-adds-panel .fpd-bottom-nav > :not(.fpd-hidden)').first().click();
		}

		fpdInstance.$container.trigger('secondaryModuleCalled', [className, $content.children('.fpd-secondary-module').children('.fpd-active')]);

	};

	this.setContentWrapper = function(wrapper) {

		$draggableDialog.removeClass('fpd-active');

		if(wrapper === 'sidebar') {

			if($nav.children('.fpd-active').length === 0) {
				$nav.children().first().addClass('fpd-active');
			}

			$content.appendTo($mainBar);

		}
		else if(wrapper === 'draggable-dialog') {

			$content.appendTo($draggableDialog);
			$nav.removeClass('fpd-hidden');

		}

		//if only modules exist, select it and hide nav
		if(instance.currentModules.length <= 1 && !fpdInstance.$container.hasClass('fpd-topbar')) {
			selectedModule = instance.currentModules[0] ? instance.currentModules[0] : '';
			$nav.addClass('fpd-hidden');
		}
		else {
			$nav.removeClass('fpd-hidden');
		}

		//toogle tooltips
		$nav.children().each(function(i, navItem) {

			var $navItem = $(navItem);
			$navItem.filter('.tooltipstered').tooltipster('destroy');
			if(fpdInstance.$container.hasClass('fpd-sidebar')) {
				$navItem.addClass('fpd-tooltip').attr('title', $navItem.children('.fpd-label').text());
			}
			else {
				$navItem.removeClass('fpd-tooltip').removeAttr('title');
			}

		});

		FPDUtil.updateTooltip($nav);

		$nav.children('.fpd-active').click();

	};

	this.toggleDialog = function(toggle) {

		toggle = typeof toggle === 'undefined' ? true : toggle;

		//top bar is enabled
		if(fpdInstance.$container.hasClass('fpd-topbar') && fpdInstance.$container.filter('[class*="fpd-off-canvas-"]').length === 0) {

			$draggableDialog.toggleClass('fpd-active', toggle);

			//deselect element when main bar is showing
			if(!toggle && instance.mainBarShowing) {
				//fpdInstance.deselectElement();
			}

		}

		//off-canvas is enabled
		if(fpdInstance.$container.filter('[class*="fpd-off-canvas-"]').length > 0) {

			instance.$container.toggleClass('fpd-show', toggle)
			.children('.fpd-close-off-canvas').removeAttr('style');
			instance.$content.removeAttr('style')
			.height(fpdInstance.$mainWrapper.height());

			if($nav.children('div').length === 0) {
				instance.$content.css('top', 0);
			}
			else {
				instance.$content.css('top', $nav.height());
			}

			//deselect element when main bar is showing
			if(!toggle && instance.mainBarShowing) {
				fpdInstance.deselectElement();
			}

		}

		if(!toggle) {
			$nav.children('.fpd-active').removeClass('fpd-active');
		}

		instance.mainBarShowing = toggle;

	};

	this.toggleUploadZonePanel = function(toggle) {

		toggle = typeof toggle === 'undefined' ? true : toggle;

		//do nothing when custom image is loading
		if(fpdInstance._loadingCustomImage) {
			return;
		}

		if(toggle) {
			instance.callSecondary('fpd-upload-zone-adds-panel');
		}
		else {

			fpdInstance.currentViewInstance.currentUploadZone = null;

			//sidebar = open first module, topbar = close dialog
			if(fpdInstance.$container.hasClass('fpd-sidebar')) {
				instance.callModule(fpdInstance.mainBar.currentModules[0]);
			}
			else {
				instance.toggleDialog(false);
			}

		}

	};

	this.toggleUploadZoneAdds = function(customAdds) {

		var $uploadZoneAddsPanel = $content.find('.fpd-upload-zone-adds-panel');

		$uploadZoneAddsPanel.find('.fpd-add-image').toggleClass('fpd-hidden', !Boolean(customAdds.uploads));
		$uploadZoneAddsPanel.find('.fpd-add-text').toggleClass('fpd-hidden', !Boolean(customAdds.texts));
		$uploadZoneAddsPanel.find('.fpd-add-design').toggleClass('fpd-hidden', !Boolean(customAdds.designs));

		if(fpdInstance.currentElement.price) {
			$uploadZoneAddsPanel.find('[data-module="text"] .fpd-btn > .fpd-price')
			.html(' - '+fpdInstance.formatPrice(fpdInstance.currentElement.price));
		}
		else {
			$uploadZoneAddsPanel.find('[data-module="text"] .fpd-btn > .fpd-price').html('');
		}

		if(fpdInstance.UZmoduleInstance_designs) {
			fpdInstance.UZmoduleInstance_designs.toggleCategories();
		}

		//select first visible add panel
		$uploadZoneAddsPanel.find('.fpd-off-canvas-nav > :not(.fpd-hidden)').first().click();

	};

	this.setup = function(modules) {

		instance.currentModules = modules;

		var selectedModule = fpdInstance.mainOptions.initialActiveModule;
		//if only modules exist, select it and hide nav
		if(instance.currentModules.length <= 1 && !fpdInstance.$container.hasClass('fpd-topbar')) {
			selectedModule = instance.currentModules[0] ? instance.currentModules[0] : '';
			$nav.addClass('fpd-hidden');
		}
		else {
			$nav.removeClass('fpd-hidden');
		}

		$nav.empty();
		$content.empty();

		//add selected modules
		modules.forEach(function(module) {

			var $module = $modules.children('[data-module="'+module+'"]'),
				$moduleClone = $module.clone(),
				navItemClass = fpdInstance.$container.hasClass('fpd-sidebar') ? 'class="fpd-tooltip"' : '',
				navItemTitle = fpdInstance.$container.hasClass('fpd-sidebar') ? 'title="'+$module.data('title')+'"' : '',
				moduleInstance;

			$nav.append('<div data-module="'+module+'" '+navItemClass+' '+navItemTitle+'><span class="'+$module.data('moduleicon')+'"></span><span class="fpd-label">'+$module.data('title')+'</span></div>');

			$content.append($moduleClone);

			if(module === 'products') {
				moduleInstance = new FPDProductsModule(fpdInstance, $moduleClone);
			}
			else if(module === 'text') {
				moduleInstance = new FPDTextModule(fpdInstance, $moduleClone);
			}
			else if(module === 'designs') {
				moduleInstance = new FPDDesignsModule(fpdInstance, $moduleClone);
			}
			else if(module === 'images') {
				moduleInstance = new FPDImagesModule(fpdInstance, $moduleClone);
			}
			else if(module === 'layouts') {
				moduleInstance = new FPDLayoutsModule(fpdInstance, $moduleClone);
			}
			//PLUS
			else if(typeof FPDDrawingModule !== 'undefined' && module === 'drawing') {
				moduleInstance = new FPDDrawingModule(fpdInstance, $moduleClone);
			}
			else if(typeof FPDDynamicViews !== 'undefined' && module === 'dynamic-views') {
				moduleInstance = new FPDDynamicViews(fpdInstance, $moduleClone);
			}

			if(moduleInstance) {
				fpdInstance['moduleInstance_'+module] = moduleInstance;
			}

		});

		if($content.children('[data-module="manage-layers"]').length === 0) {
			$content.append($modules.children('[data-module="manage-layers"]').clone());
		}

		$content.append($modules.children('[data-module="secondary"]').clone());

		//add upload zone modules
		var uploadZoneModules = ['images', 'text', 'designs'];
		for(var i=0; i < uploadZoneModules.length; ++i) {

			var module = uploadZoneModules[i],
				$module = $modules.children('[data-module="'+module+'"]'),
				$moduleClone = $module.clone(),
				moduleInstance;

			$content.find('.fpd-upload-zone-content').append($moduleClone);

			if(module === 'text') {
				moduleInstance = new FPDTextModule(fpdInstance, $moduleClone);
			}
			else if(module === 'designs') {
				moduleInstance = new FPDDesignsModule(fpdInstance, $moduleClone);
			}
			else if(module === 'images') {
				moduleInstance = new FPDImagesModule(fpdInstance, $moduleClone);
			}

			if(moduleInstance) {
				fpdInstance['UZmoduleInstance_'+module] = moduleInstance;
			}

		}

		if(fpdInstance.$container.hasClass('fpd-sidebar') && selectedModule == '') {
			selectedModule = $nav.children().first().data('module');
		}

		$nav.children('[data-module="'+selectedModule+'"]').click();

	};

	_initialize();

};

FPDMainBar.availableModules = [
	'products',
	'images',
	'text',
	'designs',
	'manage-layers',
	'text-layers',
	'layouts'
];

var FPDActions = function(fpdInstance, $actions){

	var instance = this,
		snapLinesGroup,
		$actionContainer = fpdInstance.$mainWrapper.children('.fpd-actions-container');

	this.currentActions = fpdInstance.mainOptions.actions;

	var _initialize = function() {

		//add set action buttons
		if($actions) {
			instance.setup(instance.currentActions);

			//action click handler
			fpdInstance.$container.on('click', '.fpd-actions-wrapper .fpd-action-btn', function() {

				var $this = $(this);

				if($this.hasClass('tooltipstered')) {
					$this.tooltipster('hide');
				}

				instance.doAction($this);

			});

		}

		fpdInstance.$container.on('viewSelect', function(evt, viewIndex, viewInstance) {

			instance.resetAllActions();

			fpdInstance.$mainWrapper.find('[data-action="previous-view"], [data-action="next-view"]').toggleClass('fpd-hidden', fpdInstance.viewInstances.length <= 1);
			fpdInstance.$mainWrapper.find('[data-action="previous-view"]').toggleClass('fpd-disabled', viewIndex === 0);
			fpdInstance.$mainWrapper.find('[data-action="next-view"]').toggleClass('fpd-disabled', viewIndex === fpdInstance.viewInstances.length - 1);

		});

		fpdInstance.$container.on('screenSizeChange', function(evt, device){

			if(device === 'smartphone') {
				$actionContainer.insertBefore(fpdInstance.$mainWrapper);
			}
			else {
				$actionContainer.appendTo(fpdInstance.$mainWrapper);
			}

		});

	};

	//set action button to specific position
	var _setActionButtons = function(pos) {

		fpdInstance.$mainWrapper.children('.fpd-actions-container').append('<div class="fpd-actions-wrapper fpd-pos-'+pos+'"></div>');

		var posActions = instance.currentActions[pos];

		for(var i=0; i < posActions.length; ++i) {

			var actionName = posActions[i],
				$action = $actions.children('[data-action="'+actionName+'"]');

			fpdInstance.$mainWrapper.find('.fpd-actions-wrapper.fpd-pos-'+pos).append($action.clone());
		}

	};

	//returns an object with the saved products for the current showing product
	var _getSavedProducts = function() {

		return FPDUtil.localStorageAvailable() ? JSON.parse(window.localStorage.getItem(fpdInstance.$container.attr('id'))) : false;

	};

	//download png, jpeg or pdf
	this.downloadFile = function(type) {

		if(type === 'jpeg' || type === 'png') {

			var a = document.createElement('a'),
				background = type === 'jpeg' ? '#fff' : 'transparent';

			if(typeof a.download !== 'undefined') {

				fpdInstance.getProductDataURL(function(dataURL) {

					download(dataURL, 'Product.'+type, 'image/'+type);

				}, background, {format: type})

			}
			else {

				fpdInstance.createImage(true, false, background, {format: type});

			}
		}
		else {

			_createPDF = function(dataURLs) {

				var largestWidth = fpdInstance.viewInstances[0].options.stageWidth,
					largestHeight = fpdInstance.viewInstances[0].options.stageHeight;

				for(var i=1; i < fpdInstance.viewInstances.length; ++i) {

					var viewOptions = fpdInstance.viewInstances[i].options;
					if(viewOptions.stageWidth > largestWidth) {
						largestWidth = viewOptions.stageWidth;
					}

					if(viewOptions.stageHeight > largestHeight) {
						largestHeight = viewOptions.stageHeight;
					}

				}

				var orientation = fpdInstance.currentViewInstance.stage.getWidth() > fpdInstance.currentViewInstance.stage.getHeight() ? 'l' : 'p',
					doc = new jsPDF(orientation, 'mm', [largestWidth * 0.264583, largestHeight * 0.264583]);

				for(var i=0; i < dataURLs.length; ++i) {

					doc.addImage(dataURLs[i], 'JPEG', 0, 0);
					if(i < dataURLs.length-1) {
						doc.addPage();
					}

				}

				doc.save('Product.pdf');

			};

			fpdInstance.getViewsDataURL(_createPDF, '#ffffff', {format: 'jpeg'});

		}

	};

	this.setup = function(actions) {

		this.currentActions = actions;

		fpdInstance.$mainWrapper.children('.fpd-actions-container').empty();

		var keys = Object.keys(actions);
		for(var i=0; i < keys.length; ++i) {

			var posActions = actions[keys[i]];
			if(typeof posActions === 'object' && posActions.length > 0) {
				_setActionButtons(keys[i]);
			}

		}

	};

	this.doAction = function($this) {

		var action = $this.data('action');

		fpdInstance.deselectElement();

		if(action === 'print') {

			fpdInstance.print();

		}
		else if(action === 'reset-product') {

			var confirmReset = confirm(fpdInstance.getTranslation('misc', 'reset_confirm'));
			if(confirmReset) {
				fpdInstance.loadProduct(fpdInstance.currentViews);
			}

		}
		else if(action === 'undo') {

			fpdInstance.currentViewInstance.undo();

		}
		else if(action === 'redo') {

			fpdInstance.currentViewInstance.redo();

		}
		else if(action === 'info') {

			FPDUtil.showModal($this.children('.fpd-info-content').text(), false, '', fpdInstance.$modalContainer);

		}
		else if(action === 'preview-lightbox') {

			fpdInstance.getProductDataURL(function(dataURL) {

				var image = new Image();
				image.src = dataURL;

				image.onload = function() {
					FPDUtil.showModal('<img src="'+this.src+'" download="product.png" />', true);
				}

			});

		}
		else if(action === 'save') {

			var $prompt = FPDUtil.showModal(fpdInstance.getTranslation('actions', 'save_placeholder'), false, 'prompt', fpdInstance.$modalContainer);
			$prompt.find('.fpd-btn').text(fpdInstance.getTranslation('actions', 'save')).click(function() {

				fpdInstance.doUnsavedAlert = false;

				var title = $(this).siblings('input:first').val();

				//get key and value
				var product = fpdInstance.getProduct(),
					scaling = FPDUtil.getScalingByDimesions(fpdInstance.currentViewInstance.options.stageWidth, fpdInstance.currentViewInstance.options.stageHeight, 200, 200),
					thumbnail = fpdInstance.currentViewInstance.stage.toDataURL({multiplier: 1, format: 'png'});

				if(product && fpdInstance.mainOptions.saveActionBrowserStorage) {

					//check if there is an existing products array
					var savedProducts = _getSavedProducts();
					if(!savedProducts) {
						//create new
						savedProducts = [];
					}

					savedProducts.push({thumbnail: thumbnail, product: product, title: title});
					window.localStorage.setItem(fpdInstance.$container.attr('id'), JSON.stringify(savedProducts));

					FPDUtil.showMessage(fpdInstance.getTranslation('misc', 'product_saved'));

				}

				$prompt.find('.fpd-modal-close').click();
				fpdInstance.$container.trigger('actionSave', [title, thumbnail, product]);

			});



		}
		else if(action === 'load') {

			fpdInstance.mainBar.$content.find('.fpd-saved-designs-panel .fpd-grid').empty();

			//load all saved products into list
			if(fpdInstance.mainOptions.saveActionBrowserStorage) {

				var savedProducts = _getSavedProducts();
				if(savedProducts) {

					for(var i=0; i < savedProducts.length; ++i) {

						var savedProduct = savedProducts[i];
						instance.addSavedProduct(savedProduct.thumbnail, savedProduct.product, savedProduct.title);

					}

					FPDUtil.createScrollbar(fpdInstance.mainBar.$content.find('.fpd-saved-designs-panel .fpd-scroll-area'));

				}

			}

			fpdInstance.$container.trigger('actionLoad');

			fpdInstance.mainBar.callSecondary('fpd-saved-designs-panel');


		}
		else if(action === 'manage-layers') {

			fpdInstance.mainBar.callModule('manage-layers');

		}
		else if(action === 'snap') {

			$this.toggleClass('fpd-active');
			fpdInstance.currentViewInstance._snapElements = $this.hasClass('fpd-active');

			fpdInstance.$mainWrapper.children('.fpd-snap-line-h, .fpd-snap-line-v').hide();

			if($this.hasClass('fpd-active')) {

				var lines = [],
					gridX = fpdInstance.mainOptions.snapGridSize[0] ? fpdInstance.mainOptions.snapGridSize[0] : 50,
					gridY = fpdInstance.mainOptions.snapGridSize[1] ? fpdInstance.mainOptions.snapGridSize[1] : 50,
					linesXNum = Math.ceil(fpdInstance.currentViewInstance.options.stageWidth / gridX),
					linesYNum = Math.ceil(fpdInstance.currentViewInstance.options.stageHeight / gridY);

				//add x-lines
				for(var i=0; i < linesXNum; ++i) {

					var lineX = new fabric.Rect({
						width: 1,
						height: fpdInstance.currentViewInstance.options.stageHeight,
						fill: '#ccc',
						opacity: 0.6,
						left: i * gridX,
						top: 0
					});

					lines.push(lineX);

				}

				//add y-lines
				for(var i=0; i < linesYNum; ++i) {

					var lineY = new fabric.Rect({
						width: fpdInstance.currentViewInstance.options.stageWidth,
						height: 1,
						fill: '#ccc',
						opacity: 0.6,
						top: i * gridY,
						left: 0
					});

					lines.push(lineY);

				}

				snapLinesGroup = new fabric.Group(lines, {id: '_snap_lines_group', left: 0, top: 0, evented: false, selectable: false});
				fpdInstance.currentViewInstance.stage.add(snapLinesGroup);

			}
			else {

				if(snapLinesGroup) {
					fpdInstance.currentViewInstance.stage.remove(snapLinesGroup);
				}

			}

		}
		else if(action === 'qr-code') {

			var $internalModal = FPDUtil.showModal($this.children('.fpd-modal-context').clone(), false, '', fpdInstance.$modalContainer),
				$colorPickers = $internalModal.find('.fpd-qrcode-colors input').spectrum({
					preferredFormat: "hex",
					showInput: true,
					showInitial: true,
					showButtons: false,
					replacerClassName: 'fpd-spectrum-replacer'
				});

			$internalModal.find('.fpd-add-qr-code').click(function() {

				var text = $internalModal.find('.fpd-modal-context > input').val();

				if(text && text.length !== 0) {

					var $qrcodeWrapper = $internalModal.find('.fpd-qrcode-wrapper').empty(),
						qrcode = new QRCode($qrcodeWrapper.get(0), {
					    text: text,
					    width: 256,
					    height: 256,
					    colorDark : $colorPickers.filter('.fpd-qrcode-color-dark').spectrum('get').toHexString(),
					    colorLight : $colorPickers.filter('.fpd-qrcode-color-light').spectrum('get').toHexString(),
					    correctLevel : QRCode.CorrectLevel.H
					});

					$qrcodeWrapper.find('img').load(function() {

						fpdInstance.addElement(
							'image',
							this.src,
							'QR-Code - '+text,
							fpdInstance.currentViewInstance.options.qrCodeProps
						);

						$internalModal.find('.fpd-modal-close').click();

					});

				}

			});

			$internalModal.on('modalRemove', function() {
				$colorPickers.spectrum('destroy');
			});

		}
		else if(action === 'zoom') {

			if(!$this.hasClass('fpd-active')) {

				var $contextClone = $this.children('.fpd-action-context').clone();
				fpdInstance.$mainWrapper.append($contextClone);

				var startVal = fpdInstance.currentViewInstance.stage.getZoom() / fpdInstance.currentViewInstance.responsiveScale;

				$contextClone.find('.fpd-zoom-slider')
				.attr('step', fpdInstance.mainOptions.zoomStep).attr('max', fpdInstance.mainOptions.maxZoom)
				.val(startVal).rangeslider({
					polyfill: false,
					rangeClass: 'fpd-range-slider',
					disabledClass: 'fpd-range-slider--disabled',
					horizontalClass: 'fpd-range-slider--horizontal',
				    verticalClass: 'fpd-range-slider--vertical',
				    fillClass: 'fpd-range-slider__fill',
				    handleClass: 'fpd-range-slider__handle',
				    onSlide: function(pos, value) {
						fpdInstance.setZoom(value);
				    }
				});

				$contextClone.find('.fpd-stage-pan').click(function() {

					fpdInstance.currentViewInstance.dragStage = fpdInstance.currentViewInstance.dragStage ? false : true;
					$(this).toggleClass('fpd-enabled');
					fpdInstance.$productStage.toggleClass('fpd-drag');

				}).toggleClass('fpd-enabled', fpdInstance.currentViewInstance.dragStage);

			}
			else {
				fpdInstance.$mainWrapper.children('.fpd-action-context').remove();
			}

			$this.toggleClass('fpd-active');

/*
			if(!$this.hasClass('fpd-active')) {

				if($this.hasClass('tooltipstered')) {
					$this.tooltipster('destroy');
				}

				$this.tooltipster({
					trigger: 'click',
					position: 'bottom',
					content: $this.find('.fpd-tooltip-content'),
					theme: 'fpd-sub-tooltip-theme fpd-zoom-tooltip',
					touchDevices: false,
					interactive: true,
					//autoClose: false,
					functionReady: function(origin, tooltip) {

						var startVal = fpdInstance.currentViewInstance.stage.getZoom() / fpdInstance.currentViewInstance.responsiveScale;

						tooltip.find('.fpd-zoom-slider')
						.attr('step', fpdInstance.mainOptions.zoomStep).attr('max', fpdInstance.mainOptions.maxZoom)
						.val(startVal).rangeslider({
							polyfill: false,
							rangeClass: 'fpd-range-slider',
							disabledClass: 'fpd-range-slider--disabled',
							horizontalClass: 'fpd-range-slider--horizontal',
						    verticalClass: 'fpd-range-slider--vertical',
						    fillClass: 'fpd-range-slider__fill',
						    handleClass: 'fpd-range-slider__handle',
						    onSlide: function(pos, value) {
								fpdInstance.setZoom(value);
						    }
						});

						//check for maybe better solution
						tooltip.on('touchmove', function(evt){
							evt.preventDefault();
						});



					},
					functionAfter: function(origin) {

						origin.removeClass('fpd-active')
						.tooltipster('destroy');

						origin.attr('title', origin.data('defaulttext'))
						.tooltipster({
							offsetY: 0,
							position: 'bottom',
							theme: '.fpd-tooltip-theme',
							touchDevices: false,
						});

					}
				});

				$this.tooltipster('show');

			}

*/

		}
		else if(action === 'download') {

			var $internalModal = FPDUtil.showModal($this.children('.fpd-modal-context').clone(), false, '', fpdInstance.$modalContainer);

			$internalModal.find('.fpd-modal-context span[data-value]').click(function() {
				instance.downloadFile($(this).data('value'));
				$internalModal.find('.fpd-modal-close').click();
			});

		}
		else if(action === 'magnify-glass') {

			fpdInstance.resetZoom();

			if($this.hasClass('fpd-active')) {

				$(".fpd-zoom-image,.zoomContainer").remove();
				fpdInstance.$productStage.children('.fpd-view-stage').eq(fpdInstance.currentViewIndex).removeClass('fpd-hidden');

			}
			else {

				fpdInstance.toggleSpinner();

				var scaling = Number(2000 / fpdInstance.currentViewInstance.options.stageWidth).toFixed(2);
					dataURL = fpdInstance.currentViewInstance.stage.toDataURL({multiplier: scaling, format: 'png'});

				fpdInstance.$productStage.append('<img src="'+dataURL+'" class="fpd-zoom-image" />')
				.children('.fpd-zoom-image').elevateZoom({
					scrollZoom: true,
					borderSize: 1,
					zoomType: "lens",
					lensShape: "round",
					lensSize: 200,
					responsive: true,
					onZoomedImageLoaded: function($elem) {
						$('.zoomContainer').appendTo('.fpd-modal-product-designer .fpd-main-wrapper'); //set zoom container inside main wrapper in modal mode
						fpdInstance.toggleSpinner(false);
					}
				});


				fpdInstance.$productStage.children('.fpd-view-stage').addClass('fpd-hidden');

			}

			$this.toggleClass('fpd-active');

		}
		else if(action === 'ruler') {

			if($this.hasClass('fpd-active')) {

				var rulerHor = fpdInstance.currentViewInstance.getElementByID('_ruler_hor');
				if(rulerHor) {
					fpdInstance.currentViewInstance.stage.remove(rulerHor);
				}

				var rulerVer = fpdInstance.currentViewInstance.getElementByID('_ruler_ver');
				if(rulerVer) {
					fpdInstance.currentViewInstance.stage.remove(rulerVer);
				}

			}
			else {

				var pixelUnitsOptions = {
					fill: '#979797',
					fontSize: 10,
					fontFamily: 'Arial'
				};

				fabric.util.loadImage(FPDActions.rulerHorImg, function (img) {

					var groupRulerHor = new fabric.Group([], {
						left: 0,
						top: 0,
						originX: 'left',
						originY: 'top',
						evented: false,
						selectable: false,
						id: '_ruler_hor'
					});

					var rect = new fabric.Rect({
					    width: fpdInstance.currentViewInstance.options.stageWidth,
					    height: 30
					});

					rect.setPatternFill({
				        source: img,
				        repeat: 'repeat-x'
				    });

				    groupRulerHor.addWithUpdate(rect);

					var loopX = Math.ceil(fpdInstance.currentViewInstance.options.stageWidth / 100);
				    for(var i=1; i < loopX; ++i) {
					    var text = new fabric.Text(String(i*100), $.extend({}, pixelUnitsOptions, {top: 3, left: (i*100)+3}));
					    groupRulerHor.addWithUpdate(text);
					}

					fpdInstance.currentViewInstance.stage.add(groupRulerHor).renderAll();

				});

				fabric.util.loadImage(FPDActions.rulerVerImg, function (img) {

					var groupRulerVer = new fabric.Group([], {
						left: 0,
						top: 0,
						originX: 'left',
						originY: 'top',
						evented: false,
						selectable: false,
						id: '_ruler_ver'
					});

					var rect = new fabric.Rect({
					    width: 30,
					    height: fpdInstance.currentViewInstance.options.stageHeight
					});

					rect.setPatternFill({
				        source: img,
				        repeat: 'repeat-y'
				    });

				    groupRulerVer.addWithUpdate(rect);

					var loopX = Math.ceil(fpdInstance.currentViewInstance.options.stageWidth / 100);
				    for(var i=1; i < loopX; ++i) {
					    var text = new fabric.Text(String(i*100), $.extend({}, pixelUnitsOptions, {
						    top: (i*100)+3,
						    left: 12,
						    angle: 90,
						    originY: 'bottom'})
						);
					    groupRulerVer.addWithUpdate(text);
					}

					fpdInstance.currentViewInstance.stage.add(groupRulerVer).renderAll();

				});

			}

			$this.toggleClass('fpd-active');

		}
		else if(action === 'previous-view') {
			fpdInstance.selectView(fpdInstance.currentViewIndex - 1);
		}
		else if(action === 'next-view') {
			fpdInstance.selectView(fpdInstance.currentViewIndex + 1);
		}
		else if(action === 'guided-tour') {

			if(fpdInstance.mainOptions.guidedTour && Object.keys(fpdInstance.mainOptions.guidedTour).length > 0) {
				var firstKey = Object.keys(fpdInstance.mainOptions.guidedTour)[0];
				fpdInstance.selectGuidedTourStep(firstKey);
			}

		}

	};

	this.resetAllActions = function() {

		$(".fpd-zoom-image,.zoomContainer").remove();
		fpdInstance.$productStage.children('.fpd-view-stage').eq(fpdInstance.currentViewIndex).removeClass('fpd-hidden');

		fpdInstance.$mainWrapper.find('.fpd-action-btn').removeClass('fpd-active');

	};

	this.hideAllTooltips = function() {

		fpdInstance.$mainWrapper.find('.fpd-action-btn.tooltipstered').tooltipster('hide');

	};

	//add a saved product to the load dialog
	this.addSavedProduct = function(thumbnail, product, title) {

		title = title ? title : '';

		//create new list item
		var $gridWrapper = fpdInstance.mainBar.$content.find('.fpd-saved-designs-panel .fpd-grid'),
			htmlTitle = title !== '' ? 'title="'+title+'"' : '';

		$gridWrapper.append('<div class="fpd-item fpd-tooltip" '+htmlTitle+'><picture style="background-image: url('+thumbnail+')" ></picture><div class="fpd-remove-design"><span class="fpd-icon-remove"></span></div></div>')
		.children('.fpd-item:last').click(function(evt) {

			fpdInstance.loadProduct($(this).data('product'));
			fpdInstance.currentProductIndex = -1;

		}).data('product', product)
		.children('.fpd-remove-design').click(function(evt) {

			evt.stopPropagation();

			var $item = $(this).parent('.fpd-item'),
				index = $item.parent('.fpd-grid').children('.fpd-item').index($item.remove());

			if(fpdInstance.mainOptions.saveActionBrowserStorage) {

					var savedProducts = _getSavedProducts();
					savedProducts.splice(index, 1);

				window.localStorage.setItem(fpdInstance.$container.attr('id'), JSON.stringify(savedProducts));

			}

			fpdInstance.$container.trigger('actionLoad:Remove', [index, $item]);

		});

		FPDUtil.updateTooltip($gridWrapper);

	};

	_initialize();

};

FPDActions.availableActions = [
	'print',
	'reset-product',
	'undo',
	'redo',
	'info',
	'save',
	'load',
	'manage-layers',
	'snap',
	'qr-code',
	'zoom',
	'download',
	'magnify-glass',
	'preview-lightbox',
	'ruler',
	'previous-view',
	'next-view',
	'guided-tour'
];

FPDActions.rulerHorImg = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAAAeCAYAAADaW7vzAAAAAXNSR0IArs4c6QAAAMtJREFUaAXt0bENAkEMBVGgJVranja5lq4myH50wUr+wQRDZCHWWPPee+/fdV33yw+iwAdxhUekgCBJwRgEYTjkCkGSgjEIwnDIFYIkBWMQhOGQKwRJCsYgCMMhVwiSFIxBEIZDrhAkKRiDIAyHXCFIUjAGQRgOuUKQpGAMgjAccoUgScEYjkHWWt+Tk/3dc6XTLscgz3/jt+0CgrSLDvcJMgzYfi5Iu+hwnyDDgO3ngrSLDvcJMgzYfi5Iu+hwnyDDgO3ngrSLDvf9ARH1Efg/D4CQAAAAAElFTkSuQmCC';

FPDActions.rulerVerImg = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAABkCAYAAACRiYAFAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAABWWlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNS40LjAiPgogICA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgogICAgICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgICAgICAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyI+CiAgICAgICAgIDx0aWZmOk9yaWVudGF0aW9uPjE8L3RpZmY6T3JpZW50YXRpb24+CiAgICAgIDwvcmRmOkRlc2NyaXB0aW9uPgogICA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgpMwidZAAAA40lEQVRoBe2UwQ3CUBTD+KzUYXvpSHQmECzgIlk8CbnXRonqvGZt2/a4DTz3gcxPZME/Ix/q/0e99n1/Xv3M4zjOq1rSrZaLEFnv+48tkugTakRkCVouiyT6dNWIyBKE2iKJPmOoWy7sxhKMdVywVSH6hBoRWYKWyyKJPl01IrIEobZIos8Y6pYLu7EEYx0XbFWIPqFGRJag5bJIok9XjYgsQagtkugzhrrlwm4swVjHBVsVok+oEZElaLkskujTVSMiSxBqiyT6jKFuubAbSzDWccFWhegTakRkCb5aLiv07fMCuAVB+Jp9DBgAAAAASUVORK5CYII=';


var FPDImageEditor = function($container, targetElement, fpdInstance) {

	'use strict';

	var options = fpdInstance.mainOptions.imageEditorSettings;

	var borderColor = '#2ecc71',
		instance = this,
		canvasWidth = 0,
		canvasHeight = 0,
		$canvasContainer = $container.children('.fpd-image-editor-main'),
		fabricCanvas,
		customMaskEnabled = false,
		clippingObject = null,
		fabricImage,
		fabricMaskOptions = {
			opacity: 0.3,
	        cornerColor: borderColor,
	        borderColor: borderColor,
	        borderScaleFactor: 3,
	        borderDashArray: [5,5],
	        hasRotatingPoint: true,
	        centeredScaling: true,
	        objectCaching: false,
	        __editorMode: true,
	        __imageEditor: true
		};

	var _initialize = function() {

		targetElement.originSource = targetElement.originSource ? targetElement.originSource : targetElement.source;

		instance.responsiveScale = 1;

		$container.addClass('fpd-container')

		$canvasContainer.append('<canvas>');

		var canvasOptions = {
			containerClass: 'fpd-image-editor-canvas-wrapper',
			selection: false,
			hoverCursor: 'pointer',
			controlsAboveOverlay: true,
			centeredScaling: true,
			allowTouchScrolling: true,
			preserveObjectStacking: true,
			enableRetinaScaling: false
		};

		fabricCanvas = new fabric.Canvas($canvasContainer.children('canvas:last').get(0), canvasOptions);

		var startCoords = {},
			drawClipping = false;

		fabricCanvas.on({
			'mouse:down': function(opts) {

				if(!clippingObject && customMaskEnabled) {

					drawClipping = true;

					var mouse = fabricCanvas.getPointer(opts.e);

					startCoords.x = mouse.x;
					startCoords.y = mouse.y;

					clippingObject = new fabric.Rect($.extend({}, {
				        width: 0,
				        height: 0,
				        left: mouse.x / instance.responsiveScale,
				        top: mouse.y / instance.responsiveScale,
				        fill: '#000'
				    }, fabricMaskOptions));

				     _resizeCanvas();

				    fabricCanvas.add(clippingObject);
				    fabricCanvas.renderAll();
				    fabricCanvas.setActiveObject(clippingObject);

				}

			},
			'mouse:move': function(opts) {

				if(drawClipping) {

					var mouse = fabricCanvas.getPointer(opts.e),
						w = Math.abs(mouse.x - startCoords.x),
				    	h = Math.abs(mouse.y - startCoords.y);

				    if (!w || !h) {
				        return false;
				    }

				    clippingObject.setOptions({
						width: w / instance.responsiveScale,
						height: h / instance.responsiveScale
					});

					clippingObject.setCoords();
				    fabricCanvas.renderAll();

				}

			},
			'mouse:up': function(opts) {

				drawClipping = false;
			},
		});

		//main menu
		$container.on('click', '.fpd-image-editor-menu > span', function() {

			var $this = $(this),
				id = $this.data('id');

			$this.addClass('fpd-active').siblings().removeClass('fpd-active');
			$container.find('.fpd-tab-content > div').removeClass('fpd-active')
			.filter('[data-id="'+id+'"]').addClass('fpd-active');

		});


		//--- MASK

		if(options.masks && $.isArray(options.masks)) {

			options.masks.forEach(function(svgURL) {

				var title = svgURL.split(/[\\/]/).pop(); //get basename
				title = title.substr(0,title.lastIndexOf('.')); //remove extension

				$container.find('.fpd-mask-selection').append('<span data-mask="'+svgURL+'" class="fpd-tooltip" title="'+title+'" style="background-image: url('+svgURL+')"></span>')
			});

		}

		//mask gets selected
		$container.on('click', '.fpd-mask-selection > span', function() {

			if(!fabricImage) {
				return false;
			}

			var $this = $(this),
				mask = $this.data('mask');

			fabricCanvas.discardActiveObject();
			fabricImage.evented = false;

			fabricCanvas.clipTo = null;
			clippingObject = null;

			if(mask === 'custom-rect') {
				customMaskEnabled = true;
			}
			else {

				fabric.loadSVGFromURL(mask, function(objects, options) {

					//if objects is null, svg is loaded from external server with cors disabled
					var svgGroup = objects ? fabric.util.groupSVGElements(objects, options) : null;

					fabricCanvas.add(svgGroup);

					svgGroup.setOptions($.extend({}, fabricMaskOptions, {opacity: 1, fill: "rgba(0,0,0,0)"}));
					if(fabricCanvas.width > fabricCanvas.height) {
						svgGroup.scaleToHeight((fabricCanvas.height - 80) / instance.responsiveScale);
					}
					else {
						svgGroup.scaleToWidth((fabricCanvas.width - 80) / instance.responsiveScale);
					}

					if(fabric.version === '1.6.7') { //Fabric 1.6.7
						svgGroup.getObjects()[0].set('stroke', borderColor).set('strokeWidth', 3 / svgGroup.scaleX);
					}
					else {
						svgGroup.set('stroke', borderColor).set('strokeWidth', 3 / svgGroup.scaleX);
					}

					clippingObject = svgGroup;
					_resizeCanvas();

					svgGroup.left = 0;
					svgGroup.top = 0;
					svgGroup.setPositionByOrigin(new fabric.Point(canvasWidth * 0.5, canvasHeight * 0.5), 'center', 'center');

					svgGroup.setCoords();
					fabricCanvas.renderAll();

				});

			}

			fabricCanvas.renderAll();
			$container.find('.fpd-content-mask').addClass('fpd-show-secondary');



		});

		//mask: cancel, save
		$container.on('click', '.fpd-mask-cancel, .fpd-mask-save', function() {

			if(!fabricImage) {
				return false;
			}

			fabricImage.evented = true;
			customMaskEnabled = false;

			fabricCanvas.discardActiveObject();

			if(clippingObject) {

				if($(this).hasClass('fpd-mask-save')) {

					_resizeCanvas();

					clippingObject.set('strokeWidth', 0);
					clippingObject.set('fill', 'transparent');
					fabricCanvas.clipTo = function(ctx) {
					  clippingObject.render(ctx);
					};

				}

				fabricCanvas.remove(clippingObject);

			}

			$container.find('.fpd-content-mask').removeClass('fpd-show-secondary');

		});


		//--- FILTERS

		var availableFilters = [
			'none',
			'grayscale',
			'sepia',
			'cold',
			'black_white',
			'old',
			'milk',
			'purple',
			'yellow',
			'monochrome'
		];

		//fabric 1.6.7
		if(fabric.version === '1.6.7') {
			availableFilters = availableFilters.concat(['sepia2', 'technicolor', 'kodachrome', 'vintage']);
		}

		availableFilters.forEach(function(filterName) {

			$container.find('.fpd-content-filters').append('<div data-type="'+filterName+'" style="background-image: url('+FPDFilters[filterName].preview+')" data-defaulttext="'+FPDFilters[filterName].name+'" title="image_editor.filter_'+filterName+'" class="fpd-tooltip"></div>');

		});

		$container.find('.fpd-content-filters [data-defaulttext]').each(function(index, filterElement) {

			fpdInstance.translateElement($(filterElement));

		});

		$container.on('click', '.fpd-content-filters > div', function() {

			if(!fabricImage) {
				return false;
			}

			var removeFilters = [
				'Grayscale',
				'Sepia',
				'Sepia2',
				'ColorMatrix'
			];

			//only one filter is allowed from filters tab
			fabricImage.filters = fabricImage.filters.filter(function(filterItem) {
				return filterItem && removeFilters.indexOf(filterItem.type) === -1;
			});

			fabricImage.filters.push(FPDUtil.getFilter($(this).data('type')));
			_applyFilterRender();

		});


		//--- COLOR MANIPULATION

		$container.on('click', '.fpd-switch-container', function() {

			if(!fabricImage) {
				return false;
			}

			var $this = $(this),
				filterType = $this.data('filter');

			$this.toggleClass('fpd-enabled');
			$this.nextAll('.fpd-range-tooltip:first').toggleClass('fpd-enabled', $this.hasClass('fpd-enabled'));

			if($this.hasClass('fpd-enabled')) {

				//initial values
				var valueObj = {};
				$this.parent().find('.fpd-input-range').each(function(i, input) {
					valueObj[input.name] = parseFloat(input.value);
				});

				_applyFilterValue(filterType, valueObj);

			}
			else {
				_removeFilter(filterType);
			}

		});

		var tooltipTimer = null;
		$container.on('input change', '.fpd-input-range', function() {

			if(!fabricImage) {
				return false;
			}

			var $this = $(this),
				$switchContainer = $this.parent('.fpd-range-tooltip').siblings('.fpd-switch-container:first'),
				filterType = $switchContainer.data('filter'),
				min = parseFloat(this.min),
				max = parseFloat(this.max),
				value = parseFloat(this.value),
				pos = (this.value - min) / (max - min);

			$switchContainer.parent().siblings('.fpd-left').find('.fpd-range-tooltip').removeClass('fpd-moving');

			$this.parent('.fpd-range-tooltip').addClass('fpd-moving')
			.children('.fpd-tooltip').text(value.toFixed(2))
			.css('left', String(pos * 100) + '%');

			var valueObj = {};

			if(fabric.version === '1.6.7') { //fabric 1.6.7
				value *= 255;
			}
			else {
				valueObj['color'] = '#fff';
			}

			valueObj[$this.attr('name')] = value;

			_applyFilterValue(filterType, valueObj);

			//hide tooltip after 2 secs
			if(tooltipTimer) {
				clearTimeout(tooltipTimer);
				tooltipTimer = null;
			}

			tooltipTimer = setTimeout(function() {
				$this.parent('.fpd-range-tooltip').removeClass('fpd-moving');
				clearTimeout(tooltipTimer);
				tooltipTimer = null;
			}, 2000);

		});

		//--- ACTIONS

		$container.on('click', '.fpd-action-restore', function() {

			if(!fabricImage) {
				return false;
			}

			fabricImage.source = targetElement.originSource;
			fabricImage.setSrc(targetElement.originSource, function() {

				fabricImage.setCoords();
				fabricCanvas.renderAll();

			});

			instance.reset();

		});

		$container.on('click', '.fpd-action-save', function() {

			var dataURL = instance.getImage();

			if(targetElement.type !== 'image') {

				var elemJSON = fpdInstance.currentViewInstance.getElementJSON(targetElement);
				delete elemJSON['fill'];

				fpdInstance.currentViewInstance.removeElement(targetElement.title, targetElement);
				fpdInstance.currentViewInstance.addElement('image', dataURL, targetElement.title, elemJSON);

			}
			else {

				targetElement.source = dataURL;
				targetElement.setSrc(dataURL, function() {

					targetElement.setCoords();
					targetElement.canvas.renderAll();

				});

			}

			$container.parent().siblings('.fpd-modal-close').click();

		});

		FPDUtil.updateTooltip($container);

	};

	var _removeFilter = function(type) {

		fabricImage.filters = fabricImage.filters.filter(function(filterItem) {
			return filterItem.type !== type;
		});

		_applyFilterRender();

	};

	var _applyFilterValue = function(type, valueObj) {

		valueObj = valueObj === undefined ? {} : valueObj;

		var filterExist = fabricImage.filters.filter(function(filterItem) {

			if(filterItem && filterItem.type === 'RemoveColor') {
				filterItem.type = 'RemoveWhite'
			}

			return filterItem.type === type;
		});

		if(filterExist.length > 0) {
			$.extend(filterExist[0], valueObj);
		}
		else {
			var filter = FPDUtil.getFilter(type, valueObj);
			fabricImage.filters.push(filter);
		}

		_applyFilterRender();

	};

	var _resizeCanvas = function () {

		var $canvasWrapper = $container.children('.fpd-image-editor-main');

		instance.responsiveScale = $canvasWrapper.outerWidth() < canvasWidth ? $canvasWrapper.outerWidth() / canvasWidth : 1;
		instance.responsiveScale = parseFloat(Number(instance.responsiveScale.toFixed(7)));
		instance.responsiveScale = instance.responsiveScale > 1 ? 1 : instance.responsiveScale;

		if(clippingObject) {
			clippingObject.left = clippingObject.left * instance.responsiveScale;
			clippingObject.top = clippingObject.top * instance.responsiveScale;
			clippingObject.scaleX = clippingObject.scaleX * instance.responsiveScale;
			clippingObject.scaleY = clippingObject.scaleY * instance.responsiveScale;
			clippingObject.setCoords();
		}

		fabricCanvas
		.setDimensions({
			width: $canvasWrapper.width(),
			height: canvasHeight * instance.responsiveScale
		})
		.setZoom(instance.responsiveScale)
		.calcOffset()
		.renderAll();

	};

	var _applyFilterRender = function() {

		if(fabric.version === '1.6.7') { //Fabric 1.6.7
			fabricImage.applyFilters(function() {
				fabricCanvas.renderAll();
			});
		}
		else {
			fabricImage.applyFilters();
			fabricCanvas.renderAll();
		}

	};

	this.loadImage = function(imageURL) {

		this.reset();

		new fabric.Image.fromURL(imageURL, function(fabricImg) {

			fabricImage = fabricImg;
			canvasWidth = fabricImg.width;
			canvasHeight = fabricImg.height;

			fabricImage.setOptions({
		        cornerColor: borderColor,
				borderColor: borderColor,
		        __editorMode: true,
		        __imageEditor: true
			});

			fabricCanvas.setDimensions({
				width: canvasWidth,
				height: canvasHeight,
			});

			fabricCanvas.add(fabricImg);

			_resizeCanvas();

		});

	};

	this.getImage = function() {

		fabricCanvas.setDimensions({width: canvasWidth, height: canvasHeight}).setZoom(1);

		if(clippingObject) {
			clippingObject.left = clippingObject.left / instance.responsiveScale;
			clippingObject.top = clippingObject.top / instance.responsiveScale;
			clippingObject.scaleX = clippingObject.scaleX / instance.responsiveScale;
			clippingObject.scaleY = clippingObject.scaleY / instance.responsiveScale;
			clippingObject.setCoords();
		}

		fabricCanvas.renderAll();

		var dataURL = fabricCanvas.toDataURL({});

		_resizeCanvas();

		return dataURL;

	};

	this.reset = function() {

		$container.find('.fpd-switch-container').removeClass('fpd-enabled');

		fabricCanvas.clipTo = null;
		clippingObject = null;
		fabricCanvas.discardActiveObject();

		if(fabricImage) {
			fabricImage.setOptions({
				scaleX: 1,
				scaleY: 1,
				angle: 0,
				left: 0,
				top: 0
			})
			fabricImage.filters = [];

			_applyFilterRender();
		}

	};

	_initialize();

};

var FPDDesignsModule = function(fpdInstance, $module) {

	var instance = this,
		searchInLabel = '',
		$head = $module.find('.fpd-head'),
		$scrollArea = $module.find('.fpd-scroll-area'),
		$designsGrid = $module.find('.fpd-grid'),
		lazyClass = fpdInstance.mainOptions.lazyLoad ? 'fpd-hidden' : '',
		currentCategories = null,
		categoriesUsed = false,
		categoryLevelIndexes = [];

	var _initialize = function() {

		searchInLabel = fpdInstance.getTranslation('modules', 'designs_search_in').toUpperCase();

		$head.find('.fpd-input-search input').keyup(function() {

			if(this.value == '') { //no input, display all
				$designsGrid.children('.fpd-item').css('display', 'block');
			}
			else {
				//hide all items
				$designsGrid.children('.fpd-item').css('display', 'none');

				//only show by input value
			    var searchq = this.value.toLowerCase().trim().split(" ");

			    $designsGrid.children('.fpd-item').filter(function(){

			     	var fullsearchc = 0,
			     		self = this;

				 	$.each( searchq, function( index, value ){
					 	fullsearchc += $(self).is("[data-search*='"+value+"']");
					});

					if(fullsearchc==searchq.length) {return 1;}

			    }).css('display', 'block');
			}

		});

		$head.find('.fpd-back').click(function() {

			if($designsGrid.children('.fpd-category').length > 0) {
				categoryLevelIndexes.pop(); //remove last level index
			}

			//loop through design categories to receive parent category
			var displayCategories = fpdInstance.designs,
				parentCategory;

			categoryLevelIndexes.forEach(function(levelIndex) {

				parentCategory = displayCategories[levelIndex];
				displayCategories = parentCategory.category;

			});

			currentCategories = displayCategories;

			if(displayCategories) { //display first level categories
				_displayCategories(currentCategories, parentCategory);
			}

			//only toggle categories for top level
			if(parentCategory === undefined) {
				instance.toggleCategories();
			}

		});

		//when adding a product after products are set with productsSetup()
		fpdInstance.$container.on('designsSet', function(evt, designs) {

			if(!$.isArray(designs) || designs.length === 0) {
				return;
			}

			if(designs[0].hasOwnProperty('source')) { //check if first object is a design image

				$module.addClass('fpd-single-cat');
				_displayDesigns(designs);

			}
			else {

				if(designs.length > 1) { //display categories
					categoriesUsed = true;
					instance.toggleCategories();
				}
				else if(designs.length === 1 && designs[0].designs) { //display designs in category, if only one category exists
					$module.addClass('fpd-single-cat');
					_displayDesigns(designs[0].designs);
				}


			}

		});

	};

	var _displayCategories = function(categories, parentCategory) {

		$scrollArea.find('.fpd-grid').empty();
		$head.find('.fpd-input-search input').val('');
		$module.removeClass('fpd-designs-active').addClass('fpd-categories-active');

		categories.forEach(function(category, i) {
			_addDesignCategory(category);
		});

		//set category title
		if(parentCategory) {
			$head.find('.fpd-input-search input').attr('placeholder', searchInLabel + ' ' + parentCategory.title.toUpperCase());
		}

		FPDUtil.refreshLazyLoad($designsGrid, false);
		FPDUtil.createScrollbar($scrollArea);

	};

	var _addDesignCategory = function(category) {

		var thumbnailHTML = category.thumbnail ? '<picture data-img="'+category.thumbnail+'"></picture>' : '',
			itemClass = category.thumbnail ? lazyClass : lazyClass+' fpd-title-centered',
			$lastItem = $('<div/>', {
							'class': 'fpd-category fpd-item '+lazyClass,
							'data-search': category.title.toLowerCase(),
							'html': thumbnailHTML+'<span>'+category.title+'</span>'
						}).appendTo($designsGrid);

		$lastItem.click(function(evt) {

			var $this = $(this),
				index = $this.parent().children('.fpd-item').index($this),
				selectedCategory = currentCategories[index];

			if(selectedCategory.category) {

				categoryLevelIndexes.push(index);
				currentCategories = selectedCategory.category;
				_displayCategories(currentCategories, selectedCategory);

			}
			else {

				_displayDesigns(selectedCategory.designs, selectedCategory.parameters);
			}

			$module.addClass('fpd-head-visible');
			$head.find('.fpd-input-search input').attr('placeholder', searchInLabel + ' ' +$this.children('span').text().toUpperCase());

		});

		if(lazyClass === '' && category.thumbnail) {
			FPDUtil.loadGridImage($lastItem.children('picture'), category.thumbnail);
		}

	};

	var _displayDesigns = function(designObjects, categoryParameters) {

		$scrollArea.find('.fpd-grid').empty();
		$head.find('.fpd-input-search input').val('');
		$module.removeClass('fpd-categories-active').addClass('fpd-designs-active');

		var categoryParameters = categoryParameters ? categoryParameters : {};

		designObjects.forEach(function(designObject) {

			designObject.parameters = $.extend({}, categoryParameters, designObject.parameters);
			_addGridDesign(designObject);

		});

		FPDUtil.refreshLazyLoad($designsGrid, false);
		FPDUtil.createScrollbar($scrollArea);
		FPDUtil.updateTooltip();

	};

	//adds a new design to the designs grid
	var _addGridDesign = function(design) {

		design.thumbnail = design.thumbnail === undefined ? design.source : design.thumbnail;

		var $lastItem = $('<div/>', {
							'class': 'fpd-item '+lazyClass,
							'data-title': design.title,
							'data-source': design.source,
							'data-search': design.title.toLowerCase(),
							'html': '<picture data-img="'+design.thumbnail+'"></picture>'
						}).appendTo($designsGrid);

		$lastItem.click(function(evt) {

			var $this = $(this),
				designParams = $this.data('parameters'),
				currentImageParameters = fpdInstance.currentViewInstance.options.imageParameters,
				params = $.extend({}, currentImageParameters, designParams),
				source = $this.data('source'),
				scaleX = designParams.scaleX || 1,
				scaleY = designParams.scaleY || 1;

			var image = new Image();

			image.onload = function() {

				var imageW = this.width,
					imageH = this.height;

				if(params.resizeToW || params.resizeToH) {

					scaleX = scaleY = FPDUtil.getScalingByDimesions(
						imageW,
						imageH,
						params.resizeToW,
						params.resizeToH,
						params.scaleMode
					);

				}

				if(fpdInstance.mainOptions.fitImagesInCanvas) {

					var iconTolerance = fpdInstance.mainOptions.elementParameters.cornerSize;

					if((imageW * scaleX) + iconTolerance > fpdInstance.currentViewInstance.options.stageWidth
						|| (imageH * scaleY) + iconTolerance > fpdInstance.currentViewInstance.options.stageHeight) {

						scaleX = scaleY = FPDUtil.getScalingByDimesions(
							imageW,
							imageH,
							fpdInstance.currentViewInstance.options.stageWidth - iconTolerance,
							fpdInstance.currentViewInstance.options.stageHeight - iconTolerance
						);

					}
				}

				designParams.isCustom = true;
				designParams.scaleX = scaleX;
				designParams.scaleY = scaleY;

				fpdInstance.addElement('image', source, $this.data('title'), designParams);

			};
			image.src = source;

			if(fpdInstance.productCreated && fpdInstance.mainOptions.hideDialogOnAdd && fpdInstance.$container.hasClass('fpd-topbar') && fpdInstance.mainBar) {

				fpdInstance.mainBar.toggleDialog(false);

			}

		}).data('parameters', design.parameters);

		if(lazyClass === '') {
			FPDUtil.loadGridImage($lastItem.children('picture'), design.thumbnail);
		}

	};

	this.toggleCategories = function() {

		if(!categoriesUsed) {
			return;
		}

		//reset to default view(head hidden, top-level cats are displaying)
		$module.removeClass('fpd-head-visible');

		currentCategories = fpdInstance.designs;
		_displayCategories(currentCategories);

		var catTitles = []; //stores category titles that are only visible for UZ or view
		//element (upload zone) has design categories
		if(fpdInstance.currentViewInstance) {

			var element = fpdInstance.currentViewInstance.currentElement;
			if(element && element.uploadZone && element.designCategories) {
				catTitles = fpdInstance.currentViewInstance.currentElement.designCategories;
			}
			else {
				catTitles = fpdInstance.currentViewInstance.options.designCategories;
			}

		}

		//check for particular design categories
		var $allCats = $designsGrid.find('.fpd-category');
		if(catTitles.length > 0) {

			var $visibleCats = $allCats.hide().filter(function() {
				var title = $(this).children('span').text();
				return $.inArray(title, catTitles) > -1;
			}).show();

			if($visibleCats.length === 1) {
				$visibleCats.first().click();
				$module.removeClass('fpd-head-visible');
			}

		}
		else {
			$allCats.show();
		}

	};

	_initialize();

};

var FPDProductsModule = function(fpdInstance, $module) {

	var instance = this,
		currentCategoryIndex = 0,
		$categoriesDropdown = $module.find('.fpd-product-categories'),
		$scrollArea = $module.children('.fpd-scroll-area'),
		$gridWrapper = $module.find('.fpd-grid'),
		lazyClass = fpdInstance.mainOptions.lazyLoad ? 'fpd-hidden' : '';

	var _initialize = function() {

		_checkProductsLength();

		$categoriesDropdown.children('input').keyup(function() {

			var $categoryItems = $categoriesDropdown.find('.fpd-dropdown-list .fpd-item');
			$categoryItems.hide();

			if(this.value.length === 0) {
				$categoryItems.show();
			}
			else {
				$categoryItems.filter(':containsCaseInsensitive("'+this.value+'")').show();
			}

		});

		$categoriesDropdown.on('click', '.fpd-dropdown-list .fpd-item', function() {

			var $this = $(this);

			currentCategoryIndex = $this.data('value');

			$this.parent().prevAll('.fpd-dropdown-current:first').val($this.text());
			instance.selectCategory(currentCategoryIndex);

			$this.siblings('.fpd-item').show();

			FPDUtil.refreshLazyLoad($gridWrapper, false);

		});

		fpdInstance.$container.on('productsSet', function(evt, products) {

			$categoriesDropdown.find('.fpd-dropdown-list .fpd-item').remove();
			$gridWrapper.empty();

			if(products && products.length > 0) {

				if(products[0].category !== undefined && products.length > 1) { //categories are used

					$module.addClass('fpd-categories-enabled');

					products.forEach(function(categoryItem, i) {
						$categoriesDropdown.find('.fpd-dropdown-list > .fpd-scroll-area')
						.append('<span class="fpd-item" data-value="'+i+'">'+categoryItem.category+'</span>');
					});

				}

				_checkProductsLength();

				instance.selectCategory(0);
			}

			FPDUtil.createScrollbar($categoriesDropdown.find('.fpd-dropdown-list .fpd-scroll-area'));

		});

		//when adding a product after products are set with productsSetup()
		fpdInstance.$container.on('productAdd', function(evt, views, category, catIndex) {

			if(catIndex == currentCategoryIndex) {
				_addGridProduct(views);
			}

		});

	};

	//adds a new product to the products grid
	var _addGridProduct = function(views) {

		var thumbnail = views[0].productThumbnail ? views[0].productThumbnail : views[0].thumbnail,
			productTitle = views[0].productTitle ? views[0].productTitle : views[0].title;

		var $lastItem = $('<div/>', {
							'class': 'fpd-item fpd-tooltip '+lazyClass,
							'data-title': productTitle,
							'data-source': thumbnail,
							'html': '<picture data-img="'+thumbnail+'"></picture>'
						}).appendTo($gridWrapper);

		$lastItem.click(function(evt) {

			evt.preventDefault();

			var $this = $(this),
				index = $gridWrapper.children('.fpd-item').index($this);

			fpdInstance.selectProduct(index, currentCategoryIndex);

		}).data('views', views);

		if(lazyClass === '') {
			FPDUtil.loadGridImage($lastItem.children('picture'), thumbnail);
		}
		else {
			FPDUtil.refreshLazyLoad($gridWrapper, false);
		}

		FPDUtil.updateTooltip($gridWrapper);

	};

	var _checkProductsLength = function() {

		if(fpdInstance.mainOptions.editorMode) { return; }

		var firstProductItem = fpdInstance.products[0],
			hideProductsModule = firstProductItem === undefined; //hide if no products exists at all

		if(firstProductItem !== undefined) { //at least one product exists

			if((!firstProductItem.hasOwnProperty('category') && fpdInstance.products.length < 2) //no categories are used
				|| (firstProductItem.hasOwnProperty('category') && firstProductItem.products.length < 2 && fpdInstance.products.length < 2)) //categories are used
			{
				hideProductsModule = true;
			}
			else {
				hideProductsModule = false;
			}

		}

		fpdInstance.$container.toggleClass('fpd-products-module-hidden', hideProductsModule);

	};

	this.selectCategory = function(index) {

		$scrollArea.find('.fpd-grid').empty();

		if(fpdInstance.products && fpdInstance.products.length > 0) {

			var productsObj;
			if(fpdInstance.products[0].category !== undefined) { //categories are used
				productsObj = fpdInstance.products[index].products;
				$categoriesDropdown.children('input').val(fpdInstance.products[index].category);
			}
			else {
				productsObj = fpdInstance.products;
			}

			productsObj.forEach(function(productItem) {
				_addGridProduct(productItem);
			});

			FPDUtil.createScrollbar($scrollArea);

		}

	};

	_initialize();

};

var FPDTextModule = function(fpdInstance, $module) {

	var currentViewOptions;

	var _initialize = function() {

		fpdInstance.$container.on('viewSelect', function(evt, index, viewInstance) {

			currentViewOptions = viewInstance.options;

			if(currentViewOptions.customTextParameters && currentViewOptions.customTextParameters.price) {
				var price = fpdInstance.formatPrice(currentViewOptions.customTextParameters.price);
				$module.find('.fpd-btn > .fpd-price').html(' - '+price);
			}
			else {
				$module.find('.fpd-btn > .fpd-price').html('');
			}

		});

		$module.on('click', '.fpd-btn', function() {

			var $input = $(this).prevAll('textarea:first'),
				text = $input.val();

			if(text && text.length > 0) {

				var textParams = $.extend({}, currentViewOptions.customTextParameters, {isCustom: true});
				fpdInstance.addElement(
					'text',
					text,
					text,
					textParams
				);
			}

			$input.val('');

		});

		$module.on('keyup', 'textarea', function() {

			var text = this.value,
				maxLength = currentViewOptions ? currentViewOptions.customTextParameters.maxLength : 0,
				maxLines = currentViewOptions ? currentViewOptions.customTextParameters.maxLines : 0;

			//remove emojis
			if(fpdInstance.mainOptions.disableTextEmojis) {
				text = text.replace(FPDEmojisRegex, '');
				text = text.replace(String.fromCharCode(65039), ""); //fix: some emojis left a symbol with char code 65039
			}

			if(maxLength != 0 && text.length > maxLength) {
				text = text.substr(0, maxLength);
			}

			if(maxLines != 0 && text.split("\n").length > maxLines) {
				text = text.replace(/([\s\S]*)\n/, "$1");
			}

			this.value = text;

		});

	};

	_initialize();

};

var FPDLayersModule = {

	createList : function(fpdInstance, $container) {

		var $currentColorList,
			colorDragging = false;

		$container.off();

		//append a list item to the layers list
		var _appendLayerItem = function(element) {

			var colorHtml = '<span></span>';
			if(FPDUtil.elementHasColorSelection(element)) {

				var availableColors = FPDUtil.elementAvailableColors(element, fpdInstance);
				var currentColor = '';
				if(element.uploadZone) {
					colorHtml = '<span></span>';
				}
				else if(element.type == FPDPathGroupName && element.getObjects().length > 1) {
					currentColor = availableColors[0];
					colorHtml = '<span class="fpd-current-color" style="background: '+currentColor+'"></span>';
				}
				else if(availableColors != 1 && (availableColors.length > 1 || (element.type == FPDPathGroupName && element.getObjects().length === 1))) {
					currentColor = element.fill ? element.fill : availableColors[0];
					colorHtml = '<span class="fpd-current-color" style="background: '+currentColor+'" data-colors=""></span>';
				}
				else {
					currentColor = element.fill ? element.fill : availableColors[0];
					colorHtml = '<input class="fpd-current-color" type="text" value="'+currentColor+'" />'
				}

			}

			var sourceContent = element.title;
			if(FPDUtil.getType(element.type) === 'text' && element.editable) {

				sourceContent = '<textarea>'+element.text+'</textarea>';

			}

			$container.find('.fpd-list').append('<div class="fpd-list-row" id="'+element.id+'"><div class="fpd-cell-0">'+colorHtml+'</div><div class="fpd-cell-1">'+sourceContent+'</div><div class="fpd-cell-2"></div></div>');

			var $lastItem = $container.find('.fpd-list-row:last')
				.data('element', element)
				.data('colors', availableColors);

			if(element.uploadZone) {
				$lastItem.addClass('fpd-add-layer')
				.find('.fpd-cell-2').append('<span><span class="fpd-icon-add"></span></span>');
			}
			else {

				var lockIcon = element.locked ? 'fpd-icon-locked-full' : 'fpd-icon-unlocked',
					reorderHtml = element.zChangeable ? '<span class="fpd-icon-reorder"></span>' : '';

				$lastItem.find('.fpd-cell-2').append(reorderHtml+'<span class="fpd-lock-element"><span class="'+lockIcon+'"></span></span>');

				if(element.removable) {
					$lastItem.find('.fpd-lock-element').after('<span class="fpd-remove-element"><span class="fpd-icon-remove"></span></span>');
				}

				$lastItem.toggleClass('fpd-locked', element.locked);

			}

		};

		//destroy all color pickers and empty list
		$container.find('.fpd-current-color').spectrum('destroy');
		$container.find('.fpd-list').empty();

		fpdInstance.getElements(fpdInstance.currentViewIndex).forEach(function(element) {

			if(FPDUtil.elementIsEditable(element)) {
				_appendLayerItem(element);
			}

		});

		FPDUtil.createScrollbar($container.find('.fpd-scroll-area'));

		//sortable layers list
		var sortDir = 0;
		$container.find('.fpd-list').sortable({
			handle: '.fpd-icon-reorder',
			placeholder: 'fpd-list-row fpd-sortable-placeholder',
			scroll: false,
			axis: 'y',
			containment: 'parent',
			items: '.fpd-list-row:not(.fpd-locked)',
			start: function(evt, ui) {
				sortDir = ui.originalPosition.top;
			},
			change: function(evt, ui) {

				var targetElement = fpdInstance.getElementByID(ui.item.attr('id')),
					relatedItem;

				if(ui.position.top > sortDir) { //down
					relatedItem = ui.placeholder.prevAll(".fpd-list-row:not(.ui-sortable-helper)").first();
				}
				else { //up
					relatedItem = ui.placeholder.nextAll(".fpd-list-row:not(.ui-sortable-helper)").first();
				}

				var fabricElem = fpdInstance.currentViewInstance.getElementByID(relatedItem.attr('id')),
					index = fpdInstance.currentViewInstance.getZIndex(fabricElem);

				fpdInstance.setElementParameters({z: index}, targetElement);

				sortDir = ui.position.top;

			}
		});

		$container.find('input.fpd-current-color').spectrum('destroy').spectrum({
			flat: false,
			preferredFormat: "hex",
			showInput: true,
			showInitial: true,
			showPalette: fpdInstance.mainOptions.colorPickerPalette && fpdInstance.mainOptions.colorPickerPalette.length > 0,
			palette: fpdInstance.mainOptions.colorPickerPalette,
			showButtons: false,
			show: function(color) {

				FPDUtil.spectrumColorNames($(this).spectrum('container'), fpdInstance);

				var element = $(this).parents('.fpd-list-row:first').data('element');
				element._tempFill = color.toHexString();

			},
			move: function(color) {

				var element = $(this).parents('.fpd-list-row:first').data('element');
				//only non-png images are chaning while dragging
				if(colorDragging === false || FPDUtil.elementIsColorizable(element) !== 'png') {
					fpdInstance.currentViewInstance.changeColor(element, color.toHexString());
				}

			},
			change: function(color) {

				$(document).unbind("click.spectrum"); //fix, otherwise change is fired on every click
				var element = $(this).parents('.fpd-list-row:first').data('element');
				fpdInstance.currentViewInstance.setElementParameters({fill: color.toHexString()}, element);

			}
		})
		.on('beforeShow.spectrum', function(e, tinycolor) {
			if($currentColorList) {
				$currentColorList.remove();
				$currentColorList = null;
			}
		})
		.on('dragstart.spectrum', function() {
			colorDragging = true;
		})
		.on('dragstop.spectrum', function(evt, color) {
			colorDragging = false;
			var element = $(this).parents('.fpd-list-row:first').data('element');
			fpdInstance.currentViewInstance.changeColor(element, color.toHexString());
		});

		$container.off('click', '.fpd-current-color') //unregister click, otherwise triggers multi-times when changing view
		.on('click', '.fpd-current-color', function(evt) { //open sub

			evt.stopPropagation();

			$container.find('.fpd-path-colorpicker').spectrum('destroy');
			$container.find('input.fpd-current-color').spectrum('hide');

			var $listItem = $(this).parents('.fpd-list-row'),
				element = $listItem.data('element'),
				availableColors = $listItem.data('colors');

			//clicked on opened sub colors, just close it
			if($currentColorList && $listItem.children('.fpd-scroll-area').length > 0) {
				$currentColorList.slideUp(200, function(){ $(this).remove(); });
				$currentColorList = null;
				return;
			}

			//close another sub colors
			if($currentColorList) {
				$currentColorList.slideUp(200, function(){ $(this).remove(); });
				$currentColorList = null;
			}

			if(availableColors.length > 0) {

				$listItem.append('<div class="fpd-scroll-area"><div class="fpd-color-palette fpd-grid"></div></div>');

				for(var i=0; i < availableColors.length; ++i) {

					var item;
					if(element.type === FPDPathGroupName && element.getObjects().length > 1) {

						item = '<input class="fpd-path-colorpicker" type="text" value="'+availableColors[i]+'" />';

					}
					else {

						var tooltipTitle = fpdInstance.mainOptions.hexNames[availableColors[i].replace('#', '').toLowerCase()];
						tooltipTitle = tooltipTitle ? tooltipTitle : availableColors[i];

						item = '<div class="fpd-item fpd-tooltip" title="'+tooltipTitle+'" style="background-color: '+availableColors[i]+'" data-color="'+availableColors[i]+'"></div>';

					}

					$listItem.find('.fpd-color-palette').append(item);
				}

				FPDUtil.updateTooltip($listItem);

				if(element.type === FPDPathGroupName && element.getObjects().length > 1) {

					$listItem.find('.fpd-path-colorpicker').spectrum({
						showPaletteOnly: $.isArray(element.colors),
						preferredFormat: "hex",
						showInput: true,
						showInitial: true,
						showButtons: false,
						showPalette: fpdInstance.mainOptions.colorPickerPalette && fpdInstance.mainOptions.colorPickerPalette.length > 0,
						palette: $.isArray(element.colors) ? element.colors : fpdInstance.mainOptions.colorPickerPalette,
						show: function(color) {

							var $listItem = $(this).parents('.fpd-list-row'),
								element = $listItem.data('element');

							var svgColors = FPDUtil.changePathColor(
								element,
								$listItem.find('.fpd-path-colorpicker').index(this),
								color
							);

							FPDUtil.spectrumColorNames($(this).spectrum('container'), fpdInstance);

							element._tempFill = svgColors;

						},
						move: function(color) {

							var $listItem = $(this).parents('.fpd-list-row'),
								element = $listItem.data('element');

							var svgColors = FPDUtil.changePathColor(
								element,
								$listItem.find('.fpd-path-colorpicker').index(this),
								color
							);

							fpdInstance.currentViewInstance.changeColor(element, svgColors);

						},
						change: function(color) {

							var $listItem = $(this).parents('.fpd-list-row'),
								element = $listItem.data('element');

							var svgColors = FPDUtil.changePathColor(
								element,
								$listItem.find('.fpd-path-colorpicker').index(this),
								color
							);

							$(document).unbind("click.spectrum"); //fix, otherwise change is fired on every click
							fpdInstance.currentViewInstance.setElementParameters({fill: svgColors}, element);

						}
					});

				}

				$currentColorList = $listItem.children('.fpd-scroll-area').slideDown(300);

			}

		});

		//select color from color palette
		$container.on('click', '.fpd-color-palette .fpd-item', function(evt) {

			evt.stopPropagation();

			var $this = $(this),
				$listItem = $this.parents('.fpd-list-row'),
				element = $listItem.data('element'),
				newColor = $this.data('color');

			$listItem.find('.fpd-current-color').css('background', newColor);

			//if svg has one path
			if(element.type == FPDPathGroupName) {

				newColor = FPDUtil.changePathColor(
					element,
					0,
					newColor
				);

			}

			fpdInstance.currentViewInstance.setElementParameters({fill: newColor}, element);

		});

		//select associated element on stage when choosing one from the layers list
		$container.on('click', '.fpd-list-row', function() {

			if($(this).hasClass('fpd-locked')) {
				return;
			}

			var targetElement = fpdInstance.getElementByID(this.id);
			if(targetElement) {
				targetElement.canvas.setActiveObject(targetElement).renderAll();
			}

		});

		//lock element
		$container.on('click', '.fpd-lock-element',function(evt) {

			evt.stopPropagation();

			var $this = $(this),
				element = $this.parents('.fpd-list-row').data('element');

			if($currentColorList) {
				$currentColorList.slideUp(200, function(){ $(this).remove(); });
				$currentColorList = null;
			}

			element.evented = !element.evented;
			element.locked = !element.evented;

			$this.children('span').toggleClass('fpd-icon-unlocked', element.evented)
			.toggleClass('fpd-icon-locked-full', !element.evented);

			$this.parents('.fpd-list-row').toggleClass('fpd-locked', !element.evented);
			$this.parents('.fpd-list:first').sortable( 'refresh' );

		});

		//remove element
		$container.on('click', '.fpd-remove-element',function(evt) {

			evt.stopPropagation();

			var $listItem = $(this).parents('.fpd-list-row');

			fpdInstance.currentViewInstance.removeElement($listItem.data('element'));

		});

		//text is changed via textarea
		$container.on('keyup', 'textarea',function(evt) {

			evt.stopPropagation();

			var $this = $(this),
				element = $this.parents('.fpd-list-row').data('element');

			//remove emojis
			if(fpdInstance.mainOptions.disableTextEmojis) {
				this.value = this.value.replace(FPDEmojisRegex, '');
				this.value = this.value.replace(String.fromCharCode(65039), ""); //fix: some emojis left a symbol with char code 65039
			}

			fpdInstance.currentViewInstance.setElementParameters({text: this.value}, element);
			this.value = element.text;

		});

		//text is changed in canvas
		var _textChanged = function(evt, element, parameters) {

			if(parameters.text) {
				$container.find('.fpd-list')
				.find('[id="'+element.id+'"] textarea').val(parameters.text);
			}

		};

		fpdInstance.$container.off('elementModify', _textChanged);
		fpdInstance.$container.on('elementModify', _textChanged);

		//element color change
		var _elementColorChanged = function(evt, element, hex, colorLinking) {

			var $currentColor = $container.find('.fpd-list')
			.find('[id="'+element.id+'"] .fpd-current-color');

			if($currentColor.is('input')) {
				$currentColor.spectrum('set', hex);
			}
			else {
				$currentColor.css('background', hex);
			}

		};

		fpdInstance.$container.off('elementColorChange', _elementColorChanged);
		fpdInstance.$container.on('elementColorChange', _elementColorChanged);

	}

};

var FPDImagesModule = function(fpdInstance, $module) {

	var lazyClass = fpdInstance.mainOptions.lazyLoad ? 'fpd-hidden' : '',
		$imageInput = $module.find('.fpd-input-image'),
		$uploadScrollArea = $module.find('[data-context="upload"] .fpd-scroll-area'),
		$uploadGrid = $uploadScrollArea.find('.fpd-grid'),
		$fbAlbumDropdown = $module.find('.fpd-facebook-albums'),
		$fbScrollArea = $module.find('[data-context="facebook"] .fpd-scroll-area'),
		$fbGrid = $fbScrollArea.find('.fpd-grid'),
		$instaScrollArea = $module.find('[data-context="instagram"] .fpd-scroll-area'),
		$instaGrid = $instaScrollArea.find('.fpd-grid'),
		facebookAppId = fpdInstance.mainOptions.facebookAppId,
		instagramClientId = fpdInstance.mainOptions.instagramClientId,
		instagramRedirectUri = fpdInstance.mainOptions.instagramRedirectUri,
		instaAccessToken = null,
		instaLoadingStack = false,
		instaNextStack = null,
		localStorageAvailable = FPDUtil.localStorageAvailable(),
		loadingImageLabel = fpdInstance.getTranslation('misc', 'loading_image'),
		ajaxSettings = fpdInstance.mainOptions.customImageAjaxSettings,
		saveOnServer = ajaxSettings.data && ajaxSettings.data.saveOnServer ? 1 : 0,
		uploadsDir = (ajaxSettings.data && ajaxSettings.data.uploadsDir) ? ajaxSettings.data.uploadsDir : '',
		uploadsDirURL = (ajaxSettings.data && ajaxSettings.data.uploadsDirURL) ? ajaxSettings.data.uploadsDirURL : '',
		allowedFileTypes = fpdInstance.mainOptions.allowedImageTypes,
		pixabayApiKey = fpdInstance.mainOptions.pixabayApiKey,
		$pixabayScrollArea = $module.find('[data-context="pixabay"] .fpd-scroll-area'),
		$pixabayGrid = $pixabayScrollArea.find('.fpd-grid'),
		pixabayLoadingStack = false,
		pixabayCurrentQuery = '',
		pixabayPage = 1,
		dpApiKey = fpdInstance.mainOptions.depositphotosApiKey,
		$dpScrollArea = $module.find('[data-context="depositphotos"] .fpd-scroll-area'),
		$dpGrid = $dpScrollArea.find('.fpd-grid'),
		dpLoadingStack = false,
		dpCurrentType = '',
		dpCurrentQuery = '',
		dpCurrentCat = null,
		dpOffset = 0;

	var _initialize = function() {

		fpdInstance.$container.on('viewSelect', function(evt, index, viewInstance) {

			currentViewOptions = viewInstance.options;

			if(currentViewOptions.customImageParameters && currentViewOptions.customImageParameters.price) {
				var price = fpdInstance.formatPrice(currentViewOptions.customImageParameters.price);
				$module.find('.fpd-upload-zone .fpd-price').html(price);
			}
			else {
				$module.find('.fpd-upload-zone .fpd-price').html('');
			}

		});


		//ALL
		$module.on('click', '.fpd-grid .fpd-item:not(.fpd-category)', function(evt) {

			var $this = $(this),
				title = $this.data('title') ? $this.data('title') : null;

			//save image on server
			if(saveOnServer) {

				_uploadImage(
					$this.data('file') ? $this.data('file') : $this.data('source'),
					title,
					$this.data('file') ? true : false,
					$this.data('options') ? $this.data('options') : {}
				);

			}
			//add data uri to canvas
			else {

				fpdInstance._loadingCustomImage = true;
				fpdInstance.addCustomImage( $this.data('source'), title , $this.data('options') ? $this.data('options') : {});

			}

		});


		//IMAGE UPLOAD
		if(allowedFileTypes.indexOf('jpeg') !== -1 && allowedFileTypes.indexOf('jpg') === -1) {
			allowedFileTypes.push('jpg');
		}

		var acceptTypes = [];
		allowedFileTypes.forEach(function(imageTpye) {
			if(imageTpye == 'svg') {
				imageTpye += '+xml';
			}
			acceptTypes.push('image/'+imageTpye)
		});
		$imageInput.attr('accept', acceptTypes.join());

		var $uploadZone = $module.find('.fpd-upload-zone');

		$uploadZone.click(function(evt) {

			evt.preventDefault();
			$imageInput.click();

		})
		.on('dragover dragleave', function(evt) {

			evt.stopPropagation();
			evt.preventDefault();

			$(this).toggleClass('fpd-hover', evt.type === 'dragover');

		});

		var _parseFiles = function(evt) {

			evt.stopPropagation();
			evt.preventDefault();

			var files = evt.target.files || evt.dataTransfer.files;

			if(fpdInstance.mainOptions.uploadAgreementModal) {

				var $confirm = FPDUtil.showModal(fpdInstance.getTranslation('modules', 'images_agreement'), false, 'confirm', fpdInstance.$modalContainer);
				$confirm.find('.fpd-confirm').text(fpdInstance.getTranslation('modules', 'images_confirm_button')).click(function() {

					$confirm.find('.fpd-modal-close').click();

					//timeout to wait for modal closing
					setTimeout(function() {
						_addFiles(files);
					}, 300);

				});

			}
			else {
				_addFiles(files);
			}


		};

		var _addFiles = function(files) {

			if(window.FileReader) {

				var addFirstToStage = true;

				for(var i=0; i < files.length; ++i) {

					var extension = files[i].name.split('.').pop().toLowerCase();

					if(allowedFileTypes.indexOf(extension) > -1) {
						_addUploadedImage(files[i], addFirstToStage);
						addFirstToStage = false;
					}

				}

			}

			$uploadZone.removeClass('fpd-hover');
			$imageInput.val('');

		};

		if($uploadZone.get(0)) {
			$uploadZone.get(0).addEventListener('drop', _parseFiles, false);
		}

		$module.find('.fpd-upload-form').on('change', _parseFiles);


		//FACEBOOK
		if(facebookAppId && facebookAppId.length > 5) {

			$module.find('.fpd-module-tabs [data-context="facebook"]').removeClass('fpd-hidden');
			_initFacebook();

		}

		//INSTAGRAM
		if(instagramClientId && instagramClientId.length > 5) {

			$module.find('.fpd-module-tabs [data-context="instagram"]')
			.removeClass('fpd-hidden')
			.on('click', function() {

				if($instaGrid.children('.fpd-item').length > 0) {
					return;
				}

				//check if access token is stored in browser
				//window.localStorage.removeItem('fpd_instagram_access_token')
				instaAccessToken = window.localStorage.getItem('fpd_instagram_access_token');

				var endpoint = 'recent';
				if(!localStorageAvailable || instaAccessToken == null) {

					_authenticateInstagram(function() {
						_loadInstaImages(endpoint);
					});

				}
				//load images by requested endpoint
				else {
					_loadInstaImages(endpoint);
				}

			});

			$instaScrollArea.on('_sbOnTotalScroll', function() {

				if(instaNextStack !== null && !instaLoadingStack) {
					_loadInstaImages(instaNextStack, false);
				}

			});

		}


		//PIXABAY
		if(pixabayApiKey && pixabayApiKey.length > 5) {

			$module.find('.fpd-module-tabs [data-context="pixabay"]').removeClass('fpd-hidden')
			.on('click', function() {

				if($pixabayGrid.children('.fpd-item').length > 0) {
					return;
				}

				_loadPixabayImages();

			});

			$module.on('keypress', '.fpd-module-tabs-content [data-context="pixabay"] input[type="text"]', function(evt) {

				if(evt.which == 13) {

					pixabayPage = 1;
					_loadPixabayImages(this.value);

				}

			});

			$pixabayScrollArea.on('_sbOnTotalScroll', function() {

				if(!pixabayLoadingStack) {

					pixabayPage++;
					_loadPixabayImages(undefined, false);

				}

			});

		}


		//DEPSOITPHOTOS
		if(dpApiKey && dpApiKey.length > 5) {

			$module.find('.fpd-module-tabs [data-context="depositphotos"]').removeClass('fpd-hidden')
			.on('click', function() {

				if($dpGrid.children('.fpd-item').length > 0) {
					return;
				}

				_loadDPImages('list-cats', null);

			});

			$module
			.on('keypress', '.fpd-module-tabs-content [data-context="depositphotos"] input[type="text"]', function(evt) {

				if(evt.which == 13) {

					dpOffset = 0;
					_loadDPImages('search', this.value);

				}

			})
			.on('click', '.fpd-module-tabs-content [data-context="depositphotos"] .fpd-category', function() {

				var $this = $(this),
					catTitle = $this.text();

				$module.find('.fpd-module-tabs-content [data-context="depositphotos"] .fpd-input-search input').attr('placeholder', fpdInstance.getTranslation('modules', 'depositphotos_search_category') + catTitle);

				dpCurrentCat = $this.data('category');
				_loadDPImages('search-cats', dpCurrentCat);

			})
			.on('click', '.fpd-module-tabs-content [data-context="depositphotos"] .fpd-back', function() {

				dpOffset = 0;
				dpCurrentCat = null;
				$module.find('.fpd-module-tabs-content [data-context="depositphotos"] .fpd-input-search input')
				.val('').attr('placeholder', fpdInstance.getTranslation('modules', 'depositphotos_search'));

				_loadDPImages('list-cats', null);

			});

			$dpScrollArea.on('_sbOnTotalScroll', function() {

				if(!dpLoadingStack && $dpScrollArea.prev('.fpd-cats-shown').length == 0) {

					dpOffset++;
					_loadDPImages(dpCurrentType, dpCurrentQuery, false);

				}

			});

		}

		//hide tabs when only one is active
		if($module.find('.fpd-module-tabs > :not(.fpd-hidden)').length < 2 ) {
			$module.addClass('fpd-hide-tabs');
		}

		$module.children('.fpd-module-tabs').children('div:not(.fpd-hidden):first').click();

	};

	var _uploadImage = function(source, title, viaFormData, options) {

		viaFormData = viaFormData === undefined ? false : viaFormData;
		options = options === undefined ? {} : options;

		if(fpdInstance._loadingCustomImage) {
			return false;
		}

		fpdInstance._loadingCustomImage = true;
		fpdInstance.$viewSelectionWrapper.addClass('fpd-disabled');

		var uploadAjaxSettings  = $.extend({}, ajaxSettings);
		uploadAjaxSettings.success = function(data) {

			if(data && data.error === undefined) {

				fpdInstance.addCustomImage(
					data.image_src,
					data.filename ? data.filename : title,
					options
				);

			}
			else {

				fpdInstance.toggleSpinner(false);
				FPDUtil.showModal(data.error);

			}

		};

		if(viaFormData) {

			fpdInstance.toggleSpinner(true, '<div class="fpd-loading-image-progress"></div>'+loadingImageLabel);

			var formdata = new FormData();
			formdata.append('uploadsDir', uploadsDir);
			formdata.append('uploadsDirURL', uploadsDirURL);
			formdata.append('images[]', source);

			uploadAjaxSettings.data = formdata;
			uploadAjaxSettings.processData = false;
			uploadAjaxSettings.contentType = false;

			//upload progress
			uploadAjaxSettings.xhr = function() {

	            var xhr = $.ajaxSettings.xhr();

	            if(xhr.upload) {

	                xhr.upload.addEventListener('progress', function(evt) {

						if(evt.lengthComputable) {

					        var max = evt.total,
					        	current = evt.loaded,
					        	percentage = parseInt((current * 100)/max);

							fpdInstance.$container.find('.fpd-loader-wrapper .fpd-loading-image-progress').text(String(percentage)+'%');

					    }

					}, false);
	            }

	            return xhr;

	        };


		}
		else {

			fpdInstance.toggleSpinner(true, loadingImageLabel);

			uploadAjaxSettings.data = {
				url: source,
				uploadsDir: uploadsDir,
				uploadsDirURL: uploadsDirURL,
				saveOnServer: saveOnServer
			};

		}

		//ajax post
		$.ajax(uploadAjaxSettings)
		.fail(function(evt) {

			fpdInstance.toggleSpinner(false);
			FPDUtil.showModal(evt.statusText);

		});

		if(fpdInstance.productCreated && fpdInstance.mainOptions.hideDialogOnAdd && fpdInstance.$container.hasClass('fpd-topbar') && fpdInstance.mainBar) {

			fpdInstance.mainBar.toggleDialog(false);

		}

	};

	var _addUploadedImage = function(file, addToStage) {

		//check maximum allowed size
		var maxSizeBytes = fpdInstance.mainOptions.customImageParameters.maxSize * 1024 * 1024;
		if(file.size > maxSizeBytes) {
			FPDUtil.showMessage(fpdInstance.getTranslation('misc', 'maximum_size_info').replace('%filename', file.name).replace('%mb', fpdInstance.mainOptions.customImageParameters.maxSize));
			return;
		}

		//load image with FileReader
		var reader = new FileReader();
    	reader.onload = function (evt) {

			//check image resolution of jpeg
	    	if(file.type === 'image/jpeg') {

		    	var jpeg = new JpegMeta.JpegFile(atob(this.result.replace(/^.*?,/,'')), file.name);

		    	if(jpeg.tiff && jpeg.tiff.XResolution && jpeg.tiff.XResolution.value) {

			    	var xResDen = jpeg.tiff.XResolution.value.den,
			    		xResNum = jpeg.tiff.XResolution.value.num,
			    		realRes = xResNum / xResDen;

					FPDUtil.log(file.name+', Density: '+ xResDen + ' Number: '+ xResNum + ' Real Resolution: '+ realRes, 'info');

					if(realRes < fpdInstance.mainOptions.customImageParameters.minDPI) {
						FPDUtil.showModal(fpdInstance.getTranslation('misc', 'minimum_dpi_info').replace('%dpi', fpdInstance.mainOptions.customImageParameters.minDPI), false, '', fpdInstance.$modalContainer);
						return false;
					}

		    	}
		    	else {
			    	FPDUtil.log(file.name + ': Resolution is not accessible.', 'info');
		    	}

	    	}

	    	var image = this.result,
				$lastItem = $uploadGrid.append('<div class="fpd-item" data-title="'+file.name+'"><picture data-img="'+image+'"></picture></div>')
			.children('.fpd-item:last').data('file', file);

			//check image dimensions
			var checkDimImage = new Image();
			checkDimImage.onload = function() {

				var imageH = this.height,
					imageW = this.width,
					currentCustomImageParameters = fpdInstance.currentViewInstance.options.customImageParameters;

				if(FPDUtil.checkImageDimensions(fpdInstance, imageW, imageH)) {

					$lastItem.data('source', image);
					FPDUtil.loadGridImage($lastItem.children('picture'), this.src);
					FPDUtil.createScrollbar($uploadScrollArea);

					if(addToStage) {
						$lastItem.click();
					}

				}
				else {
					$lastItem.remove();
				}

			};

			checkDimImage.src = image;

		}

		//add file to start loading
		reader.readAsDataURL(file);

	};

	var _initFacebook = function() {

		var $albumItems = $fbAlbumDropdown.find('.fpd-dropdown-list .fpd-item');

		$fbAlbumDropdown.children('input').keyup(function() {

			$albumItems.hide();

			if(this.value.length === 0) {
				$albumItems.show();
			}
			else {
				$albumItems.filter(':containsCaseInsensitive("'+this.value+'")').show();
			}

		});

		$fbAlbumDropdown.on('click', '.fpd-dropdown-list .fpd-item', function() {

			var $this = $(this);

			albumID = $this.data('value');

			$this.parent().prevAll('.fpd-dropdown-current:first').val($this.text());
			$this.siblings('.fpd-item').show();

			_selectAlbum(albumID);

		});

		var _selectAlbum = function(albumID) {

			$fbGrid.empty();
			$fbAlbumDropdown.addClass('fpd-on-loading');

			FB.api('/'+albumID+'?fields=count', function(response) {

				var albumCount = response.count;

				FB.api('/'+albumID+'?fields=photos.limit('+albumCount+').fields(source,images)', function(response) {

					$fbAlbumDropdown.removeClass('fpd-on-loading');

					if(!response.error) {

						var photos = response.photos.data;

						for(var i=0; i < photos.length; ++i) {

							var photo = photos[i],
								photoLargest = photo.images[0] ? photo.images[0].source : photo.source;
								photoThumbnail = photo.images[photo.images.length-1] ? photo.images[photo.images.length-1].source : photo.source;
								$lastItem = $('<div/>', {
									'class': 'fpd-item '+lazyClass,
									'data-title': photo.id,
									'data-source': photoLargest,
									'html': '<picture data-img="'+photoThumbnail+'"></picture>'
								}).appendTo($fbGrid);

							if(lazyClass === '') {
								FPDUtil.loadGridImage($lastItem.children('picture'), photoThumbnail);
							}

						}

						FPDUtil.createScrollbar($fbScrollArea);
						FPDUtil.refreshLazyLoad($fbGrid, false);

					}

					fpdInstance.toggleSpinner(false);

				});

			});

		};

		$.ajaxSetup({ cache: true });
		$.getScript('//connect.facebook.com/en_US/sdk.js', function(){

			//init facebook
			FB.init({
				appId: facebookAppId,
				status: true,
				cookie: true,
				xfbml: true,
				version: 'v3.0'
			});

			FB.Event.subscribe('auth.statusChange', function(response) {

				if (response.status === 'connected') {
					// the user is logged in and has authenticated your app

					$module.addClass('fpd-facebook-logged-in');

					FB.api('/me/albums?fields=name,count,id', function(response) {

						var albums = response.data;
						//add all albums to select
						for(var i=0; i < albums.length; ++i) {

							var album = albums[i];
							if(album.count > 0) {
								$fbAlbumDropdown.find('.fpd-dropdown-list').append('<span class="fpd-item" data-value="'+album.id+'">'+album.name+'</span>');
							}

						}

						$albumItems = $fbAlbumDropdown.find('.fpd-dropdown-list .fpd-item');

						$fbAlbumDropdown.removeClass('fpd-on-loading');

					});

				}

			});

		});

	};

	//log into instagram via a popup
	var _authenticateInstagram = function(callback) {

		var popupLeft = (window.screen.width - 700) / 2,
			popupTop = (window.screen.height - 500) / 2;

		var templatesType = typeof fpdInstance.mainOptions.templatesType === 'object' ? fpdInstance.mainOptions.templatesType[0] : fpdInstance.mainOptions.templatesType,
			popup = window.open(fpdInstance.mainOptions.templatesDirectory+'/instagram_auth.'+fpdInstance.mainOptions.templatesType, '', 'width=700,height=500,left='+popupLeft+',top='+popupTop+'');

		FPDUtil.popupBlockerAlert(popup, fpdInstance);
		popup.onload = new function() {

			if(window.location.hash.length == 0) {
				popup.open('https://instagram.com/oauth/authorize/?client_id='+instagramClientId+'&redirect_uri='+instagramRedirectUri+'&response_type=token', '_self');
			}

			var interval = setInterval(function() {

				//popup is closed, stop interval
				if(popup.window === null) {
					clearInterval(interval);
				}

				//when authorized, get access token and save in browser cache
				try {
					if(popup.location.hash.length) {

						clearInterval(interval);
						instaAccessToken = popup.location.hash.slice(14);
						if(localStorageAvailable) {
							window.localStorage.setItem('fpd_instagram_access_token', instaAccessToken);
						}
						popup.close();
						callback();

					}
				}
				catch(evt) {
					//permission denied
				}

			}, 100);
		}

	};

	//load photos from instagram using an endpoint
	var _loadInstaImages = function(endpoint, emptyGrid) {

		emptyGrid = typeof emptyGrid === 'undefined' ? true : emptyGrid;

		instaLoadingStack = true;

		var endpointUrl;

		switch(endpoint) {
			case 'liked':
				endpointUrl = 'https://api.instagram.com/v1/users/self/media/liked?access_token='+instaAccessToken;
			break;
			case 'recent':
				endpointUrl = 'https://api.instagram.com/v1/users/self/media/recent?access_token='+instaAccessToken;
			break;
			default:
				endpointUrl = endpoint;
		}

		if(emptyGrid) {
			$instaGrid.empty();
		}

		$.ajax({
	        method: 'GET',
	        url: endpointUrl,
	        dataType: 'jsonp',
	        jsonp: 'callback',
	        jsonpCallback: 'jsonpcallback',
	        cache: false,
	        success: function(data) {

	        	if(data.data) {

		        	instaNextStack = (data.pagination && data.pagination.next_url) ? data.pagination.next_url : null;

		        	$.each(data.data, function(i, item) {

		        		if(item.type == 'image') {

			        		/*
				        	var imageWidth = String(item.images.standard_resolution.width),
			        			imageHeight = item.images.standard_resolution.height,
			        		regexImageSize = new RegExp('/s'+imageWidth+'x'+imageHeight, 'g'),
								.replace(regexImageSize,'').replace('/vp/', '/')
				        	*/

			        		var image = item.images.standard_resolution.url,
								$lastItem = $('<div/>', {
									'class': 'fpd-item '+lazyClass,
									'data-title': item.id,
									'data-source': image,
									'html': '<picture data-img="'+image+'"></picture>'
								}).appendTo($instaGrid);

		        		}

		        		if(lazyClass === '') {
							FPDUtil.loadGridImage($lastItem.children('picture'), image);
						}

		            });

					if(emptyGrid) {
						FPDUtil.createScrollbar($instaScrollArea);
						FPDUtil.refreshLazyLoad($instaGrid, false);
					}

	        	}
	        	else {

		        	window.localStorage.removeItem('fpd_instagram_access_token');
		        	if(data.meta && data.meta.error_message) {
			        	FPDUtil.showModal('<strong>Instagram Error</strong><p>'+data.meta.error_message+'</p>');
		        	}

	        	}

	        	instaLoadingStack = false;

	        },
	        error: function(jqXHR, textStatus, errorThrown) {

				window.localStorage.removeItem('fpd_instagram_access_token');
		        instaLoadingStack = false;
	            FPDUtil.showModal("Could not load data from instagram. Please try again!");

	        }
	    });

	};

	var _loadPixabayImages = function(query, emptyGrid) {

		if(pixabayCurrentQuery === query) {
			return false;
		}

		pixabayLoadingStack = true;

		pixabayCurrentQuery = query === undefined ? pixabayCurrentQuery : query;
		emptyGrid = emptyGrid === undefined ? true : emptyGrid;

		var perPage = 40,
			highResParam = fpdInstance.mainOptions.pixabayHighResImages ? '&response_group=high_resolution' : '',
			url = 'https://pixabay.com/api/?safesearch=true&key='+pixabayApiKey+'&page='+pixabayPage+'&per_page='+perPage+'&min_width='+fpdInstance.mainOptions.customImageParameters.minW+'&min_height='+fpdInstance.mainOptions.customImageParameters.minH+highResParam+'&q='+encodeURIComponent(pixabayCurrentQuery)+'&lang='+fpdInstance.mainOptions.pixabayLang;

		if(emptyGrid) {
			$pixabayGrid.empty();
		}

		$pixabayScrollArea.prevAll('.fpd-loader-wrapper:first').removeClass('fpd-hidden');

		$.getJSON(url, function(data) {

			$pixabayScrollArea.prevAll('.fpd-loader-wrapper:first').addClass('fpd-hidden');

			if (data.hits.length > 0) {

				data.hits.forEach(function(item) {

					var source = item.imageURL ? item.imageURL : item.webformatURL,
						$lastItem = $('<div/>', {
								'class': 'fpd-item '+lazyClass,
								'data-title': (item.id ? item.id : item.id_hash),
								'data-source': source,
								'html': '<picture data-img="'+item.webformatURL+'"></picture>'
							}).appendTo($pixabayGrid);

					if(lazyClass === '') {
						FPDUtil.loadGridImage($lastItem.children('picture'), item.previewURL);
					}

					if(emptyGrid) {
						FPDUtil.createScrollbar($pixabayScrollArea);
						FPDUtil.refreshLazyLoad($pixabayGrid, false);
					}

				});

			}

			pixabayLoadingStack = false;

		})
		.fail(function(data, textStatus, jqXHR) {
			$pixabayScrollArea.prevAll('.fpd-loader-wrapper:first').addClass('fpd-hidden');
			FPDUtil.log(textStatus);
		});

	};

	var _loadDPImages = function(type, query, emptyGrid) {

		type = type === undefined ? 'search' : type;
		emptyGrid = emptyGrid === undefined ? true : emptyGrid;

		dpCurrentType = type;
		dpCurrentQuery = query;

		dpLoadingStack = true;

		var apiUrl = location.protocol+'//api.depositphotos.com?dp_apikey='+dpApiKey,
			perPage = 40;

		if(type == 'search') {
			apiUrl += '&dp_command=search&dp_search_limit=40&dp_search_offset='+dpOffset+'&dp_search_query='+encodeURIComponent(query);
			if(dpCurrentCat) {
				apiUrl += '&dp_search_categories='+encodeURIComponent(dpCurrentCat);
			}
		}
		else if(type == 'search-cats') {
			apiUrl += '&dp_command=search&dp_search_limit=40&dp_search_offset='+dpOffset+'&dp_search_categories='+encodeURIComponent(query);
		}
		else if(type == 'list-cats') {
			apiUrl += '&dp_command=getCategoriesList&dp_lang='+fpdInstance.mainOptions.depositphotosLang;
		}

		if(emptyGrid) {
			$dpGrid.empty();
		}

		$dpScrollArea.prev('.fpd-head').toggleClass('fpd-cats-shown', type == 'list-cats')
		.prev('.fpd-loader-wrapper').removeClass('fpd-hidden');

		$.getJSON(apiUrl, function(data) {

			$dpScrollArea.prevAll('.fpd-loader-wrapper:first').addClass('fpd-hidden');

			var result;
			if(type == 'list-cats') {
				result = $.map(data.result, function(value, index) {
				    return [[index,value]];
				});
			}
			else {
				result = data.result;
			}

			if (result.length > 0) {

				result.forEach(function(item) {

					if(type == 'list-cats') {

						$('<div/>', {
							'class': 'fpd-category fpd-item',
							'data-category': item[0],
							'html': '<span>'+item[1]+'</span>'
						}).appendTo($dpGrid);

					}
					else if($dpScrollArea.prev('.fpd-cats-shown').length == 0) {

						var $lastItem = $('<div/>', {
								'class': 'fpd-item '+lazyClass,
								'data-title': item.title,
								'data-source': item.url_big,
								'data-price': fpdInstance.mainOptions.depositphotosPrice,
								'html': '<picture data-img="'+item.thumb_huge+'"></picture>'
							}).appendTo($dpGrid);

						$lastItem.data('options', {depositphotos: {id: item.id, itemURL: item.itemurl}, price: fpdInstance.mainOptions.depositphotosPrice});

						if(lazyClass === '') {
							FPDUtil.loadGridImage($lastItem.children('picture'), item.previewURL);
						}

					}

					if(emptyGrid) {
						FPDUtil.createScrollbar($dpScrollArea);
						FPDUtil.refreshLazyLoad($dpGrid, false);
					}

				})

			}

			dpLoadingStack = false;

		})
		.fail(function(data, textStatus, jqXHR) {
			FPDUtil.log(textStatus);
		});

	};

	_initialize();

};

var FPDTextLayersModule = {

	createList : function(fpdInstance, $container) {

		var $currentColorList,
			colorDragging = false;

		$container.off();

		//append a list item to the layers list
		var _appendLayerItem = function(element) {

			var $colorHtml = '';
			if(FPDUtil.elementHasColorSelection(element)) {

				var availableColors = FPDUtil.elementAvailableColors(element, fpdInstance),
					currentColor = '';

				if(availableColors.length > 1) {

					$colorHtml = $('<div class="fpd-color-palette fpd-grid"></div>');

					for(var i=0; i < availableColors.length; ++i) {

						var tooltipTitle = fpdInstance.mainOptions.hexNames[availableColors[i].replace('#', '').toLowerCase()];
							tooltipTitle = tooltipTitle ? tooltipTitle : availableColors[i];

						var item = '<div class="fpd-item fpd-tooltip" title="'+tooltipTitle+'" style="background-color: '+availableColors[i]+'" data-color="'+availableColors[i]+'"></div>';

						$colorHtml.append(item);
					}

				}
				else {
					currentColor = element.fill ? element.fill : availableColors[0];
					$colorHtml = $('<div><input class="fpd-current-color" type="text" value="'+currentColor+'" /></div>');
				}

			}

			var textContent = element.maxLines === 1 ? '<input type="text" value="'+element.text+'">' : '<textarea>'+element.text+'</textarea>';

			$container.find('.fpd-list').append('<div class="fpd-text-layer-item" id="'+element.id+'"><div class="fpd-title">'+element.title+'</div><div class="fpd-text-layer-content">'+textContent+'<span class="fpd-text-layer-clear">'+fpdInstance.getTranslation('modules', 'text_layers_clear')+'</span></div><div class="fpd-text-layer-meta"></div></div>');

			var $lastItem = $container.find('.fpd-text-layer-item:last')
				.data('element', element)
				.data('colors', availableColors);

			$lastItem.find('.fpd-text-layer-meta').append($colorHtml);

			FPDUtil.updateTooltip($colorHtml);

		};

		//destroy all color pickers and empty list
		$container.find('.fpd-current-color').spectrum('destroy');
		$container.find('.fpd-list').empty();

		fpdInstance.getElements(fpdInstance.currentViewIndex).forEach(function(element) {

			if(FPDUtil.elementIsEditable(element) && FPDUtil.getType(element.type) === 'text') {
				_appendLayerItem(element);
			}

		});

		FPDUtil.createScrollbar($container.find('.fpd-scroll-area'));

		//Color Picker
		$container.find('input.fpd-current-color').spectrum('destroy').spectrum({
			flat: false,
			preferredFormat: "hex",
			showInput: true,
			showInitial: true,
			showPalette: fpdInstance.mainOptions.colorPickerPalette && fpdInstance.mainOptions.colorPickerPalette.length > 0,
			palette: fpdInstance.mainOptions.colorPickerPalette,
			showButtons: false,
			show: function(color) {

				FPDUtil.spectrumColorNames($(this).spectrum('container'), fpdInstance);

				var element = $(this).parents('.fpd-text-layer-item:first').data('element');
				element._tempFill = color.toHexString();

			},
			move: function(color) {

				var element = $(this).parents('.fpd-text-layer-item:first').data('element');
				//only non-png images are chaning while dragging
				if(colorDragging === false || FPDUtil.elementIsColorizable(element) !== 'png') {
					fpdInstance.currentViewInstance.changeColor(element, color.toHexString());
				}

			},
			change: function(color) {

				$(document).unbind("click.spectrum"); //fix, otherwise change is fired on every click
				var element = $(this).parents('.fpd-text-layer-item:first').data('element');
				fpdInstance.currentViewInstance.setElementParameters({fill: color.toHexString()}, element);

			}
		})
		.on('beforeShow.spectrum', function(e, tinycolor) {
			if($currentColorList) {
				$currentColorList.remove();
				$currentColorList = null;
			}
		})
		.on('dragstart.spectrum', function() {
			colorDragging = true;
		})
		.on('dragstop.spectrum', function(evt, color) {
			colorDragging = false;
			var element = $(this).parents('.fpd-text-layer-item:first').data('element');
			fpdInstance.currentViewInstance.changeColor(element, color.toHexString());
		});

		//select color from color palette
		$container.on('click', '.fpd-color-palette .fpd-item', function(evt) {

			evt.stopPropagation();

			var $this = $(this),
				$listItem = $this.parents('.fpd-text-layer-item'),
				element = $listItem.data('element'),
				newColor = $this.data('color');

			$listItem.find('.fpd-current-color').css('background', newColor);
			fpdInstance.currentViewInstance.setElementParameters({fill: newColor}, element);

		});

		$container.on('click', '.fpd-text-layer-clear', function(evt) {

			evt.stopPropagation();

			var $this = $(this),
				$layerItem = $this.parents('.fpd-text-layer-item'),
				element = $layerItem.data('element');

			fpdInstance.currentViewInstance.setElementParameters({text: ''}, element);
			$layerItem.find('.fpd-text-layer-content > *').val('');

		});


		//text is changed via textarea
		$container.on('keyup', 'textarea, .fpd-text-layer-content input[type="text"]',function(evt) {

			evt.stopPropagation();

			var $this = $(this),
				element = $this.parents('.fpd-text-layer-item').data('element');

			//remove emojis
			if(fpdInstance.mainOptions.disableTextEmojis) {
				this.value = this.value.replace(FPDEmojisRegex, '');
				this.value = this.value.replace(String.fromCharCode(65039), ""); //fix: some emojis left a symbol with char code 65039
			}

			fpdInstance.currentViewInstance.setElementParameters({text: this.value}, element);
			this.value = element.text;

		});

		var _textChanged = function(evt, element, parameters) {

			if(parameters.text) {
				$container.find('.fpd-list')
				.find('[id="'+element.id+'"] textarea, [id="'+element.id+'"] .fpd-text-layer-content input[type="text"]').val(parameters.text);
			}

		};

		//text is changed in canvas
		fpdInstance.$container.off('elementModify', _textChanged);
		fpdInstance.$container.on('elementModify', _textChanged);

		//element color change
		var _elementColorChanged = function(evt, element, hex, colorLinking) {

			var $currentColor = $container.find('.fpd-list')
			.find('[id="'+element.id+'"] .fpd-current-color');

			if($currentColor.is('input')) {
				$currentColor.spectrum('set', hex);
			}
			else {
				$currentColor.css('background', hex);
			}

		};

		fpdInstance.$container.off('elementColorChange', _elementColorChanged);
		fpdInstance.$container.on('elementColorChange', _elementColorChanged);

	}

};



/*
- view options (stagewidth, stageheight etc.)
*/

var FPDLayoutsModule = function(fpdInstance, $module) {

	var instance = this,
		currentLayouts = [],
		_layoutElementLoadingIndex = 0,
		_totalLayoutElements = 0,
		$scrollArea = $module.find('.fpd-scroll-area');

	var _setupLayouts = function(layouts) {

		if($.isArray(layouts)) {

			currentLayouts = layouts;

			$scrollArea.find('.fpd-grid').empty();

			layouts.forEach(function(layoutObject) {

				var $lastItem = $('<div/>', {
							'class': 'fpd-item fpd-tooltip',
							'title': layoutObject.title,
							'html': '<picture style="background-image: url('+layoutObject.thumbnail+'");"></picture>'
						}).appendTo($scrollArea.find('.fpd-grid'));

			});

			FPDUtil.updateTooltip($scrollArea.find('.fpd-grid'));
			FPDUtil.createScrollbar($scrollArea);

		}

	};

	var _loadingLayoutElement = function(evt, type, source, title, params) {

		_layoutElementLoadingIndex++;

		var loadElementState = title + '<br>' + String(_layoutElementLoadingIndex) + '/' + _totalLayoutElements;
		fpdInstance.$container.find('.fpd-loader-text').html(loadElementState);

	};

	var _initialize = function() {

		fpdInstance.$container
		.on('productCreate', function(evt, views) {

			if(views.length > 0) {
				_setupLayouts(views[0].options.layouts)
			}

		});

		$scrollArea.on('click', '.fpd-item', function() {

			if(fpdInstance.productCreated) {

				var $confirm = FPDUtil.showModal(fpdInstance.getTranslation('modules', 'layouts_confirm_replacement'), false, 'confirm', fpdInstance.$modalContainer),
					layoutIndex = $scrollArea.find('.fpd-item').index($(this));

				$confirm.find('.fpd-confirm').text(fpdInstance.getTranslation('modules', 'layouts_confirm_button')).click(function() {

					_layoutElementLoadingIndex = 0;

					var $viewInstance = $(fpdInstance.currentViewInstance);

					_totalLayoutElements = currentLayouts[layoutIndex].elements.length;

/*
					if(currentLayouts[layoutIndex].options) {
						$.extend(fpdInstance.currentViewInstance.options, currentLayouts[layoutIndex].options);
						fpdInstance.currentViewInstance.resetCanvasSize();
					}
*/

					$viewInstance.on('beforeElementAdd', _loadingLayoutElement);

					fpdInstance.toggleSpinner(true);
					fpdInstance.currentViewInstance.loadElements(currentLayouts[layoutIndex].elements, function() {

						fpdInstance.toggleSpinner(false);
						$viewInstance.off('beforeElementAdd', _loadingLayoutElement);

					});

					fpdInstance.$viewSelectionWrapper.find('.fpd-item').eq(fpdInstance.currentViewIndex).children('picture').css('background-image', 'url('+currentLayouts[layoutIndex].thumbnail+')');

					$confirm.find('.fpd-modal-close').click();

				});

			}

		});

	};

	_initialize();

};

/**
 * This is the main entry point to access FPD via the API. FancyProductDesigner class contains the instances of {{#crossLink "FancyProductDesignerView"}}FancyProductDesignerView{{/crossLink}} class.
 *
 *<h5>Example</h5>
 * Best practice to use the API is to wait for the ready event, then the UI and all products/designs has been set (not loaded).<pre>var fpd = new FancyProductDesigner($fpd, options);
 $fpd.on('ready', function() { //use api methods in here })</pre>
 * @class FancyProductDesigner
 * @constructor
 * @param {HTMLElement | jQuery} elem - A HTML element with an unique ID.
 * @param {Object} [opts] - See {{#crossLink "Options.defaults"}}{{/crossLink}}.
 */
var FancyProductDesigner = function(elem, opts) {

	'use strict';

	$ = jQuery;

	var instance = this,
		$window = $(window),
		$body = $('body'),
		$products,
		$designs,
		$elem,
		$mainBar,
		$stageLoader,
		$uiElements,
		$modules,
		$editorBox = null,
		$thumbnailPreview = null,
		globalCustomElements = [],
		stageCleared = false,
		productIsCustomized = false,
		zoomReseted = false,
		firstProductCreated = false,
		initCSSClasses = '',
		anonymFuncs = {},
		_totalProductElements = 0,
		_productElementLoadingIndex = 0,
		_outOfBoundingBoxLabel = '';

	/**
	 * Array containing all added products categorized.
	 *
	 * @property products
	 * @type Array
	 */
	this.products = [];

	/**
	 * Array containing all added designs.
	 *
	 * @property designs
	 * @type Array
	 */
	this.designs = [];

	/**
	 * The current selected product category index.
	 *
	 * @property currentCategoryIndex
	 * @type Number
	 * @default 0
	 */
	this.currentCategoryIndex = 0;

	/**
	 * The current selected product index.
	 *
	 * @property currentProductIndex
	 * @type Number
	 * @default 0
	 */
	this.currentProductIndex = 0;

	/**
	 * The current selected view index.
	 *
	 * @property currentViewIndex
	 * @type Number
	 * @default 0
	 */
	this.currentViewIndex = 0;

	/**
	 * The price considering the elements price in all views with order quantity.
	 *
	 * @property currentPrice
	 * @type Number
	 * @default 0
	 */
	this.currentPrice = 0;

	/**
	 * The price considering the elements price in all views without order quantity.
	 *
	 * @property singleProductPrice
	 * @type Number
	 * @default 0
	 */
	this.singleProductPrice = 0;

	/**
	 * The current views.
	 *
	 * @property currentViews
	 * @type Array
	 * @default null
	 */
	this.currentViews = null;

	/**
	 * The current view instance.
	 *
	 * @property currentViewInstance
	 * @type FancyProductDesignerView
	 * @default null
	 */
	this.currentViewInstance = null;

	/**
	 * The current selected element.
	 *
	 * @property currentElement
	 * @type fabric.Object
	 * @default null
	 */
	this.currentElement = null;

	/**
	 * JSON Object containing all translations.
	 *
	 * @property langJson
	 * @type Object
	 * @default null
	 */
	this.langJson = null;

	/**
	 * The main options set for this Product Designer.
	 *
	 * @property mainOptions
	 * @type Object
	 */
	this.mainOptions;

	/**
	 * jQuery object pointing on the product stage.
	 *
	 * @property $productStage
	 * @type jQuery
	 */
	this.$productStage = null;

	/**
	 * jQuery object pointing on the tooltip for the current selected element.
	 *
	 * @property $elementTooltip
	 * @type jQuery
	 */
	this.$elementTooltip = null;

	/**
	 * URL to the watermark image if one is set via options.
	 *
	 * @property watermarkImg
	 * @type String
	 * @default null
	 */
	this.watermarkImg = null;

	/**
	 * Indicates if the product is created or not.
	 *
	 * @property productCreated
	 * @type Boolean
	 * @default false
	 */
	this.productCreated = false;

	/**
	 * Indicates if the product was saved.
	 *
	 * @property doUnsavedAlert
	 * @type Boolean
	 * @default false
	 */
	this.doUnsavedAlert = false;

	/**
	 * Array containing all FancyProductDesignerView instances of the current showing product.
	 *
	 * @property viewInstances
	 * @type Array
	 * @default []
	 */
	this.viewInstances = [];

	/**
	 * Object containing all color link groups.
	 *
	 * @property colorLinkGroups
	 * @type Object
	 * @default {}
	 */
	this.colorLinkGroups = {};

	/**
	 * The order quantity.
	 *
	 * @property orderQuantity
	 * @type Number
	 * @default 1
	 */
	this.orderQuantity = 1;

	/**
	 * If FPDBulkVariations is used with the product designer, this is the instance to the FPDBulkVariations class.
	 *
	 * @property bulkVariations
	 * @type FPDBulkVariations
	 * @default null
	 */
	this.bulkVariations = null;

	/**
	 * The calculated price for the pricing rules.
	 *
	 * @property pricingRulesPrice
	 * @type Number
	 * @default 0
	 */
	this.pricingRulesPrice = 0;

	/**
	 * The container for internal modals.
	 *
	 * @property $modalContainer
	 * @type jQuery
	 * @default 0
	 */
	this.$modalContainer = $('body');

	this.languageJSON = {
		"toolbar": {},
		"actions": {},
		"modules": {},
		"misc": {},
		"image_editor": {},
		"plus": {}
	};
	this._order = {};
	this._loadingCustomImage = false;

	var fpdOptionsInstance = new FancyProductDesignerOptions();
	this.mainOptions = fpdOptionsInstance.merge(fpdOptionsInstance.defaults, opts);


	var _initialize = function() {

		// @@include('../envato/evilDomain.js')

		//create custom jquery expression to ignore case when filtering
		$.expr[":"].containsCaseInsensitive = $.expr.createPseudo(function(arg) {
		    return function( elem ) {
		        return $(elem).text().toUpperCase().indexOf(arg.toUpperCase()) >= 0;
		    };
		});

		//check if element is a jquery object
		if(elem instanceof jQuery) {
			$elem = elem;
		}
		else {
			$elem = $(elem);
		}

		instance.$modalContainer = instance.mainOptions.openModalInDesigner ? $elem : $('body');

		initCSSClasses = $elem.attr('class') ? $elem.attr('class') : '';
		instance.mainOptions.mainBarContainer = instance.mainOptions.modalMode !== false ? false : instance.mainOptions.mainBarContainer;

		//force sidebar when main bar container is set
		if(instance.mainOptions.mainBarContainer) {
			$elem.removeClass('fpd-sidebar').addClass('fpd-topbar');
		}

		if(!instance.mainOptions.fabricCanvasOptions.allowTouchScrolling) {
			$elem.addClass('fpd-disable-touch-scrolling');
		}

		$elem.addClass('fpd-device-'+FPDUtil.getDeviceByScreenSize());

		instance.$container = $elem.data('instance', instance);

		//save products and designs HTML
		$products = $elem.children('.fpd-category').length > 0 ? $elem.children('.fpd-category').remove() : $elem.children('.fpd-product').remove();
		$designs = $elem.find('.fpd-design > .fpd-category').length > 0 ? $elem.find('.fpd-design > .fpd-category') : $elem.find('.fpd-design > img');
		$elem.children('.fpd-design').remove();

		//add product designer into modal
		if(instance.mainOptions.modalMode) {

			$elem.removeClass('fpd-hidden');
			$body.addClass('fpd-modal-mode-active');

			var $modalProductDesigner = $elem.wrap('<div class="fpd-modal-product-designer fpd-modal-overlay fpd-fullscreen"><div class="fpd-modal-wrapper"></div></div>').parents('.fpd-modal-overlay:first'),
				modalProductDesignerOnceOpened = false;

			$modalProductDesigner.children()
			.append('<div class="fpd-done fpd-btn" data-defaulttext="Done">misc.modal_done</div><div class="fpd-modal-close"><span class="fpd-icon-close"></span></div>');

			$(instance.mainOptions.modalMode).addClass('fpd-modal-mode-btn').click(function(evt) {

				evt.preventDefault();

				$body.addClass('fpd-overflow-hidden').removeClass('fpd-modal-mode-active');

				$modalProductDesigner.addClass('fpd-fullscreen').fadeIn(300);
				if(instance.currentViewInstance) {
					instance.currentViewInstance.resetCanvasSize();
					instance.resetZoom();
				}

				var $selectedModule = $mainBar.children('.fpd-navigation').children('.fpd-active');
				if($selectedModule.length > 0) {
					instance.mainBar.callModule($selectedModule.data('module'));
				}

				//auto-select
				var autoSelectElement = null;
				if(!modalProductDesignerOnceOpened) {

					if(!instance.mainOptions.editorMode && instance.currentViewInstance) {

						var viewElements = instance.currentViewInstance.stage.getObjects();
						for(var i=0; i < viewElements.length; ++i) {
							var obj = viewElements[i];

							 if(obj.autoSelect && !obj.hasUploadZone) {
								 autoSelectElement = obj;
							 }

						}

					}

				}

				setTimeout(function() {

					if(autoSelectElement) {
						instance.currentViewInstance.stage.setActiveObject(autoSelectElement);
						instance.currentViewInstance.stage.renderAll();
					}

				}, 300);

				modalProductDesignerOnceOpened = true;

				/**
			     * Gets fired when the modal with the product designer opens.
			     *
			     * @event FancyProductDesigner#modalDesignerOpen
			     * @param {Event} event
			     */
				instance.$container.trigger('modalDesignerOpen');

			});

			$modalProductDesigner.find('.fpd-done').click(function() {

				$modalProductDesigner.find('.fpd-modal-close').click();

				/**
			     * Gets fired when the modal with the product designer closes.
			     *
			     * @event FancyProductDesigner#modalDesignerClose
			     * @param {Event} event
			     */
				instance.$container.trigger('modalDesignerClose');

			});

		}

		//test if browser is supported (safari, chrome, opera, firefox IE>9)
		var canvasTest = document.createElement('canvas'),
			canvasIsSupported = Boolean(canvasTest.getContext && canvasTest.getContext('2d')),
			minIE = instance.mainOptions.templatesDirectory ? 9 : 8;

		if(!canvasIsSupported || (FPDUtil.isIE() && Number(FPDUtil.isIE()) <= minIE)) {

			anonymFuncs.loadCanvasError = function(html) {

				$elem.append($.parseHTML(html)).fadeIn(300);
				$elem.trigger('templateLoad', [this.url]);

			};

			_loadTemplate('canvaserror', instance.mainOptions.templatesType, 0, anonymFuncs.loadCanvasError);

			/**
		     * Gets fired when the browser does not support HTML5 canvas.
		     *
		     * @event FancyProductDesigner#canvasFail
		     * @param {Event} event
		     */
			$elem.trigger('canvasFail');

			return false;
		}

		//lowercase all keys in hexNames
		var key,
			keys = Object.keys(instance.mainOptions.hexNames),
			n = keys.length,
			newHexNames = {};

		Object.keys(instance.mainOptions.hexNames).forEach(function(hexKey) {
			newHexNames[hexKey.toLowerCase()] = instance.mainOptions.hexNames[hexKey];
		});
		instance.mainOptions.hexNames = newHexNames;

		//PLUS
		if(typeof FancyProductDesignerPlus !== 'undefined') {
			FancyProductDesignerPlus.setup($elem, instance);
		}

		//PRICING RULES
		if(typeof FPDPricingRules !== 'undefined') {
			instance.pricingRulesInstance = new FPDPricingRules($elem, instance);
		}

		//load language JSON
		if(instance.mainOptions.langJSON !== false) {

			if(typeof instance.mainOptions.langJSON === 'object') {

				instance.langJson = instance.mainOptions.langJSON;

				$elem.trigger('langJSONLoad', [instance.langJson]);

				_initProductStage();

			}
			else {

				$.getJSON(instance.mainOptions.langJSON).done(function(data) {

					instance.langJson = data;

					/**
				     * Gets fired when the language JSON is loaded.
				     *
				     * @event FancyProductDesigner#langJSONLoad
				     * @param {Event} event
				     * @param {Object} langJSON - A JSON containing the translation.
				     */
					$elem.trigger('langJSONLoad', [instance.langJson]);

					_initProductStage();

				})
				.fail(function(data) {

					FPDUtil.showModal('Language JSON "'+instance.mainOptions.langJSON+'" could not be loaded or is not valid. Make sure you set the correct URL in the options and the JSON is valid!');

					$elem.trigger('langJSONLoad', [instance.langJson]);
				});

			}


		}
		else {
			_initProductStage();
		}

	}; //init end

	//init the product stage
	var _initProductStage = function() {

		var loaderHTML = '<div class="fpd-loader-wrapper"><div class="fpd-loader"><div class="fpd-loader-circle"></div><span class="fpd-loader-text" data-defaulttext="Initializing Product Designer">misc.initializing</span></div></div>',
			tooltipHtml = '<div class="fpd-element-tooltip" style="display: none;">misc.out_of_bounding_box</div>';

		//add init loader
		instance.$mainWrapper = $elem.addClass('fpd-container fpd-clearfix fpd-grid-columns-'+instance.mainOptions.gridColumns).html(loaderHTML+'<div class="fpd-main-wrapper">'+tooltipHtml+'<div class="fpd-snap-line-h"></div><div class="fpd-snap-line-v"></div><div class="fpd-product-stage" style="width:'+instance.mainOptions.stageWidth+'px;height: '+instance.mainOptions.stageHeight+'px;"></div><div class="fpd-actions-container"></div></div>').children('.fpd-main-wrapper');
		instance.$actionsWrapper = instance.$mainWrapper.children('.fpd-actions-container');

		$elem.after('<div class="fpd-device-info">'+instance.getTranslation('misc', 'not_supported_device_info')+'</div>');


		instance.$mainWrapper.prepend('<div class="fpd-modal-lock"><div class="fpd-toggle-lock"><span class="fpd-icon-unlocked"></span><span class="fpd-icon-locked"></span><div>'+instance.getTranslation('misc', 'view_optional_unlock')+'</div></div></div>');

		instance.$productStage  = instance.$mainWrapper.children('.fpd-product-stage')
		instance.$elementTooltip = instance.$mainWrapper.children('.fpd-element-tooltip');
		$stageLoader = $elem.children('.fpd-loader-wrapper');

		instance.translateElement($stageLoader.find('.fpd-loader-text'));
		_outOfBoundingBoxLabel = instance.translateElement(instance.$elementTooltip);
		if(instance.mainOptions.modalMode) {
			instance.translateElement($body.find('.fpd-modal-overlay .fpd-done'));
		}

		//load editor box if requested
		if(typeof instance.mainOptions.editorMode === 'string') {

			$editorBox = $('<div class="fpd-editor-box"><h5></h5><div class="fpd-clearfix"></div></div>');
			$(instance.mainOptions.editorMode).append($editorBox);

		}

		//window resize handler
		var device = '';
		$window.resize(function() {

			if(instance.currentViewInstance) {
				instance.currentViewInstance.resetCanvasSize();
			}

			if(instance.mainBar && instance.mainBar.$content
				&& instance.$container.filter('[class*="fpd-off-canvas-"]').length > 0) {
				instance.mainBar.$content.height(instance.$mainWrapper.height());
			}

			if(instance.actions) {

				instance.actions.hideAllTooltips();
				if(!zoomReseted) {
					instance.resetZoom();
				}

			}

			//deselect element if one is selected and active element is not input (FB browser fix)
			if(instance.currentElement && $(document.activeElement).is(':not(input)')) {
				//instance.deselectElement();
			}

			if((instance.currentElement && instance.currentElement.isEditing) || instance.mainOptions.editorMode) {
				return;
			}

			var currentDevice = FPDUtil.getDeviceByScreenSize();
			if(currentDevice == 'smartphone') {

				if(!instance.$container.hasClass('fpd-topbar') && instance.mainBar) {
					instance.$container.removeClass('fpd-sidebar').addClass('fpd-topbar');
					instance.mainBar.setContentWrapper('draggable-dialog');
				}


			}
			else if(currentDevice == 'tablet') {
			}
			else if(currentDevice == 'desktop') {

				if(initCSSClasses.search('fpd-topbar') === -1 && instance.$container.hasClass('fpd-topbar')) {
					instance.$container.removeClass('fpd-topbar').addClass('fpd-sidebar');
					if(instance.mainBar && !instance.mainOptions.mainBarContainer) {
						instance.mainBar.setContentWrapper('sidebar');
					}
				}

			}

			if(device !== currentDevice) {

				/**
			     * Gets fired as soon as the screen size has changed. Breakpoints: Smartphone Width < 568, Tablet Width > 568 and < 768, Desktop Width > 768.
			     *
			     * @event FancyProductDesigner#canvasFail
			     * @param {Event} event
			     * @param {String} device Possible values: desktop, tablet, smartphone.
			     */
				$elem.trigger('screenSizeChange', [currentDevice]);
			}

			device = currentDevice;

		});


		instance.loadFonts(instance.mainOptions.fonts, function() {
			instance.mainOptions.templatesDirectory ? _loadUIElements() : _ready();
		});

	};

	//now load UI elements from external HTML file
	var _loadUIElements = function() {

		anonymFuncs.loadProductDesignerTemplate = function(html) {

			/**
		     * Gets fired as soon as a template has been loaded.
		     *
		     * @event FancyProductDesigner#templateLoad
		     * @param {Event} event
		     * @param {string} URL - The URL of the loaded template.
		     */
			$elem.trigger('templateLoad', [this.url]);

			$uiElements = $(html);

			$uiElements.find('[data-defaulttext]').each(function(index, uiElement) {

				instance.translateElement($(uiElement));

			});

			instance.translatedUI = $uiElements;

			if(instance.mainOptions.mainBarContainer) {

				$elem.addClass('fpd-main-bar-container-enabled');
				$mainBar = $(instance.mainOptions.mainBarContainer).addClass('fpd-container fpd-main-bar-container fpd-tabs fpd-tabs-top fpd-sidebar fpd-grid-columns-'+instance.mainOptions.gridColumns).html($uiElements.children('.fpd-mainbar')).children('.fpd-mainbar');

			}
			else {
				$mainBar = $elem.prepend($uiElements.children('.fpd-mainbar')).children('.fpd-mainbar');
			}

			$modules = $uiElements.children('.fpd-modules');

			if($elem.hasClass('fpd-sidebar')) {
				$elem.height(instance.mainOptions.stageHeight);
			}
			else {
				$elem.width(instance.mainOptions.stageWidth);
			}

			//show tabs content
			$body.on('click', '.fpd-module-tabs > div', function() {

				var $this = $(this),
					context = $(this).data('context');

				$this.addClass('fpd-active').siblings().removeClass('fpd-active');
				$this.parent().next('.fpd-module-tabs-content').children().hide().filter('[data-context="'+context+'"]').show();

			});

			//setup modules
			if(instance.mainOptions.mainBarModules) {

				instance.mainBar = new FPDMainBar(
					instance,
					$mainBar,
					$modules,
					$uiElements.children('.fpd-draggable-dialog')
				);

			}

			//init Actions
			if(instance.mainOptions.actions) {

				instance.actions = new FPDActions(instance, $uiElements.children('.fpd-actions'));

			}

			/**
		     * Gets fired as soon as the user interface with all modules, actions is set and translated.
		     *
		     * @event FancyProductDesigner#uiSet
		     * @param {Event} event
		     */
			$elem.trigger('uiSet');

			//init Toolbar
			var $elementToolbar = $uiElements.children('.fpd-element-toolbar');
			if(instance.mainOptions.toolbarPlacement == 'smart') {
				$elementToolbar = $uiElements.children('.fpd-element-toolbar-smart');
				instance.toolbar = new FPDToolbarSmart($elementToolbar, instance);
			}
			else {
				instance.toolbar = new FPDToolbar($elementToolbar, instance);
			}

			$elem.on('elementSelect', function(evt, element) {

				evt.stopPropagation();
				evt.preventDefault();

				if(element && instance.currentViewInstance) {

					//upload zone is selected
					if(element.uploadZone && !instance.mainOptions.editorMode) {

						element.set('borderColor', 'transparent');

						var customAdds = $.extend(
							{},
							instance.currentViewInstance.options.customAdds,
							element.customAdds ? element.customAdds : {}
						);

						//mobile fix: elementSelect is triggered before click, this was adding an image on mobile
						setTimeout(function() {

							instance.mainBar.toggleUploadZoneAdds(customAdds);
							instance.mainBar.toggleUploadZonePanel();
							instance.currentViewInstance.currentUploadZone = element.title;

						}, 100);


						return;
					}
					//if element has no upload zone and an upload zone is selected, close dialogs and call first module
					else if(instance.currentViewInstance.currentUploadZone) {

						instance.mainBar.toggleDialog(false);
						instance.mainBar.toggleUploadZonePanel(false);

					}

					instance.toolbar.update(element);

					if(instance.mainOptions.openTextInputOnSelect && FPDUtil.getType(element.type) === 'text' && element.editable) {

						$elementToolbar.find('.fpd-tool-edit-text').click();
					}

					_updateEditorBox(element);

				}
				else {

					instance.toolbar.toggle(false);
					$body.children('[class^="fpd-element-toolbar"]').find('input').spectrum('destroy');

				}

			})
			.on('elementChange', function(evt, type, element) {

				instance.toolbar.toggle(false, false);

			})
			.on('elementModify', function(evt, element, parameters) {

				if(instance.productCreated) {

					if(!instance.toolbar.isTransforming) {

						if(parameters.fontSize !== undefined) {
						instance.toolbar.updateUIValue('fontSize', Number(parameters.fontSize));
						}
						if(parameters.scaleX !== undefined) {
							instance.toolbar.updateUIValue('scaleX', parseFloat(Number(parameters.scaleX).toFixed(2)));
						}
						if(parameters.scaleY !== undefined) {
							instance.toolbar.updateUIValue('scaleY', parseFloat(Number(parameters.scaleY).toFixed(2)));
						}
						if(parameters.angle !== undefined) {
							instance.toolbar.updateUIValue('angle', parseInt(parameters.angle));
						}
						if(parameters.text !== undefined) {
							instance.toolbar.updateUIValue('text', parameters.text);
						}

						if(instance.currentElement && !instance.currentElement.uploadZone) {
							instance.toolbar.updatePosition(instance.currentElement);
						}

					}



				}

			})
			.on('screenSizeChange', function(evt, device) {

				$elem.removeClass('fpd-device-smartphone fpd-device-tablet fpd-device-desktop')
				.addClass('fpd-device-'+device);

			});

			//switchers
			$('.fpd-switch-container').click(function() {

				var $this = $(this);

				if($this.hasClass('fpd-curved-text-switcher')) {

					var z = instance.currentViewInstance.getZIndex(instance.currentElement),
						defaultText = instance.currentElement.get('text'),
						parameters = instance.currentViewInstance.getElementJSON(instance.currentElement);

					parameters.z = z;
					parameters.curved = instance.currentElement.type == 'i-text';
					parameters.textAlign = 'center';

					function _onTextModeChanged(evt, textElement) {
						instance.currentViewInstance.stage.setActiveObject(textElement);
						$elem.off('elementAdd', _onTextModeChanged);

						setTimeout(function() {
							$('.fpd-tool-curved-text').click();
						}, 100);

					};
					$elem.on('elementAdd', _onTextModeChanged);

					instance.currentViewInstance.removeElement(instance.currentElement);
					instance.currentViewInstance.addElement('text', defaultText, defaultText, parameters);

				}

			});

			$('.fpd-dropdown').click(function() {

				$(this).toggleClass('fpd-active');

			});

			_ready();

		};

		_loadTemplate('productdesigner', instance.mainOptions.templatesType, 0, anonymFuncs.loadProductDesignerTemplate);

	};

	var _ready = function() {

		//load watermark image
		if(instance.mainOptions.watermark && instance.mainOptions.watermark.length > 3) {

			fabric.Image.fromURL(instance.mainOptions.watermark, function(oImg) {
				instance.watermarkImg = oImg;
			});

		}

		if(instance.mainOptions.unsavedProductAlert) {

			window.onbeforeunload = function () {

				if(instance.doUnsavedAlert) {
					return '';
				}

			};

		}

		//store a boolean to detect if the text in textarea (toolbar) was selected, then dont deselect
		var _fixSelectionTextarea = false;

		//general close handler for modal
		$body.on('click', '.fpd-modal-close', function(evt) {

			var $this = $(this);

			if($this.parents('.fpd-modal-product-designer:first').length) {
				$body.addClass('fpd-modal-mode-active');
			}

			$this.parents('.fpd-modal-overlay:first').fadeOut(200, function() {

				$this.removeClass('fpd-fullscreen');
				$body.removeClass('fpd-overflow-hidden');

				var $modal = $(this);
				if(!$modal.hasClass('fpd-modal-product-designer')) {
					$modal.trigger('modalRemove').remove();
				}

				$elem.trigger('modalClose');

			});

			//modal product designer is closing
			if($this.parents('.fpd-modal-product-designer:first').length > 0) {
				instance.deselectElement();
			}

		})
		.on('mouseup touchend', function(evt) {

			var $target = $(evt.target);

			//deselect element if click outside of a fpd-container
			if($target.closest('.fpd-container, [class^="fpd-element-toolbar"], .sp-container').length === 0
				&& instance.mainOptions.deselectActiveOnOutside && !_fixSelectionTextarea) {

				   instance.deselectElement();

			}

			//close upload zone panel if click outside of fpd-container, needed otherwise elements can be added to upload zone e.g. mspc
			if($target.closest('.fpd-container, .fpd-modal-internal').length === 0
				&& instance.currentViewInstance && instance.currentViewInstance.currentUploadZone
				&& $stageLoader.is(':hidden')) {
				instance.mainBar.toggleUploadZonePanel(false);

			}

			_fixSelectionTextarea = false;

		})
		//thumbnail preview effect
		.on('mouseover mouseout mousemove', '[data-module="designs"] .fpd-item, [data-module="images"] .fpd-item, [data-module="products"] .fpd-item', function(evt) {

			var $this = $(this),
				price = null;

			if(instance.currentViewInstance && instance.currentViewInstance.currentUploadZone
				&& $(evt.target).parents('.fpd-upload-zone-adds-panel').length > 0) {

				var uploadZone = instance.currentViewInstance.getUploadZone(instance.currentViewInstance.currentUploadZone);
				if(uploadZone && uploadZone.price) {
					price = uploadZone.price;
				}

			}

			if(evt.type === 'mouseover' && $this.data('source')) {

				//do not show when scrolling
				if($this.parents('.mCustomScrollBox:first').next('.mCSB_scrollTools_onDrag').length) {
					return;
				}

				$thumbnailPreview = $('<div class="fpd-thumbnail-preview")"><picture></picture></div>');
				FPDUtil.loadGridImage($thumbnailPreview.children('picture'), $this.children('picture').data('img'));

				//thumbnails in images module
				if($this.parents('[data-module="images"]:first').length > 0 && price === null) {

					if(!isNaN($this.data('price'))) {
						price = $this.data('price');
					}
					else if(instance.currentViewInstance && instance.currentViewInstance.options.customImageParameters.price) {
						price = instance.currentViewInstance.options.customImageParameters.price;
					}

				}
				//thumbnails in designs/products module
				else {

					if($this.data('title')) {
						$thumbnailPreview.addClass('fpd-title-enabled');
						$thumbnailPreview.append('<div class="fpd-preview-title">'+$this.data('title')+'</div>');
					}

					if($this.data('parameters') && $this.data('parameters').price && price === null) {
						price = $this.data('parameters').price;
					}

				}

				if(price) {
					$thumbnailPreview.append('<div class="fpd-preview-price">'+instance.formatPrice(price)+'</div>');
				}

				$body.append($thumbnailPreview);

			}

			if($thumbnailPreview !== null) {

				if(evt.type === 'mousemove' || evt.type === 'mouseover') {

					var leftPos = evt.pageX + 10 + $thumbnailPreview.outerWidth() > $window.width() ? $window.width() - $thumbnailPreview.outerWidth() : evt.pageX + 10;
					$thumbnailPreview.css({left: leftPos, top: evt.pageY + 10});

				}
				else if(evt.type === 'mouseout') {

					$thumbnailPreview.siblings('.fpd-thumbnail-preview').remove();
					$thumbnailPreview.remove();

				}

			}

		}).
		on('mousedown', function(evt) {

			var $target = $(evt.target);
			_fixSelectionTextarea = $target.is('textarea') && $target.data('control') ? true : false;

		})
		//guided tour events
		.on('click', '.fpd-gt-close', function() {

			if(FPDUtil.localStorageAvailable()) {

				window.localStorage.setItem('fpd-gt-closed', true);

			}

			$(this).parent('.fpd-gt-step').remove();

		})
		.on('click', '.fpd-gt-next, .fpd-gt-back', function() {

			instance.selectGuidedTourStep($(this).data('target'));

		});

		instance.$container.on('productCreate modalDesignerOpen', function(evt) {

			if((!firstProductCreated && !instance.mainOptions.modalMode) || (!firstProductCreated && evt.type === 'modalDesignerOpen')) {

				if(instance.mainOptions.autoOpenInfo) {
					instance.$container.find('[data-action="info"]').click();
				}

				if(instance.mainOptions.guidedTour && Object.keys(instance.mainOptions.guidedTour).length > 0) {

					var firstKey = Object.keys(instance.mainOptions.guidedTour)[0];
					if(FPDUtil.localStorageAvailable()) {
						if(!window.localStorage.getItem('fpd-gt-closed')) {
							instance.selectGuidedTourStep(firstKey);
						}
					}
					else {
						instance.selectGuidedTourStep(firstKey);
					}

				}

			}

			if(evt.type == 'productCreate' && globalCustomElements.length > 0) {

                var customElementsCount = 0;

                function _addCustomElement(object) {

                    var viewInstance = instance.viewInstances[object.viewIndex];
                    if(viewInstance) { //add element to correct view

                        var fpdElement = object.element;
                        viewInstance.addElement(
                            FPDUtil.getType(fpdElement.type),
                            fpdElement.source,
                            fpdElement.title,
                            viewInstance.getElementJSON(fpdElement)
                        );

                    }
                    else {
                        _customElementAdded();
                    }

                };

                function _customElementAdded() {

                    customElementsCount++;
                    if(customElementsCount < globalCustomElements.length) {
                        _addCustomElement(globalCustomElements[customElementsCount]);
                    }
                    else {
                        $elem.off('elementAdd', _customElementAdded);
                    }

                };

                $elem.on('elementAdd', _customElementAdded);
                _addCustomElement(globalCustomElements[0]);

            }

			firstProductCreated = instance.mainOptions.modalMode && evt.type === 'modalDesignerOpen';

		});

		_createProductJSONFromHTML($products);
		_createDesignJSONFromHTML($designs);

		//view lock handler
		instance.$mainWrapper.on('click', '.fpd-modal-lock > .fpd-toggle-lock', function() {

			$(this).parents('.fpd-modal-lock:first').toggleClass('fpd-unlocked');
			instance.currentViewInstance.toggleLock(!instance.currentViewInstance.locked);

		});

		/**
	     * Gets fired as soon as the product designer is ready to receive API calls.
	     *
	     * @event FancyProductDesigner#ready
	     * @param {Event} event
	     */
		$elem.trigger('ready');

		$window.resize();

	};

	var _createProductJSONFromHTML = function($products) {

		var producJSON = [];

		//creates all products from HTML markup
		var _createProductsFromHTML = function($products, category) {

			for(var i=0; i < $products.length; ++i) {

				//get other views
				var views = $($products.get(i)).children('.fpd-product');
				//get first view
				views.splice(0,0,$products.get(i));

				var viewsArr = [];
				views.each(function(j, view) {

					var $view = $(view);
					var viewObj = {
						title: view.title,
						thumbnail: $view.data('thumbnail'),
						elements: [],
						options: $view.data('options')
					};

					viewObj.mask = $view.data('mask') ? $view.data('mask') : null;

					if(j === 0) {

						//get product thumbnail from first view
						if($view.data('producttitle')) {
							viewObj.productTitle = $view.data('producttitle');
						}

						//get product thumbnail from first view
						if($view.data('productthumbnail')) {
							viewObj.productThumbnail = $view.data('productthumbnail');
						}

					}

					$view.children('img,span').each(function(k, element) {

						var $element = $(element),
							source;

						if($element.is('img')) {
							source = $element.data('src') == undefined ? $element.attr('src') : $element.data('src');
						}
						else {
							source = $element.text()
						}

						var elementObj = {
							type: $element.is('img') ? 'image' : 'text', //type
							source: source, //source
							title: $element.attr('title'),  //title
							parameters: $element.data('parameters') == undefined || $element.data('parameters').length <= 2 ? {} : $element.data('parameters')  //parameters
						};

						viewObj.elements.push(elementObj);

					});

					viewsArr.push(viewObj);

				});

				//add product in category or asn own item
				if(category) {

					//get category index by category name
					var catIndex =  $.map(producJSON, function(obj, index) {
					    if(obj.category == category) {
					        return index;
					    }
					}).shift();

					if(isNaN(catIndex)) { //category does not exist in products
						catIndex = producJSON.length; // set index
						producJSON.push({category: category, products: []});
					}

					producJSON[catIndex].products.push(viewsArr);

				}
				else { //no categories
					producJSON.push(viewsArr)
				}

			}


		};

		//check if categories are used
		if($products.is('.fpd-category') && $products.filter('.fpd-category').length > 1) {

			//loop through all categories
			$products.each(function(i, cat) {
				var $cat = $(cat);
				_createProductsFromHTML($cat.children('.fpd-product'), $cat.attr('title'));
			});

		}
		else { //no categories are used

			//check if only one category is used
			$products = $products.filter('.fpd-category').length === 0 ? $products : $products.children('.fpd-product');
			_createProductsFromHTML($products, false);

		}

		if(producJSON.length > 0) {
			instance.setupProducts(producJSON);
		}

	};

	var _createDesignJSONFromHTML = function($products) {

		var _loopDesignCategory = function($designCategories, pushToCat) {

			$designCategories.each(function(index, cat) {

				var $category = $(cat),
					categoryObj = {title: $category.attr('title'), thumbnail: $category.data('thumbnail')};

				if($category.data('parameters')) {
					categoryObj.parameters = $category.data('parameters');
				}

				pushToCat ? pushToCat.push(categoryObj) : instance.designs.push(categoryObj);

				if($category.children('.fpd-category').length > 0) {

					categoryObj.category = [];
					_loopDesignCategory($category.children('.fpd-category'), categoryObj.category);

				}
				else {

					var designImages = [];

					$category.children('img').each(function(designIndex, img) {

						var $img = $(img),
							designObj = {
								source: $img.data('src') === undefined ? $img.attr('src') : $img.data('src'),
								title: $img.attr('title'),
								parameters: $img.data('parameters'),
								thumbnail: $img.data('thumbnail')
							};

						designImages.push(designObj);

					});

					categoryObj.designs = designImages;

				}

			});

		};

		if($designs.length > 0) {

			//check if categories are used or first category also includes sub-cats
			if($designs.filter('.fpd-category').length > 1 || $designs.filter('.fpd-category:first').children('.fpd-category').length > 0) {

				_loopDesignCategory($designs.filter('.fpd-category'));

			}
			else { //display single category or designs without categories

				var $designImages = $designs;
				if($designImages.hasClass('fpd-category')) {
					$designImages = $designImages.children('img');
				}

				$designImages.each(function(designIndex, img) {

					var $img = $(img),
						designObj = {
							source: $img.data('src') === undefined ? $img.attr('src') : $img.data('src'),
							title: $img.attr('title'),
							parameters: $img.data('parameters'),
							thumbnail: $img.data('thumbnail')
						};

					instance.designs.push(designObj);

				});

			}

			$designs.remove();

			instance.setupDesigns(instance.designs);
		}

	};

	//get category index by category name
	var _getCategoryIndexInProducts = function(catName) {

		var catIndex =  $.map(instance.products, function(obj, index) {
		    if(obj.category == catName) {
		        return index;
		    }
		}).shift();

		return isNaN(catIndex) ? false : catIndex;

	};

	var _toggleUndoRedoBtn = function(undos, redos) {

		if(undos.length === 0) {
		  	instance.$actionsWrapper.find('[data-action="undo"]').addClass('fpd-disabled');
  		}
  		else {
	  		instance.$actionsWrapper.find('[data-action="undo"]').removeClass('fpd-disabled');
  		}

  		if(redos.length === 0) {
	  		instance.$actionsWrapper.find('[data-action="redo"]').addClass('fpd-disabled');
  		}
  		else {
	  		instance.$actionsWrapper.find('[data-action="redo"]').removeClass('fpd-disabled');
  		}

	};

	var _updateEditorBox = function(element) {

		if($editorBox === null) {
			return;
		}

		$editorBox.children('div').empty();
		$editorBox.children('h5').text(element.title);

		for(var i=0; i < instance.mainOptions.editorBoxParameters.length; ++i) {

			var parameter = instance.mainOptions.editorBoxParameters[i],
				value = element[parameter];

			if(value !== undefined) {

				value = typeof value === 'number' ? value.toFixed(2) : value;
				value = (typeof value === 'object' && value.source) ? value.source.src : value;
				if(parameter === 'fill' && element.type === FPDPathGroupName) {
					value = element.svgFill;
				}

				$editorBox.children('div').append('<p><i>'+parameter+'</i>: <input type="text" value="'+value+'" readonly /></p>');

			}

		}

	};

	var _onViewCreated = function() {

		//add all views of product till views end is reached
		if(instance.viewInstances.length < instance.currentViews.length) {

			instance.addView(instance.currentViews[instance.viewInstances.length]);

		}
		//all views added
		else {

			$elem.off('viewCreate', _onViewCreated);

			instance.toggleSpinner(false);
			instance.selectView(0);

			//search for object with auto-select
			if(!instance.mainOptions.editorMode && instance.currentViewInstance && $(instance.currentViewInstance.stage.getElement()).is(':visible')) {
				var viewElements = instance.currentViewInstance.stage.getObjects(),
					selectElement = null;

				for(var i=0; i < viewElements.length; ++i) {
					var obj = viewElements[i];

					 if(obj.autoSelect && !obj.hasUploadZone) {
					 	selectElement = obj;
					 }

				}
			}

			if(selectElement && instance.currentViewInstance) {
				setTimeout(function() {

					instance.currentViewInstance.stage.setActiveObject(selectElement);
					selectElement.setCoords();
					instance.currentViewInstance.stage.renderAll();

				}, 10);
			}

			instance.productCreated = true;

			//close dialog and off-canvas on element add
			if(instance.mainOptions.hideDialogOnAdd && instance.$container.hasClass('fpd-topbar')
				&& instance.mainBar && instance.mainBar.__setup) {

				instance.mainBar.toggleDialog(false);


			}
			if(instance.mainBar) {
				instance.mainBar.__setup = true; //initial active module fix
			}


			/**
		     * Gets fired as soon as a product has been fully added to the designer.
		     *
		     * @event FancyProductDesigner#productCreate
		     * @param {Event} event
		     * @param {array} currentViews - An array containing all views of the product.
		     */
			$elem.trigger('productCreate', [instance.currentViews]);

		}

	};

	var _updateElementTooltip = function() {

		var element = instance.currentElement;

		if(element && instance.$elementTooltip && instance.productCreated && !element.uploadZone) {

			if(element.isOut && element.boundingBoxMode === 'inside') {
				instance.$elementTooltip.text(_outOfBoundingBoxLabel).show();
			}
			else if(instance.mainOptions.imageSizeTooltip && FPDUtil.getType(element.type) === 'image') {
				instance.$elementTooltip.text(parseInt(element.width * element.scaleX) +' x '+ parseInt(element.height * element.scaleY)).show();
			}
			else {
				instance.$elementTooltip.hide();
			}

			var oCoords = element.oCoords;
			instance.$elementTooltip.css({
				left: oCoords.mt.x,
				top: oCoords.mt.y - element.cornerSize - element.padding - instance.$elementTooltip.height() - 10
			});

		}
		else if(instance.$elementTooltip) {
			instance.$elementTooltip.hide();
		}

	};

	var _loadTemplate = function(template, type, loadIndex, callback) {

		var templateType = $.isArray(type) ? type[loadIndex] : type;

		$.get(
			instance.mainOptions.templatesDirectory+template+'.'+templateType,
			callback
		)
		.fail(function() {

			if($.isArray(type) && type[loadIndex+1]) {
				_loadTemplate(template, type, ++loadIndex, callback);
			}
			else {
				alert(instance.mainOptions.templatesDirectory+template+'.'+templateType+' could not be loaded.')
			}

		});

	};

	/**
	 * Adds a new product to the product designer.
	 *
	 * @method addProduct
	 * @param {array} views An array containing the views for a product. A view is an object with a title, thumbnail and elements property. The elements property is an array containing one or more objects with source, title, parameters and type.
	 * @param {string} [category] If categories are used, you need to define the category title.
	 */
	this.addProduct = function(views, category) {

		var catIndex = _getCategoryIndexInProducts(category);

		/*views.forEach(function(view) {
			view.options = view.options === undefined && typeof view.options !== 'object' ? instance.mainOptions : fpdOptionsInstance.merge(instance.mainOptions, view.options)
		});*/

		if(category === undefined) {
			instance.products.push(views);
		}
		else {

			if(catIndex === false) {

				catIndex = instance.products.length;
				instance.products[catIndex] = {category: category, products: []};

			}

			instance.products[catIndex].products.push(views);

		}

		/**
		 * Gets fired when a product is added.
		 *
		 * @event FancyProductDesigner#productAdd
		 * @param {Event} event
		 * @param {Array} views - The product views.
		 * @param {String} category - The category title.
		 * @param {Number} catIndex - The index of the category.
		 */
		$elem.trigger('productAdd', [views, category, catIndex]);

	};

	/**
	 * Selects a product by index and category index.
	 *
	 * @method selectProduct
	 * @param {number} index The requested product by an index value. 0 will load the first product.
	 * @param {number} [categoryIndex] The requested category by an index value. 0 will load the first category.
	 * @example fpd.selectProduct( 1, 2 ); //will load the second product from the third category
	 */
	this.selectProduct = function(index, categoryIndex) {

		instance.currentCategoryIndex = categoryIndex === undefined ? instance.currentCategoryIndex : categoryIndex;

		var productsObj;
		if(instance.products && instance.products.length && instance.products[0].category) { //categories enabled
			var category = instance.products[instance.currentCategoryIndex];
			productsObj = category.products;
		}
		else { //no categories enabled
			productsObj = instance.products;
		}

		instance.currentProductIndex = index;
		if(index < 0) { currentProductIndex = 0; }
		else if(index > productsObj.length-1) { instance.currentProductIndex = productsObj.length-1; }

		var product = productsObj[instance.currentProductIndex];

		/**
		 * Gets fired when a product is selected.
		 *
		 * @event FancyProductDesigner#productSelect
		 * @param {Event} event
		 * @param {Number} index - The index of the product in the category.
		 * @param {Number} categoryIndex - The index of the category.
		 * @param {Object} product - An object containing the product (views).
		 */
		$elem.trigger('productSelect', [index, categoryIndex, product]);

		instance.loadProduct(product, instance.mainOptions.replaceInitialElements);

	};

	/**
	 * Loads a new product to the product designer.
	 *
	 * @method loadProduct
	 * @param {array} views An array containing the views for the product.
	 * @param {Boolean} [onlyReplaceInitialElements=false] If true, the initial elements will be replaced. Custom added elements will stay on the canvas.
	 * @param {Boolean} [mergeMainOptions=false] Merges the main options into every view options.
	 */
	this.loadProduct = function(views, replaceInitialElements, mergeMainOptions) {

		if(!views) { return; }

		replaceInitialElements = replaceInitialElements === undefined ? false : replaceInitialElements;
		mergeMainOptions = mergeMainOptions === undefined ? false : mergeMainOptions;

		if($stageLoader.is(':hidden')) {
			instance.toggleSpinner(true);
		}

		//reset when loading a product
		instance.productCreated = productIsCustomized = false;
		instance.colorLinkGroups = {};

		globalCustomElements = [];
		if(replaceInitialElements) {

			globalCustomElements = instance.getCustomElements();
			if(globalCustomElements.length > 0) {
				productIsCustomized = true;
			}

		}
		else {
			instance.doUnsavedAlert = false;
		}

		instance.reset();

		if(mergeMainOptions) {

			views.forEach(function(view, i) {
				view.options = fpdOptionsInstance.merge(instance.mainOptions, view.options);
			});

		}

		instance.currentViews = views;

		_totalProductElements = _productElementLoadingIndex = 0;
		views.forEach(function(view, i) {
			_totalProductElements += view.elements.length;
		});

		instance.$viewSelectionWrapper = $('<div class="fpd-views-selection fpd-clearfix"></div>');

		if($elem.hasClass('fpd-views-outside') || $elem.hasClass('fpd-device-smartphone')) {
			$elem.after(instance.$viewSelectionWrapper);
		}
		else {
			instance.$mainWrapper.append(instance.$viewSelectionWrapper);
		}

		$elem.on('viewCreate', _onViewCreated);

		if(views) {
			instance.addView(views[0]);
		}

	};

	/**
	 * Adds a view to the current visible product.
	 *
	 * @method addView
	 * @param {object} view An object with title, thumbnail and elements properties.
	 */
	this.addView = function(view) {

		var viewImageURL = instance.mainOptions._loadFromScript ? instance.mainOptions._loadFromScript + view.thumbnail : view.thumbnail;

		instance.$viewSelectionWrapper.append('<div class="fpd-shadow-1 fpd-item fpd-tooltip" title="'+view.title+'"><picture style="background-image: url('+viewImageURL+');"></picture></div>')
		.children('div:last').click(function(evt) {

			instance.selectView(instance.$viewSelectionWrapper.children('div').index($(this)));

		});

		view.options = view.options === undefined && typeof view.options !== 'object' ? instance.mainOptions : fpdOptionsInstance.merge(instance.mainOptions, view.options);

		var viewInstance = new FancyProductDesignerView(instance.$productStage, view, function(viewInstance) {

			//remove view instance if not added to product container
			if($(viewInstance.stage.wrapperEl).parent().length === 0) {
				viewInstance.reset();
				return;
			}

			if(instance.viewInstances.length == 0) {
				viewInstance.resetCanvasSize();
			}

			instance.viewInstances.push(viewInstance);
			/**
			 * Gets fired when a view is created.
			 *
			 * @event FancyProductDesigner#viewCreate
			 * @param {Event} event
			 * @param {FancyProductDesignerView} viewInstance
			 */
			$elem.trigger('viewCreate', [viewInstance]);

		}, instance.mainOptions.fabricCanvasOptions);


		viewInstance.stage.on({

			'object:scaling': function(opts) {
			},
			'object:moving': function(opts) {
			},
			'object:rotating': function(opts) {
			}

		});

		$(viewInstance)
		.on('beforeElementAdd', function(evt, type, source, title, params) {

			if(!instance.productCreated) {
				_productElementLoadingIndex++;

				var loadElementState = title + '<br>' + String(_productElementLoadingIndex) + '/' + _totalProductElements;
				$stageLoader.find('.fpd-loader-text').html(loadElementState);
			}

		})
		.on('elementAdd', function(evt, element) {

			if(!element) {
				return;
			}

			//check if element has a color linking group
			if(element.colorLinkGroup && element.colorLinkGroup.length > 0) {

				var viewIndex = this.getIndex();

				if(instance.colorLinkGroups.hasOwnProperty(element.colorLinkGroup)) { //check if color link object exists for the link group

					//add new element with id and view index of it
					instance.colorLinkGroups[element.colorLinkGroup].elements.push({id: element.id, viewIndex: viewIndex});

					if(typeof element.colors === 'object') {

						//create color group colors
						var colorGroupColors = instance.mainOptions.replaceColorsInColorGroup ? element.colors : instance.colorLinkGroups[element.colorLinkGroup].colors.concat(element.colors);
						instance.colorLinkGroups[element.colorLinkGroup].colors = FPDUtil.arrayUnique(colorGroupColors);

					}

				}
				else {

					//create initial color link object
					instance.colorLinkGroups[element.colorLinkGroup] = {elements: [{id:element.id, viewIndex: viewIndex}], colors: []};

					if(typeof element.colors === 'object') {

						instance.colorLinkGroups[element.colorLinkGroup].colors = element.colors;

					}

				}

			}

			//close dialog and off-canvas on element add
			if(instance.productCreated && instance.mainOptions.hideDialogOnAdd && instance.$container.hasClass('fpd-topbar') && instance.mainBar) {

				instance.mainBar.toggleDialog(false);

			}

			/**
			 * Gets fired when an element is added.
			 *
			 * @event FancyProductDesigner#elementAdd
			 * @param {Event} event
			 * @param {fabric.Object} element
			 */
			$elem.trigger('elementAdd', [element]);

			$elem.trigger('viewCanvasUpdate', [viewInstance]);

		})
		.on('boundingBoxToggle', function(evt, currentBoundingObject, addRemove) {

			/**
		     * Gets fired as soon as the bounding box is added to or removed from the stage.
		     *
		     * @event FancyProductDesigner#boundingBoxToggle
		     * @param {Event} event
		     * @param {fabric.Object} currentBoundingObject - A fabricJS rectangle representing the bounding box.
		     * @param {Boolean} addRemove - True=added, false=removed.
		     */
			$elem.trigger('boundingBoxToggle', [currentBoundingObject, addRemove]);

		})
		.on('elementSelect', function(evt, element) {

			instance.currentElement = element;

			if(element) {
				_updateElementTooltip();
			}
			else { //deselected

				if(instance.$elementTooltip) {
					instance.$elementTooltip.hide();
				}

				instance.$mainWrapper.children('.fpd-snap-line-h, .fpd-snap-line-v').hide();

			}
			/**
			 * Gets fired when an element is selected.
			 *
			 * @event FancyProductDesigner#elementSelect
			 * @param {Event} event
			 * @param {fabric.Object} element
			 */
			$elem.trigger('elementSelect', [element]);

		})
		.on('elementChange', function(evt, type, element) {

			_updateElementTooltip();
			_updateEditorBox(element.getBoundingRect());

			/**
			 * Gets fired when an element is changed.
			 *
			 * @event FancyProductDesigner#elementChange
			 * @param {Event} event
			 * @param {fabric.Object} element
			 */
			$elem.trigger('elementChange', [type, element]);

		})
		.on('elementModify', function(evt, element, parameters) {

			_updateElementTooltip();

			/**
			 * Gets fired when an element is modified.
			 *
			 * @event FancyProductDesigner#elementModify
			 * @param {Event} event
			 * @param {fabric.Object} element
			 * @param {Object} parameters
			 */
			$elem.trigger('elementModify', [element, parameters]);

			/**
			 * Gets fired when an element is modified.
			 *
			 * @event FancyProductDesigner#viewCanvasUpdate
			 * @param {Event} event
			 * @param {FancyProductDesignerView} viewInstance
			 */
			$elem.trigger('viewCanvasUpdate', [viewInstance]);

		})
		.on('undoRedoSet', function(evt, undos, redos) {

			instance.doUnsavedAlert = productIsCustomized = true;
			_toggleUndoRedoBtn(undos, redos);

			/**
			 * Gets fired when an undo or redo state is set.
			 *
			 * @event FancyProductDesigner#undoRedoSet
			 * @param {Event} event
			 * @param {Array} undos - Array containing all undo objects.
			 * @param {Array} redos - Array containing all redo objects.
			 */
			$elem.trigger('undoRedoSet', [undos, redos]);

		})
		.on('priceChange', function(evt, price, viewPrice) {

			instance.currentPrice = instance.singleProductPrice = 0;
			//calulate total price of all views
			for(var i=0; i < instance.viewInstances.length; ++i) {

				if(!instance.viewInstances[i].locked) {
					instance.singleProductPrice += instance.viewInstances[i].truePrice;
				}

			}

			var truePrice = instance.calculatePrice();

			/**
		     * Gets fired as soon as the price changes in a view.
		     *
		     * @event FancyProductDesigner#priceChange
		     * @param {Event} event
		     * @param {number} elementPrice - The price of the element.
		     * @param {number} totalPrice - The true price of all views with quantity.
		     * @param {number} singleProductPrice - The true price of all views without quantity.
		     */
			$elem.trigger('priceChange', [price, truePrice, instance.singleProductPrice]);

		})
		.on('elementCheckContainemt', function(evt, element, boundingBoxMode) {

			if(boundingBoxMode === 'inside') {

				_updateElementTooltip();

			}

		})
		.on('elementColorChange', function(evt, element, hex, colorLinking) {

			if(instance.productCreated && colorLinking && element.colorLinkGroup && element.colorLinkGroup.length > 0 && element.type !== FPDPathGroupName) {

				var group = instance.colorLinkGroups[element.colorLinkGroup];
				if(group && group.elements) {
					for(var i=0; i < group.elements.length; ++i) {

						var id = group.elements[i].id,
							viewIndex = group.elements[i].viewIndex,
							target = instance.getElementByID(id, viewIndex);

						if(target && target !== element && hex) {
							instance.viewInstances[viewIndex].changeColor(target, hex, false);
						}

					}
				}

			}

			/**
			 * Gets fired when the color of an element is changed.
			 *
			 * @event FancyProductDesigner#elementColorChange
			 * @param {Event} event
			 * @param {fabric.Object} element
			 * @param {String} hex Hexadecimal color string.
			 * @param {Boolean} colorLinking Color of element is linked to other colors.
			 */
			$elem.trigger('elementColorChange', [element, hex, colorLinking]);
			$elem.trigger('viewCanvasUpdate', [viewInstance]);

		})
		.on('elementRemove', function(evt, element) {

			/**
		     * Gets fired as soon as an element has been removed.
		     *
		     * @event FancyProductDesigner#elementRemove
		     * @param {Event} event
		     * @param {fabric.Object} element - The fabric object that has been removed.
		     */
			$elem.trigger('elementRemove', [element]);

			$elem.trigger('viewCanvasUpdate', [viewInstance]);

		})
		.on('fabricObject:added fabricObject:removed', function(evt, element) {

			$elem.trigger(evt.type, [element]);

		});

		viewInstance.setup();

		FPDUtil.updateTooltip();

		instance.$viewSelectionWrapper.children().length > 1 ? instance.$viewSelectionWrapper.show() : instance.$viewSelectionWrapper.hide();

	};

	/**
	 * Selects a view from the current visible views.
	 *
	 * @method selectView
	 * @param {number} index The requested view by an index value. 0 will load the first view.
	 */
	this.selectView = function(index) {

		if(instance.viewInstances.length <= 0) {return;}

		instance.resetZoom();

		instance.currentViewIndex = index;
		if(index < 0) { instance.currentViewIndex = 0; }
		else if(index > instance.viewInstances.length-1) { instance.currentViewIndex = instance.viewInstances.length-1; }

		instance.$viewSelectionWrapper.children('div').removeClass('fpd-view-active')
		.eq(index).addClass('fpd-view-active');

		instance.$mainWrapper.children('.fpd-ruler').remove();

		if(instance.currentViewInstance) {
			//delete all undos/redos
			instance.currentViewInstance.undos = [];
			instance.currentViewInstance.redos = [];

			//remove some objects
			var removeObjs = ['_snap_lines_group', '_ruler_hor', '_ruler_ver'];
			for(var i=0; i<removeObjs.length; ++i) {
				var removeObj = instance.currentViewInstance.getElementByID(removeObjs[i]);
				if(removeObj) {
					instance.currentViewInstance.stage.remove(removeObj);
				}
			}

			instance.currentViewInstance._snapElements = false;

		}

		instance.currentViewInstance = instance.viewInstances[instance.currentViewIndex];

		instance.deselectElement();

		//select view wrapper and render stage of view
		instance.$productStage.children('.fpd-view-stage').addClass('fpd-hidden').eq(instance.currentViewIndex).removeClass('fpd-hidden');
		instance.currentViewInstance.stage.renderAll();

		//toggle custom adds
		if($mainBar && $mainBar.find('.fpd-navigation').length) {
			var viewOpts = instance.currentViewInstance.options,
				$nav = $mainBar.find('.fpd-navigation');

			$nav.children('[data-module="designs"]').toggleClass('fpd-disabled', !viewOpts.customAdds.designs);
			$nav.children('[data-module="images"]').toggleClass('fpd-disabled', !viewOpts.customAdds.uploads);
			$nav.children('[data-module="text"]').toggleClass('fpd-disabled', !viewOpts.customAdds.texts);

			//PLUS
			if(typeof FPDNamesNumbersModule !== 'undefined') {
				$nav.children('[data-module="names-numbers"]').toggleClass('fpd-disabled', !instance.currentViewInstance.textPlaceholder && !instance.currentViewInstance.numberPlaceholder);
			}
			$nav.children('[data-module="drawing"]').toggleClass('fpd-disabled', !viewOpts.customAdds.drawing);

			//select nav item, if sidebar layout is used, no active item is set and active item is not disabled
			if($elem.hasClass('fpd-sidebar')) {

				if(($nav.children('.fpd-active').length === 0) || $nav.children('.fpd-active').hasClass('fpd-disabled')) {

					$nav.children(':not(.fpd-disabled)').length > 0 ? $nav.children(':not(.fpd-disabled)').first().click() : instance.mainBar.$content.children('.fpd-module').removeClass('fpd-active');
				}
				else if(instance.mainBar.$content.children('.fpd-active').length == 0 && instance.productCreated) {
					$nav.children(':first').click()
				}

			}
			else if($elem.hasClass('fpd-topbar')) {

				if($nav.children('.fpd-active').hasClass('fpd-disabled')) {

					instance.mainBar.toggleDialog(false);
				}

			}


			//if products module is hidden and selected, select next
			if(instance.$container.hasClass('fpd-products-module-hidden') && $nav.children('.fpd-active').filter('[data-module="products"]').length > 0) {
				$nav.children(':not(.fpd-disabled)').eq(1).click();
			}

		}

		//adjust off-canvas height to view height
		if(instance.mainBar && instance.mainBar.$content && instance.$container.filter('[class*="fpd-off-canvas-"]').length > 0) {
			instance.mainBar.$content.height(instance.$mainWrapper.height());
		}

		_toggleUndoRedoBtn(instance.currentViewInstance.undos, instance.currentViewInstance.redos);

		if(instance.moduleInstance_designs) {
			instance.moduleInstance_designs.toggleCategories();
		}

		//toggle view locker
		instance.$mainWrapper.children('.fpd-modal-lock')
		.removeClass('fpd-animated')
		.toggleClass('fpd-active', instance.currentViewInstance.options.optionalView)
		.toggleClass('fpd-unlocked', !instance.currentViewInstance.locked);
		setTimeout(function() {
			instance.$mainWrapper.children('.fpd-modal-lock').addClass('fpd-animated');
		}, 1);

		//reset view canvas size
		instance.$productStage.width(instance.currentViewInstance.options.stageWidth);
		instance.currentViewInstance.resetCanvasSize();


		/**
	     * Gets fired as soon as a view has been selected.
	     *
	     * @event FancyProductDesigner#viewSelect
	     * @param {Event} event
	     * @param {Number} viewIndex
	     * @param {Object} viewInstance
	     */
		$elem.trigger('viewSelect', [instance.currentViewIndex, instance.currentViewInstance]);

	};

	/**
	 * Adds a new element to the product designer.
	 *
	 * @method addElement
	 * @param {string} type The type of an element you would like to add, 'image' or 'text'.
	 * @param {string} source For image the URL to the image and for text elements the default text.
	 * @param {string} title Only required for image elements.
	 * @param {object} [parameters={}] An object with the parameters, you would like to apply on the element.
	 * @param {number} [viewIndex] The index of the view where the element needs to be added to. If no index is set, it will be added to current showing view.
	 */
	this.addElement = function(type, source, title, parameters, viewIndex) {

		parameters = parameters === undefined ? {} : parameters;

		viewIndex = viewIndex === undefined ? instance.currentViewIndex : viewIndex;

		instance.viewInstances[viewIndex].addElement(type, source, title, parameters);

		//element should be replaced in all views
		if(parameters.replace && parameters.replaceInAllViews) {

			for(var i=0; i < instance.viewInstances.length; ++i) {

				var viewInstance = instance.viewInstances[i];
				//check if not current view and view has at least one element with the replace value
				if(viewIndex !== i && viewInstance.getElementByReplace(parameters.replace) !== null) {
					viewInstance.addElement(type, source, title, parameters, i);
				}

			}

		}

	};

	/**
	 * Sets the parameters for a specified element.
	 *
	 * @method setElementParameters
	 * @param {object} parameters An object with the parameters that should be applied to the element.
	 * @param {fabric.Object | string} [element] A fabric object or the title of an element. If not set, the current selected element is used.
	 * @param {Number} [viewIndex] The index of the view you would like target. If not set, the current showing view will be used.
	 */
	this.setElementParameters = function(parameters, element, viewIndex) {

		element = element === undefined ? instance.stage.getActiveObject() : element;
		viewIndex = viewIndex === undefined ? instance.currentViewIndex : viewIndex;

		if(!element || parameters === undefined) {
			return false;
		}

		instance.viewInstances[viewIndex].setElementParameters(parameters, element);

	};

	/**
	 * Clears the product stage and resets everything.
	 *
	 * @method reset
	 */
	this.reset = function() {

		if(instance.currentViews === null) { return; }

		$elem.off('viewCreate', _onViewCreated);

		instance.deselectElement();
		instance.resetZoom();
		instance.currentViewIndex = instance.currentPrice = instance.singleProductPrice = instance.pricingRulesPrice = 0;
		instance.currentViewInstance = instance.currentViews = instance.currentElement = null;

		instance.$mainWrapper.find('.fpd-view-stage').remove();
		$body.find('.fpd-views-selection').remove();

		instance.viewInstances = [];

		/**
	     * Gets fired as soon as the stage has been cleared.
	     *
	     * @event FancyProductDesigner#clear
	     * @param {Event} event
	     */
		$elem.trigger('clear');
		$elem.trigger('priceChange', [0, 0, 0]);
		stageCleared = true;

	};

	/**
	 * Deselects the selected element of the current showing view.
	 *
	 * @method deselectElement
	 */
	this.deselectElement = function() {

		if(instance.currentViewInstance) {

			instance.currentViewInstance.deselectElement();

		}

	};

	/**
	 * Creates all views in one data URL. The different views will be positioned below each other.
	 *
	 * @method getProductDataURL
	 * @param {Function} callback A function that will be called when the data URL is created. The function receives the data URL.
	 * @param {String} [backgroundColor=transparent] The background color as hexadecimal value. For 'png' you can also use 'transparent'.
	 * @param {Object} [options={}] See fabricjs documentation http://fabricjs.com/docs/fabric.Canvas.html#toDataURL.
	 * @param {Boolean} [options.onlyExportable=false] If true elements with excludeFromExport=true are not exported in the image.
	 * @example fpd.getProductDataURL( function(dataURL){} );
	 */
	this.getProductDataURL = function(callback, backgroundColor, options) {

		callback = callback === undefined ? function() {} : callback ;
		backgroundColor = backgroundColor === undefined ? 'transparent' : backgroundColor;
		options = options === undefined ? {} : options;
		options.onlyExportable = options.onlyExportable === undefined ? false : options.onlyExportable;

		//check
		if(instance.viewInstances.length === 0) { callback('') }

		instance.resetZoom();

		$body.append('<canvas id="fpd-hidden-canvas"></canvas>');

		var printCanvas = new fabric.Canvas('fpd-hidden-canvas', {
				containerClass: 'fpd-hidden fpd-hidden-canvas',
				enableRetinaScaling: false
			}),
			viewCount = 0,
			multiplier = options.multiplier ? options.multiplier : 1;

		function _addCanvasImage(viewInstance) {

			if(viewInstance.options.stageWidth * multiplier > printCanvas.getWidth()) {
				printCanvas.setDimensions({width: viewInstance.options.stageWidth * multiplier});
			}

			viewInstance.toDataURL(function(dataURL) {

				fabric.Image.fromURL(dataURL, function(img) {

					printCanvas.add(img);

					if(viewCount > 0) {
						img.set('top', printCanvas.getHeight());
						printCanvas.setDimensions({height: (printCanvas.getHeight() + viewInstance.options.stageHeight)});
					}

					viewCount++;
					if(viewCount < instance.viewInstances.length) {
						_addCanvasImage(instance.viewInstances[viewCount]);
					}
					else {
						callback(printCanvas.toDataURL(options));
						printCanvas.dispose();
						$body.children('#fpd-hidden-canvas').remove();

						if(instance.currentViewInstance) {
							instance.currentViewInstance.resetCanvasSize();
						}

					}

				});

			}, backgroundColor, options, instance.watermarkImg);

		};

		var firstView = instance.viewInstances[0];
		printCanvas.setDimensions({width: firstView.options.stageWidth * multiplier, height: firstView.options.stageHeight * multiplier});
		_addCanvasImage(firstView);

	};

	/**
	 * Gets the views as data URL.
	 *
	 * @method getViewsDataURL
	 * @param {Function} callback A function that will be called when the data URL is created. The function receives the data URL.
	 * @param {string} [backgroundColor=transparent] The background color as hexadecimal value. For 'png' you can also use 'transparent'.
	 * @param {string} [options={}] See fabricjs documentation http://fabricjs.com/docs/fabric.Canvas.html#toDataURL.
	 * @param {Boolean} [options.onlyExportable=false] If true elements with excludeFromExport=true are not exported in the image.
	 * @return {array} An array with all views as data URLs.
	 */
	this.getViewsDataURL = function(callback, backgroundColor, options) {

		callback = callback === undefined ? function() {} : callback;
		backgroundColor = backgroundColor === undefined ? 'transparent' : backgroundColor;
		options = options === 'undefined' ? {} : options;

		var dataURLs = [];

		instance.resetZoom();
		for(var i=0; i < instance.viewInstances.length; ++i) {

			instance.viewInstances[i].toDataURL(function(dataURL) {

				dataURLs.push(dataURL);

				if(dataURLs.length === instance.viewInstances.length) {
					callback(dataURLs);
				}

			}, backgroundColor, options, instance.watermarkImg);

		}

	};

	/**
	 * Returns the views as SVG.
	 *
	 * @method getViewsSVG
	 * @param {Object} options See http://fabricjs.com/docs/fabric.StaticCanvas.html#toSVG.
	 * @param {Function} reviver See http://fabricjs.com/docs/fabric.StaticCanvas.html#toSVG.
	 * @return {array} An array with all views as SVG.
	 */
	this.getViewsSVG = function(options, reviver, respectPrintingBox) {

		var SVGs = [];

		for(var i=0; i < instance.viewInstances.length; ++i) {
			SVGs.push(instance.viewInstances[i].toSVG(options, reviver, respectPrintingBox));
		}

		return SVGs;

	};

	/**
	 * Shows or hides the spinner with an optional message.
	 *
	 * @method toggleSpinner
	 * @param {String} state The state can be "show" or "hide".
	 * @param {Boolean} msg The message that will be displayed underneath the spinner.
	 * @return {jQuery} $stageLoader jQuery object containing the stage loader.
	 */
	this.toggleSpinner = function(state, msg) {

		state = state === undefined ? true : state;
		msg = msg === undefined ? '' : msg;

		if(state) {

			$stageLoader.fadeIn(300).find('.fpd-loader-text').html(msg);

		}
		else {

			$stageLoader.stop().fadeOut(300);

		}

		return $stageLoader;

	};

	/**
	 * Returns an fabric object by title.
	 *
	 * @method getElementByTitle
	 * @param {String} title The title of an element.
	 * @param {Number} [viewIndex=-1] The index of the target view. By default all views are scanned.
	 * @return {fabric.Object} FabricJS Object.
	 */
	this.getElementByTitle = function(title, viewIndex) {

		viewIndex === undefined ? -1 : viewIndex;

		var searchedElement = false;
		this.getElements(viewIndex, 'all', false).some(function(element) {

			if(element.title == title) {
				searchedElement = element;
				return true;
			}

		});

		return searchedElement;

	};

	/**
	 * Returns an array with fabricjs objects.
	 *
	 * @method getElements
	 * @param {Number} [viewIndex=-1] The index of the target view. By default all views are target.
	 * @param {String} [elementType='all'] The type of elements to return. By default all types are returned. Possible values: text, image.
	 * @param {String} [deselectElement=true] Deselect current selected element.
	 * @return {Array} An array containg the elements.
	 */
	this.getElements = function(viewIndex, elementType, deselectElement) {

		viewIndex = viewIndex === undefined || isNaN(viewIndex) ? -1 : viewIndex;
		elementType = elementType === undefined ? 'all' : elementType;
		deselectElement = deselectElement === undefined ? true : deselectElement;

		if(deselectElement) {
			this.deselectElement();
		}

		var allElements = [];
		if(viewIndex === -1) {

			for(var i=0; i < instance.viewInstances.length; ++i) {
				allElements = allElements.concat(instance.viewInstances[i].stage.getObjects());
			}

		}
		else {
			allElements = instance.viewInstances[viewIndex].stage.getObjects();
		}

		//remove bounding-box and printing-box object
		allElements = allElements.filter(function(obj) {
			return obj.name !== 'bounding-box' && obj.name !== 'printing-box';
		});

		if(elementType === 'text') {

			var textElements = [];
			allElements.forEach(function(elem) {

				if(FPDUtil.getType(elem.type) === 'text') {
					textElements.push(elem);
				}

			});

			return textElements;

		}
		else if(elementType === 'image') {

			var imageElements = [];
			allElements.forEach(function(elem) {

				if(FPDUtil.getType(elem.type) === 'image') {
					imageElements.push(elem);
				}

			});

			return imageElements;

		}

		return allElements;

	};

	/**
	 * Opens the current showing product in a Pop-up window and shows the print dialog.
	 *
	 * @method print
	 */
	this.print = function() {

		var _createPopupImage = function(dataURLs) {

			var images = [],
				imageLoop = 0;

			//load all images first
			for(var i=0; i < dataURLs.length; ++i) {

				var image = new Image();
				image.src = dataURLs[i];
				image.onload = function() {

					images.push(this);
					imageLoop++;

					//add images to popup and print popup
					if(imageLoop == dataURLs.length) {

						var popup = window.open('','','width='+images[0].width+',height='+(images[0].height*dataURLs.length)+',location=no,menubar=no,scrollbars=yes,status=no,toolbar=no');
						FPDUtil.popupBlockerAlert(popup, instance);

						popup.document.title = "Print Image";
						for(var j=0; j < images.length; ++j) {
							$(popup.document.body).append('<img src="'+images[j].src+'" />');
						}

						setTimeout(function() {
							popup.print();
						}, 1000);

					}
				}

			}

		};

		instance.getViewsDataURL(_createPopupImage);

	};

	/**
	 * Creates an image of the current showing product.
	 *
	 * @method createImage
	 * @param {boolean} [openInBlankPage= true] Opens the image in a Pop-up window.
	 * @param {boolean} [forceDownload=false] Downloads the image to the user's computer.
	 * @param {string} [backgroundColor=transparent] The background color as hexadecimal value. For 'png' you can also use 'transparent'.
	 * @param {string} [options] See fabricjs documentation http://fabricjs.com/docs/fabric.Canvas.html#toDataURL.
	 * @param {Boolean} [options.onlyExportable=false] If true elements with excludeFromExport=true are not exported in the image.
	 */
	this.createImage = function(openInBlankPage, forceDownload, backgroundColor, options) {

		openInBlankPage = openInBlankPage === undefined ? true : openInBlankPage;
		forceDownload = forceDownload === undefined ? false : forceDownload;
		backgroundColor = backgroundColor === undefined ? 'transparent' : backgroundColor;
		options = options === undefined ? {} : options;

		var format = options.format === undefined ? 'png' : options.format;

		instance.getProductDataURL(function(dataURL) {

			var image = new Image();
			image.src = dataURL;

			image.onload = function() {

				if(openInBlankPage) {

					var popup = window.open('','_blank');
					FPDUtil.popupBlockerAlert(popup, instance);

					popup.document.title = "Product Image";
					$(popup.document.body).append('<img src="'+this.src+'" download="product.'+format+'" />');

					if(forceDownload) {
						window.location.href = popup.document.getElementsByTagName('img')[0].src.replace('image/'+format+'', 'image/octet-stream');
					}
				}

			}

		}, backgroundColor, options);


	};

	/**
	 * Sets the zoom of the stage. 1 is equal to no zoom.
	 *
	 * @method setZoom
	 * @param {number} value The zoom value.
	 */
	this.setZoom = function(value) {

		zoomReseted = false;
		this.deselectElement();

		if(instance.currentViewInstance) {

			var responsiveScale = instance.currentViewInstance.responsiveScale;

			var point = new fabric.Point(instance.currentViewInstance.stage.getWidth() * 0.5, instance.currentViewInstance.stage.getHeight() * 0.5);

			instance.currentViewInstance.stage.zoomToPoint(point, value * responsiveScale);

			if(value == 1) {
				instance.resetZoom();
			}

		}


	};

	/**
	 * Resets the zoom.
	 *
	 * @method resetZoom
	 */
	this.resetZoom = function() {

		zoomReseted = true;
		this.deselectElement();

		if(instance.currentViewInstance) {

			var responsiveScale = instance.currentViewInstance.responsiveScale;

			instance.currentViewInstance.stage.zoomToPoint(new fabric.Point(0, 0), responsiveScale);
			instance.currentViewInstance.stage.absolutePan(new fabric.Point(0, 0));

		}

	};

	/**
	 * Get an elment by ID.
	 *
	 * @method getElementByID
	 * @param {Number} id The id of an element.
	 * @param {Number} [viewIndex] The view index you want to search in. If no index is set, it will use the current showing view.
	 */
	this.getElementByID = function(id, viewIndex) {

		viewIndex = viewIndex === undefined ? instance.currentViewIndex : viewIndex;

		return instance.viewInstances[viewIndex] ? instance.viewInstances[viewIndex].getElementByID(id) : null;

	};

	/**
	 * Returns the current showing product with all views and elements in the views.
	 *
	 * @method getProduct
	 * @param {boolean} [onlyEditableElements=false] If true, only the editable elements will be returned.
	 * @param {boolean} [customizationRequired=false] To receive the product the user needs to customize the initial elements.
	 * @return {array} An array with all views. A view is an object containing the title, thumbnail, custom options and elements. An element object contains the title, source, parameters and type.
	 */
	this.getProduct = function(onlyEditableElements, customizationRequired) {

		onlyEditableElements = onlyEditableElements === undefined ? false : onlyEditableElements;
		customizationRequired = customizationRequired === undefined ? false : customizationRequired;

		if(customizationRequired && !productIsCustomized) {
			FPDUtil.showMessage(instance.getTranslation('misc', 'customization_required_info'));
			return false;
		}

		this.deselectElement();
		this.resetZoom();

		instance.doUnsavedAlert = false;

		//check if an element is out of his containment
		var viewElements = this.getElements(),
			product = [];
		viewElements.forEach(function(element) {

			if(element.isOut && element.boundingBoxMode === 'inside') {

				FPDUtil.showMessage(
					element.title+': '+instance.getTranslation('misc', 'out_of_bounding_box')
				);

				product = false;
			}

		});

		//abort process
		if(product === false) {
			return false;
		}

		//add views
		for(var i=0; i < instance.viewInstances.length; ++i) {

			var viewInstance = instance.viewInstances[i],
				relevantViewOpts = viewInstance.getOptions();

			var viewElements = instance.viewInstances[i].stage.getObjects(),
				jsonViewElements = [];

			for(var j=0; j < viewElements.length; ++j) {
				var element = viewElements[j];

				if(element.title !== undefined && element.source !== undefined) {
					var jsonItem = {
						title: element.title,
						source: element.source,
						parameters: instance.viewInstances[i].getElementJSON(element),
						type: FPDUtil.getType(element.type)
					};

					if(relevantViewOpts.printingBox && relevantViewOpts.printingBox.hasOwnProperty('left')  && relevantViewOpts.printingBox.hasOwnProperty('top')) {
						var pointLeftTop = element.getPointByOrigin('left', 'top'),
							bbTL = new fabric.Point(relevantViewOpts.printingBox.left, relevantViewOpts.printingBox.top),
							bbBR = new fabric.Point(relevantViewOpts.printingBox.left + relevantViewOpts.printingBox.width, relevantViewOpts.printingBox.top  + relevantViewOpts.printingBox.height)

						jsonItem.printingBoxCoords = {
							left: pointLeftTop.x - relevantViewOpts.printingBox.left,
							top: pointLeftTop.y - relevantViewOpts.printingBox.top,
							//visible: element.intersectsWithRect(bbTL, bbBR) || element.isContainedWithinRect(bbTL, bbBR)
						};

					}

					if(onlyEditableElements) {
						if(element.isEditable) {
							jsonViewElements.push(jsonItem);
						}
					}
					else {
						jsonViewElements.push(jsonItem);
					}
				}
			}

			product.push({
				title: viewInstance.title,
				thumbnail: viewInstance.thumbnail,
				elements: jsonViewElements,
				options: relevantViewOpts,
				names_numbers: viewInstance.names_numbers,
				mask: viewInstance.mask,
				locked: viewInstance.locked
			});

		}

		//returns an array with all views
		return product;

	};

	/**
	 * Get the translation of a label.
	 *
	 * @method getTranslation
	 * @param {String} section The section key you want - toolbar, actions, modules or misc.
	 * @param {String} label The label key.
	 */
	this.getTranslation = function(section, label) {

		if(instance.langJson) {

			section = instance.langJson[section];

			if(section) {
				return section[label];
			}

		}

		return '';

	};

	/**
	 * Returns an array with all custom added elements.
	 *
	 * @method getCustomElements
	 * @param {string} [type='all'] The type of elements. Possible values: 'all', 'image', 'text'.
	 * @param {Number} [viewIndex=-1] The index of the target view. By default all views are target.
	 * @param {String} [deselectElement=true] Deselect current selected element.
	 * @return {array} An array with objects with the fabric object and the view index.
	 */
	this.getCustomElements = function(type, viewIndex, deselectElement) {

		var elements = this.getElements(viewIndex, type, deselectElement),
			customElements = [];

		elements.forEach(function(element) {

			if(element.isCustom) {

				var viewIndex = instance.$productStage.children('.fpd-view-stage').index(element.canvas.wrapperEl);
				customElements.push({element: element, viewIndex: viewIndex});

			}

		});

		return customElements;

	};

	/**
	 * Adds a new custom image to the product stage. This method should be used if you are using an own image uploader for the product designer. The customImageParameters option will be applied on the images that are added via this method.
	 *
	 * @method addCustomImage
	 * @param {string} source The URL of the image.
	 * @param {string} title The title for the design.
	 * @param {Object} options Additional options.
	 */
	this.addCustomImage = function(source, title, options) {

		options = options === undefined ? {} : options;

		var image = new Image;
    		image.src = source;

    	this.toggleSpinner();
    	instance.$viewSelectionWrapper.addClass('fpd-disabled');

		image.onload = function() {

			instance._loadingCustomImage = false;

			var imageH = this.height,
				imageW = this.width,
				currentCustomImageParameters = instance.currentViewInstance.options.customImageParameters,
				imageParts = this.src.split('.'),
				scaleX = currentCustomImageParameters.scaleX || 1,
				scaleY = currentCustomImageParameters.scaleY || 1;

			if(!FPDUtil.checkImageDimensions(instance, imageW, imageH)) {
				instance.toggleSpinner(false);
    			return false;
			}

			if(currentCustomImageParameters.resizeToW || currentCustomImageParameters.resizeToH) {

				scaleX = scaleY = FPDUtil.getScalingByDimesions(
					imageW,
					imageH,
					currentCustomImageParameters.resizeToW,
					currentCustomImageParameters.resizeToH,
					currentCustomImageParameters.scaleMode
				);

			}

			if(instance.mainOptions.fitImagesInCanvas) {

				var iconTolerance = instance.mainOptions.elementParameters.cornerSize;

				if((imageW * scaleX) + iconTolerance > instance.currentViewInstance.options.stageWidth
					|| (imageH * scaleY) + iconTolerance > instance.currentViewInstance.options.stageHeight) {

					scaleX = scaleY = FPDUtil.getScalingByDimesions(
						imageW,
						imageH,
						instance.currentViewInstance.options.stageWidth - iconTolerance,
						instance.currentViewInstance.options.stageHeight - iconTolerance
					);

				}
			}

			var fixedParams = {
				scaleX: scaleX,
				scaleY: scaleY,
				isCustom: true
			};

			//enable color wheel for svg and when no colors are set
			if($.inArray('svg', imageParts) != -1 && !currentCustomImageParameters.colors) {
				fixedParams.colors = true;
			}

			instance.addElement(
    			'image',
    			source,
    			title,
	    		$.extend({}, currentCustomImageParameters, fixedParams, options)
    		);


    		instance.toggleSpinner(false);
    		instance.$viewSelectionWrapper.removeClass('fpd-disabled');
    		FPDUtil.showMessage(instance.getTranslation('misc', 'image_added'));

		}

		image.onerror = function(evt) {
			FPDUtil.showModal('Image could not be loaded!');
		}

	};

	/**
	 * Sets the dimensions of all views.
	 *
	 * @method setDimensions
	 * @param {Number} width The width in pixel.
	 * @param {Number} height The height in pixel.
	 */
	this.setDimensions = function(width, height) {

		instance.mainOptions.stageWidth = width;
		instance.mainOptions.stageHeight = height;

		instance.$container.find('.fpd-product-stage').width(width);
		for(var i=0; i < instance.viewInstances.length; ++i) {

			instance.viewInstances[i].options.stageWidth = width;
			instance.viewInstances[i].options.stageHeight = height;
			instance.viewInstances[i].resetCanvasSize();

		}

		if(instance.mainBar && instance.mainBar.$content && instance.$container.filter('[class*="fpd-off-canvas-"]').length > 0) {
			instance.mainBar.$content.height(instance.$mainWrapper.height());
		}

	};

	/**
	 * Sets the order quantity.
	 *
	 * @method setOrderQuantity
	 * @param {Number} quantity The width in pixel.
	 */
	this.setOrderQuantity = function(quantity) {

		quantity = quantity == '' || quantity < 0 ? 1 : quantity;
		instance.orderQuantity = quantity;

		var truePrice = instance.calculatePrice();

		$elem.trigger('priceChange', [null, truePrice, instance.singleProductPrice]);

	};

	/**
	 * Returns an order object containing the product from the getProduct() method. If using plus add-on and bulk variations, the variations will be added into the object.
	 *
	 * @method getOrder
	 * @param {Object} [options={}] Options for the methods that are called inside this mehtod, e.g. getProduct() can receive two parameters.
	 * @return {object} An object containing different objects representing important order data.
	 * @example
	 * // includes only editable elements and the user needs to customize the initial product
	 * fpd.getOrder( {onlyEditableElements: true, customizationRequired: true} );
	 */
	this.getOrder = function(options) {

		options = options === undefined ? {} : options;

		instance._order.product = instance.getProduct(
			options.onlyEditableElements || false,
			options.customizationRequired || false
		);

		instance._order.usedFonts = instance.getUsedFonts();
		instance._order.usedColors = [];

		instance.getUsedColors().forEach(function(hexValue) {

			var colorName = instance.mainOptions.hexNames[hexValue.replace('#', '').toLowerCase()],
				colorItem = {hex: hexValue};

			if(colorName) {
				colorItem.name = colorName;
			}

			instance._order.usedColors.push(colorItem)
		});

		instance._order.usedDepositPhotos = instance.getDepositPhotos();

		$elem.trigger('getOrder');

		return instance._order;

	};

	/**
	 * Get all fonts used in the product.
	 *
	 * @method getUsedFonts
	 * @return {array} An array with objects containing the font name and optional the URL to the font.
	 */
	this.getUsedFonts = function() {

		var _usedFonts = [], //temp to check if already included
			usedFonts = [];

		this.getElements(-1, 'all', false).forEach(function(element) {

			if(FPDUtil.getType(element.type) === 'text') {

				if(_usedFonts.indexOf(element.fontFamily) === -1) {

					var fontObj = {name: element.fontFamily},
						//grep font entry
						result = $.grep(instance.mainOptions.fonts, function(e){
							return e.name == element.fontFamily;
						});

					//check if result contains props and url prop
					if(result.length > 0 && result[0].url) {
						fontObj.url = result[0].url;
					}

					_usedFonts.push(element.fontFamily);
					usedFonts.push(fontObj);


				}

			}

		});

		return usedFonts;

	};

	/**
	 * Get all used colors from a single or all views.
	 *
	 * @method getUsedColors
	 * @param {Number} [viewIndex=-1] The index of the target view. By default all views are target.
	 * @return {array} An array with hexdecimal color values.
	 */
	this.getUsedColors = function(viewIndex) {

		var usedColors = [];
		this.getElements(viewIndex, 'all', false).forEach(function(element) {

			var type = FPDUtil.elementIsColorizable(element);
			if(type) {

				if(type === 'svg') {

					if(element.type === FPDPathGroupName) { //multi pathes
						element.getObjects().forEach(function(path) {
							if(FPDUtil.isHex(path.fill)) {
								usedColors.push(path.fill);
							}
						});
					}
					else { //single path
						usedColors.push(element.fill);
					}

				}
				else {
					if(FPDUtil.isHex(element.fill)) {
						usedColors.push(element.fill);
					}
				}
			}

		});

		return FPDUtil.arrayUnique(usedColors);

	};

	/**
	 * Calculates the total price considering the elements price in all views and pricing rules.
	 *
	 * @method calculatePrice
	 * @param {Boolean} [considerQuantity=true] Calculate with or without quantity.
	 * @return {Number} The calculated price.
	 */
	this.calculatePrice = function(considerQuantity) {

		considerQuantity = considerQuantity === undefined ? true : considerQuantity;

		var calculatedPrice = instance.singleProductPrice;
		instance.currentPrice = calculatedPrice;

		calculatedPrice += instance.pricingRulesPrice;

		if(considerQuantity) {
			calculatedPrice *= instance.orderQuantity;
		}

		//price has decimals, set max. decimals to 2
		if(calculatedPrice % 1 != 0) {
			calculatedPrice = Number(calculatedPrice.toFixed(2));
		}

		return calculatedPrice;

	}

	/**
	 * Removes a view by its index value.
	 *
	 * @method removeView
	 * @param {Number} [viewIndex=0] The index of the target view.
	 */
	this.removeView = function(viewIndex) {

		viewIndex = viewIndex === undefined ? 0 : viewIndex;

		var $viewStage = instance.$productStage.children('.fpd-view-stage').eq(viewIndex);

		instance.$viewSelectionWrapper.children('.fpd-item').eq(viewIndex).remove();
		$viewStage.remove();

		instance.viewInstances.splice(viewIndex, 1);

		//select next view if removing view is showing
		if(instance.viewInstances.length > 0) {
			viewIndex == instance.currentViewIndex ? instance.selectView(0) : instance.selectView(viewIndex);
		}

		/**
		 * Gets fired when a view is removed.
		 *
		 * @event FancyProductDesigner#viewRemove
		 * @param {Event} event
		 * @param {Number} viewIndex
		 */
		$elem.trigger('viewRemove', [viewIndex]);

	};

	/**
	 * Formats the price to a string with the currency and the decimal as well as the thousand separator.
	 *
	 * @method formatPrice
	 * @param {Number} [price] The price thats gonna be formatted.
	 * @return {String} The formatted price string.
	 */
	this.formatPrice = function(price) {

		if(typeof instance.mainOptions.priceFormat === 'object') {

			var thousandSep = instance.mainOptions.priceFormat.thousandSep,
				decimalSep = instance.mainOptions.priceFormat.decimalSep;

			var splitPrice = price.toString().split('.'),
				absPrice = splitPrice[0],
				decimalPrice = splitPrice[1],
				tempAbsPrice = '';

			if (typeof absPrice != 'undefined') {

				for (var i=absPrice.length-1; i>=0; i--) {
					tempAbsPrice += absPrice.charAt(i);
				}

				tempAbsPrice = tempAbsPrice.replace(/(\d{3})/g, "$1" + thousandSep);
				if (tempAbsPrice.slice(-thousandSep.length) == thousandSep) {
					tempAbsPrice = tempAbsPrice.slice(0, -thousandSep.length);
				}

				absPrice = '';
				for (var i=tempAbsPrice.length-1; i>=0 ;i--) {
					absPrice += tempAbsPrice.charAt(i);
				}

				if (typeof decimalPrice != 'undefined' && decimalPrice.length > 0) {
					//if only one decimal digit add zero at end
					if(decimalPrice.length == 1) {
						decimalPrice += '0';
					}
					absPrice += decimalSep + decimalPrice;
				}

			}

			absPrice = instance.mainOptions.priceFormat.currency.replace('%d', absPrice.toString());

			return absPrice;

		}
		else {
			price = instance.mainOptions.priceFormat.replace('%d', price);
		}

		return price;

	};

	//translates a HTML element
	this.translateElement = function($tag) {

		var label = '';
		if(instance.langJson) {

			var objString = '';

			if($tag.attr('placeholder') !== undefined) {
				objString = $tag.attr('placeholder');
			}
			else if($tag.attr('title') !== undefined) {
				objString = $tag.attr('title');
			}
			else if($tag.data('title') !== undefined) {
				objString = $tag.data('title');
			}
			else {
				objString = $tag.text();
			}

			var keys = objString.split('.'),
				firstObject = instance.langJson[keys[0]];

			if(firstObject) { //check if object exists

				label = firstObject[keys[1]];

				if(label === undefined) { //if label does not exist in JSON, take default text
					label = $tag.data('defaulttext');
				}

			}
			else {
				label = $tag.data('defaulttext');
			}

			//store all translatable labels in json
			var sectionObj = instance.languageJSON[keys[0]];
			sectionObj[keys[1]] = label;

		}
		else {
			label = $tag.data('defaulttext');
		}

		if($tag.attr('placeholder') !== undefined) {
			$tag.attr('placeholder', label).text('');
		}
		else if($tag.attr('title') !== undefined) {
			$tag.attr('title', label);
		}
		else if($tag.data('title') !== undefined) {
			$tag.data('title', label);
		}
		else {
			$tag.text(label);
		}

		return label;

	};

	this.selectGuidedTourStep = function(target) {

		$body.children('.fpd-gt-step').remove();

		var keyIndex = Object.keys(instance.mainOptions.guidedTour).indexOf(target),
			splitTarget = target.split(':'),
			$targetElem = null;

		if(splitTarget[0] === 'module') {
			$targetElem = $mainBar.find('.fpd-navigation').children('[data-module="'+splitTarget[1]+'"]');
		}
		else if(splitTarget[0] === 'action') {
			$targetElem = $('.fpd-action-btn[data-action="'+splitTarget[1]+'"]');
		}
		else if(splitTarget.length === 1) { //css selector
			$targetElem = $(splitTarget[0]);
		}

		if($targetElem) {

			//if module or action is not available, go to next
			if($targetElem.length === 0) {

				if(Object.keys(instance.mainOptions.guidedTour)[keyIndex+1]) {
					instance.selectGuidedTourStep(Object.keys(instance.mainOptions.guidedTour)[keyIndex+1]);
				}

				return;
			}

			var $step = $body.append('<div class="fpd-container fpd-gt-step"><div class="fpd-gt-pointer"><span class="fpd-icon-arrow-dropdown"></span></div><div class="fpd-gt-close"><span class="fpd-icon-close"></span></div><div class="fpd-gt-text">'+instance.mainOptions.guidedTour[target]+'</div><div class="fpd-gt-actions fpd-clearfix"><div class="fpd-gt-next fpd-btn fpd-primary">'+instance.getTranslation('misc', 'guided_tour_next')+'</div><div class="fpd-gt-back fpd-btn fpd-primary">'+instance.getTranslation('misc', 'guided_tour_back')+'</div><span class="fpd-gt-counter">'+String(keyIndex +1)+'/'+Object.keys(instance.mainOptions.guidedTour).length+'</span></div></div>').children('.fpd-gt-step'),
				targetPos = $targetElem.offset(),
				offsetX = $targetElem.outerWidth() * 0.5,
				offsetY = 0,
				stepLeft = targetPos.left + offsetX;

			//position step
			$step.css({
				left: stepLeft,
				top: targetPos.top + $targetElem.outerHeight() + offsetY,
			});

			//if step is outside viewport, reposition step and pointer
			if($step.outerWidth() + stepLeft > window.innerWidth) {
				offsetX = (window.innerWidth - ($step.outerWidth() + stepLeft));
				$step.css('left', stepLeft + offsetX)
				.children('.fpd-gt-pointer').css('margin-left', Math.abs(offsetX));
			}

			//set back btn
			if(Object.keys(instance.mainOptions.guidedTour)[keyIndex-1]) {
				$step.find('.fpd-gt-back').data('target', Object.keys(instance.mainOptions.guidedTour)[keyIndex-1]);
			}
			else {
				$step.find('.fpd-gt-back').hide();
			}

			//set next btn
			if(Object.keys(instance.mainOptions.guidedTour)[keyIndex+1]) {
				$step.find('.fpd-gt-next').data('target', Object.keys(instance.mainOptions.guidedTour)[keyIndex+1]);
			}
			else {
				$step.find('.fpd-gt-next').hide();
			}

		}

	};

	/**
	 * Set up the products with a JSON.
	 *
	 * @method setupProducts
	 * @param {Array} products An array containg the products or categories with products.
	 * @example [{
	 "category": "Category Title", "products":
	 	[{"productTitle": "TITLE OF PRODUCT", "productThumbnail": "THUMBNAIL OF PRODUCT" "title": "TITLE OF VIEW", "thumbnail": "THUMBNAIL OF VIEW", "OPTIONS": {OBJECT VIEW OPTIONS}, "ELEMENTS": [ARRAY OF ELEMENTS]
	 	...
]}
	 */
	this.setupProducts = function(products) {

		products = products === undefined ? [] : products;

		this.products = [];

		products.forEach(function(productItem) {

			if(productItem.hasOwnProperty('category')) { //check if products JSON contains categories

				productItem.products.forEach(function(singleProduct) {
					instance.addProduct(singleProduct, productItem.category);
				});

			}
			else {
				instance.addProduct(productItem);
			}

		});

		/**
	     * Gets fired as soon as products are set either from the HTML or added as JSON.
	     *
	     * @event FancyProductDesigner#productsSet
	     * @param {Event} event
	     * @param {Array} products - An array containing the products.
	     */
		$elem.trigger('productsSet', [instance.products]);

		//load first product
		if(instance.mainOptions.loadFirstProductInStage && products.length > 0 && !stageCleared) {
			instance.selectProduct(0);
		}
		else {
			instance.toggleSpinner(false);
		}

	};

	/**
	 * Set up the designs with a JSON.
	 *
	 * @method setupDesigns
	 * @param {Array} designs An array containg the categories with designs.
	 * @example [{
	 "title": "Category Title", "thumbnail": "Thumbnail of Category", "designs": [ARRAY OF ELEMENTS]},
	 {"title": "Category Title", "thumbnail": "Thumbnail of Category", "category": [
	 		{"title": "Category Child", "thumbnail": "Thumbnail of Category", "designs": [ARRAY OF ELEMENTS]}
	 ]}
]
	 */
	this.setupDesigns = function(designs) {

		instance.designs = designs;

		/**
	     * Gets fired as soon as designs are set either from the HTML or added as JSON.
	     *
	     * @event FancyProductDesigner#designsSet
	     * @param {Event} event
	     * @param {Array} designs - An array containing the designs.
	     */
		$elem.trigger('designsSet', [instance.designs]);

	};

	/**
	 * Toggle the responsive behavior.
	 *
	 * @method toggleResponsive
	 * @param {Boolean} [toggle] True or false.
	 * @return {Boolean} Returns true or false.
	 */
	this.toggleResponsive = function(toggle) {

		toggle = toggle === undefined ? $elem.hasClass('fpd-not-responsive') : toggle;

		$elem.toggleClass('fpd-not-responsive', !toggle);
		this.viewInstances.forEach(function(viewInstance) {

			viewInstance.options.responsive = toggle;
			viewInstance.resetCanvasSize();

		});

		return toggle;

	};

	/**
	 * Get an array with image objects from depositphotos.com that are used in the current showing product.
	 *
	 * @method getDepositPhotos
	 * @return {Array} An array containing objects. The object contains the depositphotos media ID and the URL to the image that has been uploaded to the server.
	 */
	this.getDepositPhotos = function() {

		var dpImages = [];
		this.getElements(-1, 'image').forEach(function(imgItem) {

			if(imgItem.source && imgItem.depositphotos) {
				dpImages.push({depositphotos: imgItem.depositphotos, source: imgItem.source});
			}

		});

		return dpImages;

	};

	/**
	 * Get an object containing the download link for a media. Whenever you call this method, credits will be taken from your depositphotos account to purchase a media. You can find more infos about the Depositphotos API here: http://api.depositphotos.com/doc/classes/API.Purchase.html
	 *
	 * @method getDepositPhotosPurchaseMedia
	 * @param {Function} callback A function that will be called with JSON data has been loaded. Will also be executed on failure.
	 * @param {String} mediaID A Depositphotos media ID.
	 * @param {String} username Your Depositphotos username.
	 * @param {String} password Your Depositphotos password.
	 * @param {String} [size=s] Possible values: s/m/l/xl/vect/el0.
	 * @param {String} [license=standard] Possible values: standard or extended.
	 * @param {String} [purchaseCurrency=credits] The license. Possible values: 'credits' | 'subscription' | 'bonus' | 'ondemand'.
	 * @example
fpd.getDepositPhotosPurchaseMedia(function(data) {
}, '12345', 'username', 'password', 'm')
	 */
	this.getDepositPhotosPurchaseMedia = function(callback, mediaID, username, password, size, license, purchaseCurrency) {

		size = size === undefined ? 's' : size;
		license = license === undefined ? 'standard' : license;
		purchaseCurrency = purchaseCurrency === undefined ? 'credits' : purchaseCurrency;

		var loginObj = {
			dp_apikey: instance.mainOptions.depositphotosApiKey,
			dp_command: 'login',
			dp_login_user: username,
			dp_login_password: password
		};

		$.getJSON(location.protocol+'//api.depositphotos.com?'+$.param(loginObj), function(loginData) {

			if(loginData.error) {

				callback(loginData);
				alert(loginData.error.errormsg);

			}
			else if(loginData.sessionid) {

				var mediaObj = {
					dp_apikey: instance.mainOptions.depositphotosApiKey,
					dp_command: 'getMedia',
					dp_session_id: loginData.sessionid,
					dp_media_id: mediaID,
					dp_media_option: size,
					dp_media_license: license,
					dp_purchase_currency: purchaseCurrency,
					dp_force_purchase_method: purchaseCurrency
				};

				$.getJSON(location.protocol+'//api.depositphotos.com?'+$.param(mediaObj), function(mediaData) {

					callback(mediaData);

					if(mediaData.error) {
						alert(mediaData.error.errormsg);
					}
					else {

					}

				})

			}
			else {

				callback(loginData);
				alert("No Sessions ID!");

			}

		});


	};

	/**
	 * Load custom fonts or from Google webfonts  used in the product designer.
	 *
	 * @method loadFonts
	 * @param {Array} fonts An array containing objects with name and URL to the font file.
	 * @param {Function} callback A function that will be called when all fonts have been loaded.
	 * @version 4.7.6
	 */
	this.loadFonts = function(fonts, callback) {

		if(fonts && fonts.length > 0 && typeof fonts[0] === 'object') {

			var googleFonts = [],
				customFonts = [],
				fontStateCount = 0,
				$customFontsStyle;

			if(instance.$container.prevAll('#fpd-custom-fonts').length == 0) {

				$customFontsStyle = $('<style type="text/css" id="fpd-custom-fonts"></style>');
				instance.$container.before($customFontsStyle);

			}
			else {
				$customFontsStyle = instance.$container.prevAll('#fpd-custom-fonts:first').empty();
			}

			fonts.forEach(function(fontItem) {

				if(fontItem.hasOwnProperty('url')) {

					if(fontItem.url == 'google') { //from google fonts
						googleFonts.push(fontItem.name);
					}
					else { //custom fonts

						var fontFormat = fontItem.url.search('.woff') !== -1 ? 'woff' : 'TrueType',
							fontURL = instance.mainOptions._loadFromScript ? (instance.mainOptions._loadFromScript+fontItem.url) : fontItem.url;
						$customFontsStyle.append('@font-face {font-family:"'+fontItem.name+'"; src:url("'+fontURL+'") format("'+fontFormat+'");}');
						customFonts.push(fontItem.name);

					}

				}

			});

			var _fontActiveState = function(state, familyName, fvd) {

				if(state == 'inactive') {
					FPDUtil.log(familyName+' font could not be loaded.', 'warn');
				}

				if(fontStateCount == (googleFonts.length + customFonts.length)-1) {
					callback();
				}

				fontStateCount++;

			};

			var WebFontOpts = {
				 fontactive: function(familyName, fvd) {
				    _fontActiveState('active', familyName, fvd);
			    },
			    fontinactive: function(familyName, fvd) {
				    _fontActiveState('inactive', familyName, fvd);
				},
			    timeout: 2000
			};

			if(googleFonts.length > 0) {
				WebFontOpts.google = {families: googleFonts};
			}

			if(customFonts.length > 0) {
				WebFontOpts.custom = {families: customFonts};
			}

			if(googleFonts.length > 0 || customFonts.length > 0) {
				WebFont.load(WebFontOpts);
			}
			else {
				callback();
			}


		}
		else {
			callback();
		}

	};

	_initialize();

};



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