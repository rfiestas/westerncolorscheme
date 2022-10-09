const filterData = {
    "Brand": {
        "Icon": "fa-flag",
        "Color": "primary",
    },
    "Group": {
        "Icon": "fa-shapes",
        "Color": "success",
    },
    "Color": {
        "Icon": "fa-palette",
        "Color": "warning",
    },
    "Borders": {
        "Icon": "fa-border-all",
        "Color": "info",
        "Default": "No"
    },
    "Stickers": {
        "Icon": "fa-sticky-note",
        "Color": "sticker",
        "Default": "No"
    },
    "View360": {
        "Icon": "fa-cube",
        "Color": "danger",
        "Default": "No"
    },
    "Default": {
        "Icon": "fa-backspace",
        "Color": "muted",
    }
};

$(document).ready(function () {
    // Get catalog
    $.getJSON('cubes-catalog.json', function (catalog) {
        // Sort Cubes catalog
        catalog.cubes = catalog.cubes.sort((a, b) => (a.Name > b.Name) ? 1 : ((b.Name > a.Name) ? -1 : 0));

        // Add all filter checkbox
        // Get unique Brands, create and print
        ["Brand","Group","Color","Borders","Stickers","View360"].forEach(category => {
            generateFilter(catalog.cubes, category);
        });

        // Show cubes catalog
        document.getElementById("catalog").innerHTML = `
            <h2 class="app-title">Cube (${catalog.cubes.length} results) </h2>
            ${catalog.cubes.map(cubeTemplate).join("")}
            <p class="footer">These ${catalog.cubes.length} cubes were added recently. Check back soon for updates</p>
        `;

        const $filtersCkb = $(".custom-control-input");
        $filtersCkb.on("change", function () {
            key = $(this).val().split('#')[0]; // Get category
            const $items = $(`[data-${key}]`); // Get items with the same category
        
            // Create an list of checked filters
            const checkedFilter = $filtersCkb.filter(":checked").get().map(el => el.value);
            // Show all and exit if no filter is active
            if (!checkedFilter.length) return $items.removeClass("is-hidden");

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

            // Iterate the catalog items to show or hide based on the filters.
            $items.each(function () {
                var match = 0;
                for (var key in filters) {
                    const itemValue = $(this).data(key.toLowerCase()); //Data in lowercase
                    if (filters[key].includes(itemValue)) {
                        match += 1;
                    }
                }
                if (match == Object.keys(filters).length) {
                    $(this).removeClass("is-hidden"); // March all filters, then show
                } else {
                    $(this).addClass("is-hidden"); // Hide
                }
            });
        });
    });
    
    // Configure view 360 modal listeners
    document.getElementById('view360').addEventListener('hidden.bs.modal', function (event) {
        window.CI360.destroy();
    })
    document.getElementById('view360').addEventListener('shown.bs.modal', function (event) {
        window.CI360.init();
    })
});

// generate filters view
function generateFilter(catalog, key){
    let category = [...new Set(catalog.map(item => item[key]))];
    document.getElementById("filters").innerHTML += FilterTemplate(key, category.sort());
}

// get filtered key
function getfilterDataKey(category, key) {
    return filterData[category][key] || filterData.Default[key];
}

// Open view 360 modal
function openView360(brand, name){
    let folder = `images/cubes/view-360/${brand}-${name}/`;
    document.getElementById('view-label').innerHTML = `${brand} ${name}`;
    document.getElementById('cube-360').setAttribute('data-folder', folder);
    $('#view360').modal('show');
}

function FilterTemplate(key, items) {
    var filterItems = "";
    var i = 0;

    // Prepare filters view
    for (const item of items) {
        val = item || getfilterDataKey(key, "Default")
        filterItems += `
<div class="custom-control custom-checkbox">
    <input type="checkbox" class="custom-control-input" id="${key}#${val}" value="${key}#${val}">
    <label class="custom-control-label" for="${key}#${val}">${val}</label>
</div>
`;
        i++;
    }

    // Print filters view
    let categoryClass = getfilterDataKey(key, "Icon") + " text-" + getfilterDataKey(key, "Color");
    content = `
<div class="widget-title widget-collapse">
    <h6><i class="fas ${categoryClass} pr-1"></i>&nbsp;&nbsp;${key}</h6>&nbsp; 
    <a class="ml-auto" data-bs-toggle="collapse" href="#${key}" role="button" aria-expanded="false" aria-controls="${key}"><i class="fas fa-chevron-down"></i></a>
</div>
<div class="collapse" id="${key}">
    <div class="widget-content">
${filterItems}
    </div>
</div>
`;

    return content;
}

function cubeTemplate(cube) {
    return `
<div class="col-sm-6 col-lg-4 mb-4" data-brand="${cube.Brand}" data-group="${cube.Group}" data-color="${cube.Color}" data-borders="${cube.Borders || getfilterDataKey("Borders", "Default")}" data-stickers="${cube.Stickers || getfilterDataKey("Stickers", "Default")}" data-view360="${cube.View360 || getfilterDataKey("View360", "Default")}">
    <div class="cube-list cube-grid">
        <div class="cube-list-image">
            ${imageTemplate(cube.View360, cube.Brand, cube.Name)}
        </div>
        <div class="cube-list-details">
            <div class="cube-list-info">
                <div class="cube-list-title">
                    <h5>${cube.Brand} ${cube.Name}</h5>
                </div>
                <div class="cube-list-option badges-list">
                    <ul class="list-unstyled">
                        ${cubeBadgesTemplate("Brand", cube.Brand)}
                        ${cubeBadgesTemplate("Group", cube.Group)}
                        ${cubeBadgesTemplate("Color", cube.Color)}
                        ${cubeBadgesTemplate("Borders", cube.Borders)}
                    </ul>
                </div>
            </div>
            <div class="cube-list-favourite-time">
                ${view360Template(cube.View360, cube.Brand, cube.Name)}
                <span class="cube-list-time order-1"><i class="far fa-clock pr-1"></i> ${cube.Date}</span>
            </div>
        </div>
    </div>
</div>
`;
}

function cubeBadgesTemplate(key, value) {
    let badgeClass = "badge bg-" + getfilterDataKey(key, "Color") + " increase-size";
    let badgeIcon = "fas " + getfilterDataKey(key, "Icon") + " pr-1";
    let val = value || getfilterDataKey(key, "Default") || 'Error';
    
    if (val == "No" || val == "Error") { return "" }; // Avoid print badge when value is No or Error
    return `<li title="${key}: ${val}"><span class="${badgeClass}"><i class="${badgeIcon}"></i> ${val}</span></li>`;
}

function imageTemplate(print, brand, name){
    let image = `<img class="img-fluid" src="images/cubes/square-336/${brand}-${name}.png" alt="${brand}-${name}">`
    if (print){
        return `<a href="#View360/${brand}-${name}" title="${brand}-${name} 360 view" onclick="openView360('${brand}', '${name}')">${image}</a>`
    }
    return image;
}

function view360Template(print, brand, name){
    let classes = getfilterDataKey("View360", "Icon") + " text-" + getfilterDataKey("View360", "Color");
    if (print){
        return `<a class="cube-list-favourite order-2" href="#View360/${brand}-${name}" title="${brand}-${name} 360 view" onclick="openView360('${brand}', '${name}')"><i class="fas ${classes}"></i></a>`;
    }
    return ``;
}