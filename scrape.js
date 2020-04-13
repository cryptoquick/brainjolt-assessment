const scrape = () => {
  const imgs = [
    ...document.querySelectorAll('.gallery-item img.load-image'),
  ].slice(0, 19)
  const images = imgs.map((img) => img.src)

  const els = [
    ...document.querySelectorAll('.gallery-item .slide-title'),
  ].slice(
    1, // fix off-by-one caption order.
    20,
  )
  const captions = els.map((el) => el.innerText)

  return { images, captions }
}

JSON.stringify(scrape(), null, 2)
