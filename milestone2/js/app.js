$(document).ready(function () {

    const maxResults = 20;
    let currentQuery = "";

    $("#searchBtn").click(startSearch);

    $("#searchBox").keypress(function(e) {
        if (e.which === 13) startSearch();
    });

    function startSearch() {
        currentQuery = $("#searchBox").val().trim();

        if (!currentQuery) {
            alert("Enter a search term");
            return;
        }

        loadPage(0);
    }

    function loadPage(startIndex) {
        $("#results").html("<p>Loading...</p>");

        $.getJSON(
            `https://www.googleapis.com/books/v1/volumes?q=${currentQuery}&startIndex=${startIndex}&maxResults=${maxResults}`,
            function (data) {
                if (!data.items) {
                    $("#results").html("<p>No results found</p>");
                    return;
                }

                displayResults(data.items);
                setupPagination(data.totalItems);
            }
        );
    }

    function displayResults(books) {
        $("#results").empty();

        books.forEach(book => {
            const info = book.volumeInfo;

            const html = `
                <div class="book">
                    <img src="${info.imageLinks?.thumbnail || 'https://via.placeholder.com/100'}">
                    <h3>
                        <a href="details.html?id=${book.id}">
                            ${info.title}
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
            $("#pageSelect").append(`<option value="${i}">Page ${i + 1}</option>`);
        }

        $("#pageSelect").off().change(function () {
            loadPage($(this).val() * maxResults);
        });
    }

});
