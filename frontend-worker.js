/**
 * Golden Wings Robyn — static asset Worker + Phase 3 redirects.
 * Redirect map is DRY-RUN / staging until Phase 4 Bulk Redirect apply.
 */
import redirects from './redirects.json'

function normalizePath(pathname) {
  if (!pathname || pathname === '/') return '/'
  const trimmed = pathname.replace(/\/+$/, '') || '/'
  return trimmed
}

function resolveTarget(requestUrl, target) {
  if (/^https?:\/\//i.test(target)) return target
  const u = new URL(requestUrl)
  u.pathname = target
  u.search = new URL(requestUrl).search
  return u.toString()
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const path = normalizePath(url.pathname)
    const rule = redirects[path]
    if (rule) {
      const location = resolveTarget(request.url, rule.target)
      return Response.redirect(location, rule.status || 301)
    }
    return env.ASSETS.fetch(request)
  }
}
