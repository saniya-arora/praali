(function () {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const products = {
    '1': {
      name: 'Product 1',
      price: '$XX',
      composition: '100% organic cotton, ethically dyed in small batches.',
      colors: [
        { name: 'Olive', hex: '#596C45' },
        { name: 'Cream', hex: '#EDE8E0' },
        { name: 'Navy',  hex: '#002C39' }
      ],
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      sizeChart: [
        { size: 'XS', bust: '32', waist: '24', hip: '34' },
        { size: 'S',  bust: '34', waist: '26', hip: '36' },
        { size: 'M',  bust: '36', waist: '28', hip: '38' },
        { size: 'L',  bust: '38', waist: '30', hip: '40' },
        { size: 'XL', bust: '40', waist: '32', hip: '42' }
      ],
      facts: [
        'Made in India',
        'Ethically produced in small batches',
        'Hand-finished details',
        'Machine wash cold, line dry'
      ]
    },
    '2': {
      name: 'Product 2',
      price: '$XX',
      composition: 'Organic cotton blend with hand-block printed accents.',
      colors: [
        { name: 'Yellow', hex: '#FEE569' },
        { name: 'Sage',   hex: '#A9B48B' },
        { name: 'Berry',  hex: '#9E2949' }
      ],
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      sizeChart: [
        { size: 'XS', bust: '32', waist: '24', hip: '34' },
        { size: 'S',  bust: '34', waist: '26', hip: '36' },
        { size: 'M',  bust: '36', waist: '28', hip: '38' },
        { size: 'L',  bust: '38', waist: '30', hip: '40' },
        { size: 'XL', bust: '40', waist: '32', hip: '42' }
      ],
      facts: [
        'Made in India',
        'Inspired by traditional Indian silhouettes',
        'Designed for movement and rest',
        'Machine wash cold, line dry'
      ]
    }
  };

  /* Color swatches + sizes on cards */
  document.querySelectorAll('.product-card').forEach(card => {
    const productId = card.dataset.product;
    const product = products[productId];
    if (!product) return;

    const swatches = card.querySelectorAll('.swatch');
    const imageLabel = card.querySelector('.product-image .img-label');

    swatches.forEach((s, i) => {
      s.addEventListener('click', (e) => {
        e.stopPropagation();
        swatches.forEach(x => x.classList.remove('is-active'));
        s.classList.add('is-active');
        if (imageLabel) {
          imageLabel.textContent = `${product.name.toLowerCase()} — ${product.colors[i].name.toLowerCase()}`;
        }
      });
    });

    const cardSizes = card.querySelector('[data-card-sizes]');
    if (cardSizes) {
      product.sizes.forEach(size => {
        const b = document.createElement('button');
        b.className = 'size-option';
        b.textContent = size;
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          cardSizes.querySelectorAll('.size-option').forEach(x => x.classList.remove('is-active'));
          b.classList.add('is-active');
        });
        cardSizes.appendChild(b);
      });
    }
  });

  /* Modal */
  const modal = document.getElementById('productModal');
  const modalTitle = modal.querySelector('[id="modalTitle"]');
  const modalPrice = modal.querySelector('[data-modal-price]');
  const modalComposition = modal.querySelector('[data-modal-composition]');
  const modalImageLabel = modal.querySelector('[data-modal-image-label]');
  const modalImage = modal.querySelector('[data-modal-image]');
  const modalSwatches = modal.querySelector('[data-modal-swatches]');
  const modalColorName = modal.querySelector('[data-modal-color-name]');
  const modalSizes = modal.querySelector('[data-modal-sizes]');
  const modalSizeChart = modal.querySelector('[data-modal-size-chart]');
  const modalFacts = modal.querySelector('[data-modal-facts]');

  function renderColor(product, index) {
    const color = product.colors[index];
    modalColorName.textContent = color.name;
    modalImage.style.background = color.hex;
    modalImageLabel.textContent = `${product.name.toLowerCase()} — ${color.name.toLowerCase()}`;
    modalImageLabel.style.color = isLight(color.hex) ? '#002C39' : '#EDE8E0';
    modalSwatches.querySelectorAll('.swatch').forEach((s, i) => {
      s.classList.toggle('is-active', i === index);
    });
  }

  function isLight(hex) {
    const h = hex.replace('#', '');
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return (r * 0.299 + g * 0.587 + b * 0.114) > 160;
  }

  function openModal(productId) {
    const product = products[productId];
    if (!product) return;

    modalTitle.textContent = product.name;
    modalPrice.textContent = product.price;
    modalComposition.textContent = product.composition;

    /* Swatches */
    modalSwatches.innerHTML = '';
    product.colors.forEach((c, i) => {
      const b = document.createElement('button');
      b.className = 'swatch' + (i === 0 ? ' is-active' : '');
      b.style.background = c.hex;
      b.setAttribute('aria-label', c.name);
      b.addEventListener('click', () => renderColor(product, i));
      modalSwatches.appendChild(b);
    });

    /* Sizes */
    modalSizes.innerHTML = '';
    product.sizes.forEach(size => {
      const b = document.createElement('button');
      b.className = 'size-option';
      b.textContent = size;
      b.addEventListener('click', () => {
        modalSizes.querySelectorAll('.size-option').forEach(x => x.classList.remove('is-active'));
        b.classList.add('is-active');
      });
      modalSizes.appendChild(b);
    });

    /* Size chart */
    modalSizeChart.innerHTML = '';
    product.sizeChart.forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${row.size}</td><td>${row.bust}</td><td>${row.waist}</td><td>${row.hip}</td>`;
      modalSizeChart.appendChild(tr);
    });

    /* Facts */
    modalFacts.innerHTML = '';
    product.facts.forEach(f => {
      const li = document.createElement('li');
      li.textContent = f;
      modalFacts.appendChild(li);
    });

    renderColor(product, 0);

    modal.hidden = false;
    document.body.classList.add('modal-open');
  }

  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove('modal-open');
  }

  document.querySelectorAll('[data-modal-open]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openModal(el.dataset.modalOpen);
    });
  });

  modal.querySelectorAll('[data-modal-close]').forEach(el => {
    el.addEventListener('click', closeModal);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) closeModal();
  });
})();
