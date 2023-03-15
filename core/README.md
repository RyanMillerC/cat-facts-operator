# Core Package

Business logic for the cat-facts-operator. The controller will call functions
in this package to perform tasks.

## Testing

To test only the core package, cd into core and run:

```bash
go test -v
```

Otherwise run `make test` from the repo root to run tests from all packages.