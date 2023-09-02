package catalog

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"sort"
	"strings"
	"text/template"

	"github.com/tdewolff/minify/v2"
	"github.com/tdewolff/minify/v2/css"
	"github.com/tdewolff/minify/v2/html"
	"github.com/tdewolff/minify/v2/js"
)

type CatalogEngineCfg struct {
	JsonData []byte
	Minify   bool
}
type CatalogEngine struct {
	catalog catalog
	minify  bool
}

func NewCatalogEngine(cfg CatalogEngineCfg) (*CatalogEngine, error) {
	var data catalog
	data, err := loadCatalog(cfg.JsonData)
	if err != nil {
		return nil, err
	}

	err = validateCatalog(data)
	if err != nil {
		return nil, err
	}

	err = data.precalculateCatalog()
	if err != nil {
		return nil, err
	}

	return &CatalogEngine{
		catalog: data,
		minify:  cfg.Minify,
	}, nil
}

func loadCatalog(data []byte) (catalog, error) {
	var jsonData catalog
	err := json.Unmarshal(data, &jsonData)
	if err != nil {
		return catalog{}, err
	}
	return jsonData, err
}
func validateCatalog(c catalog) error {
	for _, cube := range c.Cubes {
		file := fmt.Sprintf("./www/images/cubes/square-336/%s-%s.webp", cube.Brand, cube.Name)
		if _, err := os.Stat(file); err != nil {
			return fmt.Errorf("file %s not exist", file)
		}
	}
	return nil
}

func filter(data []cubes, f func(cubes) bool) []cubes {
	fltd := make([]cubes, 0)
	for _, cube := range data {
		if f(cube) {
			fltd = append(fltd, cube)
		}
	}

	return fltd
}

func (c *catalog) precalculateCatalog() error {
	filters := map[string][]string{}

	// Remove decommisioned
	c.Cubes = filter(c.Cubes, func(u cubes) bool {
		return !u.Decommissioned
	})

	// Sort by group + brand
	sort.Slice(c.Cubes, func(i, j int) bool { return c.Cubes[i].Group+c.Cubes[i].Brand < c.Cubes[j].Group+c.Cubes[j].Brand })

	for idx, cube := range c.Cubes {
		// ColorSchema, full precalculated
		if len(cube.Schema) > 0 {
			c.Cubes[idx].ColorSchema = cube.Schema
		} else if colorSchema, found := c.ColorSchema[cube.Color]; found {
			c.Cubes[idx].ColorSchema = colorSchema
		} else {
			c.Cubes[idx].ColorSchema = append(c.Cubes[idx].ColorSchema, cube.Color)
		}
		// Stickers, only when empty
		if len(cube.Stickers) == 0 {
			value := c.getCategoryDataKey("Stickers", "Default")
			if value == "ERROR" {
				return fmt.Errorf("error: Stickers.Default not defined in catalog")
			}
			c.Cubes[idx].Stickers = value
		}
		// Base, only when empty
		if len(cube.Base) == 0 {
			value := c.getCategoryDataKey("Base", "Default")
			if value == "ERROR" {
				return fmt.Errorf("error: Base.Default not defined in catalog")
			}
			c.Cubes[idx].Base = value
		}
		// Texture, only when empty
		if len(cube.Texture) == 0 {
			value := c.getCategoryDataKey("Texture", "Default")
			if value == "ERROR" {
				return fmt.Errorf("error: Texture.Default not defined in catalog")
			}
			c.Cubes[idx].Texture = value
		}
		// View360, only when empty
		if len(cube.View360) == 0 {
			value := c.getCategoryDataKey("View360", "Default")
			if value == "ERROR" {
				return fmt.Errorf("error: View360.Default not defined in catalog")
			}
			c.Cubes[idx].View360 = value
		}
		//Add filters
		filters["Brand"] = append(filters["Brand"], c.Cubes[idx].Brand)
		filters["Group"] = append(filters["Group"], c.Cubes[idx].Group)
		filters["Color"] = append(filters["Color"], c.Cubes[idx].Color)
		filters["Base"] = append(filters["Base"], c.Cubes[idx].Base)
		filters["Stickers"] = append(filters["Stickers"], c.Cubes[idx].Stickers)
		filters["Texture"] = append(filters["Texture"], c.Cubes[idx].Texture)
		filters["View360"] = append(filters["View360"], c.Cubes[idx].View360)
		filters["Tags"] = append(filters["Tags"], c.Cubes[idx].Tags...)
	}

	// Remove filter duplicates and assign
	c.Filters = map[string][]string{}
	c.Filters["Brand"] = removeDuplicateStr(filters["Brand"])
	c.Filters["Group"] = removeDuplicateStr(filters["Group"])
	c.Filters["Color"] = removeDuplicateStr(filters["Color"])
	c.Filters["Base"] = removeDuplicateStr(filters["Base"])
	c.Filters["Stickers"] = removeDuplicateStr(filters["Stickers"])
	c.Filters["Texture"] = removeDuplicateStr(filters["Texture"])
	c.Filters["View360"] = removeDuplicateStr(filters["View360"])
	c.Filters["Tags"] = removeDuplicateStr(filters["Tags"])

	return nil
}

func MinifyContent(reader io.Reader, minifyType string) (io.Reader, error) {
	var buffer bytes.Buffer
	writer := &buffer

	m := minify.New()
	switch minifyType {
	case "html":
		m.AddFunc("html", html.Minify)
	case "javascript":
		m.AddFunc("javascript", js.Minify)
	case "css":
		m.AddFunc("css", css.Minify)
	default:
		return nil, fmt.Errorf("type not supported: %s", minifyType)
	}

	if err := m.Minify(minifyType, writer, reader); err != nil {
		return nil, err
	}
	return writer, nil
}

func (c CatalogEngine) Index() (io.Reader, error) {
	var buffer bytes.Buffer
	writer := &buffer

	tmpl, err := template.New("index").Funcs(template.FuncMap{
		"getCategoryDataKey": c.catalog.getCategoryDataKey,
		"toCss":              toCss,
	}).ParseFiles(
		"./templates/index.tmpl",
		"./templates/index-catalog-element.tmpl",
		"./templates/index-catalog-element-image.tmpl",
		"./templates/index-catalog-element-colors.tmpl",
		"./templates/index-catalog-element-badges.tmpl",
		"./templates/index-filters.tmpl",
	)
	if err != nil {
		return nil, err
	}

	err = tmpl.ExecuteTemplate(writer, "index.tmpl", c.catalog)
	if err != nil {
		return nil, err
	}

	if c.minify {
		writerMinify, err := MinifyContent(writer, "html")
		if err != nil {
			return nil, err
		}
		return writerMinify, nil
	}

	return writer, nil
}

func (c catalog) getCategoryDataKey(key string, property string) string {
	if value, ok := c.Categories[key]; ok {
		if propertyValue, ok := value[property]; ok {
			return propertyValue
		}
	}
	return "ERROR"
}

func toCss(value string) string {
	return strings.ReplaceAll((strings.ToLower(value)), " ", "-")
}

type catalog struct {
	Cubes       []cubes                      `json:"Cubes"`
	Categories  map[string]map[string]string `json:"Categories"`
	ColorSchema map[string][]string          `json:"ColorSchema"`
	Filters     map[string][]string          `json:"Filters"`
}

type cubes struct {
	Name           string   `json:"Name"`
	Brand          string   `json:"Brand"`
	Group          string   `json:"Group"`
	Shape          string   `json:"Shape"`
	Color          string   `json:"Color"`
	Schema         []string `json:"Schema,omitempty"`
	ColorSchema    []string `json:"ColorSchema,omitempty"` // Precalculated
	Texture        string   `json:"Texture,omitempty"`
	Base           string   `json:"Base,omitempty"`
	Stickers       string   `json:"Stickers,omitempty"` // PrecalculatedWhenEmpty
	View360        string   `json:"View360,omitempty"`
	Date           string   `json:"Date"`
	Description    string   `json:"Description,omitempty"`
	Decommissioned bool     `json:"Decommissioned,omitempty"`
	Tags           []string `json:"Tags,omitempty"`
}

func removeDuplicateStr(strSlice []string) []string {
	allKeys := make(map[string]bool)
	list := []string{}
	for _, item := range strSlice {
		if _, value := allKeys[item]; !value {
			allKeys[item] = true
			list = append(list, item)
		}
	}
	return list
}
