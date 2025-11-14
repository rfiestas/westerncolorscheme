package main

import (
	"net/http"

	"github.com/sirupsen/logrus"
)

type webServerCmd struct{}

func (c *webServerCmd) Run(globals *Globals) error {
	logrus.Infof("Starting web server on http://localhost:8080 serving ./www/")
	http.Handle("/", http.FileServer(http.Dir("www")))
	return http.ListenAndServe(":8080", nil)
}
