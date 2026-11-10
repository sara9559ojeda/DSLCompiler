# Compiler snapshot

`compiler-core-898b295.tgz` contains the compiled browser-safe compiler from
`sara9559ojeda/DSLCompiler_Backend` commit
`898b295` (language 2.0.0). Compared with the previous snapshot (`f726e8f`) it
fixes names that exist on `Object.prototype` (`constructor`, `toString`,
`__proto__`…): they are now ordinary identifiers and are never resolved as
colors.

The package metadata still reports 0.2.0 upstream, but this snapshot includes
the language 2.0 implementation. It is pinned as a file dependency so clean
installs and Vercel builds use the same compiler without a sibling checkout
or an unpublished npm release. The package retains the upstream MIT license.

To update it, build `packages/compiler-core` at the desired backend commit,
run `npm pack` for that package, place the archive here with its commit in the
filename, and run `npm install ./vendor/<archive>.tgz --save`. Commit both the
archive and the updated package lock. Verify typecheck, tests and build.
