package main

import (
	"fmt"
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
	if err != nil {
		fmt.Print(err)
		os.Exit(2)
	}
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
}
