$(document).ready(function () {

    const maxResults = 20;
    let currentQuery = "";
    let isLoading = false;

    // Search button click
    $("#searchBtn").click(startSearch);

    // Press Enter to search
    $("#searchBox").keypress(function (e) {
        if (e.which === 13) startSearch();
    });

    function startSearch() {
        // Prevent multiple rapid requests
        if (isLoading) return;

        currentQuery = $("#searchBox").val().trim();

        if (!currentQuery) {
            alert("Enter a search term");
            return;
        }

        isLoading = true;
        loadPage(0);
    }

    function loadPage(startIndex) {
        $("#results").html("<p>Loading...</p>");

        const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(currentQuery)}&startIndex=${startIndex}&maxResults=${maxResults}`;

        $.getJSON(url)
            .done(function (data) {

                if (!data.items) {
                    $("#results").html("<p>No results found</p>");
                    isLoading = false;
                    return;
                }

                displayResults(data.items);
                setupPagination(data.totalItems);

                isLoading = false;
            })
            .fail(function () {
                $("#results").html("<p>Too many requests. Please wait a few seconds and try again.</p>");
                isLoading = false;
            });
    }

    function displayResults(books) {
        $("#results").empty();

        books.forEach(book => {
            const info = book.volumeInfo;

            const title = info.title || "No title";
            const img = info.imageLinks?.thumbnail || "https://via.placeholder.com/100";

            const html = `
                <div class="book">
                    <img src="${img}">
                    <h3>
                        <a href="details.html?id=${book.id}">
                            ${title}
                        </a>
                    </h3>
                </div>
            `;

            $("#results").append(html);
        });
    }

    function setupPagination(totalItems) {
        $("#pageSelect").empty();

        const totalPages = Math.ceil(Math.min(totalItems, 60) / maxResults);

        for (let i = 0; i < totalPages; i++) {
            $("#pageSelect").append(
                `<option value="${i}">Page ${i + 1}</option>`
            );
        }

        $("#pageSelect").off("change").on("change", function () {
            loadPage($(this).val() * maxResults);
        });
    }

});
