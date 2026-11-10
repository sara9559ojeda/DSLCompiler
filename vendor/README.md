# Compiler snapshot

`compiler-core-f726e8f.tgz` contains the compiled browser-safe compiler from
`sara9559ojeda/DSLCompiler_Backend` commit
`f726e8f1d242b772b32f1e1e2c87db68ff0923f3` (language 2.0.0).

The package metadata still reports 0.2.0 upstream, but this snapshot includes
the language 2.0 implementation. It is pinned as a file dependency so clean
installs and Vercel builds use the same compiler without a sibling checkout
or an unpublished npm release. The package retains the upstream MIT license.

To update it, build `packages/compiler-core` at the desired backend commit,
run `npm pack` for that package, place the archive here with its commit in the
filename, and run `npm install ./vendor/<archive>.tgz --save`. Commit both the
archive and the updated package lock. Verify typecheck, tests and build.
