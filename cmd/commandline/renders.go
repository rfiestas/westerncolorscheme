package main

import (
	"io"
	"io/ioutil"
	"os"

	"github.com/sirupsen/logrus"

	"github.com/rfiestas/westerncolorscheme/internal/catalog"
)

type renderIndexPageCmd struct {
	File string `name:"file" help:"Filename to store the index page." type:"file" default:"www/index.html"`
}
type renderCssFileCmd struct {
	File string `name:"file" help:"Filename to store the css content." type:"file" default:"www/catalog-style.css"`
}
type renderJavascriptFileCmd struct {
	File string `name:"file" help:"Filename to store the Javascript content." type:"file" default:"www/catalog-engine.js"`
}

func (r *renderIndexPageCmd) Run(globals *Globals) error {

	jsonData, err := ioutil.ReadFile("static/data/catalog-cubes.json")
	if err != nil {
		logrus.Error(err)
		os.Exit(2)
	}

	app, err := catalog.NewCatalogEngine(catalog.CatalogEngineCfg{
		JsonData: jsonData,
		Minify:   globals.Minify,
	})
	if err != nil {
		logrus.Error(err)
		os.Exit(2)
	}

	logrus.Info("Running Index")
	reader, err := app.Index()
	if err != nil {
		logrus.Error(err)
		os.Exit(2)
	}

	logrus.Info("Generating the output")
	generateOutput(r.File, reader)

	return nil
}

func (r *renderCssFileCmd) Run(globals *Globals) error {
	var reader io.Reader
	file, err := os.Open("static/css/catalog-style.css")
	if err != nil {
		logrus.Error(err)
		os.Exit(2)
	}
	reader = io.Reader(file)

	if globals.Minify {
		reader, err = catalog.MinifyContent(reader, "css")
		if err != nil {
			logrus.Error(err)
			os.Exit(2)
		}
	}

	logrus.Info("Generating the output")
	generateOutput(r.File, reader)

	return nil
}

func (r *renderJavascriptFileCmd) Run(globals *Globals) error {
	var reader io.Reader
	file, err := os.Open("static/js/catalog-engine.js")
	if err != nil {
		logrus.Error(err)
		os.Exit(2)
	}
	reader = io.Reader(file)

	if globals.Minify {
		reader, err = catalog.MinifyContent(reader, "javascript")
		if err != nil {
			logrus.Error(err)
			os.Exit(2)
		}
	}

	logrus.Info("Generating the output")
	generateOutput(r.File, reader)

	return nil
}
