import { createRouter, createWebHashHistory } from 'vue-router'

const PlaybooksView = () => import('../views/PlaybooksView.vue')
const AuditView = () => import('../views/AuditView.vue')
const TrainerView = () => import('../views/TrainerView.vue')
const SyntaxView = () => import('../views/SyntaxView.vue')
const ExportView = () => import('../views/ExportView.vue')

const routes = [
  {
    path: '/',
    redirect: '/playbooks/master',
  },
  {
    path: '/playbooks/:id?',
    name: 'Playbooks',
    component: PlaybooksView,
  },
  {
    path: '/audit',
    name: 'Audit',
    component: AuditView,
  },
  {
    path: '/syntax',
    name: 'Syntax',
    component: SyntaxView,
  },
  {
    path: '/trainer',
    name: 'Trainer',
    component: TrainerView,
  },
  {
    path: '/export',
    name: 'Export',
    component: ExportView,
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
