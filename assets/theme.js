    (function () {
      const yearEl = document.getElementById('year');
      if (yearEl) yearEl.textContent = new Date().getFullYear();


      // Load products from inline JSON script (rendered by snippets/product-modal.liquid)
      let products = {};
      const productsScript = document.getElementById('praali-products');
      if (productsScript) {
        try { products = JSON.parse(productsScript.textContent); }
        catch (e) { console.warn('Could not parse praali-products JSON', e); }
      }


      document.querySelectorAll('.product-card').forEach(card => {
        const productId = card.dataset.product;
        const product = products[productId];
        if (!product) return;

        const swatches = card.querySelectorAll('.swatch');
        const imageLabel = card.querySelector('.product-image .img-label');

        const cardImg = card.querySelector('.product-image img');
        swatches.forEach((s, i) => {
          s.addEventListener('click', (e) => {
            e.stopPropagation();
            swatches.forEach(x => x.classList.remove('is-active'));
            s.classList.add('is-active');
            const color = product.colors[i];
            if (cardImg && color.images && color.images[0]) {
              cardImg.src = color.images[0];
            }
            if (imageLabel) {
              imageLabel.textContent = `${product.name.toLowerCase()} — ${color.name.toLowerCase()}`;
            }
          });
        });

        const cardSizes = card.querySelector('[data-card-sizes]');
        if (cardSizes) {
          // If Liquid already rendered size buttons from real Shopify variants,
          // just wire up click handlers. Otherwise (placeholder cards),
          // populate from the hardcoded prototype data.
          const existingButtons = cardSizes.querySelectorAll('.size-option');
          if (existingButtons.length > 0) {
            existingButtons.forEach(btn => {
              btn.addEventListener('click', (e) => {
                e.stopPropagation();
                existingButtons.forEach(x => x.classList.remove('is-active'));
                btn.classList.add('is-active');
              });
            });
          } else {
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
        }
      });

      const modal = document.getElementById('productModal');
      const modalTitle = modal.querySelector('[id="modalTitle"]');
      const modalPrice = modal.querySelector('[data-modal-price]');
      const modalImageLabel = modal.querySelector('[data-modal-image-label]');
      const modalImage = modal.querySelector('[data-modal-image]');
      const modalImageImg = modal.querySelector('[data-modal-image-img]');
      const carouselPrev = modal.querySelector('[data-carousel-prev]');
      const carouselNext = modal.querySelector('[data-carousel-next]');
      const carouselCounter = modal.querySelector('[data-carousel-counter]');
      const modalSwatches = modal.querySelector('[data-modal-swatches]');
      const modalColorName = modal.querySelector('[data-modal-color-name]');
      const modalSizes = modal.querySelector('[data-modal-sizes]');
      const modalSizeChart = modal.querySelector('[data-modal-size-chart]');
      const modalSizeThead = modal.querySelector('[data-modal-size-thead]');
      const modalTagline = modal.querySelector('[data-modal-tagline]');
      const modalFitNote = modal.querySelector('[data-modal-fit-note]');
      const modalBullets = modal.querySelector('[data-modal-bullets]');
      const modalFlat = modal.querySelector('[data-modal-flat]');
      const modalFlatImg = modal.querySelector('[data-modal-flat-img]');

      let carouselIndex = 0;
      let carouselImages = [];

      function renderCarousel(index) {
        if (!carouselImages.length) return;
        carouselIndex = (index + carouselImages.length) % carouselImages.length;
        modalImageImg.src = carouselImages[carouselIndex];
        carouselCounter.textContent = `${carouselIndex + 1} / ${carouselImages.length}`;
      }

      carouselPrev.addEventListener('click', (e) => {
        e.stopPropagation();
        renderCarousel(carouselIndex - 1);
      });
      carouselNext.addEventListener('click', (e) => {
        e.stopPropagation();
        renderCarousel(carouselIndex + 1);
      });

      function isLight(hex) {
        const h = hex.replace('#', '');
        const r = parseInt(h.slice(0, 2), 16);
        const g = parseInt(h.slice(2, 4), 16);
        const b = parseInt(h.slice(4, 6), 16);
        return (r * 0.299 + g * 0.587 + b * 0.114) > 160;
      }

      function renderColor(product, index) {
        const color = product.colors[index];
        modalColorName.textContent = color.name;
        modalSwatches.querySelectorAll('.swatch').forEach((s, i) => {
          s.classList.toggle('is-active', i === index);
        });

        if (color.flat) {
          modalFlatImg.src = color.flat;
          modalFlat.hidden = false;
        } else {
          modalFlat.hidden = true;
        }

        const imgs = (color.images && color.images.length) ? color.images : (product.images || []);
        if (imgs.length) {
          carouselImages = imgs;
          modalImageImg.hidden = false;
          modalImageLabel.hidden = true;
          modalImage.style.background = '';
          carouselPrev.hidden = imgs.length <= 1;
          carouselNext.hidden = imgs.length <= 1;
          carouselCounter.hidden = imgs.length <= 1;
          renderCarousel(0);
        } else {
          carouselImages = [];
          modalImageImg.hidden = true;
          modalImageLabel.hidden = false;
          modalImage.style.background = color.hex;
          modalImageLabel.textContent = `${product.name.toLowerCase()} — ${color.name.toLowerCase()}`;
          modalImageLabel.style.color = isLight(color.hex) ? '#002C39' : '#EDE8E0';
          carouselPrev.hidden = true;
          carouselNext.hidden = true;
          carouselCounter.hidden = true;
        }
      }

      function openModal(productId) {
        const product = products[productId];
        if (!product) return;

        modalTitle.textContent = product.name;
        modalPrice.textContent = product.price;

        if (product.tagline) {
          modalTagline.textContent = product.tagline;
          modalTagline.hidden = false;
        } else {
          modalTagline.hidden = true;
        }

        if (product.fitNote) {
          modalFitNote.textContent = product.fitNote;
          modalFitNote.hidden = false;
        } else {
          modalFitNote.hidden = true;
        }

        modalBullets.innerHTML = '';
        if (product.bullets && product.bullets.length) {
          product.bullets.forEach(b => {
            const li = document.createElement('li');
            li.textContent = b;
            modalBullets.appendChild(li);
          });
          modalBullets.hidden = false;
        } else {
          modalBullets.hidden = true;
        }


        modalSwatches.innerHTML = '';
        product.colors.forEach((c, i) => {
          const b = document.createElement('button');
          b.className = 'swatch';
          b.style.background = c.hex;
          b.setAttribute('aria-label', c.name);
          b.addEventListener('click', () => renderColor(product, i));
          modalSwatches.appendChild(b);
        });

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

        const sizeCols = product.sizeColumns || [
          { label: 'Bust', key: 'bust' },
          { label: 'Waist', key: 'waist' },
          { label: 'Length', key: 'length' }
        ];
        modalSizeThead.innerHTML = `<tr><th>Size</th>${sizeCols.map(c => `<th>${c.label}</th>`).join('')}</tr>`;
        modalSizeChart.innerHTML = '';
        product.sizeChart.forEach(row => {
          const tr = document.createElement('tr');
          tr.innerHTML = `<td>${row.size}</td>${sizeCols.map(c => `<td>${row[c.key] || ''}</td>`).join('')}`;
          modalSizeChart.appendChild(tr);
        });

        renderColor(product, product.defaultColorIndex || 0);

        modal.hidden = false;
        document.body.classList.add('modal-open');
      }

      function closeModal() {
        modal.hidden = true;
        document.body.classList.remove('modal-open');
      }

      /* Track which product card opened the modal (used for Buy Now) */
      let activeCardEl = null;

      document.querySelectorAll('[data-modal-open]').forEach(el => {
        el.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          activeCardEl = el.closest('.product-card');
          openModal(el.dataset.modalOpen);
        });
      });

      modal.querySelectorAll('[data-modal-close]').forEach(el => {
        el.addEventListener('click', closeModal);
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.hidden) closeModal();
      });

      /* BUY NOW — resolve Shopify variant and redirect to checkout */
      function getCardVariants(card) {
        if (!card) return null;
        const raw = card.getAttribute('data-variants');
        if (!raw) return null;
        try { return JSON.parse(raw); } catch (e) { return null; }
      }

      function getActiveValue(scope, selector) {
        const el = scope && scope.querySelector(selector + '.is-active');
        if (!el) return null;
        return (el.getAttribute('data-value') || el.getAttribute('aria-label') || el.textContent || '').trim();
      }

      function findVariant(variants, color, size) {
        if (!variants || !variants.length) return null;
        return variants.find(v => {
          const opts = (v.options || []).map(o => (o || '').toString());
          if (color && !opts.includes(color)) return false;
          if (size && !opts.includes(size)) return false;
          return true;
        }) || null;
      }

      function buyNowFromCard(card, color, size) {
        const variants = getCardVariants(card);
        if (!variants) {
          alert('This is a demo product. Configure real products in Shopify to enable checkout.');
          return;
        }
        const chosenColor = color || getActiveValue(card, '.swatch');
        const chosenSize = size || getActiveValue(card, '.size-option');
        if (!chosenSize && card.querySelector('.size-option')) {
          alert('Please pick a size.');
          return;
        }
        const variant = findVariant(variants, chosenColor, chosenSize) || variants[0];
        if (!variant || !variant.available) {
          alert('That option isn\'t available right now.');
          return;
        }
        window.location.href = '/cart/' + variant.id + ':1';
      }

      document.querySelectorAll('.product-card [data-buy-now]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const card = btn.closest('.product-card');
          buyNowFromCard(card);
        });
      });

      const modalBuyBtn = modal.querySelector('[data-modal-buy]');
      if (modalBuyBtn) {
        modalBuyBtn.addEventListener('click', (e) => {
          e.preventDefault();
          if (!activeCardEl) return;
          const modalColor = getActiveValue(modal, '.modal-swatches .swatch');
          const modalSize = getActiveValue(modal, '[data-modal-sizes] .size-option');
          buyNowFromCard(activeCardEl, modalColor, modalSize);
        });
      }

      /* HERO CAROUSEL */
      const heroSlides = document.querySelectorAll('.hero-slide');
      const heroDots = document.querySelectorAll('.hero-dot');
      const heroPrev = document.querySelector('[data-hero-prev]');
      const heroNext = document.querySelector('[data-hero-next]');
      if (heroSlides.length) {
        let heroIndex = 0;
        let heroTimer;

        function showHero(i) {
          heroIndex = (i + heroSlides.length) % heroSlides.length;
          heroSlides.forEach((s, idx) => s.classList.toggle('is-active', idx === heroIndex));
          heroDots.forEach((d, idx) => d.classList.toggle('is-active', idx === heroIndex));
        }

        function startHeroAuto() {
          stopHeroAuto();
          heroTimer = setInterval(() => showHero(heroIndex + 1), 5000);
        }
        function stopHeroAuto() {
          if (heroTimer) clearInterval(heroTimer);
        }

        heroPrev.addEventListener('click', () => { showHero(heroIndex - 1); startHeroAuto(); });
        heroNext.addEventListener('click', () => { showHero(heroIndex + 1); startHeroAuto(); });
        heroDots.forEach((d, idx) => {
          d.addEventListener('click', () => { showHero(idx); startHeroAuto(); });
        });
        startHeroAuto();
      }

      /* PHOTO STRIP CAROUSEL */
      const stripWrap = document.querySelector('.photo-strip-wrap');
      const stripTrack = document.querySelector('[data-strip-track]');
      const stripPrev = document.querySelector('[data-strip-prev]');
      const stripNext = document.querySelector('[data-strip-next]');
      if (stripWrap && stripTrack) {
        const stripCount = stripTrack.querySelectorAll('.strip-img').length;
        let stripIndex = 0;

        function getVisible() {
          const v = parseFloat(getComputedStyle(stripWrap).getPropertyValue('--visible-count'));
          return v > 0 ? v : 4;
        }

        function updateStrip() {
          const visible = getVisible();
          const max = Math.max(0, stripCount - visible);
          if (stripIndex > max) stripIndex = max;
          if (stripIndex < 0) stripIndex = 0;
          const shift = stripIndex * (100 / visible);
          stripTrack.style.transform = `translateX(-${shift}%)`;
          stripPrev.disabled = stripIndex === 0;
          stripNext.disabled = stripIndex >= max;
        }

        stripPrev.addEventListener('click', () => { stripIndex -= 1; updateStrip(); });
        stripNext.addEventListener('click', () => { stripIndex += 1; updateStrip(); });
        window.addEventListener('resize', updateStrip);
        updateStrip();
      }
    })();
