import backends from 'onehostname/lib/backends'
import { processImages } from './src/images';
import { withDocument } from './src/html';

const ghost = backends.generic("https://blog.ghost.org", { host: "blog.ghost.org" })
const imageWidths = {
  "highlight-primary": {
    width: 1040,
    selector: ".post-feed.highlight-feed-primary .post-card-image"
  },
  "post-feed": {
    width: 320,
    selector: ".post-feed .post-card-image"
  }
  //selector: ".post-card.featured .post-card-image", width: 1040 },
}

fly.http.respondWith(
  // just wrap our router up in 
  // image processing middleware
  processImages(
    // writes images with sizes into html
    resizeGhostImages(ghost),
    {
      sizes: imageWidths // options for processImages
    }
  )
)

function resizeGhostImages(fetch) {
  return async function resizeGhostImages(req, opts) {
    let resp = await withDocument(fetch, req, opts)
    if (!resp.document || !(resp.document instanceof Document)) {
      // nothing to do
      return resp
    }

    for (const k of Object.keys(imageWidths)) {
      const o = imageWidths[k]
      const elements = resp.document.querySelectorAll(o.selector)
      const append = '?' + k

      for (const el of elements) {
        let style = el.getAttribute('style')
        if (style) {
          // replace url(/blah.jpg.) in style attributes
          const nstyle = style.replace(/(url\(\/.+)(png|jpg|gif)\)/, `$1$2${append})`)
          if (nstyle != style) {
            el.setAttribute('style', nstyle)
          }
        }
      }
    }
    const html = resp.document.documentElement.outerHTML
    resp = new Response(html, resp)
    resp.headers.delete("content-length")
    return resp
  }
}


// The Ghost demo serves some images from another hostname
// we'll route anything on /casper/ there
const casper = backends.generic("https://casper.ghost.org/v1.0.0/", { host: "casper.ghost.org" })

function router(req) {
  const url = new URL(req.url)
  if (url.pathname.startsWith("/casper/")) {
    return casper(req, "/casper/")
  }
  return ghost(req)
}
// Ghost's Demo uses casper.ghost.org for some image urls
// we need to rewrite those so we can process them

function rewriteCasperImages(fetch) {
  return async function rewriteCasperImages(req, opts) {
    let resp = await withDocument(fetch, req, opts)
    if (!resp.document || !(resp.document instanceof Document)) {
      // nothing to do
      return resp
    }

    const elements = resp.document.querySelectorAll('[style]')
    for (const el of elements) {
      let v = el.getAttribute('style')
      if (v) {
        el.setAttribute('style', v.replace("https://casper.ghost.org/v1.0.0/", "/casper/"))
        //console.log("rewrite: ", v, el.getAttribute("style"))
      }
    }

    const html = resp.document.documentElement.outerHTML
    resp = new Response(html, resp)
    resp.headers.delete("content-length")
    return resp
  }
}