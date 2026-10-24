# YUNEX external imported-car catalogue

96 imported GLB candidates are indexed in `external-car-catalogue.json`. All records contain the upstream Git blob SHA-1 and exact size. The upstream source is pinned to a commit for reproducible downloads. **These assets are NOT bundled in Git and are NOT approved for commercial use.** Each Sketchfab creator, licence and any redistribution rights must be verified individually before publication.

## Use
```bash
python3 production/asset-library/fetch_cars.py --list
python3 production/asset-library/fetch_cars.py --id mclaren-mclaren-senna-free --allow-unverified
python3 production/asset-library/fetch_cars.py --all --allow-unverified
```

Downloaded files appear at `public/yunex-external-cars/<id>.glb`. Use Remotion `staticFile('yunex-external-cars/<id>.glb')` with Three.js GLTFLoader. A downloader refuses unverified assets unless you explicitly request **private review**. Check the licence independently for each car before public videos. Do not assume that the upstream mirror's possession establishes redistribution or commercial rights.

For GitHub Actions, download only the models needed by the video; `--all` is over 1 GB and may exceed render budgets. Preserve the source manifest with the finished film.
