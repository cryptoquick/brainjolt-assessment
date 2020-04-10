#!/bin/sh

(sleep 1 && open http://localhost:8000) & python3 -m http.server
