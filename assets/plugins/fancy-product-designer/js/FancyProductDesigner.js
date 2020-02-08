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

