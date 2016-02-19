(function ($){
  var _model;

  var toType = function(obj) {
    return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase()
  }

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
    var _instances = [];

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
        promises.push(loadImage($(item.el).data('zoomage-img')))
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
      baseScale += distance * .3;
      return baseScale;
    }

    function draw(instance){
      ctx = instance.ctx,
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
          var alphaPrev = Math.max(0, 1 - (Math.abs(distancePrev) - .5));

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

        var alpha = 1 - (Math.abs(distance) - .5);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.drawImage(bg, cropX, cropY, cropWidth, cropHeight, 0,0, instance.canvas.width, instance.canvas.height );
        ctx.restore();
        if(instance.activeSectionInd < (instance.sections.length - 1) && distance > 0){
          var distanceNext = instance.sections[instance.activeSectionInd + 1].distance;

          var alphaNext = Math.max(0, 1 - (Math.abs(distanceNext) - .5));
          var nextImage = instance.images[instance.activeSectionInd + 1];
          var baseScaleNext = getZoomLevel(width, height, nextImage, distanceNext);
          console.log(distanceNext, baseScaleNext);
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

    return {
      add:add
    };
  }


  var zoomageMain = function(userOpts){
    if(_model === undefined){
      _model = zoomageGlobal();
    }

    if (this.length){
      // merge arrays
      for (var i = 0; i < this.length; i++) {
        _model.add(this[i], userOpts);
      }
    } else if (typeof this === "object"){
      _model.add(this, userOpts);
    }



  }


  if($.fn.zoomage === undefined){
    $.fn.zoomage = zoomageMain;
  }
})(jQuery);
