(function ($){
  var _model;

  /**
   * Debounce function from underscore.js
   * https://github.com/jashkenas/underscore/blob/master/underscore.js
   */

  // Similar to ES6's rest param (http://ariya.ofilabs.com/2013/03/es6-and-rest-parameter.html)
  // This accumulates the arguments passed into an array, after a given index.
  function restArgs(func, startIndex) {
    startIndex = startIndex == null ? func.length - 1 : +startIndex;
    return function() {
      var length = Math.max(arguments.length - startIndex, 0);
      var rest = Array(length);
      for (var index = 0; index < length; index++) {
        rest[index] = arguments[index + startIndex];
      }
      switch (startIndex) {
        case 0: return func.call(this, rest);
        case 1: return func.call(this, arguments[0], rest);
        case 2: return func.call(this, arguments[0], arguments[1], rest);
      }
      var args = Array(startIndex + 1);
      for (index = 0; index < startIndex; index++) {
        args[index] = arguments[index];
      }
      args[startIndex] = rest;
      return func.apply(this, args);
    };
  }

  function debounce(func, wait, immediate) {
    var timeout, result;

    var later = function(context, args) {
      timeout = null;
      if (args) result = func.apply(context, args);
    };

    var debounced = restArgs(function(args) {
      var callNow = immediate && !timeout;
      if (timeout) clearTimeout(timeout);
      if (callNow) {
        timeout = setTimeout(later, wait);
        result = func.apply(this, args);
      } else if (!immediate) {

        timeout = setTimeout(function() {
          return func.apply(null, this);
        }, wait);
      }

      return result;
    });

    debounced.cancel = function() {
      clearTimeout(timeout);
      timeout = null;
    };

    return debounced;
  }
  delay = restArgs(function(func, wait, args) {
    return setTimeout(function() {
      return func.apply(null, args);
    }, wait);
  });
  //END DEBOUNCE dependencies

  function loadImage(url){
    var deferred = Q.defer();

    var imageObj = new Image();
    imageObj.onload = function() {
      deferred.resolve(imageObj);
    };
    imageObj.src = url;

    return deferred.promise;
  }

  function zoomageGlobal(){
    var _instances = [],
    maxAlpha = 0.5;

    function init(instance, opts){
      instance.canvas_container = document.createElement('div');
      instance.canvas_container.className = 'zoomage-canvas-container';
      instance.canvas = document.createElement('canvas');
      instance.canvas_container.appendChild(instance.canvas);
      instance.el.insertBefore(instance.canvas_container, instance.el.firstChild);
      instance.ctx = instance.canvas.getContext("2d");
      instance.canvas.setAttribute('width', instance.canvas.clientWidth);
      instance.canvas.setAttribute('height', instance.canvas.clientHeight);

      var promises = [];
      instance.sections.forEach(function(item, index){
        promises.push(loadImage($(item.el).data('zoomage-img')));
      });


      Q.all(promises).done(function(values){
        instance.images = values;
        ready(instance);
      });
    }

    function add(target, opts){
      var sections = [];

      Array.prototype.slice.call(target.querySelectorAll('.zoomage-section')).forEach(function(item, index){
        sections.push({
          el:item,
          distance:0,
          active:false
        });
      });

      var instance = {
        el:target,
        sections: sections,
        activeSectionInd: 0,
        images: []
      };

      _instances.push(instance);
      init(instance, opts);
    }

    function ready(instance){
      animate(instance);
    }

    function onWindowResize(){
      console.log('onWindowResize');
      _instances.forEach(function(item, index){
        item.canvas.setAttribute('width', item.canvas.clientWidth);
        item.canvas.setAttribute('height', item.canvas.clientHeight);
      });
    }

    function scroll(evt){
      _instances.forEach(function(item, index){
        var rect = item.el.getBoundingClientRect();
        var topDistance    = rect.top,
            bottomDistance = item.canvas.height - rect.bottom;
        if (topDistance >= 0 && bottomDistance <= 0) {
          item.canvas_container.classList.remove('zoomage-fixed');
          item.canvas_container.classList.remove('zoomage-bottom');
          item.active = false;
        }else if(bottomDistance > 0){
          item.canvas_container.classList.remove('zoomage-fixed');
          item.canvas_container.classList.add('zoomage-bottom');
          item.active = false;
        }else{
          item.active = true;
          item.canvas_container.classList.add('zoomage-fixed');
          item.canvas_container.classList.remove('zoomage-bottom');
          var sectionActiveInd = 0;
          var sectionMinDistance = Number.MAX_VALUE;
          item.sections.forEach(function (section, index){
            var sectionRect = section.el.getBoundingClientRect();
            var sectionTopDistance = sectionRect.top,
              sectionMidDistance = (item.canvas.height * 0.5) - (sectionRect.height * 0.5) - sectionRect.top;

            section.distance = sectionMidDistance / (sectionRect.height * 0.5); //normalize

            if(Math.abs(section.distance) < sectionMinDistance){
              sectionMinDistance = Math.abs(section.distance);
              item.activeSectionInd = index;
            }

          });
        }


      });
    }

    function animate(instance){
      function loop(){
          draw(instance);
          requestAnimationFrame(loop);
      }
      scroll();
      requestAnimationFrame(loop);
    }

    function getZoomLevel(width, height, image, distance){
      var baseScale = ( (width / image.width) > (height / image.height) ? (width / image.width) : (height / image.height) ) * 1.8;
      baseScale += distance * 0.3;
      return baseScale;
    }

    function draw(instance){
      var ctx = instance.ctx,
      bg = instance.images[instance.activeSectionInd];
      var distance = instance.sections[instance.activeSectionInd].distance;
      var width = instance.canvas.width,
        height = instance.canvas.height;
      var baseScale = getZoomLevel(width, height, bg, distance);

      var cropWidth = instance.canvas.width / baseScale;
      var cropHeight = instance.canvas.height / baseScale;
      var cropX = (bg.width - cropWidth) / 2;
      var cropY = (bg.height - cropHeight) / 2;



      ctx.fillStyle   = '#152735';
      ctx.fillRect(0, 0, width, height);
      ctx.save();
      if(Math.abs(distance) <= 0.5){
        ctx.save();
        ctx.globalAlpha = 1;
        ctx.drawImage(bg, cropX, cropY, cropWidth, cropHeight, 0,0, instance.canvas.width, instance.canvas.height );
        ctx.restore();
      }else{
        if(instance.activeSectionInd > 0 && distance < 0){

          var distancePrev = instance.sections[instance.activeSectionInd -1].distance;
          var alphaPrev = Math.max(0, 1 - (Math.abs(distancePrev) - maxAlpha));

          var prevImage = instance.images[instance.activeSectionInd - 1];
          var baseScalePrev = getZoomLevel(width, height, prevImage, distancePrev);
          var cropWidthPrev = instance.canvas.width / baseScalePrev;
          var cropHeightPrev = instance.canvas.height / baseScalePrev;
          cropXPrev = (prevImage.width - cropWidthPrev) / 2;
          cropYPrev = (prevImage.height - cropHeightPrev) / 2;

          ctx.save();
          ctx.globalAlpha = alphaPrev;
          ctx.drawImage(prevImage, cropXPrev, cropYPrev, cropWidthPrev, cropHeightPrev, 0,0, instance.canvas.width, instance.canvas.height );
          ctx.restore();
        }

        var alpha = 1 - (Math.abs(distance) - maxAlpha);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.drawImage(bg, cropX, cropY, cropWidth, cropHeight, 0,0, instance.canvas.width, instance.canvas.height );
        ctx.restore();
        if(instance.activeSectionInd < (instance.sections.length - 1) && distance > 0){
          var distanceNext = instance.sections[instance.activeSectionInd + 1].distance;

          var alphaNext = Math.max(0, 1 - (Math.abs(distanceNext) - maxAlpha));
          var nextImage = instance.images[instance.activeSectionInd + 1];
          var baseScaleNext = getZoomLevel(width, height, nextImage, distanceNext);
          //console.log(distanceNext, baseScaleNext);
          var cropWidthNext = instance.canvas.width / baseScaleNext;
          var cropHeightNext = instance.canvas.height / baseScaleNext;
          cropXNext = (nextImage.width - cropWidthNext) / 2;
          cropYNext = (nextImage.height - cropHeightNext) / 2;

          ctx.save();
          ctx.globalAlpha = alphaNext;
          ctx.drawImage(nextImage, cropXNext, cropYNext, cropWidthNext, cropHeightNext, 0,0, instance.canvas.width, instance.canvas.height );
          ctx.restore();
        }

      }


      //ctx.translate(instance.canvas.width/2, instance.canvas.height/2);
      //ctx.scale(baseScale,baseScale);
    }

    document.addEventListener("scroll", scroll, false);
    $(window).resize( debounce(onWindowResize, 300) );

    return {
      add:add
    };
  }


  var zoomageMain = function(userOpts){
    if(_model === undefined){
      _model = zoomageGlobal();
    }

    if ( this.hasOwnProperty('length') ){
      if(this.length > 0){
        // merge arrays
        for (var i = 0; i < this.length; i++) {
          _model.add(this[i], userOpts);
        }
      }
    } else if (typeof this === "object"){
      _model.add(this, userOpts);
    }
  };


  if($.fn.zoomage === undefined){
    $.fn.zoomage = zoomageMain;
  }
})(jQuery);
