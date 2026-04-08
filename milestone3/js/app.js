/* milestone 3 javascript and jQuery logic file */

// my google books API key
const API_KEY = "AIzaSyAKDvKl8cU38lc-1vkK-vmWA7MdAkC3MWE";

// 10 results per page and 5 pages in total = 50 results overall
const PER_PAGE    = 10;
const TOTAL_PAGES = 5;

// volume IDs for the my personal collection section
// fetched individually from the API on page load
const MY_BOOK_IDS = [
   "-9WUEQAAQBAJ",
  "Vf9JtAEACAAJ",
  "FQaalAEACAAJ",
  "LKdGpOxtEHsC",
  "RehWEQAAQBAJ",
];

// stores the active search query so page buttons can re-use it
let currentQuery = "";


/* waits for the page to fully load before running any code */
$(function () {

  // pressing enter in the search box trigger a search
  $("#searchInput").on("keypress", function (e) {
    if (e.key === "Enter") doSearch(1);
  });

  // search button click handler
  $("#searchBtn").on("click", function () {
    doSearch(1);
  });

  // load my collection on page load (no user action required)
  loadCollection();
});


/* makes a fresh API call for each page using
   startIndex so it can reach up to 50 results
   across 5 pages without hitting the 40-result
   single-request google books API limit */
function doSearch(page) {

  // page 1 reads from the input; on later pages re-use the saved query
  const query = page === 1
    ? $("#searchInput").val().trim()
    : currentQuery;

  // nothing happens if the search box is empty
  if (!query) return;

  // saves the query so pagination buttons can re-use it
  currentQuery = query;

  // resets the UI for a fresh search
  $("#booksGrid").empty();
  $("#detailPanel").addClass("hidden").empty();
  $("#noResults").addClass("hidden");
  $("#searchSection").addClass("hidden");
  $("#searchLoading").removeClass("hidden");

  // startIndex moves forward by PER_PAGE for each page:
  // page 1 = 0, page 2 = 10, page 3 = 20, page 4 = 30, page 5 = 40
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

      if (books.length === 0) {
        // show empty state message if nothing comes back
        $("#noResults").removeClass("hidden");
        return;
      }

      // shows the results section
      $("#searchSection").removeClass("hidden");

      // builds the result count string
      const rangeStart = startIndex + 1;
      const rangeEnd   = startIndex + books.length;
      $("#resultsCount").text(
        `Showing ${rangeStart}–${rangeEnd} of ${TOTAL_PAGES * PER_PAGE} total results for "${query}"`
      );

      // builds the numbered page buttons
      buildPagination(page);

      // renders a card for each book returned
      books.forEach(function (book) {
        $("#booksGrid").append(buildCard(book, "search"));
      });

      // staggered fade-in, each card waits 40ms longer than the previous
      $("#booksGrid .book-card").hide().each(function (i) {
        $(this).delay(i * 40).fadeIn(280);
      });

      // scroll up to the results section
      $("html, body").animate(
        { scrollTop: $("#searchSection").offset().top - 80 },
        300
      );
    })
    .fail(function () {
      // shows error if the API call fails
      $("#searchLoading").addClass("hidden");
      $("#noResults").removeClass("hidden")
        .find("p").text("API error. Please check the API key and try again.");
    });
}


/* buildPagination(currentPage)
   creates one numbered button per page
   the active page button is highlighted in blue */
function buildPagination(currentPage) {
  const $pag = $("#pagination").empty();

  for (let i = 1; i <= TOTAL_PAGES; i++) {
    const $btn = $(`<button>${i}</button>`);

    // highlights the currently active page
    if (i === currentPage) $btn.addClass("active");

    // each button triggers a new API call for that page
    $btn.on("click", function () {
      doSearch(i);
    });

    $pag.append($btn);
  }
}


/* loadCollection()
   fetches all books in MY_BOOK_IDS in parallel
   using $.when() and renders them in the
   my Collection grid on page load */
function loadCollection() {

  // builds one $.getJSON request per book ID
  const requests = MY_BOOK_IDS.map(function (id) {
    return $.getJSON(
      `https://www.googleapis.com/books/v1/volumes/${id}?key=${API_KEY}`
    );
  });

  // $.when() waits for all requests to finish before running .done()
  $.when(...requests)
    .done(function () {

      // normalizes arguments into a plain array
      const results = MY_BOOK_IDS.length === 1
        ? [arguments[0]]
        : Array.from(arguments).map(function (a) { return a[0]; });

      // hides the loading spinner
      $("#collectionLoading").addClass("hidden");

      // renders a card for each book
      results.forEach(function (book) {
        $("#collectionGrid").append(buildCard(book, "collection"));
      });

      // staggered fade-in for collection cards
      $("#collectionGrid .book-card").hide().each(function (i) {
        $(this).delay(i * 80).fadeIn(350);
      });
    })
    .fail(function () {
      $("#collectionLoading").html("<p>Could not load collection.</p>");
    });
}


/* buildCard(book, source)
   builds and returns a single book card element
   source = "search" or "collection", used to
   know which grid to remove the highlight from
   when a new card is selected */
function buildCard(book, source) {
  const info    = book.volumeInfo || {};
  const title   = info.title || "Unknown Title";
  const authors = (info.authors || ["Unknown Author"]).join(", ");

  // uses thumbnail if available, otherwise shows a text placeholder
  const cover = info.imageLinks
    ? (info.imageLinks.thumbnail || info.imageLinks.smallThumbnail)
    : null;

  const imgHtml = cover
    ? `<img src="${cover}" alt="${title}" loading="lazy" />`
    : `<span class="no-cover">No Cover</span>`;

  // clicking shows details
  // on the same page instead of navigating to a new page
  const $card = $(`
    <div class="book-card" data-id="${book.id}" data-source="${source}">
      <div class="cover-wrap">${imgHtml}</div>
      <div class="card-body">
        <span class="card-title">${title}</span>
        <span class="card-author">${authors}</span>
      </div>
    </div>`);

  // clicking a card loads its details into the detail panel below
  $card.on("click", function () {
    const bookId = $(this).data("id");
    const src    = $(this).data("source");

    // removes selected highlight from all cards in this grid
    const gridId = src === "search" ? "#booksGrid" : "#collectionGrid";
    $(gridId).find(".book-card").removeClass("selected");

    // highlights the clicked card with a blue ring
    $(this).addClass("selected");

    // fetches and displays the details panel
    loadDetails(bookId);
  });

  return $card;
}


/* loadDetails(bookId)
   fetches full book data by volume ID and
   renders the detail panel below the grid
   no page reload */
function loadDetails(bookId) {

  // shows a loading spinner inside the detail panel while fetching
  $("#detailPanel")
    .removeClass("hidden")
    .html(`<div class="loading"><div class="spinner"></div><p>Loading details...</p></div>`);

  $.getJSON(
    `https://www.googleapis.com/books/v1/volumes/${bookId}?key=${API_KEY}`
  )
    .done(function (book) {
      renderDetails(book); // if success, renders the full detail panel
    })
    .fail(function () {
      $("#detailPanel").html(
        `<p style="color:#c04040; padding:1.5rem">Could not load the book details.</p>`
      );
    });
}


/* renderDetails(book)
   builds and injects the full detail panel HTML */
function renderDetails(book) {
  const info = book.volumeInfo || {}; // all text info 
  const sale = book.saleInfo   || {}; // pricing info 

  // extracts values to display
  const title       = info.title        || "Unknown Title";
  const authors     = (info.authors     || ["Unknown Author"]).join(", ");
  const publisher   = info.publisher    || "Unknown Publisher";
  const published   = info.publishedDate || "N/A";
  const description = info.description  || "No description available.";
  const pages       = info.pageCount    ? `${info.pageCount} pages` : null;
  const categories  = info.categories   ? info.categories.join(", ") : null;
  const language    = info.language     ? info.language.toUpperCase() : null;
  const rating      = info.averageRating
    ? `${info.averageRating}/5 (${info.ratingsCount || 0} ratings)`
    : null;

  // cover image 
  let coverHtml = `<div class="no-cover-lg">No Cover Available</div>`;
  if (info.imageLinks) {
    const src = info.imageLinks.large
             || info.imageLinks.medium
             || info.imageLinks.thumbnail
             || info.imageLinks.smallThumbnail;
    if (src) coverHtml = `<img src="${src}" alt="${title}" />`;
  }

  // price only shown if the book is for sale and has a list price
  let priceHtml = "";
  if (sale.saleability === "FOR_SALE" && sale.listPrice) {
    priceHtml = `
      <span class="price-tag">
        ${sale.listPrice.amount.toFixed(2)} ${sale.listPrice.currencyCode}
      </span>`;
  }

  // preview link button
  let previewHtml = "";
  if (info.previewLink) {
    previewHtml = `
      <a class="preview-btn" href="${info.previewLink}" target="_blank">
        Preview on Google Books &rarr;
      </a>`;
  }

  // metadata pills. only adds a pill if the value exists
  let metaTags = `<span class="meta-tag">Published: ${published}</span>`;
  if (pages)     metaTags += `<span class="meta-tag">${pages}</span>`;
  if (language)  metaTags += `<span class="meta-tag">Language: ${language}</span>`;
  if (rating)    metaTags += `<span class="meta-tag">Rating: ${rating}</span>`;
  if (priceHtml) metaTags += priceHtml;

  // the full detail panel HTML
  const html = `
    <div class="detail-panel">
      <button class="close-btn" id="closeDetail">X</button>

      <div class="detail-cover">${coverHtml}</div>

      <div class="detail-info">
        <h2>${title}</h2>
        <p style="font-weight:700; color:var(--primary-dk); margin-bottom:.15rem">${authors}</p>
        <p style="font-size:.86rem; color:var(--muted)">Published by ${publisher}</p>

        <div class="detail-meta">${metaTags}</div>

        ${categories ? `<h3>Genre</h3><p>${categories}</p>` : ""}

        <h3>Description</h3>
        <p>${description}</p>

        ${previewHtml}
      </div>
    </div>`;

  // injects the panel into the page
  $("#detailPanel").html(html);
  document.getElementById("detailPanel").scrollIntoView({
   behavior: "smooth",
   block: "start"
});

  // close button hides the panel and removes the card highlight
  $("#closeDetail").on("click", function () {
    $("#detailPanel").addClass("hidden").empty();
    $(".book-card").removeClass("selected");
  });
}
