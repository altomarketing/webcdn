try {
  class AnimatedIcons extends HTMLElement {
    constructor() {
      super()
      this.attachShadow({ mode: 'open' })

      // Create the container for the Lottie animation
      this.container = document.createElement('div')
      this.shadowRoot.appendChild(this.container)

      const style = document.createElement('style')
      style.textContent = `
        div {
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `
      this.shadowRoot.appendChild(style)
    }

    connectedCallback() {
      // Access the attributes after the element is connected to the DOM
      const customWidth = this.getAttribute('width') || '100px'
      const customHeight = this.getAttribute('height') || '100px'
      const trigger = this.getAttribute('trigger') || 'hover'

      // If no unit is provided, append 'px' to width and height
      this.container.style.width = this.addUnit(customWidth)
      this.container.style.height = this.addUnit(customHeight)

      if (!window.lottie) {
        const lottieScript = document.createElement('script')
        lottieScript.src =
          'https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.12.2/lottie.min.js'
        lottieScript.onload = async () => {
          await this.loadAnimation(this.container, trigger)
        }
        lottieScript.onerror = () => {
          console.error('Failed to load the Lottie library.')
        }
        document.head.appendChild(lottieScript)
      } else {
        this.loadAnimation(this.container, trigger)
      }
    }

    addUnit(value) {
      if (!value) {
        return '100px'
      }

      const hasUnit =
        value.includes('px') || value.includes('%') || value.includes('em')
      return hasUnit ? value : `${value}px`
    }

    async loadAnimation(container, trigger) {
      const src = this.getAttribute('src')
      const attributes = this.getAttribute('attributes')

      if (!src) {
        console.error('AnimatedIcons: Missing "src" attribute for Lottie JSON.')
        return
      }

      try {
        const response = await fetch(src)
        if (!response.ok) {
          throw new Error(`Failed to fetch Lottie JSON: ${response.statusText}`)
        }
        const animationData = await response.json()

        if (attributes) {
          try {
            const parsedAttributes = JSON.parse(attributes)
            this.applyAttributes(animationData, parsedAttributes)
          } catch (error) {
            console.error('Invalid JSON in attributes:', error)
          }
        }

        const animation = lottie.loadAnimation({
          container: container,
          renderer: 'svg',
          loop: trigger === 'loop',
          autoplay: trigger === 'loop',
          animationData: animationData,
        })

        if (trigger === 'hover') {
          container.addEventListener('mouseenter', () => {
            animation.loop = false
            animation.play()
          })
        } else if (trigger === 'loop-on-hover') {
          container.addEventListener('mouseenter', () => {
            animation.loop = true
            animation.play()
          })

          container.addEventListener('mouseleave', () => {
            animation.loop = false
            animation.stop()
          })
        } else if (trigger === 'click') {
          container.addEventListener('click', () => {
            animation.loop = false
            animation.play()
          })
        }

        // Stop animation on completion for non-loop triggers
        animation.addEventListener('complete', () => {
          if (trigger !== 'loop' && trigger !== 'loop-on-hover') {
            animation.stop()
          }
        })
      } catch (error) {
        console.error('Error loading or parsing Lottie JSON:', error)
      }
    }

    applyAttributes(animationData, attributes) {
      const layers = animationData.layers || []
      const { defaultColours, numberOfGroups, variationNumber, strokeWidth } =
        attributes

      this.strokeWidth = strokeWidth

      this.applyGroupColors(
        defaultColours,
        numberOfGroups,
        variationNumber,
        layers
      )

      this.applyBackgroundColor(defaultColours, layers)
      this.applySecondaryBackgroundColor(defaultColours, layers)
    }

    applyGroupColors(defaultColours, numberOfGroups, variationNumber, layers) {
      // Ensure that defaultColors, numberOfGroups, and variationNumber are provided
      if (!defaultColours || !numberOfGroups || !variationNumber) return

      // Loop through each group and apply the corresponding color
      for (let groupIndex = 1; groupIndex <= numberOfGroups; groupIndex++) {
        // Generate the group ID part using variation and group index
        const groupIdPart = `s${variationNumber}g${groupIndex}`
        const colorKey = `group-${groupIndex}`
        const groupColor = defaultColours[colorKey]

        // If the color is defined for the group, apply it
        if (groupColor) {
          const rgbColor = this.hexToRgb(groupColor)
          // Update the colors in the layers for this group
          this.updateColorsInLayers(layers, groupIdPart, rgbColor, 'fill')
        }
      }
    }

    applyBackgroundColor(defaultColours, layers) {
      const backgroundColor = defaultColours.background

      // If a background color is provided, apply it to the layers
      if (backgroundColor) {
        const rgb = this.hexToRgb(backgroundColor)
        this.updateBackgroundColorInLayers(layers, rgb)
      }
    }

    applySecondaryBackgroundColor(defaultColours, layers) {
      const bgSecondary = defaultColours.background2

      // If a secondary background color is provided, apply it to the layers
      if (bgSecondary) {
        const rgb = this.hexToRgb(bgSecondary)
        this.updateBackgroundSecondayColorInLayers(layers, rgb)
      }
    }

    updateColorsInLayers(layers, groupIdPart, rgb) {
      layers.forEach((layer) => {
        if (layer.nm.includes(groupIdPart) && layer.shapes) {
          this.updateColorsRecursively(layer.shapes, rgb, 'stroke')
        }
      })
    }

    // Code to update the background layers
    updateBackgroundColorInLayers(layers, rgb) {
      layers.forEach((layer) => {
        if (layer.nm.includes('background') && layer.shapes) {
          this.updateColorsRecursively(layer.shapes, rgb, 'fill')
        }
      })
    }

    updateBackgroundSecondayColorInLayers(layers, rgb) {
      layers.forEach((layer) => {
        if (!layer.nm.includes('background') && layer.shapes) {
          this.updateColorsRecursively(layer.shapes, rgb, 'fill')
        }
      })
    }

    updateColorsRecursively(items, rgb, updateType) {
      if (rgb.a === undefined) rgb.a = 1
      items.forEach((item) => {
        if (updateType === 'fill' && item.ty === 'fl') {
          item.c.k = [rgb.r / 255, rgb.g / 255, rgb.b / 255] // Set RGB
          if (item.o) {
            item.o.k = typeof item.o.k === 'number' ? rgb.a * 100 : rgb.a // Adjust the opacity
          }
        } else if (updateType === 'stroke' && item.ty === 'st') {
          item.c.k = [rgb.r / 255, rgb.g / 255, rgb.b / 255] // Set RGB
          if (item.o) {
            item.o.k = typeof item.o.k === 'number' ? rgb.a * 100 : rgb.a // Adjust the opacity
          }
          item.w.k = this.strokeWidth * 1 // Modify the stroke width
        } else if (item.ty === 'gr' && item.it) {
          this.updateColorsRecursively(item.it, rgb, updateType)
        }
      })
    }

    hexToRgb(hex) {
      if (typeof hex !== 'string') {
        console.error('Provided hex value is not a string:', hex)
        return null // Return a default or null value if hex is not a string
      }

      const bigint = parseInt(hex.slice(1, 7), 16)
      const r = (bigint >> 16) & 255
      const g = (bigint >> 8) & 255
      const b = bigint & 255

      if (hex.length === 9) {
        const a = parseInt(hex.slice(7), 16) / 255
        return { r, g, b, a }
      } else {
        return { r, g, b }
      }
    }
  }

  if (!customElements.get('animated-icons')) {
    customElements.define('animated-icons', AnimatedIcons)
  }
} catch (err) {
  console.warn(
    "AnimatedIcons: It seems like the script has already been loaded. Please ensure that you only load a single <script src='embed-animated-icons.js'></script> tag on your page."
  )
}
