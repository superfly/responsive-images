import { ghost } from 'onehostname/lib/backends'
import { processImages } from './src/images';

const blog = ghost("demo")

fly.http.respondWith(
  processImages(
    blog
  )
)