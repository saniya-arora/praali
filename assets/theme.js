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
          const existingButtons = cardSizes.querySelectorAll('.size-option');
          if (existingButtons.length === 0) {
            availableSizeValues(product, card).forEach(size => {
              const b = document.createElement('button');
              b.className = 'size-option';
              b.textContent = size;
              b.setAttribute('data-value', size);
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
        availableSizeValues(product, activeCardEl).forEach(size => {
          const b = document.createElement('button');
          b.className = 'size-option';
          b.textContent = size;
          b.setAttribute('data-value', size);
          b.addEventListener('click', () => {
            modalSizes.querySelectorAll('.size-option').forEach(x => x.classList.remove('is-active'));
            b.classList.add('is-active');
            if (!maybeOpenRestockModal(modal, activeCardEl, '[data-modal-sizes] .size-option')) {
              updateModalAvailability();
            }
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
        const script = card.querySelector('script[type="application/json"][data-card-variants]');
        if (script) {
          try { return JSON.parse(script.textContent); } catch (e) { /* fall through */ }
        }
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

      /* The prototype data lists every size we might ever carry. When a card is
         backed by real Shopify variants, narrow that list to sizes that actually
         exist so we never render a button with no variant behind it. */
      function availableSizeValues(product, card) {
        const sizes = (product && product.sizes) || [];
        const variants = getCardVariants(card);
        if (!variants || !variants.length) return sizes;
        const optionValues = new Set();
        variants.forEach(v => variantOptions(v).forEach(o => optionValues.add(o)));
        const matched = sizes.filter(size => optionValues.has(size));
        return matched.length ? matched : sizes;
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

      /* Liquid's translate filter HTML-escapes quotes, which would show as
         literal entities once assigned via textContent. */
      function decodeEntities(value) {
        return String(value)
          .replace(/&#39;/g, "'")
          .replace(/&quot;/g, '"')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&');
      }

      const STRINGS = {};
      Object.keys(window.praaliStrings || {}).forEach(key => {
        STRINGS[key] = decodeEntities(window.praaliStrings[key]);
      });

      const KLAVIYO = window.praaliKlaviyo || {};

      const restockModal = document.querySelector('[data-restock-modal]');
      const restockForm = restockModal && restockModal.querySelector('[data-restock-form]');
      const restockLabel = restockModal && restockModal.querySelector('[data-restock-label]');
      const restockEmail = restockModal && restockModal.querySelector('[data-restock-email]');
      const restockSubmit = restockModal && restockModal.querySelector('[data-restock-submit]');
      const restockSuccess = restockModal && restockModal.querySelector('[data-restock-success]');
      const restockError = restockModal && restockModal.querySelector('[data-restock-error]');
      const restockConsent = restockModal && restockModal.querySelector('.restock-modal-consent');

      const KLAVIYO_REVISION = '2024-06-15';

      /* What the shopper asked to be notified about */
      let restockRequest = null;

      function restockLabelForRequest(request) {
        const template = STRINGS.restockLabel || 'Enter your email and we’ll let you know when __PRODUCT__ in size __SIZE__ is back in stock.';
        return template
          .replace('__PRODUCT__', (request && request.title) || 'this item')
          .replace('__SIZE__', (request && request.size) || '');
      }

      function resetRestockFeedback() {
        if (restockForm) restockForm.hidden = false;
        if (restockConsent) restockConsent.hidden = false;
        if (restockSuccess) restockSuccess.hidden = true;
        if (restockError) {
          restockError.hidden = true;
          restockError.textContent = '';
        }
      }

      function resetPurchaseButtons(addBtn, buyBtn) {
        if (!addBtn) return;
        addBtn.disabled = false;
        addBtn.textContent = LABELS.add;
        addBtn.classList.remove('is-sold-out');
        if (buyBtn) {
          buyBtn.disabled = false;
          buyBtn.hidden = false;
          buyBtn.textContent = LABELS.buy;
        }
      }

      function restoreNormalPurchaseButtons(card) {
        if (!card) return;
        card.querySelectorAll('.size-option').forEach(btn => btn.classList.remove('is-active'));
        const addBtn = card.querySelector('[data-add-to-cart]');
        const buyBtn = card.querySelector('[data-buy-now]');
        const variants = getCardVariants(card);
        const color = getActiveColor(card);
        if (variants && color) updateSizeAvailability(card, variants, color);
        resetPurchaseButtons(addBtn, buyBtn);
      }

      function restoreNormalModalButtons() {
        if (!modal || !activeCardEl) return;
        modal.querySelectorAll('[data-modal-sizes] .size-option').forEach(btn => {
          btn.classList.remove('is-active');
        });
        const addBtn = modal.querySelector('[data-modal-add-to-cart]');
        const buyBtn = modal.querySelector('[data-modal-buy]');
        const variants = getCardVariants(activeCardEl);
        const color = getActiveColor(modal) || getActiveValue(modal, '.modal-swatches .swatch');
        if (variants && color) updateSizeAvailability(modal, variants, color);
        resetPurchaseButtons(addBtn, buyBtn);
      }

      function resetAfterRestockSignup() {
        const card = restockRequest && restockRequest.card;
        restoreNormalPurchaseButtons(card);
        restoreNormalModalButtons();
      }

      function showRestockSuccess() {
        if (restockForm) restockForm.hidden = true;
        if (restockConsent) restockConsent.hidden = true;
        if (restockError) restockError.hidden = true;
        if (restockSuccess) restockSuccess.hidden = false;
        resetAfterRestockSignup();
      }

      function showRestockError(message) {
        if (!restockError) return;
        restockError.textContent = message || STRINGS.restockError || 'Something went wrong. Please try again.';
        restockError.hidden = false;
      }

      function openRestockModal(variant, size, card, color) {
        if (!restockModal) return;
        restockRequest = {
          variantId: variant.id,
          size: size,
          color: color || null,
          title: (card && card.getAttribute('data-product-title')) || document.title,
          url: (card && card.getAttribute('data-product-url')) || window.location.pathname,
          card: card || null
        };
        if (restockLabel) restockLabel.textContent = restockLabelForRequest(restockRequest);
        resetRestockFeedback();
        if (restockEmail) restockEmail.value = '';
        resetAfterRestockSignup();
        restockModal.hidden = false;
        document.body.classList.add('restock-modal-open');
        requestAnimationFrame(() => {
          restockModal.classList.add('is-visible');
          if (restockEmail) restockEmail.focus();
        });
      }

      function closeRestockModal() {
        if (!restockModal) return;
        resetAfterRestockSignup();
        restockModal.classList.remove('is-visible');
        document.body.classList.remove('restock-modal-open');
        setTimeout(() => { restockModal.hidden = true; }, 220);
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
              revision: KLAVIYO_REVISION
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
            }
            throw new Error((err && err.detail) || STRINGS.restockError || 'Something went wrong. Please try again.');
          });
        }, function () {
          throw new Error(STRINGS.restockError || 'Something went wrong. Please try again.');
        });
      }

      /* Our own record of who wants what. Unlike the subscription endpoint this
         does not depend on Klaviyo's catalog, so it still captures the signup
         when the catalog is missing the variant. */
      function logRestockRequest(email, request) {
        const companyId = KLAVIYO.companyId;
        if (!companyId) {
          return Promise.reject(new Error(STRINGS.restockNotConfigured || 'Restock alerts are not configured yet.'));
        }
        return fetch(
          'https://a.klaviyo.com/client/events/?company_id=' + encodeURIComponent(companyId),
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              revision: KLAVIYO_REVISION
            },
            body: JSON.stringify({
              data: {
                type: 'event',
                attributes: {
                  metric: {
                    data: {
                      type: 'metric',
                      attributes: { name: 'Requested Back In Stock' }
                    }
                  },
                  profile: {
                    data: {
                      type: 'profile',
                      attributes: { email: email }
                    }
                  },
                  properties: {
                    ProductName: request.title,
                    Size: request.size,
                    Color: request.color,
                    VariantID: String(request.variantId),
                    ProductURL: window.location.origin + request.url
                  }
                }
              }
            })
          }
        ).then(function (res) {
          if (res.ok) return true;
          throw new Error('Klaviyo rejected the restock request event (' + res.status + ')');
        });
      }

      function subscribeToWaitlist(email) {
        const companyId = KLAVIYO.companyId;
        const listId = KLAVIYO.listId;
        if (!companyId || !listId) {
          return Promise.resolve(false);
        }
        return fetch(
          'https://a.klaviyo.com/client/subscriptions/?company_id=' + encodeURIComponent(companyId),
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              revision: KLAVIYO_REVISION
            },
            body: JSON.stringify({
              data: {
                type: 'subscription',
                attributes: {
                  profile: {
                    data: {
                      type: 'profile',
                      attributes: {
                        email: email,
                        subscriptions: {
                          email: {
                            marketing: { consent: 'SUBSCRIBED' }
                          }
                        }
                      }
                    }
                  }
                },
                relationships: {
                  list: {
                    data: { type: 'list', id: listId }
                  }
                }
              }
            })
          }
        ).then(function (res) {
          if (res.ok) return true;
          throw new Error('Klaviyo rejected the waitlist subscription (' + res.status + ')');
        });
      }

      function updateRestockProfile(email, request) {
        const companyId = KLAVIYO.companyId;
        if (!companyId) {
          return Promise.resolve(false);
        }
        return fetch(
          'https://a.klaviyo.com/client/profiles/?company_id=' + encodeURIComponent(companyId),
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              revision: KLAVIYO_REVISION
            },
            body: JSON.stringify({
              data: {
                type: 'profile',
                attributes: {
                  email: email,
                  properties: {
                    last_bis_product: request.title,
                    last_bis_size: request.size,
                    last_bis_color: request.color,
                    last_bis_variant_id: String(request.variantId),
                    last_bis_product_url: window.location.origin + request.url
                  }
                }
              }
            })
          }
        ).then(function (res) {
          if (res.ok) return true;
          throw new Error('Klaviyo rejected the profile update (' + res.status + ')');
        });
      }

      function isVariantInStock(v) {
        if (!v) return false;
        /* Shopify can report inventory_quantity > 0 while available is false
           when units are committed to orders. Trust available first. */
        if (v.available === false) return false;
        if (v.inventory_management === 'shopify') {
          const qty = Number(v.inventory_quantity);
          if (Number.isFinite(qty)) return qty > 0;
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

      /* Opens the restock modal when the shopper picks a sold-out size */
      function maybeOpenRestockModal(scope, card, sizeSelector) {
        if (!restockModal) return false;
        const variants = getCardVariants(card);
        if (!variants) return false;
        const size = getActiveValue(scope, sizeSelector);
        if (!size) return false;
        const color = getActiveColor(scope) || getActiveValue(scope, '.modal-swatches .swatch');
        const variant = findVariant(variants, color, size);
        if (!variant || isVariantInStock(variant)) return false;
        openRestockModal(variant, size, card, color);
        return true;
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

      const SIZE_OPTION_BELL_HTML =
        '<span class="size-option-bell" aria-hidden="true">' +
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>' +
        '<path d="M13.73 21a2 2 0 0 1-3.46 0"/>' +
        '</svg></span>';

      function syncSizeOptionBell(btn, unavailable) {
        const bell = btn.querySelector('.size-option-bell');
        if (unavailable) {
          if (!bell) btn.insertAdjacentHTML('afterbegin', SIZE_OPTION_BELL_HTML);
        } else if (bell) {
          bell.remove();
        }
      }

      function updateSizeAvailability(scope, variants, color) {
        scope.querySelectorAll('.size-option').forEach(btn => {
          const sizeVal = (btn.getAttribute('data-value') || btn.textContent || '').trim();
          const available = isSizeAvailableForColor(variants, color, sizeVal);
          btn.classList.toggle('is-unavailable', !available);
          syncSizeOptionBell(btn, !available);
          if (!available && btn.classList.contains('is-active')) {
            btn.classList.remove('is-active');
          }
        });
      }

      /* Only show "Sold out" when every variant is unavailable. Individual
         sold-out sizes use the restock modal — the purchase buttons stay normal. */
      function shouldShowSoldOut(variants) {
        return !hasAnyAvailableVariant(variants);
      }

      function updateCardAvailability(card) {
        const variants = getCardVariants(card);
        if (!variants) return;

        const addBtn = card.querySelector('[data-add-to-cart]');
        const buyBtn = card.querySelector('[data-buy-now]');
        const color = getActiveColor(card);

        updateSizeAvailability(card, variants, color);
        setPurchaseButtons(addBtn, buyBtn, shouldShowSoldOut(variants));
      }

      function updateModalAvailability() {
        if (!activeCardEl) return;
        const variants = getCardVariants(activeCardEl);
        if (!variants) return;

        const addBtn = modal.querySelector('[data-modal-add-to-cart]');
        const buyBtn = modal.querySelector('[data-modal-buy]');
        const color = getActiveColor(modal) || getActiveValue(modal, '.modal-swatches .swatch');

        updateSizeAvailability(modal, variants, color);
        setPurchaseButtons(addBtn, buyBtn, shouldShowSoldOut(variants));
      }

      if (restockModal) {
        restockModal.querySelectorAll('[data-restock-close]').forEach(el => {
          el.addEventListener('click', closeRestockModal);
        });

        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && !restockModal.hidden) closeRestockModal();
        });
      }

      if (restockForm) {
        restockForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const email = restockEmail && restockEmail.value ? restockEmail.value.trim() : '';
          if (!email || !restockRequest) return;

          const request = restockRequest;
          if (restockSubmit) restockSubmit.disabled = true;

          /* Back-in-stock subscription triggers your Klaviyo flow. List, event,
             and profile calls add consent, history, and visible product/size. */
          Promise.allSettled([
            subscribeBackInStock(email, request.variantId),
            subscribeToWaitlist(email),
            logRestockRequest(email, request),
            updateRestockProfile(email, request)
          ])
            .then(results => {
              if (results.some(r => r.status === 'fulfilled')) {
                showRestockSuccess();
                return;
              }
              const failure = results.find(r => r.status === 'rejected');
              showRestockError(failure && failure.reason && failure.reason.message);
            })
            .finally(() => {
              if (restockSubmit) restockSubmit.disabled = false;
            });
        });
      }

      document.querySelectorAll('.product-card').forEach(card => {
        if (!getCardVariants(card)) return;
        updateCardAvailability(card);
        card.querySelectorAll('.swatch').forEach(el => {
          el.addEventListener('click', () => updateCardAvailability(card));
        });
        card.querySelectorAll('[data-card-sizes] .size-option').forEach(el => {
          el.addEventListener('click', (e) => {
            e.stopPropagation();
            card.querySelectorAll('[data-card-sizes] .size-option').forEach(x => {
              x.classList.remove('is-active');
            });
            el.classList.add('is-active');
            if (!maybeOpenRestockModal(card, card, '.size-option')) {
              updateCardAvailability(card);
            }
          });
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
