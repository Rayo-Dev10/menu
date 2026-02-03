document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("app-container");
  const money = (v) => (v > 0 ? "$" + new Intl.NumberFormat("es-CO").format(v) : "");

  const escapeHtml = (value) =>
    String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const splitTitle = (text) => {
    const safe = String(text || "");
    const idx = safe.indexOf(":");
    if (idx === -1) {
      return { title: safe.trim(), rest: "" };
    }
    return {
      title: safe.slice(0, idx).trim(),
      rest: safe.slice(idx + 1).trim(),
    };
  };

  const hasPrintable = (value) => typeof value === "string" && value.replace(/\s+/g, "").length > 0;

  const hasDetails = (item) => {
    if (!item) return false;
    const descriptionOk = hasPrintable(item.desc);
    const imagesOk =
      [item.srcimg1, item.srcimg2, item.srcimg3, item.srcimg4].some((img) =>
        hasPrintable(img)
      );

    return descriptionOk || imagesOk;
  };

  const truncate = (value, max = 128) => {
    const safe = String(value || "").trim();
    if (safe.length <= max) return safe;
    return safe.slice(0, max - 1).trimEnd() + "…";
  };

  const renderTitle = (item, meta) => {
    const { title, rest } = splitTitle(item.item);
    const titleHtml = escapeHtml(title || item.item);
    const restHtml = rest ? " " + escapeHtml(rest) : "";

    if (meta.clickable) {
      const separator = rest ? ":" : "";
      return `
        <button
          type="button"
          class="item-title is-clickable js-item-title"
          data-page="${meta.pageIndex}"
          data-group="${meta.groupKey}"
          data-index="${meta.itemIndex}"
          aria-label="Ver detalles de ${titleHtml}"
        >${titleHtml}</button>${separator}${restHtml}
      `;
    }

    return `<span class="item-title">${titleHtml}</span>${rest ? ":" + restHtml : ""}`;
  };

  const renderList = (items, pageIndex, groupKey) =>
    items
      .map((p, itemIndex) => {
        const cl = p.precio === 0 ? " opt" : "";
        const clickable = hasDetails(p);
        const titleHtml = renderTitle(p, { clickable, pageIndex, groupKey, itemIndex });
        const clickableClass = clickable ? " is-clickable" : "";
        return `<div class="item${cl}${clickableClass}"><span>${titleHtml}</span><span class="price">${money(
          p.precio
        )}</span></div>`;
      })
      .join("");

  const renderMenuPage = (pageData, pageIndex) => {
    return `
      <div class="stage menu-page">
        <img src="assets/rama.png" class="decor decor-tl">
        <img src="assets/rama.png" class="decor decor-br">
        <div class="header">
          <div class="sub">Restaurante</div>
          <h1 class="brand">EL RECREO</h1>
          <div class="sub" style="border-top:1px solid #fff;display:inline-block;padding-top:4px">MENÚ</div>
        </div>
        <div class="grupo g-izq">
          <div class="encabezado-seccion">
            <div class="pill">${pageData.g1.titulo}</div>
            <div class="line"></div>
          </div>
          <div class="cuerpo-grupo">
            <div class="list">${renderList(pageData.g1.items, pageIndex, "g1")}</div>
            <div class="circle-container"><img src="${pageData.g1.img}" onerror="this.style.backgroundColor='#222'"></div>
          </div>
        </div>
        <div class="grupo g-der">
          <div class="encabezado-seccion">
            <div class="line"></div>
            <div class="pill">${pageData.g2.titulo}</div>
          </div>
          <div class="cuerpo-grupo">
            <div class="circle-container"><img src="${pageData.g2.img}" onerror="this.style.backgroundColor='#222'"></div>
            <div class="list">${renderList(pageData.g2.items, pageIndex, "g2")}</div>
          </div>
        </div>
        <div class="grupo g-izq">
          <div class="encabezado-seccion">
            <div class="pill">${pageData.g3.titulo}</div>
            <div class="line"></div>
          </div>
          <div class="cuerpo-grupo">
            <div class="list">${renderList(pageData.g3.items, pageIndex, "g3")}</div>
            <div class="circle-container"><img src="${pageData.g3.img}" onerror="this.style.backgroundColor='#222'"></div>
          </div>
        </div>
      </div>
    `;
  };

  const renderClosingPage = (pageData) => {
    const contactosHtml = pageData.contactos
      .map(
        (c) =>
          `<div class="contact-block"><div class="contact-role">${c.cargo}: ${c.nombre}</div><div class="contact-phone">Celular: ${c.celular}</div></div>`
      )
      .join("");
    return `
      <div class="stage closing-page">
        <img src="assets/rama.png" class="decor decor-tl">
        <img src="assets/rama.png" class="decor decor-br" style="bottom:-10%; right:-10%;">
        <div class="header closing-header">
          <div class="sub">Restaurante</div>
          <h1 class="brand">EL RECREO</h1>
        </div>
        <div class="closing-content">
          <div class="logo-container"><img src="${pageData.logo_img}" alt="Logo" onerror="this.style.display='none';"></div>
          <div class="fake-button">${pageData.boton_texto}</div>
          <div class="contacts-section">${contactosHtml}</div>
          <div class="address-section"><div>${pageData.direccion.linea1}</div><div class="address-highlight">${pageData.direccion.linea2}</div></div>
          <div class="delivery-text">${pageData.domicilio_texto}</div>
          <div class="thank-you-text">${pageData.agradecimiento_texto}</div>
        </div>
      </div>
    `;
  };

  const modal = document.getElementById("item-dialog");
  const modalTitle = modal.querySelector("#modal-title");
  const modalPrep = modal.querySelector("#modal-prep");
  const ingredientsSection = modal.querySelector("#modal-ingredients-section");
  const ingredientsList = modal.querySelector("#modal-ingredients");
  const carousel = modal.querySelector("#modal-carousel");
  const carouselTrack = modal.querySelector("#carousel-track");
  const prevBtn = modal.querySelector(".carousel-btn.prev");
  const nextBtn = modal.querySelector(".carousel-btn.next");

  let menuData = [];
  let carouselIndex = 0;
  let carouselImages = [];

  const updateCarousel = () => {
    if (!carouselImages.length) return;

    carouselImages.forEach((img, idx) => {
      img.classList.toggle("active", idx === carouselIndex);
      if (idx === carouselIndex && !img.src) {
        img.src = img.dataset.src;
      }
    });

    prevBtn.disabled = carouselIndex === 0;
    nextBtn.disabled = carouselIndex === carouselImages.length - 1;
  };

  const openModal = (item) => {
    const details = item || {};
    const { title } = splitTitle(item.item);

    modalTitle.textContent = title || item.item;

    const prepText = truncate(details.desc || "", 128);
    modalPrep.textContent = prepText;
    modalPrep.style.display = prepText ? "block" : "none";

    ingredientsSection.style.display = "none";
    ingredientsList.innerHTML = "";

    const images = [details.srcimg1, details.srcimg2, details.srcimg3, details.srcimg4]
      .filter((img) => hasPrintable(img))
      .slice(0, 4);
    carouselTrack.innerHTML = images
      .map(
        (src, idx) =>
          `<img class="carousel-image${idx === 0 ? " active" : ""}" data-src="${escapeHtml(
            src
          )}" alt="Imagen ${idx + 1} de ${escapeHtml(title || item.item)}">`
      )
      .join("");
    carouselImages = Array.from(carouselTrack.querySelectorAll(".carousel-image"));
    carouselIndex = 0;
    carousel.style.display = carouselImages.length ? "flex" : "none";
    updateCarousel();

    if (typeof modal.showModal === "function") {
      modal.showModal();
    } else {
      modal.setAttribute("open", "");
    }
    document.body.classList.add("modal-open");
  };

  const closeModal = () => {
    if (typeof modal.close === "function") {
      modal.close();
    } else {
      modal.removeAttribute("open");
    }
    document.body.classList.remove("modal-open");
  };

  modal.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeModal();
  });

  modal.addEventListener("close", () => {
    document.body.classList.remove("modal-open");
  });

  prevBtn.addEventListener("click", () => {
    if (carouselIndex > 0) {
      carouselIndex -= 1;
      updateCarousel();
    }
  });

  nextBtn.addEventListener("click", () => {
    if (carouselIndex < carouselImages.length - 1) {
      carouselIndex += 1;
      updateCarousel();
    }
  });

  container.addEventListener("click", (event) => {
    const button = event.target.closest(".js-item-title");
    if (!button) return;

    const pageIndex = Number(button.dataset.page);
    const groupKey = button.dataset.group;
    const itemIndex = Number(button.dataset.index);
    const page = menuData[pageIndex];
    const group = page && page[groupKey];
    const item = group && group.items && group.items[itemIndex];
    if (!item || !hasDetails(item)) return;

    openModal(item);
  });

  fetch("menu.json")
    .then((r) => r.json())
    .then((data) => {
      menuData = data;
      container.innerHTML = data
        .map((page, pageIndex) => {
          if (page.id === "hoja_cierre") {
            return renderClosingPage(page);
          }
          return renderMenuPage(page, pageIndex);
        })
        .join("");
    })
    .catch((e) => console.error("Error en JSON:", e));
});
