# Approved winter artwork integration

The new user-supplied art has been prepared as lossless transparent WebPs, with
**original v7/v9 wood pixels retained beneath alpha-only snow masks**. This
branch first updates the tree drawing geometry without changing the physical
collision bounds or removing upper-tree snow shedding.

## Artwork delivery

The final replacement WebPs and the four original source JPEGs are supplied
together in the Chauá approved winter art package in the conversation.
The repository cannot accept that binary attachment through the available
GitHub text-only editing connection. **Do not claim new art is installed just
because this code change passes CI.**

To install the package, unpack it at the repository root (matching its
`Chaua-Educa-main/assets/...` directory structure), review
`alignment-metadata.json`, and run:

```sh
npm test
python scripts/dev-server.py
# in another terminal
node tests/browser-visual.cjs
node tests/browser-background.cjs
```

The superseded wood base atlases and all six
`trees-upper-shedding-00..05.webp` must be preserved. The overlay stages
`01..04` and terminal `snow-04` must derive from exactly the same alpha
mask. The four-season atlas stays 1672×941 with the original quadrant order.

No automatic overwrite of authored art is performed by CI.
