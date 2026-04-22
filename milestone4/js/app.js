/* milestone 4 app.js SPA with mustache templates, grid/list view,
   tabs, and library section */

// my API key
const API_KEY = "AIzaSyAKDvKl8cU38lc-1vkK-vmWA7MdAkC3MWE";

// 10 results per page, 5 pages, 50 in total
const PER_PAGE    = 10;
const TOTAL_PAGES = 5;

// my books ids
const MY_BOOK_IDS = [
"-9WUEQAAQBAJ",
  "Vf9JtAEACAAJ",
  "FQaalAEACAAJ",
  "LKdGpOxtEHsC",
  "RehWEQAAQBAJ"
];

// saves the active search query so page buttons can re-use it
let currentQuery = "";

// tracks current view mode for search results "grid" or "list"
let currentView = "grid";

// tracks current view mode for the collection tab: "grid" or "list"
let currentCollectionView = "grid";

// cached book data for re-rendering when view mode changes
let searchResultsData = [];
let myBooksData      = [];


/* wait for the page to fully load before running any code */
$(function () {

  // ── search triggers ──
  $("#searchInput").on("keypress", function (e) {
    if (e.key === "Enter") doSearch(1);
  });
  $("#searchBtn").on("click", function () { doSearch(1); });

  // main tab switching search results / library)
  $(".tab-btn").on("click", function () {
    const tab = $(this).data("tab");

    $(".tab-btn").removeClass("active");
    $(this).addClass("active");

    $(".tab-content").addClass("hidden");
    $(`#tab-${tab}`).removeClass("hidden");
  });

  // sub-tab
  $(".sub-tab-btn").on("click", function () {
    const subtab = $(this).data("subtab");

    $(".sub-tab-btn").removeClass("active");
    $(this).addClass("active");

    $(".subtab-content").addClass("hidden");
    $(`#subtab-${subtab}`).removeClass("hidden");
  });

  // toggle for search results, grid / list
  $("#btnGrid").on("click", function () { setView("grid"); });
  $("#btnList").on("click", function () { setView("list"); });

  // toggle for library tab, grid / list
  $("#btnCollectionGrid").on("click", function () { setCollectionView("grid"); });
  $("#btnCollectionList").on("click", function () { setCollectionView("list"); });

  // load my books library
  loadMyBooks();
});


/* switches the search results between grid and
   list layout without making a new API call */
function setView(mode) {
  currentView = mode;

  $("#btnGrid").toggleClass("active", mode === "grid");
  $("#btnList").toggleClass("active", mode === "list");

  $("#booksGrid").toggleClass("list-mode", mode === "list");

  if (searchResultsData.length === 0) return;

  $("#booksGrid").empty();
  searchResultsData.forEach(function (book) {
    const html  = renderCardTemplate(book, "search");
    const $card = $(html);
    attachCardClick($card, "search");
    $("#booksGrid").append($card);
  });
}


/*  switch between grid and list layout
   re-renders all cards using the correct template */
function setCollectionView(mode) {
  currentCollectionView = mode;

  $("#btnCollectionGrid").toggleClass("active", mode === "grid");
  $("#btnCollectionList").toggleClass("active", mode === "list");

  $("#myBooksGrid").toggleClass("list-mode", mode === "list");

  // re-render cards with the new template
  reRenderCollection("#myBooksGrid", "mybooks");
}


/* fetches books from the API and renders them
   using the mustache card template
   a fresh API call is made for each page using
   startIndex to avoid the 40-result cap */
function doSearch(page) {
  const query = page === 1
    ? $("#searchInput").val().trim()
    : currentQuery;

  if (!query) return;

  currentQuery = query;

  // resets UI
  $("#booksGrid").empty().removeClass("list-mode");
  $("#detailPanel").addClass("hidden").empty();
  $("#noResults").addClass("hidden");
  $("#searchHeader").addClass("hidden");
  $("#searchPlaceholder").addClass("hidden");
  $("#searchLoading").removeClass("hidden");

  // re apply's current view mode to the freshly cleared grid
  if (currentView === "list") $("#booksGrid").addClass("list-mode");

  // switch to search tab automatically
  $(".tab-btn").removeClass("active");
  $(".tab-btn[data-tab='search']").addClass("active");
  $(".tab-content").addClass("hidden");
  $("#tab-search").removeClass("hidden");

  const startIndex = (page - 1) * PER_PAGE;

  const url = `https://www.googleapis.com/books/v1/volumes`
    + `?q=${encodeURIComponent(query)}`
    + `&startIndex=${startIndex}`
    + `&maxResults=${PER_PAGE}`
    + `&key=${API_KEY}`;

  $.getJSON(url)
    .done(function (data) {
      const books = data.items || [];
      $("#searchLoading").addClass("hidden");
      searchResultsData = books;

      if (books.length === 0) {
        $("#noResults").removeClass("hidden");
        return;
      }

      // shows the results header
      $("#searchHeader").removeClass("hidden");

      // updates result count text
      const rangeStart = startIndex + 1;
      const rangeEnd   = startIndex + books.length;
      $("#resultsCount").text(
        `Showing ${rangeStart}–${rangeEnd} of ${TOTAL_PAGES * PER_PAGE} results for "${query}"`
      );

      // pagination buttons
      buildPagination(page);

      // renders each book card using mustache
      books.forEach(function (book) {
        const html = renderCardTemplate(book, "search");
        const $card = $(html);
        attachCardClick($card, "search");
        $("#booksGrid").append($card);
      });

      // staggered fade-in
      $("#booksGrid").children().hide().each(function (i) {
        $(this).delay(i * 40).fadeIn(280);
      });

      // scroll to results
      $("html, body").animate(
        { scrollTop: $("#tab-search").offset().top - 80 },
        300
      );
    })
    .fail(function () {
      $("#searchLoading").addClass("hidden");
      $("#noResults").removeClass("hidden")
        .find("p").text("API error. Please check your API key and try again.");
    });
}


/* creates numbered page buttons 1 through 5 the active page is highlighted */
function buildPagination(currentPage) {
  const $pag = $("#pagination").empty();

  for (let i = 1; i <= TOTAL_PAGES; i++) {
    const $btn = $(`<button>${i}</button>`);
    if (i === currentPage) $btn.addClass("active");
    $btn.on("click", function () { doSearch(i); });
    $pag.append($btn);
  }
}


/* fetches all books in my book ids in parallel
   and renders them in the my books grid using mustache */
function loadMyBooks() {
  const requests = MY_BOOK_IDS.map(function (id) {
    return $.getJSON(
      `https://www.googleapis.com/books/v1/volumes/${id}?key=${API_KEY}`
    );
  });

  $.when(...requests)
    .done(function () {
      const results = MY_BOOK_IDS.length === 1
        ? [arguments[0]]
        : Array.from(arguments).map(function (a) { return a[0]; });

      $("#myBooksLoading").addClass("hidden");

      // cache the results so it can re-render when view mode changes
      myBooksData = results;

      results.forEach(function (book) {
        const html  = renderCardTemplate(book, "mybooks", currentCollectionView);
        const $card = $(html);
        attachCardClick($card, "collection");
        $("#myBooksGrid").append($card);
      });

      // staggered fade-in
      $("#myBooksGrid").children().hide().each(function (i) {
        $(this).delay(i * 80).fadeIn(350);
      });
    })
    .fail(function () {
      $("#myBooksLoading").html("<p>Could not load collection.</p>");
    });
}

/* uses mustache to render either the grid card
   or list row template, viewOverride lets collection cards use
   currentCollectionView instead of currentView */
function renderCardTemplate(book, source, viewOverride) {
  const info = book.volumeInfo || {};

  // build the data object that mustache will use
  const data = {
    id:      book.id,
    source:  source,
    title:   info.title || "Unknown Title",
    authors: (info.authors || ["Unknown Author"]).join(", "),
    // mustache uses truthy/falsy — if cover is null/undefined the
    // {{^cover}} block (inverted section) shows the fallback instead
    cover: info.imageLinks
      ? (info.imageLinks.thumbnail || info.imageLinks.smallThumbnail)
      : null,
  };

  // uses the override view if provided, otherwise usew the current search view
  const view = viewOverride || currentView;

  // picks the template based on the view mode
  const templateId = view === "list" ? "#tpl-card-list" : "#tpl-card-grid";
  const template   = $(templateId).html();

  // mustache.render() fills in the template with the data
  return Mustache.render(template, data);
}


/* clears a collection grid and re-renders all
   its cards using the current collection view mode,
   uses cached book data so no extra API calls needed */
function reRenderCollection(gridId, source) {
  const $grid = $(gridId);

  // only re-renders if the grid has cards in it
  if ($grid.children().length === 0) return;

  // picks the correct cached data array
  const books = myBooksData;
  if (!books || books.length === 0) return;

  $grid.empty();

  books.forEach(function (book) {
    const html  = renderCardTemplate(book, source, currentCollectionView);
    const $card = $(html);
    attachCardClick($card, "collection");
    $grid.append($card);
  });
}


/* adds a click handler to a rendered card element
   panelTarget = "search" or "collection"
   determines which detail panel div to use */
function attachCardClick($card, panelTarget) {
  $card.on("click", function () {
    const bookId  = $(this).data("id");
    const panelId = panelTarget === "search" ? "#detailPanel" : "#collectionDetailPanel";

    // finds which grid this card is in and removes selected from siblings
    $(this).closest(".books-grid, #myBooksGrid")
      .find(".book-card, .book-list-item").removeClass("selected");

    // highligths the clicked card
    $(this).addClass("selected");

    // loads and shows the detail panel
    loadDetails(bookId, panelId);
  });
}


/* fetches full book data and renders the detail
   panel using the mustache detail template, no page reload */
function loadDetails(bookId, panelId) {

  // shows spinner inside the panel while loading
  $(panelId)
    .removeClass("hidden")
    .html(`<div class="loading"><div class="spinner"></div><p>Loading details...</p></div>`);

  // scrolls to the panel
  $("html, body").animate(
    { scrollTop: $(panelId).offset().top - 80 },
    300
  );

  $.getJSON(
    `https://www.googleapis.com/books/v1/volumes/${bookId}?key=${API_KEY}`
  )
    .done(function (book) {
      renderDetailTemplate(book, panelId);
    })
    .fail(function () {
      $(panelId).html(
        `<p style="color:#c04040; padding:1.5rem">Could not load book details.</p>`
      );
    });
}


/* builds the data object and uses mustache to render the detail panel template, 
  then injects it into the correct panel div */
function renderDetailTemplate(book, panelId) {
  const info = book.volumeInfo || {};
  const sale = book.saleInfo   || {};

  // build cover URL, prefer largest size
  let coverLg = null;
  if (info.imageLinks) {
    coverLg = info.imageLinks.large
           || info.imageLinks.medium
           || info.imageLinks.thumbnail
           || info.imageLinks.smallThumbnail
           || null;
  }

  // build price string
  let price = null;
  if (sale.saleability === "FOR_SALE" && sale.listPrice) {
    price = `${sale.listPrice.amount.toFixed(2)} ${sale.listPrice.currencyCode}`;
  }

  // builds the data object for mustache
  // null, empty string hide their sections via {{#field}} blocks
  const data = {
    title:       info.title        || "Unknown Title",
    authors:     (info.authors     || ["Unknown Author"]).join(", "),
    publisher:   info.publisher    || "Unknown Publisher",
    published:   info.publishedDate || "N/A",
    description: info.description  || "No description available.",
    coverLg:     coverLg,
    pages:       info.pageCount    ? `${info.pageCount} pages` : null,
    language:    info.language     ? info.language.toUpperCase() : null,
    rating:      info.averageRating
                   ? `${info.averageRating}/5 (${info.ratingsCount || 0} ratings)`
                   : null,
    categories:  info.categories   ? info.categories.join(", ") : null,
    price:       price,
    previewLink: info.previewLink  || null,
  };

  // gets the detail template and renders it with mustache
  const template = $("#tpl-detail").html();
  const html     = Mustache.render(template, data);

  // injects into the panel
  $(panelId).html(html);

  // close button hides the panel and removes card highlight
  $("#closeDetail").on("click", function () {
    $(panelId).addClass("hidden").empty();
    $(".book-card, .book-list-item").removeClass("selected");
  });
}
