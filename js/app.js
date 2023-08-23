function iniciarApp() {
  const resultado = document.querySelector("#resultado");
  const selectCategorias = document.querySelector("#categorias");
  const modal = new bootstrap.Modal("#modal", {});

  if (selectCategorias) {
    selectCategorias.addEventListener("change", seleccionarCategoria);
    obtenerCategorias();
  }

  const favoritosDiv = document.querySelector(".favoritos");
  if (favoritosDiv) {
    obtenerFavoritos();
  }

  function obtenerCategorias() {
    const url = "https://www.themealdb.com/api/json/v1/1/categories.php";
    fetch(url)
      .then((respuesta) => {
        return respuesta.json();
      })
      .then((resultados) => {
        mostrarCategorias(resultados.categories);
      });
  }

  function mostrarCategorias(categorias = []) {
    categorias.forEach((categoria) => {
      const { strCategory } = categoria;

      const option = document.createElement("option");
      option.value = strCategory;
      option.textContent = strCategory;
      selectCategorias.appendChild(option);
    });
  }

  function seleccionarCategoria(e) {
    const categoria = e.target.value;
    const url = `https://www.themealdb.com/api/json/v1/1/filter.php?c=${categoria}`;

    fetch(url)
      .then((respuesta) => respuesta.json())
      .then((resultado) => mostrarRecetas(resultado.meals));
  }

  function mostrarRecetas(recetas = []) {
    //iterar los resultados
    limpiarHTML(resultado);

    const heading = document.createElement("H2");
    heading.classList.add("text-center", "text-black", "my-5");
    heading.textContent = recetas.length ? "Resultados" : "No hay resultados";
    resultado.appendChild(heading);

    recetas.forEach((receta) => {
      const { idMeal, strMeal, strMealThumb } = receta;

      const recetaContenedor = document.createElement("DIV");
      recetaContenedor.classList.add("col-md-4");

      const recetaCard = document.createElement("DIV");
      recetaCard.classList.add("card", "mb-4");

      const recetaImagen = document.createElement("IMG");
      recetaImagen.classList.add("card-img-top");
      recetaImagen.alt = `Imagen de la receta ${strMeal ?? receta.name}`;
      recetaImagen.src = strMealThumb ?? receta.image;

      const recetaCardBody = document.createElement("DIV");
      recetaCardBody.classList.add("card-body");

      const recetaHeading = document.createElement("H3");
      recetaHeading.classList.add("card-title", "mb-3");
      recetaHeading.textContent = strMeal ?? receta.name;

      const recetaBtn = document.createElement("BUTTON");
      recetaBtn.classList.add("btn", "btn-danger", "w-100");
      recetaBtn.textContent = "Ver Receta";
      recetaBtn.dataset.bsTarget = "#modal";
      recetaBtn.dataset.bsToggle = "modal";
      recetaBtn.onclick = function () {
        seleccionaReceta(idMeal ?? receta.id);
      };

      //Inyectar en el HTML

      recetaCardBody.appendChild(recetaHeading);
      recetaCardBody.appendChild(recetaBtn);
      recetaCard.appendChild(recetaImagen);
      recetaCard.appendChild(recetaCardBody);
      recetaContenedor.appendChild(recetaCard);
      resultado.appendChild(recetaContenedor);
    });
  }

  function seleccionaReceta(id) {
    const url = `https://themealdb.com/api/json/v1/1/lookup.php?i=${id}`;

    fetch(url)
      .then((consulta) => consulta.json())
      .then((respuesta) => mostrarRecetaModal(respuesta.meals[0]));
  }

  function mostrarRecetaModal(receta) {
    const { idMeal, strInstructions, strMeal, strMealThumb } = receta;

    //añadir contenido al modal
    const modalTitle = document.querySelector(".modal .modal-title");
    modalTitle.textContent = strMeal;

    const modalBody = document.querySelector(".modal .modal-body");
    modalBody.innerHTML = `
    <img class='img-fluid' src='${strMealThumb}' alt='receta: ${strMeal}'></img>
    <h4 class='text-center my-3 text-gray-700 '> Instructions</h4>
    <p class='m-2 mb-2 border-bottom border-danger'>${strInstructions}</p>
    <h3 class='my-3 text-center' > Ingredients and amounts </h3>
    `;

    //Mostrar cantidades e ingredientes

    const listGroup = document.createElement("Ul");
    listGroup.classList.add("list-group");

    for (let i = 1; i <= 20; i++) {
      if (receta[`strIngredient${i}`]) {
        const ingredientes = receta[`strIngredient${i}`];
        const cantidades = receta[`strMeasure${i}`];
        const ingredienteLI = document.createElement("LI");
        ingredienteLI.classList.add("list-group-item");
        ingredienteLI.textContent = ` ${ingredientes} - ${cantidades}   `;
        listGroup.appendChild(ingredienteLI);
      }
    }
    modalBody.appendChild(listGroup);

    //crear botones de cerrar y favoritos

    const footerModal = document.querySelector(".modal-footer");

    limpiarHTML(footerModal);

    const btnFavorito = document.createElement("button");
    btnFavorito.classList.add("btn", "btn-danger", "col");
    btnFavorito.textContent = existeStorage(idMeal)
      ? "Delete Favorite"
      : "Add Favorite";

    //localStorage

    btnFavorito.onclick = function () {
      if (existeStorage(idMeal)) {
        eliminarFavorito(idMeal);
        alertaExiste("Was removed from favorites");
        btnFavorito.textContent = "Add Favorite";
        mostrarToast("Favorite removed");
        return;
      }

      agregarFavorito({
        id: idMeal,
        name: strMeal,
        image: strMealThumb,
      });
      btnFavorito.textContent = "Delete Favorite";
      mostrarToast("Successfully added");
      setTimeout(() => {
        mostrarToast.remove();
      }, 5000);
    };

    const btnCerrar = document.createElement("button");
    btnCerrar.classList.add("btn", "btn-secondary", "col");
    btnCerrar.textContent = "Close";
    btnCerrar.setAttribute("data-bs-dismiss", "modal");

    footerModal.appendChild(btnFavorito);
    footerModal.appendChild(btnCerrar);

    //Mostrar modal
    modal.show();
  }

  function agregarFavorito(receta) {
    const favoritos = JSON.parse(localStorage.getItem("favoritos")) ?? [];
    localStorage.setItem("favoritos", JSON.stringify([...favoritos, receta]));
  }

  function existeStorage(id) {
    const favoritos = JSON.parse(localStorage.getItem("favoritos")) ?? [];
    return favoritos.some((favorito) => favorito.id === id);
  }

  function eliminarFavorito(id) {
    const favoritos = JSON.parse(localStorage.getItem("favoritos")) ?? [];
    const nuevoFavoritos = favoritos.filter((favorito) => favorito.id !== id);
    localStorage.setItem("favoritos", JSON.stringify(nuevoFavoritos));
  }

  function alertaExiste(mensaje) {
    const divMensaje = document.createElement("DIV");
    divMensaje.classList.add("text-center", "alert", "alert-danger", "col");
    divMensaje.textContent = mensaje;

    document.querySelector(".modal-content").appendChild(divMensaje);

    setTimeout(() => {
      divMensaje.remove();
    }, 3000);
  }

  function mostrarToast(mensaje) {
    const toastDiv = document.querySelector("#toast");
    const toastBody = document.querySelector(".toast-body");
    const toast = new bootstrap.Toast(toastDiv);
    toastBody.textContent = mensaje;

    toast.show();
  }

  function obtenerFavoritos() {
    const favoritos = JSON.parse(localStorage.getItem("favoritos")) ?? [];
    if (favoritos.length) {
      mostrarRecetas(favoritos);
      return;
    }
    const noFavoritos = document.createElement("P");
    noFavoritos.textContent = "No hay favoritos";
    noFavoritos.classList.add("fs-4", "text-center", "font-bold", "mt-5");
    favoritosDiv.appendChild(noFavoritos);
  }

  function limpiarHTML(selector) {
    while (selector.firstChild) {
      selector.removeChild(selector.firstChild);
    }
  }
}

document.addEventListener("DOMContentLoaded", iniciarApp);
