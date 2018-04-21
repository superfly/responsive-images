
export async function withDocument(fetchFn, req, opts) {
  let resp = await fetchFn(req, opts)
  console.log(resp instanceof Response)

  if (resp.document) {
    // already done
    return resp
  }

  const contentType = resp.headers.get("content-type") || ""
  if (!contentType.includes("text/html")) {
    return resp
  }

  console.log("Reading DOM")
  let html = await resp.text()
  // the body can't be read again, make a new response
  resp = new Response(html, resp)
  resp.document = Document.parse(html)
  return resp
}