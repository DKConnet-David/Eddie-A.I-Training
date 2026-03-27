<template>
  <aside class="sidebar">
    <nav id="sidebar-nav">
      <template v-for="(group, key) in sidebarGroups" :key="key">
        <div v-if="group.items.length > 0" class="sidebar-group">
          <div class="sidebar-group-label">{{ group.label }}</div>
          <SidebarNavItem
            v-for="pb in group.items"
            :key="pb.id"
            :playbook="pb"
            :is-active="pb.id === activeId"
            @navigate="onNavigate"
          />
        </div>
      </template>
    </nav>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePlaybookStore } from '@/stores/playbook.js'
import SidebarNavItem from './SidebarNavItem.vue'

const props = defineProps({
  activeId: {
    type: String,
    default: 'master',
  },
})

const emit = defineEmits(['check-unsaved'])

const router = useRouter()
const store = usePlaybookStore()

const sidebarGroups = computed(() => store.sidebarGroups)

function onNavigate(id) {
  // Emit so the parent can check unsaved changes before navigating
  emit('check-unsaved', () => {
    router.push('/playbooks/' + id)
  })
}
</script>
