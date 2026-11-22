/**
 * Equipment photos are mostly manufacturer cut-outs on white, with the odd
 * ordinary photograph among them. A cut-out is shown whole in the white
 * product well; a photograph looks wrong floating in that well and fills the
 * frame instead. Which is which is read off the loaded image in the browser
 * (same-origin, so a canvas can look at it):
 *
 * - four white corners: a cut-out (a transparent PNG counts, it is drawn on white);
 * - otherwise a photograph, but only when its shape is close to the frame's, so
 *   filling the frame trims an edge and never crops the subject. A square or
 *   upright studio shot on a grey backdrop stays whole in the well.
 *
 * `frame` is the frame's width / height (the galleries and cards are 3:2).
 */
export const isFramePhotograph = (img: HTMLImageElement, frame = 1.5): boolean => {
  if (!img.naturalWidth || !img.naturalHeight) return false
  const shape = img.naturalWidth / img.naturalHeight
  if (shape < frame * 0.85 || shape > frame * 1.2) return false
  try {
    const size = 16
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return false
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, size, size)
    ctx.drawImage(img, 0, 0, size, size)
    const white = ([[0, 0], [size - 1, 0], [0, size - 1], [size - 1, size - 1]] as const).every(([x, y]) => {
      const [r, g, b] = ctx.getImageData(x, y, 1, 1).data
      return r! > 238 && g! > 238 && b! > 238
    })
    return !white
  }
  catch {
    // canvas not readable: leave it as a cut-out
    return false
  }
}
