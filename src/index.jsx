import React from 'react'
import Dialog from 'rc-dialog'
import ReactDOM from 'react-dom'
import 'rc-dialog/assets/index.css'

/**
 * [getAdjustSize Adjust size according to window size]
 * @param  {[number]} initialWidth  [description]
 * @param  {[number]} initialHeight   [description]
 * @param  {[number]} windowWidth   [description]
 * @param  {[number]} windowHeight  [description]
 * @return {[object]}         [Adjusted size]
 */
export function getAdjustSize(initialWidth, initialHeight, windowWidth, windowHeight) {
  const aspectRatio = initialWidth / initialHeight
  let width, height
  if (initialWidth >= windowWidth && initialHeight >= windowHeight) {
    width = initialWidth
    height = initialHeight
  } else if (initialWidth < windowWidth) {
    if (windowWidth / aspectRatio >= windowHeight) {
      width = windowWidth
      height = windowWidth / aspectRatio
    } else {
      width = windowHeight * aspectRatio
      height = windowHeight
    }
  } else if (initialHeight < windowHeight) {
    if (windowHeight * aspectRatio >= windowWidth) {
      width = windowHeight * aspectRatio
      height = windowHeight
    } else {
      width = windowWidth
      height = windowWidth / aspectRatio
    }
  }
  return { width, height }
}

/**
 * Receive the image and return the clipped image
 * @param  {[object, string]}  image             image to be clipped
 * @param  {object}   options                    Default: {}
 *    @param  {[function]} callback              Customize how to process image, default return a file. function(canvas, resolve, reject)
 *    @param  {[number]} clipWidth               width to be clipped. Default: 256
 *    @param  {[number]} clipHeight              height to be clipped. Default: 256
 *    @param  {[number]} outlineWidth            shadow width around clipping window. Default: 32
 *    @param  {[string, ReactNode]} okText       text of the Ok button. Default: 'ok'
 *    @param  {[object]} okStyle                 style of the Ok button. Default: {}
 *    @param  {[object]} cancelStyle             style of the Cancel button. Default: {}
 *    @param  {[object]} windowStyle             style of the Cliper window. Default: {}
 *    @param  {[string, ReactNode]} cancelText   text of the Cancel button. Default: 'cancel'
 * ]
 * @return {[promise]}
 */
export default function imageClipper(image, options = {}) {
  if (!(typeof image === 'object' && image.type.match('image') || typeof image === 'string')) {
    throw new TypeError('The type of image is invalid')
  }

  return new Promise((resolve, reject) => {
    confirm({
      image: image,
      visible: true,
      closable: false,
      maskClosable: false,
      keyboard: false,
      resolve,
      reject,
      ...options})
  })
}

export function confirm(config: {}) {
  const div = document.createElement('div');
  document.body.appendChild(div);
  function destroy() {
    const unmountResult = ReactDOM.unmountComponentAtNode(div);
    if (unmountResult && div.parentNode) {
      div.parentNode.removeChild(div);
    }
  }

  function render(props) {
    const { clipWidth=256, outlineWidth=32 } = props
    ReactDOM.render(<Dialog {...props} onClose={destroy} style={{width: (clipWidth + outlineWidth + 32) * 2 + 'px'}}><ClipperView onClose={destroy} {...props}/></Dialog>, div);
  }
  render(config)
}

export class ClipperView extends React.PureComponent {
  constructor(props) {
    super()
    this.state = {
      img: '',
      image: null,
      clipWidth: props.clipWidth || 256,
      clipHeight: props.clipHeight || 256,
      outlineWidth: props.outlineWidth || 32,
      iWidth: 0,
      iHeight: 0,
      imgX: 0,
      imgY: 0,
      clientX: 0,
      clientY: 0,
      zoomWidth: 0,
      zoomHeight: 0,
      dragable: false,
    }
  }
  componentDidMount() {
    if( typeof this.props.image === 'string') {
      this.handleLoadImage(this.props.image)
    } else {
      const reader = new FileReader()
      reader.onload = () => {
        this.handleLoadImage(reader.result)
      }
      reader.onerror = (e) => {
        this.props.reject(e)
        this.props.onClose()
      }
      reader.readAsDataURL(this.props.image)
    }
  }
  handleLoadImage = (img) => {
      const image = new Image()
      image.setAttribute("crossOrigin",'Anonymous')
      image.onload = () => {
        const { width, height } = getAdjustSize(image.width, image.height, this.state.clipWidth, this.state.clipHeight)
        let iWidth = width,
        iHeight = height,
        imgX = (this.state.clipWidth - iWidth) / 2 + this.state.outlineWidth,
        imgY = (this.state.clipHeight - iHeight) / 2 + this.state.outlineWidth
        this.setState({
          image,
          img,
          iWidth,
          iHeight,
          imgX,
          imgY
        })
      }
      image.onerror = (e) => {
          this.props.reject(e)
          this.props.onClose()
      }
      image.src = img
  }
  handleClickMove = (e) => {
    const { clipWidth, clipHeight, outlineWidth, iWidth, iHeight, imgX, imgY, clientX, clientY, dragable, } = this.state
    if (!dragable) return
    if (clientX === 0) {
      this.setState({
        clientX: e.clientX,
        clientY: e.clientY
      })
    } else {
      let _imgX = imgX + e.clientX - clientX,
      _imgY = imgY +  e.clientY - clientY
      _imgX > outlineWidth && (_imgX = outlineWidth)
      _imgY > outlineWidth && (_imgY = outlineWidth)
      _imgX < outlineWidth + clipWidth - iWidth && (_imgX = outlineWidth + clipWidth - iWidth)
      _imgY < outlineWidth + clipHeight - iHeight && (_imgY = outlineWidth + clipHeight - iHeight)
      this.setState({
        imgX: _imgX,
        imgY: _imgY,
        clientX: e.clientX,
        clientY: e.clientY
      })
    }
  }
  handleWheelChange = (e) => {
    const { clipWidth, clipHeight, outlineWidth, iWidth, iHeight, imgX, imgY } = this.state
    let zoomWidth,
    zoomHeight,
    _imgX = imgX,
    _imgY = imgY
    if (e.deltaY > 0) {
      zoomWidth = iWidth * 1.1
      zoomHeight = iHeight * 1.1
    } else {
      zoomWidth = iWidth * 0.9
      zoomHeight = iHeight * 0.9
    }
    const { width, height } = getAdjustSize(zoomWidth, zoomHeight, clipWidth, clipHeight)
    _imgX < clipWidth + outlineWidth - width && (_imgX = clipWidth + outlineWidth - width)
    _imgY < clipHeight + outlineWidth - height && (_imgY = clipHeight + outlineWidth - height)
    this.setState({
      iWidth: width,
      iHeight: height,
      imgX: _imgX,
      imgY: _imgY
    })
  }
  handleClickDown = (e) => {
    this.setState({
      dragable: true,
      clientX: 0,
      clientY: 0
    })
  }
  handleOk = () => {
    if (this.props.callback) {
      this.props.callback(this.refs.cvs, this.props.resolve, this.props.reject)
    } else {
      this.refs.cvs.toBlob((blob) => {
        if (typeof this.props.image === 'string') {
          const f = new File([blob], 'clipped', {
            type: 'png'
          })
          this.props.resolve(f)
        } else {
          const f = new File([blob], this.props.image.name, {
            type: this.props.image.type
          })
          this.props.resolve(Object.assign(f, this.props.image))
        }
      })
    }
    this.props.onClose()
  }
  handleCancel = () => {
    this.props.reject()
    this.props.onClose()
  }
  render() {
    const { img, image, clipWidth, clipHeight, outlineWidth, iWidth, iHeight, imgX, imgY } = this.state
    const { okText='ok', cancelText='cancel', okStyle={}, cancelStyle={}, windowStyle={} } = this.props
    if (this.refs.cvs) {
      const ctx = this.refs.cvs.getContext('2d'),
      zoomRatio = image.width / iWidth
      ctx.drawImage(image, (outlineWidth - imgX) * zoomRatio, (outlineWidth - imgY) * zoomRatio, clipWidth * zoomRatio, clipHeight * zoomRatio, 0, 0, clipWidth, clipHeight)
    }
    return <div>
      <div
        style={{
          position: 'relative',
          height: `${2 * outlineWidth + clipHeight}px`,
          width: `${2 * outlineWidth + clipWidth}px`,
          overflow: 'hidden',
          display: 'inline-block'
        }}
      >
        <img
          alt='clip imgae'
          src={img}
          style={{
            position: 'absolute',
            top: imgY,
            left: imgX,
            width: iWidth,
            height: iHeight,
          }}
        />
        <div
          style={{
            outline: `#111 solid ${outlineWidth}px`,
            width: `${clipWidth}px`,
            height: `${clipHeight}px`,
            position: 'absolute',
            top: outlineWidth,
            left: outlineWidth,
            opacity: .6,
            cursor: 'pointer',
            border: '1px dashed #fff',
            ...windowStyle,
          }}
          onPointerDown={this.handleClickDown}
          onPointerUp={(e) => this.setState({dragable: false})}
          onPointerLeave={(e) => this.setState({dragable: false})}
          onPointerMove={this.handleClickMove}
          onWheel={this.handleWheelChange}
        >
        </div>
      </div>
      <canvas
        ref='cvs'
        width={clipWidth}
        height={clipHeight}
        style={{
          float: 'right'
        }}
      />
      <div style={{textAlign: 'center'}}>
        <button onClick={this.handleCancel} style={{...buttonStyle, ...cancelStyle}}>{cancelText}</button>
        <button onClick={this.handleOk} style={{...buttonStyle, ...primaryStyle, ...okStyle}}>{okText}</button>
      </div>
    </div>
  }
}

const buttonStyle = {
  fontWeight: 400,
  textAlign: 'center',
  touchAction: 'manipulation',
  cursor: 'pointer',
  borderRadius: '4px',
  border: '1px solid #d9d9d9',
  whiteSpace: 'nowrap',
  padding: '0 15px',
  fontSize: '14px',
  height: '32px',
  transition: 'all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1)',
  position: 'relative',
  boxShadow: '0 2px 0 rgba(0, 0, 0, 0.015)',
  color: 'rgba(0, 0, 0, 0.65)',
  backgroundColor: '#fff',
  margin: '0 8px',
}
const primaryStyle = {
  borderColor: 'rgba(53, 116, 250, 0.85)',
  background: 'rgba(53, 116, 250, 0.85)',
  color: '#FFF',
}
