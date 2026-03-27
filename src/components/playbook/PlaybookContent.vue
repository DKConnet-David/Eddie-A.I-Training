<template>
  <div class="playbook-content-wrapper">
    <template v-if="playbook">
      <PlaybookHeader :playbook="playbook" />

      <PlaybookActions
        :all-expanded="allExpanded"
        :has-override="hasOverride"
        @edit="$emit('edit-playbook')"
        @toggle-all="toggleAll"
        @reset="$emit('reset')"
      />

      <!-- Pre-step content (before any ## Step) -->
      <div
        v-if="preContent"
        v-html="preContentHtml"
        v-route-links="router"
      ></div>

      <!-- Step cards with sub-step grouping -->
      <div ref="stepsContainer">
        <template v-for="(group, gi) in stepGroups" :key="gi">
          <!-- Regular step (not a sub-step) -->
          <template v-if="!group.isSub">
            <StepCard
              v-for="item in group.items"
              :key="'step-' + item.globalIndex"
              :step="item.step"
              :index="item.globalIndex"
              :is-sub-step="false"
              :initial-open="item.globalIndex === 0"
              :force-open="forceOpenState"
              :is-editing="editingStepIndex === item.globalIndex"
              @edit="(idx) => $emit('open-editor', idx)"
              :ref="(el) => registerCardRef(item.globalIndex, el)"
            />
          </template>

          <!-- Sub-step group -->
          <SubStepGroup v-else>
            <StepCard
              v-for="item in group.items"
              :key="'step-' + item.globalIndex"
              :step="item.step"
              :index="item.globalIndex"
              :is-sub-step="true"
              :initial-open="false"
              :force-open="forceOpenState"
              :is-editing="editingStepIndex === item.globalIndex"
              @edit="(idx) => $emit('open-editor', idx)"
              :ref="(el) => registerCardRef(item.globalIndex, el)"
            />
          </SubStepGroup>
        </template>
      </div>

      <AddStepButton @add="$emit('add-step')" />
    </template>

    <p v-else style="color: var(--text-muted);">Playbook not found.</p>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePlaybookStore } from '@/stores/playbook.js'
import { splitSteps, renderContent } from '@/lib/markdown.js'
import { extractFrontmatter } from '@/lib/markdown.js'
import { vRouteLinks } from '@/directives/vRouteLinks.js'
import { useDragReorder } from '@/composables/useDragReorder.js'
import PlaybookHeader from './PlaybookHeader.vue'
import PlaybookActions from './PlaybookActions.vue'
import StepCard from './StepCard.vue'
import SubStepGroup from './SubStepGroup.vue'
import AddStepButton from './AddStepButton.vue'

const props = defineProps({
  playbookId: {
    type: String,
    required: true,
  },
  editingStepIndex: {
    type: Number,
    default: -1,
  },
})

const emit = defineEmits(['edit-playbook', 'open-editor', 'add-step', 'reset'])

const router = useRouter()
const store = usePlaybookStore()

const stepsContainer = ref(null)
const cardRefs = ref({})
const allExpanded = ref(false)
const forceOpenState = ref(undefined)

// Track force-open changes via a toggle counter
// undefined = no force, true = expand all, false = collapse all
function toggleAll() {
  allExpanded.value = !allExpanded.value
  forceOpenState.value = allExpanded.value
}

const playbook = computed(() => store.playbooks[props.playbookId] || null)

const hasOverride = computed(() => !!store.overrides[props.playbookId])

const effectiveMd = computed(() => store.effectiveMarkdown(props.playbookId))

const parsedSections = computed(() => {
  if (!effectiveMd.value) return { pre: '', steps: [] }
  const fm = extractFrontmatter(effectiveMd.value)
  return splitSteps(fm.body)
})

const preContent = computed(() => parsedSections.value.pre)

const preContentHtml = computed(() => {
  return renderContent(preContent.value)
})

const steps = computed(() => parsedSections.value.steps)

/**
 * Group consecutive sub-steps together for the SubStepGroup wrapper.
 * Returns array of { isSub: boolean, items: [{ step, globalIndex }] }
 */
const stepGroups = computed(() => {
  const groups = []
  let currentSubGroup = null

  for (let i = 0; i < steps.value.length; i++) {
    const step = steps.value[i]
    const isSub = /^\d+[A-Za-z]/.test(step.number)

    if (isSub) {
      if (!currentSubGroup) {
        currentSubGroup = { isSub: true, items: [] }
        groups.push(currentSubGroup)
      }
      currentSubGroup.items.push({ step, globalIndex: i })
    } else {
      currentSubGroup = null
      groups.push({
        isSub: false,
        items: [{ step, globalIndex: i }],
      })
    }
  }

  return groups
})

function registerCardRef(index, el) {
  if (el) {
    cardRefs.value[index] = el
  } else {
    delete cardRefs.value[index]
  }
}

// Drag and drop
const { bind: bindDrag } = useDragReorder(stepsContainer, (fromIndex, toIndex) => {
  store.moveStep(props.playbookId, fromIndex, toIndex)
})

// Re-bind drag after steps render
watch(steps, () => {
  nextTick(() => bindDrag())
})

onMounted(() => {
  nextTick(() => bindDrag())
})

// Reset expand state when playbook changes
watch(
  () => props.playbookId,
  () => {
    allExpanded.value = false
    forceOpenState.value = undefined
  }
)

// Scroll editing step into view
watch(
  () => props.editingStepIndex,
  (idx) => {
    if (idx >= 0) {
      nextTick(() => {
        const cardComp = cardRefs.value[idx]
        if (cardComp && cardComp.$el) {
          cardComp.$el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }
      })
    }
  }
)

defineExpose({ stepsContainer })
</script>
