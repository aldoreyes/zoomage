# zoomage
Canvas based scroll effect to zoom in/out images as you scroll down. WORK IN PROGRESS.

## DEMO
[http://aldoreyes.github.io/zoomage/](http://aldoreyes.github.io/zoomage/)

## Install

### Bower
`bower install zoomage --save`

### Manual Install
Install dependencies ([Jquery](https://jquery.com/) and [q](https://github.com/kriskowal/q)).

```html
<head>
  <link rel="stylesheet" type="text/css" href="zoomage.css" />
...
</head>
<body>
  ...
  <script type="text/javascript" src="jquery.min.js"></script>
  <script type="text/javascript" src="q.js"></script>
  <script type="text/javascript" src="zoomage.js"></script>
</body>

```

## Usage

### Prepare markup
```html
<div class="zoomage-container">
  <div class="zoomage-section" data-zoomage-img="./img/img-1.jpg">
    <p>Content for section 1...</p>
  </div>
  <div class="zoomage-section" data-zoomage-img="./img/img-2.jpg">
    <p>Content for section 2...</p>
  </div>
  <div class="zoomage-section" data-zoomage-img="./img/img-3.jpg">
    <p>Content for section 3...</p>
  </div>
</div>
```

### Initialize zoomage.
```javascript
$( document ).ready(function() {
  $('.zoomage-container').zoomage({});
});
```
