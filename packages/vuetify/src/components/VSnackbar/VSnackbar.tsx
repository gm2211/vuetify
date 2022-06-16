// Styles
import './VSnackbar.sass'

// Components
import { VDefaultsProvider } from '@/components/VDefaultsProvider'
import { VOverlay } from '@/components/VOverlay'

// Composables
import { makePositionProps, usePosition } from '@/composables/position'
import { useProxiedModel } from '@/composables/proxiedModel'
import { makeTransitionProps } from '@/composables/transition'
import { genOverlays, makeVariantProps, useVariant } from '@/composables/variant'

// Utilities
import { onMounted, watch } from 'vue'
import { defineComponent, useRender } from '@/util'
import { makeRoundedProps, useRounded } from '@/composables/rounded'
import { makeLocationProps, useLocation } from '@/composables/location'
import { useScopeId } from '@/composables/scopeId'

export const VSnackbar = defineComponent({
  name: 'VSnackbar',

  props: {
    app: Boolean,
    contentClass: {
      type: String,
      default: '',
    },
    multiLine: Boolean,
    timeout: {
      type: [Number, String],
      default: 5000,
    },
    vertical: Boolean,

    modelValue: Boolean,

    ...makeLocationProps({ location: 'bottom' } as const),
    ...makePositionProps(),
    ...makeRoundedProps(),
    ...makeVariantProps(),
    ...makeTransitionProps({ transition: 'v-snackbar-transition' }),
  },

  emits: {
    'update:modelValue': (v: boolean) => true,
  },

  setup (props, { slots }) {
    const isActive = useProxiedModel(props, 'modelValue')
    const { locationStyles } = useLocation(props)
    const { positionClasses } = usePosition(props)
    const { scopeId } = useScopeId()

    const { colorClasses, colorStyles, variantClasses } = useVariant(props)
    const { roundedClasses } = useRounded(props)

    watch(isActive, startTimeout)
    watch(() => props.timeout, startTimeout)

    onMounted(() => {
      if (isActive.value) startTimeout()
    })

    let activeTimeout = -1
    function startTimeout () {
      window.clearTimeout(activeTimeout)
      const timeout = Number(props.timeout)

      if (!isActive.value || timeout === -1) return

      activeTimeout = window.setTimeout(() => {
        isActive.value = false
      }, timeout)
    }

    function onPointerenter () {
      window.clearTimeout(activeTimeout)
    }

    useRender(() => (
      <VOverlay
        v-model={ isActive.value }
        class={[
          'v-snackbar',
          {
            'v-snackbar--active': isActive.value,
            'v-snackbar--multi-line': props.multiLine && !props.vertical,
            'v-snackbar--vertical': props.vertical,
          },
          positionClasses.value,
        ]}
        style={[colorStyles.value]}
        contentProps={{
          style: locationStyles.value,
        }}
        persistent
        noClickAnimation
        scrim={ false }
        scrollStrategy="none"
        transition={ props.transition }
        { ...scopeId }
        v-slots={{ activator: slots.activator }}
      >
        <div
          class={[
            'v-snackbar__wrapper',
            colorClasses.value,
            roundedClasses.value,
            variantClasses.value,
          ]}
          onPointerenter={ onPointerenter }
          onPointerleave={ startTimeout }
        >
          { genOverlays(false, 'v-snackbar') }

          { slots.default && (
            <div
              class={[
                'v-snackbar__content',
                props.contentClass,
              ]}
              role="status"
              aria-live="polite"
            >
              { slots.default?.() }
            </div>
          ) }

          { slots.actions && (
            <VDefaultsProvider
              defaults={{
                VBtn: {
                  variant: 'text',
                  ripple: false,
                },
              }}
            >
              <div class="v-snackbar__actions">
                { slots.actions?.() }
              </div>
            </VDefaultsProvider>
          ) }
        </div>
      </VOverlay>
    ))
  },
})

export type VSnackbar = InstanceType<typeof VSnackbar>