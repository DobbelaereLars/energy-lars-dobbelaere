import { useTres } from '@tresjs/core'
import { Raycaster, Vector2 } from 'three'
import type { Object3D } from 'three'
import { onMounted, onUnmounted } from 'vue'

interface DragHandlers {
  start?: (ray: Raycaster) => void
  move: (ray: Raycaster, pointer: Vector2) => void
  end?: () => void
  hover?: (over: boolean) => void
  click?: (ray: Raycaster) => void
}

const hovered = new Set<symbol>()
let active: symbol | null = null

export function useDrag(target: () => Object3D | null, handlers: DragHandlers) {
  const { camera, renderer, controls } = useTres()
  const raycaster = new Raycaster()
  const pointer = new Vector2()
  const id = Symbol('drag')
  let dragging = false
  let over = false
  const down = new Vector2()

  function aim(e: PointerEvent) {
    const rect = renderer.domElement.getBoundingClientRect()
    pointer.set((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1)
    raycaster.setFromCamera(pointer, camera.value!)
  }

  function hits(e: PointerEvent) {
    const object = target()
    if (e.target !== renderer.domElement || !object?.visible || !camera.value) {
      return false
    }
    aim(e)
    return raycaster.intersectObject(object).length > 0
  }

  function setCursor() {
    renderer.domElement.style.cursor = active ? 'grabbing' : hovered.size ? 'grab' : ''
  }

  function onDown(e: PointerEvent) {
    if (active || !hits(e)) {
      return
    }
    active = id
    dragging = true
    down.set(e.clientX, e.clientY)
    if (controls.value) {
      controls.value.enabled = false
    }
    handlers.start?.(raycaster)
    setCursor()
  }

  function onMove(e: PointerEvent) {
    if (dragging) {
      aim(e)
      handlers.move(raycaster, pointer)
      return
    }
    const hit = hits(e)
    if (hit !== over) {
      over = hit
      handlers.hover?.(hit)
    }
    if (hit) {
      hovered.add(id)
    }
    else {
      hovered.delete(id)
    }
    setCursor()
  }

  function onUp(e: PointerEvent) {
    if (!dragging) {
      return
    }
    dragging = false
    active = null
    handlers.end?.()
    if (handlers.click && down.distanceTo(new Vector2(e.clientX, e.clientY)) < 5) {
      aim(e)
      handlers.click(raycaster)
    }
    if (controls.value) {
      controls.value.enabled = true
    }
    setCursor()
  }

  onMounted(() => {
    window.addEventListener('pointerdown', onDown, true)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  })

  onUnmounted(() => {
    window.removeEventListener('pointerdown', onDown, true)
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
  })
}
