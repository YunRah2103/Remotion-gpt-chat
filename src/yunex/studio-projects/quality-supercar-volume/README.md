# Supercar body-volume inspection

Editable, silent native studio turntable for judging the actual sports-car silhouette without scenery or captions. The camera moves from front three-quarter to side profile over 90 frames at30fps. It is a modelling proof, not a driving simulation.

Render using the normal source/recipe-stability and media-contract pipeline:

```sh
node --experimental-strip-types scripts/modelling-kit/studio-v3.mjs render quality-supercar-volume --landscape
```

The entry is a deliberately custom Remotion scene. Edit entry.tsx for camera path, framing and model selection; recipe.json records the matching3-second production contract and paint configuration. If changing duration or model selection, update both the custom entry and recipe consistently. Default composition is1920x1080; the command above explicitly selects that format. The matching moving road proof remains quality-supercar-coachbuilt/front at1080x1920.

Source remains procedural and stylised. No claim of production CAD accuracy or calibrated dynamics. No narration or original supplied assets were added or changed.
