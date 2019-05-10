import React from 'react'
import Dialog from 'rc-dialog'
import ReactDOM from 'react-dom'
import insertCss from 'insert-css'

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

const styles = `.rc-dialog {
  position: relative;
  width: auto;
  margin: 10px;
}
.rc-dialog-wrap {
  position: fixed;
  overflow: auto;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1050;
  -webkit-overflow-scrolling: touch;
  outline: 0;
}
.rc-dialog-title {
  margin: 0;
  font-size: 14px;
  line-height: 21px;
  font-weight: bold;
}
.rc-dialog-content {
  position: relative;
  background-color: #ffffff;
  border: none;
  border-radius: 6px 6px;
  background-clip: padding-box;
}
.rc-dialog-close {
  cursor: pointer;
  border: 0;
  background: transparent;
  font-size: 21px;
  position: absolute;
  right: 20px;
  top: 12px;
  font-weight: 700;
  line-height: 1;
  color: #000;
  text-shadow: 0 1px 0 #fff;
  filter: alpha(opacity=20);
  opacity: .2;
  text-decoration: none;
}
.rc-dialog-close-x:after {
  content: '×';
}
.rc-dialog-close:hover {
  opacity: 1;
  filter: alpha(opacity=100);
  text-decoration: none;
}
.rc-dialog-header {
  padding: 13px 20px 14px 20px;
  border-radius: 5px 5px 0 0;
  background: #fff;
  color: #666;
  border-bottom: 1px solid #e9e9e9;
}
.rc-dialog-body {
  padding: 20px;
}
.rc-dialog-footer {
  border-top: 1px solid #e9e9e9;
  padding: 10px 20px;
  text-align: right;
  border-radius: 0 0 5px 5px;
}
.rc-dialog-zoom-enter,
.rc-dialog-zoom-appear {
  opacity: 0;
  animation-duration: 0.3s;
  animation-fill-mode: both;
  animation-timing-function: cubic-bezier(0.08, 0.82, 0.17, 1);
  animation-play-state: paused;
}
.rc-dialog-zoom-leave {
  animation-duration: 0.3s;
  animation-fill-mode: both;
  animation-timing-function: cubic-bezier(0.6, 0.04, 0.98, 0.34);
  animation-play-state: paused;
}
.rc-dialog-zoom-enter.rc-dialog-zoom-enter-active,
.rc-dialog-zoom-appear.rc-dialog-zoom-appear-active {
  animation-name: rcDialogZoomIn;
  animation-play-state: running;
}
.rc-dialog-zoom-leave.rc-dialog-zoom-leave-active {
  animation-name: rcDialogZoomOut;
  animation-play-state: running;
}
@keyframes rcDialogZoomIn {
  0% {
    opacity: 0;
    transform: scale(0, 0);
  }
  100% {
    opacity: 1;
    transform: scale(1, 1);
  }
}
@keyframes rcDialogZoomOut {
  0% {
    transform: scale(1, 1);
  }
  100% {
    opacity: 0;
    transform: scale(0, 0);
  }
}
@media (min-width: 768px) {
  .rc-dialog {
    width: 600px;
    margin: 30px auto;
  }
}
.rc-dialog-mask {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
  background-color: #373737;
  background-color: rgba(55, 55, 55, 0.6);
  height: 100%;
  filter: alpha(opacity=50);
  z-index: 1050;
}
.rc-dialog-mask-hidden {
  display: none;
}
.rc-dialog-fade-enter,
.rc-dialog-fade-appear {
  opacity: 0;
  animation-duration: 0.3s;
  animation-fill-mode: both;
  animation-timing-function: cubic-bezier(0.55, 0, 0.55, 0.2);
  animation-play-state: paused;
}
.rc-dialog-fade-leave {
  animation-duration: 0.3s;
  animation-fill-mode: both;
  animation-timing-function: cubic-bezier(0.55, 0, 0.55, 0.2);
  animation-play-state: paused;
}
.rc-dialog-fade-enter.rc-dialog-fade-enter-active,
.rc-dialog-fade-appear.rc-dialog-fade-appear-active {
  animation-name: rcDialogFadeIn;
  animation-play-state: running;
}
.rc-dialog-fade-leave.rc-dialog-fade-leave-active {
  animation-name: rcDialogFadeOut;
  animation-play-state: running;
}
@keyframes rcDialogFadeIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
@keyframes rcDialogFadeOut {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}
`
insertCss(styles)
