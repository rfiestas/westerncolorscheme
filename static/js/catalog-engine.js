var filtersData = {};
var colorSchemaData = {};

$(document).ready(function () {
    // Get catalog
        //document.getElementById("cube-total").innerHTML = `${catalog.Cubes.length} Cubes `;
        //document.getElementById("modal-cube-total").innerHTML = `${catalog.Cubes.length} Cubes `;

        /* Filter reset button */
        const $resetBtn = $("#reset");
        $resetBtn.on("click", function () {
            $(".custom-control-input").prop('checked', false).trigger("change");
        })

        /* Filter checkbox*/
        const $filtersCkb = $(".custom-control-input");
        $filtersCkb.on("change", function () {
            key = $(this).val().split('#')[0]; // Get category
            const $items = $(`[data-${key}]`); // Get items with the same category

            // Create an list of checked filters
            const checkedFilter = $filtersCkb.filter(":checked").get().map(el => el.value);
            // Show all and exit if no filter is active
            if (!checkedFilter.length) {
                document.getElementById('cube-summary').innerHTML = ``;
                document.getElementById('modal-cube-summary').innerHTML = ``;
                return $items.removeClass("visually-hidden");
            }
            // Create a Dictionary of list with the filters, to apply this rules:
            // OR for filters with the same category
            // AND for filters with different category
            var filters = new Object();
            checkedFilter.forEach(element => {
                var filterValue = element.split('#'), category = filterValue[0], value = filterValue[1];
                if (category in filters) {
                    filters[category].push(value); // The category already exist, append a new category filter value
                } else {
                    filters[category] = [value]; // The category does't exit, create it and assign the first category filter value
                }
            });

            let cubesFiltered = 0;
            // Iterate the catalog items to show or hide based on the filters.
            $items.each(function () {
                var match = 0;
                for (var key in filters) {
                    const itemValue = $(this).data(key.toLowerCase()); //Data in lowercase
                    if (itemValue.includes(",")) { // Used on tags or when a key contains a list.
                        var removedDuplicates = (new Set([].concat(filters[key], itemValue.split(","))));
                        var duplicates = [].concat(filters[key], itemValue.split(","));
                        if (removedDuplicates.size < duplicates.length) {
                            match += 1;
                        }
                    } else { // Used on keys that use a string
                        if (filters[key].includes(itemValue)) {
                            match += 1;
                        }
                    }
                }
                if (match == Object.keys(filters).length) {
                    $(this).removeClass("visually-hidden"); // Match all filters, then show
                    cubesFiltered++;
                } else {
                    $(this).addClass("visually-hidden"); // Hide
                }
            });

            let summary = " (" + resultsTemplate(Object.keys(filters).length, "Filter") + ', ' + resultsTemplate(cubesFiltered, "Result") + ")";
            document.getElementById('cube-summary').innerHTML = summary;
            document.getElementById('modal-cube-summary').innerHTML = summary;
        });
    });

    // Configure view 360 modal listeners
    document.getElementById('view360').addEventListener('hidden.bs.modal', function () {
        window.CI360.destroy();
    })
    document.getElementById('view360').addEventListener('shown.bs.modal', function () {
        window.CI360.init();
    })

// Open view 360 modal
function openView360(brand, name) {
    let folder = `images/cubes/view-360/${brand}-${name}/`;
    document.getElementById('view-label').innerHTML = `${brand} ${name}`;
    document.getElementById('cube-360').setAttribute('data-folder', folder);
    $('#view360').modal('show');
}

function resultsTemplate(results, title) {
    let plural = "s";
    if (results == 1) { plural = "" }
    return `${results} ${title}${plural}`
}

function view360Template(print, brand, name) {
    let classes = getfilterDataKey("View360", "Icon") + " text-" + getfilterDataKey("View360", "Color");
    if (print) {
        return `<a class="cube-list-favourite order-2" href="#View360/${brand}-${name}" title="${brand}-${name} 360 view" onclick="openView360('${brand}', '${name}')"><i class="fas ${classes}"></i></a>`;
    }
    return ``;
}

// Lazy Load
document.addEventListener("DOMContentLoaded", function() {
    let lazyloadImages;
    if("IntersectionObserver" in window) {
    lazyloadImages = document.querySelectorAll(".lazy-load");
    let imageObserver = new IntersectionObserver(function(entries, observer) {
        entries.forEach(function(entry) {
        if(entry.isIntersecting) {
            let image = entry.target;
            image.src = image.dataset.src;
            image.classList.remove("lazy-load");
            imageObserver.unobserve(image);
        }
        });
    });
    lazyloadImages.forEach(function(image) {
        imageObserver.observe(image);
    });
    } else {
    let lazyloadThrottleTimeout;
    lazyloadImages = document.querySelectorAll(".lazy-load");

    function lazyload() {
        if(lazyloadThrottleTimeout) {
        clearTimeout(lazyloadThrottleTimeout);
        }
        lazyloadThrottleTimeout = setTimeout(function() {
        let scrollTop = window.pageYOffset;
        lazyloadImages.forEach(function(img) {
            if(img.offsetTop < (window.innerHeight + scrollTop)) {
            img.src = img.dataset.src;
            img.classList.remove('lazy-load');
            }
        });
        if(lazyloadImages.length == 0) {
            document.removeEventListener("scroll", lazyload);
            window.removeEventListener("resize", lazyload);
            window.removeEventListener("orientationChange", lazyload);
        }
        }, 20);
    }
    document.addEventListener("scroll", lazyload);
    window.addEventListener("resize", lazyload);
    window.addEventListener("orientationChange", lazyload);
    }
})
