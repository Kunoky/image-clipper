# image-clipper
image clipper

[![NPM version][npm-image]][npm-url]

[npm-image]: https://img.shields.io/badge/npm-v0.0.1-blue.svg
[npm-url]: https://www.npmjs.com/package/@solakuroky/image-clipper
## Screenshot

<img src="https://user-images.githubusercontent.com/26639880/57443748-5d1c6380-7281-11e9-81b0-561073412597.png"/>

## install

npm install @solakuroky/image-clipper

## Usage

```javascript
var imageClipper = require('@solakuroky/image-clipper')

var clippedImage = imageClipper('https://someimage.png')

<script type="text/javascript">  
  function cropImage(source) {  
    var file = source.files[0]
    var clippedImage = imageClipper(file, {
        callback: callback
    })
  }
  function callback(canvas, resolve, reject) {
      resolve(canvas.toDataUrl())
  }
</script>  

<input type="file" name="file" onchange="cropImage(this)" />  

```

## API

### image-clipper


<table class="table table-bordered table-striped">
    <thead>
    <tr>
        <th style="width: 100px;">name</th>
        <th style="width: 50px;">type</th>
        <th>default</th>
        <th>description</th>
    </tr>
    </thead>
    <tbody>
      <tr>
          <td>image</td>
          <td>String|FileObject</td>
          <td></td>
          <td>image to be clipped</td>
      </tr>
      <tr>
          <td>options</td>
          <td>Object</td>
          <td>{}</td>
          <td>Configuration of clipper</td>
      </tr>
    </tbody>
</table>

### options


<table class="table table-bordered table-striped">
    <thead>
    <tr>
        <th style="width: 100px;">name</th>
        <th style="width: 50px;">type</th>
        <th>default</th>
        <th>description</th>
    </tr>
    </thead>
    <tbody>
      <tr>
          <td>callback</td>
          <td>function(canvas, resolve, reject)</td>
          <td></td>
          <td>Customize how to process image, default return a file</td>
      </tr>
      <tr>
          <td>clipWidth</td>
          <td>Number</td>
          <td>256</td>
          <td>width to be clipped</td>
      </tr>
      <tr>
          <td>clipHeight</td>
          <td>Number</td>
          <td>256</td>
          <td>height to be clipped</td>
      </tr>
      <tr>
          <td>outlineWidth</td>
          <td>Number</td>
          <td>32</td>
          <td>shadow width around clipping window</td>
      </tr>
      <tr>
          <td>okText</td>
          <td>String|ReactNode</td>
          <td>'ok'</td>
          <td>text of the Ok button</td>
      </tr>
      <tr>
          <td>cancelText</td>
          <td>String|ReactNode</td>
          <td>'cancel'</td>
          <td>text of the Cancel button</td>
      </tr>
      <tr>
          <td>okStyle</td>
          <td>Object</td>
          <td>{}</td>
          <td>style of the Ok button</td>
      </tr>
      <tr>
          <td>cancelStyle</td>
          <td>Object</td>
          <td>{}</td>
          <td>style of the Cancel button</td>
      </tr>
      <tr>
          <td>windowStyle</td>
          <td>Object</td>
          <td>{}</td>
          <td>style of the Cliper window</td>
      </tr>
    </tbody>
</table>

## License

image-clipper is released under the MIT license.
