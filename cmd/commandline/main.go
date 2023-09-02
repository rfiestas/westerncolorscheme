package main

import (
	"fmt"
<<<<<<< HEAD
	"io"
	"os"

	"github.com/alecthomas/kong"
	"github.com/sirupsen/logrus"
)

type Globals struct {
	Minify bool `help:"Force removal." default:"true"`

	LogLevel string `help:"Set the log level." default:"info" enum:"trace,debug,info,warning,error,fatal"`
}

type CLI struct {
	Globals
	RenderIndexPage         renderIndexPageCmd      `cmd:"" help:"Render the index page."`
	RenderCssFileCmd        renderCssFileCmd        `cmd:"" help:"Render the css content."`
	RenderJavascriptFileCmd renderJavascriptFileCmd `cmd:"" help:"Render the javascript content."`
}

func main() {

	cli := CLI{}
	ctx := kong.Parse(&cli,
		kong.Name("WesternColorScheme"),
		kong.Description("Script to generate the html page."),
		kong.UsageOnError(),
		kong.ConfigureHelp(kong.HelpOptions{
			Compact: true,
		}),
	)

	logrus.SetFormatter(&logrus.TextFormatter{
		DisableColors:    false,
		DisableTimestamp: true,
		FullTimestamp:    false,
	})
	level, err := logrus.ParseLevel(cli.Globals.LogLevel)
=======
	"io/ioutil"
	"os"
	"rubik/internal/catalog"
)

func main() {

	jsonData, err := ioutil.ReadFile("catalog-cubes.json") // just pass the file name
>>>>>>> 12b6e18e8c7f6e511f84ae131e26f597b3de285c
	if err != nil {
		fmt.Print(err)
		os.Exit(2)
	}
<<<<<<< HEAD
	logrus.SetLevel(level)

	err = ctx.Run(&cli.Globals)
	ctx.FatalIfErrorf(err)
}

func generateOutput(file string, reader io.Reader) error {
	writer := os.Stdout
	if file != "" {
		file, err := os.Create(file)
		if err != nil {
			return fmt.Errorf("error opening the file '%s': %s", file.Name(), err)
		}
		defer file.Close()
		writer = file
	}

	_, err := io.Copy(writer, reader)
	if err != nil {
		return fmt.Errorf("error creating the file '%s': %s", file, err)
	}

	return nil
=======

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

>>>>>>> 12b6e18e8c7f6e511f84ae131e26f597b3de285c
}
