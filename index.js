import { ghost } from 'onehostname/lib/backends'

const blog = ghost("ghost", "blog.ghost.org")

fly.http.respondWith(blog)