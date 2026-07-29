    (function () {
      const yearEl = document.getElementById('year');
      if (yearEl) yearEl.textContent = new Date().getFullYear();

      const emailPopup = document.querySelector('[data-email-popup]');
      if (emailPopup) {
        const storageKey = 'praali_email_popup_dismissed';
        const hasMessage = !!emailPopup.querySelector('[data-email-popup-message]');

        function hasDismissedEmailPopup() {
          try { return window.localStorage.getItem(storageKey) === 'true'; }
          catch (e) { return false; }
        }

        function markEmailPopupDismissed() {
          try { window.localStorage.setItem(storageKey, 'true'); }
          catch (e) { /* localStorage can be unavailable in private browsing */ }
        }

        function openEmailPopup() {
          emailPopup.hidden = false;
          document.body.classList.add('email-popup-open');
          requestAnimationFrame(() => emailPopup.classList.add('is-visible'));
        }

        function closeEmailPopup() {
          emailPopup.classList.remove('is-visible');
          document.body.classList.remove('email-popup-open');
          markEmailPopupDismissed();
          setTimeout(() => { emailPopup.hidden = true; }, 220);
        }

        emailPopup.querySelectorAll('[data-email-popup-close]').forEach(el => {
          el.addEventListener('click', closeEmailPopup);
        });

        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && !emailPopup.hidden) closeEmailPopup();
        });

        if (hasMessage || !hasDismissedEmailPopup()) {
          setTimeout(openEmailPopup, hasMessage ? 100 : 900);
        }
      }


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
          b.addEventListener('click', () => {
            renderColor(product, i);
            updateModalAvailability();
          });
          modalSwatches.appendChild(b);
        });

        modalSizes.innerHTML = '';
        product.sizes.forEach(size => {
          const b = document.createElement('button');
          b.className = 'size-option';
          b.textContent = size;
          b.setAttribute('data-value', size);
          b.addEventListener('click', () => {
            modalSizes.querySelectorAll('.size-option').forEach(x => x.classList.remove('is-active'));
            b.classList.add('is-active');
            updateModalAvailability();
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
        updateModalAvailability();

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
        el.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            activeCardEl = el.closest('.product-card');
            openModal(el.dataset.modalOpen);
          }
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

      function variantOptions(v) {
        if (v.options && v.options.length) {
          return v.options.filter(Boolean).map(o => String(o).trim());
        }
        return [v.option1, v.option2, v.option3].filter(Boolean).map(o => String(o).trim());
      }

      function findVariant(variants, color, size) {
        if (!variants || !variants.length) return null;
        return variants.find(v => {
          const opts = variantOptions(v);
          if (color && !opts.includes(color)) return false;
          if (size && !opts.includes(size)) return false;
          return true;
        }) || null;
      }

      function getActiveColor(scope) {
        const el = scope && (scope.querySelector('.swatch.is-active') || scope.querySelector('.color-swatches .swatch'));
        if (!el) return null;
        return (el.getAttribute('data-value') || el.getAttribute('aria-label') || '').trim();
      }

      const LABELS = {
        add: 'Add to Cart',
        buy: 'Buy Now',
        soldOut: 'Sold out'
      };

      const STRINGS = window.praaliStrings || {};
      const KLAVIYO = window.praaliKlaviyo || {};

      function restockLabelForSize(size) {
        const template = STRINGS.restockLabel || 'Email me when size __SIZE__ is back in stock.';
        return template.replace('__SIZE__', size);
      }

      function resetRestockFeedback(restockEl) {
        const form = restockEl.querySelector('[data-restock-form]');
        const success = restockEl.querySelector('[data-restock-success]');
        const error = restockEl.querySelector('[data-restock-error]');
        if (form) form.hidden = false;
        if (success) success.hidden = true;
        if (error) {
          error.hidden = true;
          error.textContent = '';
        }
      }

      function showRestockSuccess(restockEl) {
        const form = restockEl.querySelector('[data-restock-form]');
        const success = restockEl.querySelector('[data-restock-success]');
        const error = restockEl.querySelector('[data-restock-error]');
        if (form) form.hidden = true;
        if (error) error.hidden = true;
        if (success) success.hidden = false;
      }

      function showRestockError(restockEl, message) {
        const error = restockEl.querySelector('[data-restock-error]');
        if (!error) return;
        error.textContent = message || STRINGS.restockError || 'Something went wrong. Please try again.';
        error.hidden = false;
      }

      function subscribeBackInStock(email, variantId) {
        const companyId = KLAVIYO.companyId;
        if (!companyId) {
          return Promise.reject(new Error(STRINGS.restockNotConfigured || 'Restock alerts are not configured yet.'));
        }
        const id = String(variantId);
        return fetch(
          'https://a.klaviyo.com/client/back-in-stock-subscriptions/?company_id=' + encodeURIComponent(companyId),
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              revision: '2024-06-15'
            },
            body: JSON.stringify({
              data: {
                type: 'back-in-stock-subscription',
                attributes: {
                  profile: {
                    data: {
                      type: 'profile',
                      attributes: { email: email }
                    }
                  },
                  channels: ['EMAIL']
                },
                relationships: {
                  variant: {
                    data: {
                      type: 'catalog-variant',
                      id: '$shopify:::$default:::' + id
                    }
                  }
                }
              }
            })
          }
        ).then(function (res) {
          if (res.ok) return res.json().catch(function () { return {}; });
          return res.json().catch(function () { return {}; }).then(function (body) {
            const err = body && body.errors && body.errors[0];
            if (err && err.code === 'variant_not_found') {
              console.warn('Klaviyo has no catalog variant for Shopify variant', id);
              throw new Error(STRINGS.restockVariantNotSynced || err.detail);
            }
            throw new Error((err && err.detail) || STRINGS.restockError || 'Something went wrong. Please try again.');
          });
        }, function () {
          throw new Error(STRINGS.restockError || 'Something went wrong. Please try again.');
        });
      }

      function updateRestockUI(scope, variants, color, size, restockEl, actionsEl, addBtn, buyBtn, sizeButtons) {
        if (!restockEl) {
          if (actionsEl) actionsEl.hidden = false;
          setPurchaseButtons(addBtn, buyBtn, shouldShowSoldOut(variants, color, size, sizeButtons));
          return;
        }

        const showRestock = isSizeSoldOutForColor(variants, color, size);

        if (showRestock) {
          const wasHidden = restockEl.hidden;
          restockEl.hidden = false;
          if (actionsEl) actionsEl.hidden = true;
          const labelEl = restockEl.querySelector('[data-restock-label]');
          const newLabel = restockLabelForSize(size);
          const labelChanged = labelEl && labelEl.textContent !== newLabel;
          if (labelEl) labelEl.textContent = newLabel;
          if (wasHidden || labelChanged) resetRestockFeedback(restockEl);
        } else {
          restockEl.hidden = true;
          if (actionsEl) actionsEl.hidden = false;
          setPurchaseButtons(addBtn, buyBtn, shouldShowSoldOut(variants, color, size, sizeButtons));
        }
      }

      function isVariantInStock(v) {
        if (!v) return false;
        const qty = Number(v.inventory_quantity);
        if (v.inventory_management === 'shopify' && Number.isFinite(qty)) {
          return qty > 0;
        }
        return !!v.available;
      }

      function hasAnyAvailableVariant(variants) {
        return variants.some(isVariantInStock);
      }

      function isSizeAvailableForColor(variants, color, size) {
        const v = findVariant(variants, color, size);
        return isVariantInStock(v);
      }

      function isSizeSoldOutForColor(variants, color, size) {
        const v = findVariant(variants, color, size);
        return !!(v && !isVariantInStock(v));
      }

      function setPurchaseButtons(addBtn, buyBtn, soldOut) {
        if (!addBtn) return;
        if (soldOut) {
          addBtn.disabled = true;
          addBtn.textContent = LABELS.soldOut;
          addBtn.classList.add('is-sold-out');
          if (buyBtn) {
            buyBtn.disabled = true;
            buyBtn.hidden = true;
          }
        } else {
          addBtn.disabled = false;
          addBtn.textContent = LABELS.add;
          addBtn.classList.remove('is-sold-out');
          if (buyBtn) {
            buyBtn.disabled = false;
            buyBtn.hidden = false;
            buyBtn.textContent = LABELS.buy;
          }
        }
      }

      function updateSizeAvailability(scope, variants, color) {
        scope.querySelectorAll('.size-option').forEach(btn => {
          const sizeVal = (btn.getAttribute('data-value') || btn.textContent || '').trim();
          const available = isSizeAvailableForColor(variants, color, sizeVal);
          btn.classList.toggle('is-unavailable', !available);
        });
      }

      function shouldShowSoldOut(variants, color, size, sizeButtons) {
        if (!hasAnyAvailableVariant(variants)) return true;
        if (size) return !isSizeAvailableForColor(variants, color, size);
        if (sizeButtons.length && color) {
          return !Array.from(sizeButtons).some(btn => {
            const sizeVal = (btn.getAttribute('data-value') || btn.textContent || '').trim();
            return isSizeAvailableForColor(variants, color, sizeVal);
          });
        }
        return false;
      }

      function updateCardAvailability(card) {
        const variants = getCardVariants(card);
        if (!variants) return;

        const addBtn = card.querySelector('[data-add-to-cart]');
        const buyBtn = card.querySelector('[data-buy-now]');
        const actionsEl = card.querySelector('[data-product-actions]');
        const restockEl = card.querySelector('[data-restock-notify]');

        const color = getActiveColor(card);
        const size = getActiveValue(card, '.size-option');
        const sizeButtons = card.querySelectorAll('[data-card-sizes] .size-option');

        updateSizeAvailability(card, variants, color);
        updateRestockUI(card, variants, color, size, restockEl, actionsEl, addBtn, buyBtn, sizeButtons);
      }

      function updateModalAvailability() {
        if (!activeCardEl) return;
        const variants = getCardVariants(activeCardEl);
        if (!variants) return;

        const addBtn = modal.querySelector('[data-modal-add-to-cart]');
        const buyBtn = modal.querySelector('[data-modal-buy]');
        const actionsEl = modal.querySelector('[data-modal-actions]');
        const restockEl = modal.querySelector('[data-restock-notify]');
        const color = getActiveColor(modal) || getActiveValue(modal, '.modal-swatches .swatch');
        const size = getActiveValue(modal, '[data-modal-sizes] .size-option');
        const sizeButtons = modal.querySelectorAll('[data-modal-sizes] .size-option');

        updateSizeAvailability(modal, variants, color);
        updateRestockUI(modal, variants, color, size, restockEl, actionsEl, addBtn, buyBtn, sizeButtons);
      }

      function getVariantSourceCard(restockEl) {
        const card = restockEl.closest('.product-card');
        if (card) return card;
        return activeCardEl;
      }

      function handleRestockSubmit(e) {
        e.preventDefault();
        const form = e.currentTarget;
        const restockEl = form.closest('[data-restock-notify]');
        if (!restockEl) return;

        const card = getVariantSourceCard(restockEl);
        const variants = getCardVariants(card);
        if (!variants) return;

        const scope = restockEl.closest('.product-card') || modal;
        const color = getActiveColor(scope) || getActiveValue(scope, '.modal-swatches .swatch');
        const sizeSelector = scope.classList.contains('product-card') ? '.size-option' : '[data-modal-sizes] .size-option';
        const size = getActiveValue(scope, sizeSelector);
        const variant = findVariant(variants, color, size);
        if (!variant) return;

        const emailInput = form.querySelector('[data-restock-email]');
        const submitBtn = form.querySelector('[data-restock-submit]');
        const email = emailInput && emailInput.value ? emailInput.value.trim() : '';
        if (!email) return;

        if (submitBtn) submitBtn.disabled = true;
        subscribeBackInStock(email, variant.id)
          .then(function () {
            showRestockSuccess(restockEl);
          })
          .catch(function (err) {
            showRestockError(restockEl, err && err.message);
          })
          .finally(function () {
            if (submitBtn) submitBtn.disabled = false;
          });
      }

      document.querySelectorAll('[data-restock-form]').forEach(function (form) {
        form.addEventListener('submit', handleRestockSubmit);
      });

      document.querySelectorAll('.product-card').forEach(card => {
        if (!getCardVariants(card)) return;
        updateCardAvailability(card);
        card.querySelectorAll('.swatch, .size-option').forEach(el => {
          el.addEventListener('click', () => updateCardAvailability(card));
        });
      });

      function buyNowFromCard(card, color, size) {
        const variants = getCardVariants(card);
        if (!variants) {
          alert('This is a demo product. Configure real products in Shopify to enable checkout.');
          return;
        }
        const chosenColor = color || getActiveColor(card);
        const chosenSize = size || getActiveValue(card, '.size-option');
        if (!chosenSize && card.querySelector('.size-option')) {
          alert('Please pick a size.');
          return;
        }
        const variant = findVariant(variants, chosenColor, chosenSize) || variants[0];
        if (!variant || !isVariantInStock(variant)) {
          alert(LABELS.soldOut);
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

      /* ADD TO CART — adds via /cart/add.js, shows toast, bumps header count */
      const toastEl = document.getElementById('cartToast');
      function showCartToast(text) {
        if (!toastEl) return;
        toastEl.textContent = text || 'Added to cart';
        toastEl.hidden = false;
        requestAnimationFrame(() => toastEl.classList.add('is-visible'));
        clearTimeout(toastEl._timer);
        toastEl._timer = setTimeout(() => {
          toastEl.classList.remove('is-visible');
          setTimeout(() => { toastEl.hidden = true; }, 250);
        }, 2000);
      }

      function updateCartCountInHeader(count) {
        const link = document.querySelector('.cart-link');
        if (link) link.textContent = 'Cart (' + count + ')';
      }

      function refreshCartCount() {
        return fetch('/cart.js', { credentials: 'same-origin' })
          .then(r => r.json())
          .then(cart => { updateCartCountInHeader(cart.item_count); return cart; });
      }

      function addToCartFromCard(card, color, size) {
        const variants = getCardVariants(card);
        if (!variants) {
          showCartToast('Demo product — set up real Shopify products first');
          return;
        }
        const chosenColor = color || getActiveColor(card);
        const chosenSize = size || getActiveValue(card, '.size-option');
        if (!chosenSize && card.querySelector('.size-option')) {
          showCartToast('Pick a size first');
          return;
        }
        const variant = findVariant(variants, chosenColor, chosenSize) || variants[0];
        if (!variant || !isVariantInStock(variant)) {
          showCartToast(LABELS.soldOut);
          return;
        }
        fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ id: variant.id, quantity: 1 }),
          credentials: 'same-origin'
        })
          .then(r => r.ok ? r.json() : r.json().then(err => Promise.reject(err)))
          .then(() => refreshCartCount())
          .then(() => showCartToast('Added to cart'))
          .catch(err => {
            console.warn('cart/add failed', err);
            showCartToast(err && err.description ? err.description : 'Could not add to cart');
          });
      }

      document.querySelectorAll('.product-card [data-add-to-cart]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const card = btn.closest('.product-card');
          addToCartFromCard(card);
        });
      });

      const modalAddBtn = modal.querySelector('[data-modal-add-to-cart]');
      if (modalAddBtn) {
        modalAddBtn.addEventListener('click', (e) => {
          e.preventDefault();
          if (!activeCardEl) return;
          const modalColor = getActiveValue(modal, '.modal-swatches .swatch');
          const modalSize = getActiveValue(modal, '[data-modal-sizes] .size-option');
          addToCartFromCard(activeCardEl, modalColor, modalSize);
        });
      }

      /* CART PAGE — qty stepper + remove link via /cart/change.js */
      function formatMoneyCents(cents) {
        return '$' + (cents / 100).toFixed(2);
      }

      function updateCartPageTotals(cart) {
        const subtotalEl = document.querySelector('[data-cart-subtotal]');
        if (subtotalEl) subtotalEl.textContent = formatMoneyCents(cart.total_price);
        const subtitleEl = document.querySelector('.cart-subtitle');
        if (subtitleEl) subtitleEl.textContent = cart.item_count + (cart.item_count === 1 ? ' item' : ' items');
        updateCartCountInHeader(cart.item_count);
        if (cart.item_count === 0) {
          window.location.reload();
        }
      }

      function changeCartLine(key, qty) {
        return fetch('/cart/change.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ id: key, quantity: qty }),
          credentials: 'same-origin'
        }).then(r => r.json());
      }

      document.querySelectorAll('[data-cart-item]').forEach(row => {
        const key = row.dataset.cartItem;
        const stepper = row.querySelector('[data-qty]');
        if (!stepper) return;
        const input = stepper.querySelector('input');
        const dec = stepper.querySelector('[data-qty-dec]');
        const inc = stepper.querySelector('[data-qty-inc]');

        function applyQty(newQty) {
          newQty = Math.max(0, newQty);
          input.value = newQty;
          changeCartLine(key, newQty).then(cart => {
            if (newQty === 0) {
              row.remove();
            } else {
              const item = cart.items.find(i => i.key === key);
              if (item) {
                const lineEl = row.querySelector('[data-line-total]');
                if (lineEl) lineEl.textContent = formatMoneyCents(item.final_line_price);
              }
            }
            updateCartPageTotals(cart);
          }).catch(err => console.warn('cart/change failed', err));
        }

        if (dec) dec.addEventListener('click', () => applyQty((parseInt(input.value, 10) || 0) - 1));
        if (inc) inc.addEventListener('click', () => applyQty((parseInt(input.value, 10) || 0) + 1));
        input.addEventListener('change', () => applyQty(parseInt(input.value, 10) || 0));

        const removeLink = row.querySelector('[data-cart-remove]');
        if (removeLink) {
          removeLink.addEventListener('click', (e) => {
            e.preventDefault();
            applyQty(0);
          });
        }
      });

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
