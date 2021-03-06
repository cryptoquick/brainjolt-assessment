import { h, render, Fragment } from 'https://unpkg.com/preact@latest?module'
import {
  useState,
  useEffect,
} from 'https://unpkg.com/preact@latest/hooks/dist/hooks.module.js?module'

// constants
const HOST = 'http://0.0.0.0:3000'
const PATH = 'data.json'

// styles classes
const styles = {
  component: 'slideshow',
  loading: 'loading',
  image: 'image',
  font: { playfair: 'font-playfair', lato: 'font-lato' },
}

// util
const join = (sep, ...classes) => classes.join(sep)

const range = (length) => Array.from({ length }, (_, i) => i)

// crypto

// mulberry32 PRNG
// https://github.com/bryc/code/blob/master/jshash/PRNGs.md#mulberry32https://gist.github.com/blixt/f17b47c62508be59987b#gistcomment-2792771
const mb32 = (a) => (t) =>
  ((a = (a + 1831565813) | 0),
  (t = Math.imul(a ^ (a >>> 15), 1 | a)),
  (t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t),
  (t ^ (t >>> 14)) >>> 0) /
  2 ** 32

// pseudorandom permutation
const PRPRM = (len, seed) => {
  const order = range(len)
  const prng = mb32(seed)
  const seq = []
  let t = 0

  while (t < len) {
    t++
    let i = Math.floor(prng(t) * order.length)
    seq.push(order[i])
    order.splice(i, 1) // not ideal, prefer balanced tree for scalability
  }

  return seq
}

// test assertion: is unique sequence (using set method)
const isUniqSeq = (arr) => {
  const set = new Set(arr)
  return set.size === arr.length
}

// unit test
const test = (runs, func, assert, ...args) => {
  let errs = 0

  const indexArg = args.indexOf('__index')

  for (let i = 0; i <= runs; i++) {
    if (indexArg >= 0) {
      args[indexArg] = i
    }
    if (!assert(func(...args))) {
      errs++
    }
  }

  if (errs) {
    console.error(`failed ${Math.round(errs / runs) * 100}% tests`)
  } else {
    console.info(`no errors after ${runs} runs`)
  }
}

const unit = (runs) => [() => test(runs, PRPRM, isUniqSeq, 100, '__index')]

// SFCs - stateless functional components
const Loader = () =>
  h(
    Fragment,
    {},
    h(
      'span',
      { class: join(' ', styles.font.lato, styles.loading) },
      'Loading...',
    ),
    h('progress'),
  )

const Slide = ({ index, images, captions, sequence, setIndex }) =>
  h(
    'figure',
    {},
    h(
      'figcaption',
      {
        class: join(' ', styles.font.playfair, styles.caption),
      },
      captions[sequence[index]],
    ),
    h('div', {
      class: styles.image,
      style: `background-image: url('${images[sequence[index]]}')`,
    }),
    h(
      'button',
      {
        onClick: advanceSlide(index, setIndex),
      },
      'Next Slide',
    ),
  )

// async ops
const fetchSlides = async (setImages, setCaptions) => {
  try {
    const res = await fetch(join('/', HOST, PATH))

    if (res.status !== 200) {
      throw new Error('Error fetching images:', res.statusText)
    }

    const { images, captions } = await res.json()

    setImages(images)
    setCaptions(captions)

    return images.length
  } catch (err) {
    console.error(err)
    alert(err)
  }
}

// event handlers
const advanceSlide = (index, setIndex) => () => {
  setIndex(index + 1)
}

// FCs - stateful functional components
const SlideSlideshow = () => {
  const [index, setIndex] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [images, setImages] = useState([])
  const [captions, setCaptions] = useState([])
  const [sequence, setSequence] = useState([])
  const [run, setRun] = useState(0)
  const [max, setMax] = useState(-1)

  useEffect(async () => {
    const length = await fetchSlides(setImages, setCaptions)
    setMax(length)
    setSequence(PRPRM(length, run))
  }, [])

  if (index === max) {
    setIndex(0)
    const newSeq = run + 1
    setRun(newSeq)
    setSequence(PRPRM(images.length, newSeq))
    console.info('restarted, with sequence', newSeq)
  }

  useEffect(() => {
    if (
      images.length > 0 &&
      captions.length > 0 &&
      sequence.length === images.length &&
      sequence.length === captions.length
    ) {
      console.info('loaded')
      setLoaded(true)
    } else {
      console.debug('not yet ready...')
      console.debug('captions', captions)
      console.debug('images', images)
      console.debug('sequence', sequence)
    }
  }, [images.length, captions.length, sequence.length])

  return h(
    'div',
    { class: styles.component },
    loaded
      ? h(Slide, { index, images, captions, sequence, setIndex })
      : h(Loader),
  )
}

// app
render(h(SlideSlideshow), document.body)

// run tests in-browser
// no setImmediate ... ugh ... https://bugs.chromium.org/p/chromium/issues/detail?id=146172
const RUNS = 100
setTimeout(() => unit(RUNS).map((t, i) => t(i)), 0)
