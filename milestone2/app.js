let allBooks = [];
let resultsPerPage = 10;

$(document).ready(function () {

    $(".loading").hide();

    // SEARCH
    $("#searchBtn").click(function () {
        let query = $("#searchInput").val();

        $(".loading").show();

        let url = `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=40`;

        $.getJSON(url, function (data) {
            allBooks = data.items || [];

            $(".loading").hide();

            setupPagination();
            displayPage(1);
        });
    });

    // PAGINATION
    $("#pagination").change(function () {
        displayPage($(this).val());
    });

    // DETAILS PAGE
    let params = new URLSearchParams(window.location.search);
    let bookId = params.get("id");

    if (bookId && $("#bookDetails").length) {
        let url = `https://www.googleapis.com/books/v1/volumes/${bookId}`;

        $.getJSON(url, function (data) {
            let info = data.volumeInfo;

            $("#bookDetails").html(`
                <h2>${info.title}</h2>
                <img src="${info.imageLinks?.thumbnail || ''}">
                <p><strong>Authors:</strong> ${info.authors?.join(", ") || 'N/A'}</p>
                <p><strong>Publisher:</strong> ${info.publisher || 'N/A'}</p>
                <p><strong>Description:</strong> ${info.description || 'N/A'}</p>
                <p><strong>Price:</strong> ${data.saleInfo?.listPrice?.amount || 'N/A'}</p>
            `);
        });
    }

    // BOOKSHELF
    if ($("#bookshelf").length) {
        let myBooks = [
            "zyTCAlFPjgYC",
            "uW3aDwAAQBAJ",
            "m8dPPgAACAAJ"
        ];

        myBooks.forEach(id => {
            let url = `https://www.googleapis.com/books/v1/volumes/${id}`;

            $.getJSON(url, function (data) {
                $("#bookshelf").append(`
                    <div>
                        <img src="${data.volumeInfo.imageLinks?.thumbnail || ''}">
                        <a href="details.html?id=${id}">${data.volumeInfo.title}</a>
                    </div>
                `);
            });
        });
    }
});

function displayPage(page) {
    $("#results").empty();

    let start = (page - 1) * resultsPerPage;
    let end = start + resultsPerPage;

    let pageItems = allBooks.slice(start, end);

    pageItems.forEach(book => {
        $("#results").append(`
            <div>
                <img src="${book.volumeInfo.imageLinks?.thumbnail || ''}">
                <a href="details.html?id=${book.id}">${book.volumeInfo.title}</a>
            </div>
        `);
    });
}

function setupPagination() {
    $("#pagination").empty();

    let pages = Math.ceil(allBooks.length / resultsPerPage);

    for (let i = 1; i <= pages; i++) {
        $("#pagination").append(`<option value="${i}">Page ${i}</option>`);
    }
}
