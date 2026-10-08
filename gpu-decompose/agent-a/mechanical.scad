// OpenSCAD real manifold rotor spacer hub. This source produces a physical STL
// imported as native triangles into each of 3 Blender fan rotor anchors.
// SCAD native geometry: mm; Blender import multiplies by 0.01.
// Stylized mechanic approximation, not an XFX machining blueprint.
$fn=64;
difference() {
 union() {
   cylinder(h=3.4,r=15.0,center=true);
   cylinder(h=1.5,r=19.0,center=true);
   cylinder(h=6.8,r=8.2,center=true);
 }
 for (a=[0:90:270])
  rotate([0,0,a]) translate([11.4,0,0])
   cylinder(h=10,r=1.35,center=true);
}
