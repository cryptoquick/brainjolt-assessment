import { h, render, Fragment } from 'https://unpkg.com/preact@latest?module'
import {
  useState,
  useEffect,
} from 'https://unpkg.com/preact@latest/hooks/dist/hooks.module.js?module'

const styles = {
  component: 'slideshow',
  loading: 'loading',
  image: 'image',
  font: { playfair: 'font-playfair', lato: 'font-lato' },
}

const join = (...classes) => classes.join(' ')

const Loader = () =>
  h(
    Fragment,
    {},
    h('span', { class: join(styles.font.lato, styles.loading) }, 'Loading...'),
    h('progress'),
  )

const Slide = ({ index, images, captions, setIndex }) =>
  h(
    'figure',
    {},
    h(
      'figcaption',
      {
        class: join(styles.font.playfair, styles.caption),
      },
      captions[index],
    ),
    h('div', {
      class: styles.image,
      style: `background-image: url('${images[index]}')`,
    }),
    h(
      'button',
      {
        onClick: advanceSlide(index, setIndex),
      },
      'Next Slide',
    ),
  )

const fetchSlides = (setImages, setCaptions, setLoaded) => async () => {
  try {
    const res = await fetch(
      `https://api.allorigins.win/get?url=${encodeURIComponent(
        'https://twentytwowords.com/weird-pictures-that-will-make-you-giggle-despite-your-best-intentions/',
      )}`,
    )

    if (res.status !== 200) {
      throw new Error('Error fetching images:', res.statusText)
    }

    const json = await res.json()
    const html = json.contents
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

    const imgs = [...doc.querySelectorAll('.gallery-item img.load-image')]
    const images = imgs.map((img) => img.src)
    setImages(images)

    const els = [...doc.querySelectorAll('.gallery-item .slide-title')]
    const captions = els.map((el) => el.innerText)
    setCaptions(captions)

    setLoaded(true)
  } catch (err) {
    console.error(err)
    alert(err)
  }
}

const advanceSlide = (index, setIndex) => () => {
  setIndex(++index)
}

const SlideSlideshow = () => {
  const [index, setIndex] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [images, setImages] = useState([])
  const [captions, setCaptions] = useState([])

  useEffect(fetchSlides(setImages, setCaptions, setLoaded), [])

  return h(
    'div',
    { class: styles.component },
    loaded ? h(Slide, { index, images, captions, setIndex }) : h(Loader),
  )
}

render(h(SlideSlideshow), document.body)
