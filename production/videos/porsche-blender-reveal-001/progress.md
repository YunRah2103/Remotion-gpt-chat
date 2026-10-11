# Porsche Blender Reveal progress
Design approved: user said continue with previous prompt.
Source model: canonical GLB, expected SHA256 1c73fcb138c31e2b1d5ed126a2412074bb17f8e960b355436f28139bf518e1eb.
Local Blender and external package/download access unavailable. Use repository's existing GitHub Blender/Cycles runner pattern. No paid services.
Audio assembly regression reproduced: one-pass FFmpeg with -frames:v 479 drops final AAC packet (347 instead of 348). Fixed by separate video encoding and stream-copy mux. Local 479-frame encoder fixture PASS: 1080x1920/30fps, full decode, all 348 packet hashes/timestamps/skip metadata equal to original reference. Fixture is internal only, not a creative preview.
Wheel rotation mode explicitly converted to XYZ while preserving the imported local rotation; real Cycles motion blur uses baked keys. Portrait framing checked against canonical silhouette bounds.
