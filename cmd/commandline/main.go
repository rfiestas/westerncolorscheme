package main

import (
	"fmt"
	"io/ioutil"
	"os"
	"rubik/internal/catalog"
)

func main() {

	jsonData, err := ioutil.ReadFile("catalog-cubes.json") // just pass the file name
	if err != nil {
		fmt.Print(err)
		os.Exit(2)
	}

	app, err := catalog.NewCatalogEngine(catalog.CatalogEngineCfg{
		JsonData: jsonData,
	})
	if err != nil {
		fmt.Print(err)
		os.Exit(2)
	}

	err = app.Index(os.Stdout)
	if err != nil {
		fmt.Print(err)
		os.Exit(2)
	}

}
