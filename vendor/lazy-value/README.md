# Femboy Launcher deferred value adapter

Project-owned implementation of the small Lazy interface used by electron-updater and electron-builder. It does not bundle upstream lazy-val source. Licensed under the same GPL-3.0-only license as the launcher; see LICENSE.

The factory runs on first value access. Reads retain the exact value or promise, including rejected promises. A synchronous exception allows retry. Assignment replaces the cached value without running the factory. hasValue reports whether a value has been stored.

The root npm override maps the historical require("lazy-val") name to this local package for every consumer. The installed package identifies itself as @femboy-launcher/lazy-value. The vendored archive is generated from this directory with npm pack; no registry publication or install-time patching is used.

To regenerate from the repository root:

    npm pack ./vendor/lazy-value --pack-destination ./vendor

Then run npm install --ignore-scripts --no-audit --no-fund, the adapter tests, the full test suites and an isolated unsigned packaging check. Commit source, archive and lockfile together.
