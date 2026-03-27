import { useRouter } from 'vue-router'

/**
 * Custom directive that finds .route-link[data-route] spans inside v-html content
 * and binds click handlers to navigate via the Vue Router.
 *
 * Usage: <div v-html="html" v-route-links></div>
 */
function bindRouteLinks(el, router) {
  const links = el.querySelectorAll('.route-link[data-route]')
  links.forEach((link) => {
    // Avoid binding twice
    if (link.__routeLinkBound) return
    link.__routeLinkBound = true
    link.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      const route = link.dataset.route
      if (route) {
        router.push('/playbooks/' + route)
      }
    })
  })
}

export const vRouteLinks = {
  mounted(el, binding) {
    // The router instance is passed via binding.value or we grab it from the app
    const router = binding.value
    if (router) {
      bindRouteLinks(el, router)
    }
  },
  updated(el, binding) {
    const router = binding.value
    if (router) {
      bindRouteLinks(el, router)
    }
  },
}

export default vRouteLinks
