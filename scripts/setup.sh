#!/bin/bash

declare rootDir=`pwd`/..;
declare scriptsrtir=`pwd`;
declare packagesDir=`pwd`/../packages;
declare os=`uname -s`;

function toTheRootDir() { cd $rootDir; }

function toTheScriptsrtir() { cd $scriptsrtir; }

function toThePackagesDir() { cd $packagesDir; }

function installAllNode_modules() {
  # for package in *; do if [[ -d $package ]]; then cd $package; npm i; fi; done;
  # for package in $packagesDir/*; do if [[ -d $package ]]; then echo `basename $package`; fi; done;
  for item in $packagesDir/*; do if [[ -d $item ]]; then cd $packagesDir/`basename $item` && npm i; fi; done;
  toTheScriptsrtir;
}

installAllNode_modules;
