// Original parametric rim, no imported assets.
$fn = 60;
difference() {
  union() {
    cylinder(h=12, r=32, center=true);
    cylinder(h=16, r=25, center=true);
  }
  cylinder(h=20, r=20, center=true);
  for (a=[0:60:300]) rotate([0,0,a])
    translate([25,0,0]) cylinder(h=20, r=3, center=true);
}
