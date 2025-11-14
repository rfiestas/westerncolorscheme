var filtersData = {};
var colorSchemaData = {};


document.addEventListener("DOMContentLoaded", function () {
    // Filter reset button
    const resetBtn = document.getElementById("reset");
    if (resetBtn) {
        resetBtn.addEventListener("click", function () {
            const filterInputs = document.querySelectorAll(".custom-control-input");
            filterInputs.forEach(input => {
                input.checked = false;
                input.dispatchEvent(new Event("change"));
            });
        });
    }

    // Filter checkbox logic
    const filtersCkb = document.querySelectorAll(".custom-control-input");
    filtersCkb.forEach(input => {
        input.addEventListener("change", function () {
            const key = this.value.split('#')[0]; // Get category
            const items = document.querySelectorAll(`[data-${key}]`); // Get items with the same category

            // List of checked filters
            const checkedFilter = Array.from(filtersCkb).filter(el => el.checked).map(el => el.value);
            // Show all and exit if no filter is active
            if (!checkedFilter.length) {
                document.getElementById('cube-summary').innerHTML = ``;
                document.getElementById('modal-cube-summary').innerHTML = ``;
                items.forEach(item => item.classList.remove("visually-hidden"));
                return;
            }
            // Dictionary of filters
            var filters = {};
            checkedFilter.forEach(element => {
                var filterValue = element.split('#'), category = filterValue[0], value = filterValue[1];
                if (category in filters) {
                    filters[category].push(value);
                } else {
                    filters[category] = [value];
                }
            });

            let cubesFiltered = 0;
            items.forEach(item => {
                var match = 0;
                for (var key in filters) {
                    // Use data-* attributes (all lowercased)
                    const itemValue = item.dataset[key.toLowerCase()];
                    if (!itemValue) continue;
                    if (itemValue.includes(",")) {
                        var removedDuplicates = (new Set([].concat(filters[key], itemValue.split(","))));
                        var duplicates = [].concat(filters[key], itemValue.split(","));
                        if (removedDuplicates.size < duplicates.length) {
                            match += 1;
                        }
                    } else {
                        if (filters[key].includes(itemValue)) {
                            match += 1;
                        }
                    }
                }
                if (match == Object.keys(filters).length) {
                    item.classList.remove("visually-hidden");
                    cubesFiltered++;
                } else {
                    item.classList.add("visually-hidden");
                }
            });

            let summary = " (" + resultsTemplate(Object.keys(filters).length, "Filter") + ', ' + resultsTemplate(cubesFiltered, "Result") + ")";
            document.getElementById('cube-summary').innerHTML = summary;
            document.getElementById('modal-cube-summary').innerHTML = summary;
        });
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
    const modalEl = document.getElementById('view360');
    if (modalEl) {
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
    }
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

document.addEventListener("DOMContentLoaded", () => {
    const lazyPatterns = document.querySelectorAll('[data-bg]');

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const bg = el.getAttribute('data-bg');
                el.style.backgroundImage = `url(${bg})`;
                el.removeAttribute('data-bg');
                observer.unobserve(el);
            }
        });
    }, {
        rootMargin: '200px 0px'
    });

    lazyPatterns.forEach(el => observer.observe(el));
});