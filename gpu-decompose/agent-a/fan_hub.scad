// Real printed/CAD-style fan hub/mount insert, XFX-inspired, dimensioned in millimetres.
// This is a generic mechanical approximation, NOT manufacturer CAD.
// Blender imports the exported manifold STL at 0.01 Blender units/mm.
$fn=64;
difference(){
 union(){
   cylinder(h=7.0,r=15.0,center=true);
   cylinder(h=3.2,r=20.0,center=true);
   cylinder(h=10.0,r=7.2,center=true);
 }
 for(a=[0:90:270])
   rotate([0,0,a]) translate([11.6,0,0])
     cylinder(h=15,r=1.35,center=true);
}
